document.addEventListener('DOMContentLoaded', () => {
    // Main elements
    const notesList = document.getElementById('notesList');
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');

    const isLoggedIn = localStorage.getItem('username');
    const userEmail = localStorage.getItem('email');
    const loginLink = document.getElementById('loginLink');
    const logoutLink = document.getElementById('logoutLink');
    const navUsername = document.getElementById('navUsername');
    const navUserAvatar = document.getElementById('navUserAvatar');
    
    if (loginLink && logoutLink) {
        if (isLoggedIn) {
            loginLink.style.display = 'none';
            logoutLink.style.display = 'flex';
            
            // Update username in navbar
            if (navUsername) {
                navUsername.textContent = isLoggedIn;
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
        } else {
            loginLink.style.display = 'flex';
            logoutLink.style.display = 'none';
        }
    }


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
        // Show loading state
        notesList.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading your notes...</p></div>';
        
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
            
            // Get last editor from editHistory if lastEditedBy is null
            let lastEditor = note.lastEditedBy;
            if (!lastEditor && note.editHistory && note.editHistory.length > 0) {
                const sortedHistory = [...note.editHistory].sort((a, b) => new Date(b.editedAt) - new Date(a.editedAt));
                lastEditor = sortedHistory[0].editedBy;
            }
            
            noteElement.innerHTML = `
                <div class="note-title">${noteName}</div>
                <div class="note-meta">
                    <div>By: ${note.username}</div>
                    <div>edited: ${lastEditor || note.username}</div>
                    <div>${new Date(note.lastEditedAt || note.createdAt).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', hour12: false })}</div>
                </div>
            `;
            
            // Add click event to entire card
            noteElement.addEventListener('click', () => {
                viewNote(note);
            });
            
            // Add cursor pointer style
            noteElement.style.cursor = 'pointer';
            
            notesList.appendChild(noteElement);
        });
    }


    async function viewNote(note) {
        try {
            // Show modal with loading state immediately
            viewNoteModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Add to history for back button support
            history.pushState({ modal: 'viewNote' }, '');
            
            // Show loading in content area
            viewNoteName.textContent = 'Loading...';
            viewNoteContent.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading note...</p></div>';
            
            // Clear history list
            const editHistoryList = document.getElementById('editHistoryList');
            if (editHistoryList) {
                editHistoryList.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
            }
            
            // Add history toggle button and overlay for mobile
            if (window.innerWidth <= 768) {
                if (!document.querySelector('.history-toggle')) {
                    const toggleBtn = document.createElement('button');
                    toggleBtn.className = 'history-toggle';
                    toggleBtn.innerHTML = '<i class="fas fa-history"></i>';
                    toggleBtn.onclick = toggleHistoryDrawer;
                    viewNoteModal.querySelector('.modal-content').appendChild(toggleBtn);
                    
                    const overlay = document.createElement('div');
                    overlay.className = 'history-overlay';
                    overlay.onclick = closeHistoryDrawer;
                    viewNoteModal.querySelector('.modal-content').appendChild(overlay);
                }
            }
            
            // Force reflow
            void viewNoteModal.offsetWidth;
            
            // Start loading data
            if (note) {
                // Remove historical banner if exists
                const existingBanner = document.querySelector('.historical-banner');
                if (existingBanner) {
                    existingBanner.remove();
                }
                
                // Remove historical class from content
                viewNoteContent.classList.remove('historical');
                
                // Update content
                viewNoteName.textContent = note.noteName || 'Untitled Note';
                viewNoteContent.innerHTML = note.content.replace(/\n/g, '<br>');
                
                // Update author and last edited info
                const noteAuthor = document.getElementById('noteAuthor');
                const noteLastEdited = document.getElementById('noteLastEdited');
                
                noteAuthor.textContent = `By: ${note.username}`;
                noteLastEdited.classList.remove('viewing-historical');
                
                // Get last editor from editHistory if lastEditedBy is null
                let lastEditor = note.lastEditedBy;
                if (!lastEditor && note.editHistory && note.editHistory.length > 0) {
                    // Sort by editedAt to get the most recent
                    const sortedHistory = [...note.editHistory].sort((a, b) => new Date(b.editedAt) - new Date(a.editedAt));
                    lastEditor = sortedHistory[0].editedBy;
                }
                
                // Always show edited info if available
                if (lastEditor && note.lastEditedAt) {
                    noteLastEdited.textContent = `edited ${lastEditor} date ${new Date(note.lastEditedAt).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', hour12: false })}`;
                } else if (note.createdAt) {
                    noteLastEdited.textContent = `date ${new Date(note.createdAt).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', hour12: false })}`;
                } else {
                    noteLastEdited.textContent = '';
                }
                
                // Display edit history
                displayEditHistory(note);
                
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
            viewNoteContent.innerHTML = '<div class="error-message">Failed to load note. Please try again.</div>';
        }
    }

    function displayEditHistory(note) {
        const editHistoryList = document.getElementById('editHistoryList');
        editHistoryList.innerHTML = '';
        
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
            viewNote(note);
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
                showHistoricalNote(history);
            });
            
            editHistoryList.appendChild(historyItem);
        });
    }

    function showHistoricalNote(history) {
        // Update the main note view with historical content
        viewNoteName.textContent = history.noteName || 'Untitled Note';
        
        // Add historical banner
        const existingBanner = document.querySelector('.historical-banner');
        if (existingBanner) {
            existingBanner.remove();
        }
        
        const banner = document.createElement('div');
        banner.className = 'historical-banner';
        banner.innerHTML = '<i class="fas fa-history"></i> <strong>Historical Version</strong> - Click on another history item to view different versions';
        
        const noteMain = document.querySelector('.note-main');
        const h2 = noteMain.querySelector('h2');
        h2.after(banner);
        
        // Update content with historical background
        viewNoteContent.innerHTML = history.content.replace(/\n/g, '<br>');
        viewNoteContent.classList.add('historical');
        
        // Update author and last edited info for historical version
        const noteAuthor = document.getElementById('noteAuthor');
        const noteLastEdited = document.getElementById('noteLastEdited');
        
        noteAuthor.textContent = `By: ${history.editedBy}`;
        noteLastEdited.textContent = `date ${new Date(history.editedAt).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', hour12: false })} (Historical Version)`;
        noteLastEdited.classList.add('viewing-historical');
    }

    function getAddedContent(oldContent, newContent) {
        // Simple diff to find what was added
        const oldLines = oldContent.split('\n');
        const newLines = newContent.split('\n');
        
        let addedLines = [];
        let oldIndex = 0;
        let newIndex = 0;
        
        while (newIndex < newLines.length) {
            if (oldIndex >= oldLines.length || oldLines[oldIndex] !== newLines[newIndex]) {
                // This line is new or modified
                addedLines.push(newLines[newIndex]);
                newIndex++;
            } else {
                // Lines match, move to next
                oldIndex++;
                newIndex++;
            }
        }
        
        // If we couldn't find differences by line, try character-based diff
        if (addedLines.length === 0 && oldContent !== newContent) {
            addedLines = [getCharDiff(oldContent, newContent)];
        }
        
        // For original notes (when oldContent is empty or only whitespace), show only the first line or first 50 chars
        if (!oldContent || oldContent.trim() === '') {
            const firstLine = newContent.split('\n')[0].trim();
            if (firstLine.length > 50) {
                return firstLine.substring(0, 50) + '...';
            }
            return firstLine;
        }
        
        const addedText = addedLines.join('\n').trim();
        return addedText.length > 100 ? addedText.substring(0, 100) + '...' : addedText;
    }

    function getCharDiff(oldContent, newContent) {
        // Find the longest common prefix
        let commonPrefix = 0;
        const minLength = Math.min(oldContent.length, newContent.length);
        
        while (commonPrefix < minLength && oldContent[commonPrefix] === newContent[commonPrefix]) {
            commonPrefix++;
        }
        
        // Find the longest common suffix
        let commonSuffix = 0;
        while (commonSuffix < minLength - commonPrefix && 
               oldContent[oldContent.length - 1 - commonSuffix] === newContent[newContent.length - 1 - commonSuffix]) {
            commonSuffix++;
        }
        
        // Extract the added content
        const addedContent = newContent.substring(commonPrefix, newContent.length - commonSuffix);
        return addedContent.trim();
    }

    function closeViewModal() {
        // Hide modal immediately
        viewNoteModal.style.display = 'none';
        viewNoteModal.classList.remove('active');
        document.body.style.overflow = ''; // Re-enable scrolling
        
        // Remove from history if it was added
        if (window.history.state && window.history.state.modal === 'viewNote') {
            history.back();
        }
        
        // Clean up event listeners
        if (viewNoteModal._keyDownHandler) {
            document.removeEventListener('keydown', viewNoteModal._keyDownHandler);
            viewNoteModal._keyDownHandler = null;
        }
        
        // Reset scroll position
        viewNoteContent.scrollTop = 0;
    }

    closeViewBtn.addEventListener('click', closeViewModal);
    
    // Handle back button
    window.addEventListener('popstate', function(e) {
        if (viewNoteModal.style.display === 'flex') {
            e.preventDefault();
            viewNoteModal.style.display = 'none';
            viewNoteModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    
    // Copy note content button
    const copyNoteBtn = document.getElementById('copyNoteBtn');
    if (copyNoteBtn) {
        copyNoteBtn.addEventListener('click', async () => {
            const noteContent = document.getElementById('viewNoteContent');
            if (noteContent) {
                try {
                    // Get text content (without HTML tags)
                    const textToCopy = noteContent.innerText || noteContent.textContent;
                    
                    // Copy to clipboard
                    await navigator.clipboard.writeText(textToCopy);
                    
                    // Show success feedback
                    const originalHTML = copyNoteBtn.innerHTML;
                    copyNoteBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    copyNoteBtn.style.backgroundColor = 'var(--success-color)';
                    
                    setTimeout(() => {
                        copyNoteBtn.innerHTML = originalHTML;
                        copyNoteBtn.style.backgroundColor = '';
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy:', err);
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = noteContent.innerText || noteContent.textContent;
                    textArea.style.position = 'fixed';
                    textArea.style.left = '-999999px';
                    document.body.appendChild(textArea);
                    textArea.select();
                    try {
                        document.execCommand('copy');
                        const originalHTML = copyNoteBtn.innerHTML;
                        copyNoteBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                        copyNoteBtn.style.backgroundColor = 'var(--success-color)';
                        setTimeout(() => {
                            copyNoteBtn.innerHTML = originalHTML;
                            copyNoteBtn.style.backgroundColor = '';
                        }, 2000);
                    } catch (err2) {
                        console.error('Fallback copy failed:', err2);
                        alert('Failed to copy text');
                    }
                    document.body.removeChild(textArea);
                }
            }
        });
    }

    viewNoteModal.addEventListener('click', (e) => {
        if (e.target === viewNoteModal) {
            closeViewModal();
        }
    });
});


// Toggle history drawer on mobile
function toggleHistoryDrawer() {
    const noteHistory = document.querySelector('.note-history');
    const toggleBtn = document.querySelector('.history-toggle');
    const overlay = document.querySelector('.history-overlay');
    
    if (noteHistory && toggleBtn && overlay) {
        noteHistory.classList.toggle('open');
        toggleBtn.classList.toggle('open');
        overlay.classList.toggle('active');
    }
}

function closeHistoryDrawer() {
    const noteHistory = document.querySelector('.note-history');
    const toggleBtn = document.querySelector('.history-toggle');
    const overlay = document.querySelector('.history-overlay');
    
    if (noteHistory && toggleBtn && overlay) {
        noteHistory.classList.remove('open');
        toggleBtn.classList.remove('open');
        overlay.classList.remove('active');
    }
}

// Close drawer when selecting a history item on mobile
document.addEventListener('click', (e) => {
    if (e.target.closest('.history-item') && window.innerWidth <= 768) {
        closeHistoryDrawer();
    }
});
