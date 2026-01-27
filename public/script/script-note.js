document.addEventListener('DOMContentLoaded', () => {
    // Main elements
    const notesList = document.getElementById('notesList');
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');


    // View Modal elements
    const viewNoteModal = document.getElementById('viewNoteModal');
    const viewNoteName = document.getElementById('viewNoteName');
    const viewNoteContent = document.getElementById('viewNoteContent');
    const closeViewBtn = document.getElementById('closeViewBtn');

    let currentNoteId = null;

    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    const username = localStorage.getItem('username');

    if (!username) {
        window.location.href = '/login.html';
        return;
    }

    fetchNotes();

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
                <div class="note-header">
                    <h3>${noteName}</h3>
                </div>
                <div class="note-footer">
                    <small>By: ${note.username}</small>
                    <small>${new Date(note.createdAt).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', hour12: false })}</small>
                </div>
            `;
            noteElement.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    viewNote(note._id);
                }
            });
            notesList.appendChild(noteElement);
        });
    }

    let allNotes = [];

    async function viewNote(noteId) {
        try {
            // Show loading state
            viewNoteContent.textContent = 'Loading...';
            
            // Start showing modal immediately for better perceived performance
            viewNoteModal.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
            
            // Force reflow to ensure the element is in the render tree
            void viewNoteModal.offsetWidth;
            
            // Start loading data
            if (allNotes.length === 0) {
                const response = await fetch(`/api/notes?username=${username}`);
                if (!response.ok) throw new Error('Failed to fetch notes');
                allNotes = await response.json();
            }
            
            const note = allNotes.find(n => n._id === noteId);
            if (note) {
                // Update content
                viewNoteName.textContent = note.noteName || 'Untitled Note';
                viewNoteContent.innerHTML = note.content.replace(/\n/g, '<br>');
                
                // Start animation after content is updated
                requestAnimationFrame(() => {
                    viewNoteModal.classList.add('active');
                    
                    // Add smooth scroll to top if content is long
                    if (viewNoteContent.scrollHeight > viewNoteContent.clientHeight) {
                        viewNoteContent.scrollTo({
                            top: 0,
                            behavior: 'smooth'
                        });
                    }
                });
                
                // Add keyboard event listener for Escape key
                const handleKeyDown = (e) => {
                    if (e.key === 'Escape') {
                        closeViewModal();
                    }
                };
                document.addEventListener('keydown', handleKeyDown);
                viewNoteModal._keyDownHandler = handleKeyDown;
            }
        } catch (error) {
            console.error('Error viewing note:', error);
            viewNoteContent.innerHTML = 'Failed to load note. Please try again.';
        }
    }

    function closeViewModal() {
        // Start closing animation
        viewNoteModal.classList.remove('active');
        document.body.style.overflow = ''; // Re-enable scrolling
        
        // Clean up event listeners
        if (viewNoteModal._keyDownHandler) {
            document.removeEventListener('keydown', viewNoteModal._keyDownHandler);
            viewNoteModal._keyDownHandler = null;
        }
        
        // Wait for animation to complete before hiding
        setTimeout(() => {
            if (!viewNoteModal.classList.contains('active')) {
                viewNoteModal.style.display = 'none';
                // Reset scroll position for next open
                viewNoteContent.scrollTop = 0;
            }
        }, 300);
    }

    closeViewBtn.addEventListener('click', closeViewModal);

    viewNoteModal.addEventListener('click', (e) => {
        if (e.target === viewNoteModal) {
            closeViewModal();
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
});
