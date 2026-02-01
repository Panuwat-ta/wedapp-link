document.addEventListener('DOMContentLoaded', () => {
    const saveNoteBtn = document.getElementById('saveNoteBtn');
    const noteContent = document.getElementById('noteContent');
    const noteName = document.getElementById('noteName');
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');

    const username = localStorage.getItem('username');
    const userEmail = localStorage.getItem('email');
    const loginLink = document.getElementById('loginLink');
    const logoutLink = document.getElementById('logoutLink');
    const navUsername = document.getElementById('navUsername');
    const navUserAvatar = document.getElementById('navUserAvatar');

    if (!username) {
        window.location.href = '/login.html';
        return;
    }
    
    if (loginLink && logoutLink) {
        loginLink.style.display = 'none';
        logoutLink.style.display = 'flex';
        
        // Update username in navbar
        if (navUsername) {
            navUsername.textContent = username;
        }
        
        // Fetch and update user avatar
        if (navUserAvatar && userEmail) {
            fetch('/current-user', {
                headers: {
                    'x-email': userEmail
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.profileImage) {
                    navUserAvatar.src = data.profileImage;
                }
            })
            .catch(error => {
                console.error('Error fetching user data:', error);
            });
        }
    }

    // Notes list and view modal elements
    const notesList = document.getElementById('notesList');
    const viewNoteModal = document.getElementById('viewNoteModal');
    const viewNoteName = document.getElementById('viewNoteName');
    const viewNoteContent = document.getElementById('viewNoteContent');
    const closeViewBtn = document.getElementById('closeViewBtn');

    // Edit Modal elements
    const editNoteModal = document.getElementById('editNoteModal');
    const editNoteTextarea = document.getElementById('editNoteTextarea');
    const editNoteName = document.getElementById('editNoteName');
    const saveEditedNoteBtn = document.getElementById('saveEditedNoteBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');

    // Delete Modal elements
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

    let currentNoteId = null;

    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    fetchNotes();

    saveNoteBtn.addEventListener('click', async () => {
        const contentValue = noteContent.value.trim();
        const nameValue = noteName.value.trim();

        if (contentValue && nameValue) {
            try {
                const response = await fetch('/api/notes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-username': username
                    },
                    body: JSON.stringify({ content: contentValue, noteName: nameValue })
                });

                if (response.ok) {
                    window.location.href = '/note.html';
                } else {
                    alert('Failed to save note. Please try again.');
                    console.error('Failed to save note');
                }
            } catch (error) {
                alert('An error occurred while saving the note. Please try again.');
                console.error('Error saving note:', error);
            }
        }
    });

    async function fetchNotes() {
        // Show loading state
        notesList.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading existing notes...</p></div>';
        
        try {
            const response = await fetch(`/api/notes?username=${username}`);
            if (response.ok) {
                const notes = await response.json();
                // Sort notes by last modified date (newest first)
                const sortedNotes = notes.sort((a, b) => {
                    const dateA = new Date(a.updatedAt || a.createdAt);
                    const dateB = new Date(b.updatedAt || b.createdAt);
                    return dateB - dateA; // Descending order (newest first)
                });
                displayNotes(sortedNotes);
            } else {
                console.error('Failed to fetch notes');
                notesList.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-circle"></i><p>Failed to load notes. Please try again.</p></div>';
            }
        } catch (error) {
            console.error('Error fetching notes:', error);
            notesList.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-circle"></i><p>Error loading notes. Please check your connection.</p></div>';
        }
    }

    function displayNotes(notes) {
        notesList.innerHTML = '';
        notes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.classList.add('note-card');
            const noteName = note.noteName || 'Untitled Note';
            noteElement.innerHTML = `
                <div class="note-card-content">
                    <div class="note-title">${noteName}</div>
                    <div class="note-footer">
                        <div class="note-meta">
                            <span>By: ${note.username}</span>
                            <span>${new Date(note.createdAt).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', hour12: false })}</span>
                        </div>
                        <div class="note-actions">
                            <button class="note-btn edit-btn" data-id="${note._id}" data-name="${noteName}"><i class="fas fa-edit"></i></button>
                            <button class="note-btn delete-btn" data-id="${note._id}"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            `;
            noteElement.addEventListener('click', (e) => {
                const deleteButton = e.target.closest('.delete-btn');
                const editButton = e.target.closest('.edit-btn');

                if (deleteButton) {
                    e.stopPropagation();
                    showDeleteModal(deleteButton.dataset.id);
                } else if (editButton) {
                    e.stopPropagation();
                    const noteContent = notes.find(n => n._id === editButton.dataset.id).content;
                    showEditModal(editButton.dataset.id, editButton.dataset.name, noteContent);
                } else {
                    // Click on card - open edit modal
                    const noteContent = note.content;
                    showEditModal(note._id, noteName, noteContent);
                }
            });
            notesList.appendChild(noteElement);
        });
    }

    function showEditModal(noteId, noteName, content) {
        currentNoteId = noteId;
        
        // Show modal with loading state
        editNoteModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Show loading state
        editNoteName.value = 'Loading...';
        editNoteTextarea.value = 'Loading note content...';
        editNoteName.readOnly = true;
        editNoteTextarea.readOnly = true;
        
        // Show loading in history
        const editHistoryList = document.getElementById('editHistoryList');
        if (editHistoryList) {
            editHistoryList.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading history...</p></div>';
        }
        
        // Clear footer info
        const editNoteAuthor = document.getElementById('editNoteAuthor');
        const editNoteLastEdited = document.getElementById('editNoteLastEdited');
        if (editNoteAuthor) editNoteAuthor.textContent = '';
        if (editNoteLastEdited) editNoteLastEdited.textContent = '';
        
        setTimeout(() => {
            editNoteModal.classList.add('active');
            
            // Load actual content
            editNoteName.value = noteName;
            editNoteTextarea.value = content;
            editNoteName.readOnly = false;
            editNoteTextarea.readOnly = false;
            
            // Fetch and display edit history
            fetchNoteHistory(noteId);
        }, 10);
    }

    function showDeleteModal(noteId) {
        currentNoteId = noteId;
        document.getElementById('deletePassword').value = '';
        document.getElementById('deleteError').style.display = 'none';
        deleteConfirmModal.style.display = 'flex';
        
        // Lock body scroll
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
            deleteConfirmModal.classList.add('active');
        }, 10);
    }

    function closeViewModal() {
        viewNoteModal.classList.remove('active');
        
        // Unlock body scroll
        document.body.style.overflow = '';
        
        setTimeout(() => {
            viewNoteModal.style.display = 'none';
        }, 300);
    }

    closeViewBtn.addEventListener('click', closeViewModal);

    window.addEventListener('click', (e) => {
        if (e.target === viewNoteModal) {
            closeViewModal();
        }
        if (e.target === editNoteModal) {
            closeEditModal();
        }
        if (e.target === deleteConfirmModal) {
            closeDeleteModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (editNoteModal.classList.contains('active')) {
                closeEditModal();
            }
            if (deleteConfirmModal.classList.contains('active')) {
                closeDeleteModal();
            }
        }
    });

    async function deleteNote() {
        if (!currentNoteId) return;
        
        const password = document.getElementById('deletePassword').value;
        const errorElement = document.getElementById('deleteError');
        
        if (password !== 'panuwat') {
            errorElement.style.display = 'block';
            return;
        }
        
        try {
            const response = await fetch(`/api/notes/${currentNoteId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password: password })
            });

            if (response.ok) {
                fetchNotes();
                closeDeleteModal();
            } else {
                errorElement.style.display = 'block';
                console.error('Failed to delete note');
            }
        } catch (error) {
            errorElement.style.display = 'block';
            console.error('Error deleting note:', error);
        }
    }

    async function editNote() {
        if (!currentNoteId) return;
        const content = editNoteTextarea.value.trim();
        const noteName = editNoteName.value.trim();
        if (!content || !noteName) return;

        try {
            const response = await fetch(`/api/notes/${currentNoteId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content, noteName })
            });

            if (response.ok) {
                fetchNotes();
            } else {
                console.error('Failed to update note');
            }
        } catch (error) {
            console.error('Error updating note:', error);
        } finally {
            closeEditModal();
        }
    }

    function closeEditModal() {
        currentNoteId = null;
        editNoteModal.style.display = 'none';
        editNoteModal.classList.remove('active');
        
        // Unlock body scroll
        document.body.style.overflow = '';
    }

    function closeDeleteModal() {
        currentNoteId = null;
        document.getElementById('deletePassword').value = '';
        document.getElementById('deleteError').style.display = 'none';
        deleteConfirmModal.style.display = 'none';
        
        // Unlock body scroll
        document.body.style.overflow = '';
    }

    confirmDeleteBtn.addEventListener('click', deleteNote);
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    saveEditedNoteBtn.addEventListener('click', editNote);
    cancelEditBtn.addEventListener('click', closeEditModal);

    async function fetchNoteHistory(noteId) {
        try {
            const response = await fetch(`/api/notes/${noteId}`);
            if (response.ok) {
                const note = await response.json();
                displayEditHistory(note);
            } else {
                console.error('Failed to fetch note history');
            }
        } catch (error) {
            console.error('Error fetching note history:', error);
        }
    }

    function displayEditHistory(note) {
        const editHistoryList = document.getElementById('editHistoryList');
        editHistoryList.innerHTML = '';
        
        // Update author and editor info in footer
        const editNoteAuthor = document.getElementById('editNoteAuthor');
        const editNoteLastEdited = document.getElementById('editNoteLastEdited');
        
        if (editNoteAuthor && editNoteLastEdited) {
            editNoteAuthor.textContent = `By: ${note.username}`;
            
            // Get last editor from editHistory if lastEditedBy is null
            let lastEditor = note.lastEditedBy;
            if (!lastEditor && note.editHistory && note.editHistory.length > 0) {
                const sortedHistory = [...note.editHistory].sort((a, b) => new Date(b.editedAt) - new Date(a.editedAt));
                lastEditor = sortedHistory[0].editedBy;
            }
            
            if (lastEditor && note.lastEditedAt) {
                editNoteLastEdited.textContent = `edited ${lastEditor} date ${new Date(note.lastEditedAt).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', hour12: false })}`;
            } else if (note.createdAt) {
                editNoteLastEdited.textContent = `date ${new Date(note.createdAt).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', hour12: false })}`;
            }
        }
        
        // Add current version option
        const currentVersionItem = document.createElement('div');
        currentVersionItem.classList.add('history-item', 'current-version');
        currentVersionItem.style.cursor = 'pointer';
        currentVersionItem.style.backgroundColor = '#e7f3ff';
        currentVersionItem.style.border = '1px solid #b3d9ff';
        
        const currentDate = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', hour12: false });
        // Calculate edit count (current version number)
        const editCount = (note.editHistory ? note.editHistory.length : 0) + 1;
        
        currentVersionItem.innerHTML = `
            <div class="history-content">
                <p><strong>Current Version</strong> #${editCount}</p>
                <p><strong>${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', hour12: false })}</strong></p>
                <p><strong>Title:</strong> ${note.noteName}</p>
            </div>
        `;
        
        currentVersionItem.addEventListener('click', () => {
            // Load current version into edit form
            editNoteName.value = note.noteName || '';
            editNoteTextarea.value = note.content || '';
            
            // Enable editing for current version
            editNoteName.readOnly = false;
            editNoteTextarea.readOnly = false;
            saveEditedNoteBtn.style.display = 'inline-block';
            
            // Update footer info for current version
            if (editNoteAuthor && editNoteLastEdited) {
                editNoteAuthor.textContent = `By: ${note.username}`;
                
                let lastEditor = note.lastEditedBy;
                if (!lastEditor && note.editHistory && note.editHistory.length > 0) {
                    const sortedHistory = [...note.editHistory].sort((a, b) => new Date(b.editedAt) - new Date(a.editedAt));
                    lastEditor = sortedHistory[0].editedBy;
                }
                
                if (lastEditor && note.lastEditedAt) {
                    editNoteLastEdited.textContent = `edited ${lastEditor} date ${new Date(note.lastEditedAt).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', hour12: false })}`;
                } else if (note.createdAt) {
                    editNoteLastEdited.textContent = `date ${new Date(note.createdAt).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', hour12: false })}`;
                }
            }
            
            // Remove 'active' class from previously selected item
            const currentActive = document.querySelector('.history-item.active');
            if (currentActive) {
                currentActive.classList.remove('active');
            }
            // Add 'active' class to the clicked item
            currentVersionItem.classList.add('active');
        });
        
        // Set current version as active by default
        currentVersionItem.classList.add('active');
        editHistoryList.appendChild(currentVersionItem);
        
        if (!note.editHistory || note.editHistory.length === 0) {
            return;
        }
        
        // Sort history by date (newest first)
        const sortedHistory = [...note.editHistory].sort((a, b) => new Date(b.editedAt) - new Date(a.editedAt));
        
        sortedHistory.forEach((history, index) => {
            const historyItem = document.createElement('div');
            historyItem.classList.add('history-item', 'history-version');
            historyItem.style.cursor = 'pointer';
            
            const editDate = new Date(history.editedAt).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', hour12: false });
            const editType = history.editType === 'original' ? 'Created' : 'Modified';
            
            // Calculate version number for this history item
            const totalVersions = sortedHistory.length + 1; // +1 for current version
            const versionNumber = totalVersions - index - 1; // Reverse order (newest gets highest number)
            
            historyItem.innerHTML = `
                <div class="history-content">
                    <p><strong>Version ${versionNumber}</strong></p>
                    <p><strong>${editDate}</strong></p>
                    <p><strong>Title:</strong> ${history.noteName}</p>
                    <p><strong>By:</strong> ${history.editedBy}</p>
                </div>
            `;
            
            // Add click event to load historical content (read-only)
            historyItem.addEventListener('click', () => {
                // Load historical version into edit form (read-only)
                editNoteName.value = history.noteName || '';
                editNoteTextarea.value = history.content || '';
                
                // Disable editing for historical versions
                editNoteName.readOnly = true;
                editNoteTextarea.readOnly = true;
                saveEditedNoteBtn.style.display = 'none';
                
                // Update footer info for historical version
                if (editNoteAuthor && editNoteLastEdited) {
                    editNoteAuthor.textContent = `By: ${history.editedBy}`;
                    editNoteLastEdited.textContent = `date ${new Date(history.editedAt).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', hour12: false })} (Historical Version)`;
                }
                
                // Remove 'active' class from previously selected item
                const currentActive = document.querySelector('.history-item.active');
                if (currentActive) {
                    currentActive.classList.remove('active');
                }
                // Add 'active' class to the clicked item
                historyItem.classList.add('active');
            });
            
            editHistoryList.appendChild(historyItem);
        });
    }
});
