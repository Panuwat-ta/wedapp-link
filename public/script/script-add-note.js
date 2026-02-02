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

    // Mobile menu is handled by mobile-menu.js

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
            
            // Add click events only to buttons, not the card
            const editBtn = noteElement.querySelector('.edit-btn');
            const deleteBtn = noteElement.querySelector('.delete-btn');
            
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const noteContent = notes.find(n => n._id === editBtn.dataset.id).content;
                showEditModal(editBtn.dataset.id, editBtn.dataset.name, noteContent);
            });
            
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showDeleteModal(deleteBtn.dataset.id);
            });
            
            notesList.appendChild(noteElement);
        });
    }

    function showEditModal(noteId, noteName, content) {
        currentNoteId = noteId;
        
        // Show modal with loading state
        editNoteModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Add to history for back button support
        history.pushState({ modal: 'editNote' }, '');
        
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
        
        // Add history toggle button and overlay for mobile
        if (window.innerWidth <= 768) {
            if (!document.querySelector('.history-toggle')) {
                const toggleBtn = document.createElement('button');
                toggleBtn.className = 'history-toggle';
                toggleBtn.innerHTML = '<i class="fas fa-history"></i>';
                toggleBtn.onclick = toggleHistoryDrawer;
                editNoteModal.querySelector('.modal-content').appendChild(toggleBtn);
                
                const overlay = document.createElement('div');
                overlay.className = 'history-overlay';
                overlay.onclick = closeHistoryDrawer;
                editNoteModal.querySelector('.modal-content').appendChild(overlay);
            }
        }
        
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
        
        // Add to history for back button support
        history.pushState({ modal: 'deleteNote' }, '');
        
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
        
        // Remove from history if it was added
        if (window.history.state && window.history.state.modal === 'editNote') {
            history.back();
        }
        
        // Unlock body scroll
        document.body.style.overflow = '';
        
        // Close drawer if open
        if (window.innerWidth <= 768) {
            closeHistoryDrawer();
        }
    }

    function closeDeleteModal() {
        currentNoteId = null;
        document.getElementById('deletePassword').value = '';
        document.getElementById('deleteError').style.display = 'none';
        deleteConfirmModal.style.display = 'none';
        
        // Remove from history if it was added
        if (window.history.state && window.history.state.modal === 'deleteNote') {
            history.back();
        }
        
        // Unlock body scroll
        document.body.style.overflow = '';
    }

    confirmDeleteBtn.addEventListener('click', deleteNote);
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    saveEditedNoteBtn.addEventListener('click', editNote);
    cancelEditBtn.addEventListener('click', closeEditModal);
    
    // Handle back button for modals
    window.addEventListener('popstate', function(e) {
        if (editNoteModal.style.display === 'flex') {
            e.preventDefault();
            editNoteModal.style.display = 'none';
            editNoteModal.classList.remove('active');
            document.body.style.overflow = '';
            currentNoteId = null;
        } else if (deleteConfirmModal.style.display === 'flex') {
            e.preventDefault();
            deleteConfirmModal.style.display = 'none';
            document.body.style.overflow = '';
            currentNoteId = null;
        }
    });

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
        
        // Calculate total versions
        const totalVersions = (note.editHistory ? note.editHistory.length : 0) + 1;
        
        // Add current version option
        const currentVersionItem = document.createElement('div');
        currentVersionItem.classList.add('history-item', 'active');
        
        currentVersionItem.innerHTML = `
            <div class="history-item-header">Current Version #${totalVersions}</div>
            <div class="history-item-meta">${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', hour12: false })}</div>
            <div class="history-item-meta"><strong>Title:</strong> ${note.noteName}</div>
        `;
        
        currentVersionItem.addEventListener('click', () => {
            // Remove active class from all items
            document.querySelectorAll('.history-item').forEach(item => item.classList.remove('active'));
            currentVersionItem.classList.add('active');
            
            // Load current version into edit form
            editNoteName.value = note.noteName || '';
            editNoteTextarea.value = note.content || '';
            
            // Enable editing for current version
            editNoteName.readOnly = false;
            editNoteTextarea.readOnly = false;
            saveEditedNoteBtn.style.display = 'inline-flex';
            
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
        });
        
        editHistoryList.appendChild(currentVersionItem);
        
        if (!note.editHistory || note.editHistory.length === 0) {
            return;
        }
        
        // Sort history by date (newest first)
        const sortedHistory = [...note.editHistory].sort((a, b) => new Date(b.editedAt) - new Date(a.editedAt));
        
        sortedHistory.forEach((history, index) => {
            const historyItem = document.createElement('div');
            historyItem.classList.add('history-item');
            
            const editDate = new Date(history.editedAt).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', hour12: false });
            const versionNumber = totalVersions - index - 1;
            
            historyItem.innerHTML = `
                <div class="history-item-header">Title: ${history.noteName}</div>
                <div class="history-item-meta"><strong>Modified by</strong> ${history.editedBy}</div>
                <div class="history-item-meta">${editDate} (V.${versionNumber})</div>
                <div class="history-item-meta"><strong>By</strong> ${history.editedBy}</div>
            `;
            
            // Add click event to show historical content
            historyItem.addEventListener('click', () => {
                // Remove active class from all items
                document.querySelectorAll('.history-item').forEach(item => item.classList.remove('active'));
                historyItem.classList.add('active');
                
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
            });
            
            editHistoryList.appendChild(historyItem);
        });
    }
    
    // Toggle history drawer on mobile
    window.toggleHistoryDrawer = function() {
        const noteHistory = document.querySelector('.note-history');
        const toggleBtn = document.querySelector('.history-toggle');
        const overlay = document.querySelector('.history-overlay');
        
        if (noteHistory && toggleBtn && overlay) {
            noteHistory.classList.toggle('open');
            toggleBtn.classList.toggle('open');
            overlay.classList.toggle('active');
        }
    };

    window.closeHistoryDrawer = function() {
        const noteHistory = document.querySelector('.note-history');
        const toggleBtn = document.querySelector('.history-toggle');
        const overlay = document.querySelector('.history-overlay');
        
        if (noteHistory && toggleBtn && overlay) {
            noteHistory.classList.remove('open');
            toggleBtn.classList.remove('open');
            overlay.classList.remove('active');
        }
    };
    
    // Close drawer when selecting a history item on mobile
    document.addEventListener('click', (e) => {
        if (e.target.closest('.history-item') && window.innerWidth <= 768) {
            closeHistoryDrawer();
        }
    });
});
