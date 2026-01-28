document.addEventListener('DOMContentLoaded', () => {
    const saveNoteBtn = document.getElementById('saveNoteBtn');
    const noteContent = document.getElementById('noteContent');
    const noteName = document.getElementById('noteName');
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');

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

    const username = localStorage.getItem('username');

    if (!username) {
        // Redirect to login page if not logged in
        window.location.href = '/login.html';
        return;
    }

    fetchNotes();

    saveNoteBtn.addEventListener('click', async () => {
        const contentValue = noteContent.value.trim();
        const nameValue = document.getElementById('noteName').value.trim(); // Directly get the value

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
                    // Redirect to the notes list page after saving
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

    // login logout
    const loginLink = document.getElementById('loginLink');
    const logoutLink = document.getElementById('logoutLink');
    if (username) {
        loginLink.style.display = 'none';
        logoutLink.style.display = 'block';
    } else {
        loginLink.style.display = 'block';
        logoutLink.style.display = 'none';
    }

    async function fetchNotes() {
        try {
            const response = await fetch(`/api/notes?username=${username}`);
            if (response.ok) {
                const notes = await response.json();
                displayNotes(notes);
            } else {
                console.error('Failed to fetch notes');
            }
        } catch (error) {
            console.error('Error fetching notes:', error);
        }
    }

    function displayNotes(notes) {
        notesList.innerHTML = '';
        notes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.classList.add('note-item');
            const noteName = note.noteName || 'Untitled Note';
            noteElement.innerHTML = `
                <h3>${noteName}</h3>
                <hr>
                <div class="note-footer">
                    <small class="author">By: ${note.username}</small>
                    <div class="footer-right">
                        <small class="date">${new Date(note.createdAt).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', hour12: false })}</small>
                        <div class="note-actions">
                            <button class="edit-note-btn" data-id="${note._id}" data-name="${noteName}"><i class="fas fa-edit"></i></button>
                            <button class="delete-note-btn" data-id="${note._id}"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            `;
            noteElement.addEventListener('click', (e) => {
                const deleteButton = e.target.closest('.delete-note-btn');
                const editButton = e.target.closest('.edit-note-btn');

                if (deleteButton) {
                    showDeleteModal(deleteButton.dataset.id);
                } else if (editButton) {
                    const noteContent = notes.find(n => n._id === editButton.dataset.id).content;
                    showEditModal(editButton.dataset.id, editButton.dataset.name, noteContent);
                } else {
                    viewNoteName.textContent = noteName;
                    viewNoteContent.innerHTML = note.content.replace(/\n/g, '<br>');
                    viewNoteModal.style.display = 'flex';
                }
            });
            notesList.appendChild(noteElement);
        });
    }

    function showEditModal(noteId, noteName, content) {
        currentNoteId = noteId;
        editNoteName.value = noteName;
        editNoteTextarea.value = content;
        editNoteModal.style.display = 'flex';
        
        // Fetch and display edit history
        fetchNoteHistory(noteId);
        
        setTimeout(() => {
            editNoteModal.classList.add('active');
        }, 10);
    }

    function showDeleteModal(noteId) {
        currentNoteId = noteId;
        document.getElementById('deletePassword').value = '';
        document.getElementById('deleteError').style.display = 'none';
        deleteConfirmModal.style.display = 'flex';
        setTimeout(() => {
            deleteConfirmModal.classList.add('active');
        }, 10);
    }

    function closeViewModal() {
        viewNoteModal.classList.remove('active');
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
    }

    function closeDeleteModal() {
        currentNoteId = null;
        document.getElementById('deletePassword').value = '';
        document.getElementById('deleteError').style.display = 'none';
        deleteConfirmModal.style.display = 'none';
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
        
        // Add current version option
        const currentVersionItem = document.createElement('div');
        currentVersionItem.classList.add('history-item');
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
            
            // Remove 'active' class from previously selected item
            const currentActive = document.querySelector('.history-item.active');
            if (currentActive) {
                currentActive.classList.remove('active');
            }
            // Add 'active' class to the clicked item
            currentVersionItem.classList.add('active');
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
            historyItem.style.cursor = 'pointer';
            
            const editDate = new Date(history.editedAt).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', hour12: false });
            const editType = history.editType === 'original' ? 'Created' : 'Modified';
            
            // Calculate version number for this history item
            const totalVersions = sortedHistory.length + 1; // +1 for current version
            const versionNumber = totalVersions - index; // Reverse order (newest gets highest number)
            
            historyItem.innerHTML = `
                <div class="history-content">
                    <p><strong>Title:</strong> ${history.noteName}</p>
                    <p><strong>Modified by</strong> ${history.editedBy}</p>
                    <p><strong>${editDate} (V.${versionNumber})</strong></p>
                    <p><strong>By</strong> ${history.editedBy}</p>
                </div>
            `;
            
            // Add click event to load historical content into edit form
            historyItem.addEventListener('click', () => {
                // Load historical version into edit form
                editNoteName.value = history.noteName || '';
                editNoteTextarea.value = history.content || '';
                
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
