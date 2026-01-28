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
                <h3>${noteName}</h3>
                <div class="note-footer">
                    <div class="author-line">By: ${note.username}</div>
                    <div class="edited-line">edited: ${note.lastEditedBy || note.username}</div>
                    <div class="date-line">${new Date(note.lastEditedAt || note.createdAt).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', hour12: false })}</div>
                </div>
            `;
            noteElement.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    viewNote(note);
                }
            });
            notesList.appendChild(noteElement);
        });
    }


    async function viewNote(note) {
        try {
            // Show loading state
            viewNoteContent.textContent = 'Loading...';
            
            // Start showing modal immediately for better perceived performance
            viewNoteModal.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
            
            // Force reflow to ensure the element is in the render tree
            void viewNoteModal.offsetWidth;
            
            // Start loading data
            if (note) {
                // Reset any historical styling
                viewNoteContent.style.backgroundColor = '';
                viewNoteContent.style.border = '';
                viewNoteContent.style.padding = '';
                viewNoteContent.style.borderRadius = '';
                
                // Remove any historical indicator
                const historicalIndicator = viewNoteContent.parentNode.querySelector('.historical-indicator');
                if (historicalIndicator) {
                    historicalIndicator.remove();
                }
                
                // Update content
                viewNoteName.textContent = note.noteName || 'Untitled Note';
                viewNoteContent.innerHTML = note.content.replace(/\n/g, '<br>');
                
                // Update author and last edited info
                const noteAuthor = document.getElementById('noteAuthor');
                const noteLastEdited = document.getElementById('noteLastEdited');
                
                noteAuthor.textContent = `By: ${note.username}`;
                
                if (note.lastEditedBy && note.lastEditedAt) {
                    noteLastEdited.textContent = `edited ${note.lastEditedBy} date ${new Date(note.lastEditedAt).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', hour12: false })}`;
                } else {
                    noteLastEdited.textContent = `date ${new Date(note.createdAt).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', hour12: false })}`;
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
            viewNoteContent.innerHTML = 'Failed to load note. Please try again.';
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
            historyItem.style.cursor = 'pointer';
            
            const editDate = new Date(history.editedAt).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', hour12: false });
            const editType = history.editType === 'original' ? 'Created' : 'Modified';
            
            // Calculate version number for this history item
            const totalVersions = sortedHistory.length + 1; // +1 for current version
            const versionNumber = totalVersions - index; // Reverse order (newest gets highest number)
            
            // Calculate newly added content
            let addedContent = '';
            if (history.editType === 'original') {
                // For original, show first 50 characters
                const firstLine = history.content.split('\n')[0].trim();
                addedContent = firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
            } else {
                // For modified, calculate what was added by comparing with the next newer version
                const nextHistory = sortedHistory[index - 1]; // Next newer version
                if (nextHistory) {
                    // Compare this history with the next newer one to see what was added
                    addedContent = getAddedContent(history.content, nextHistory.content);
                } else {
                    // If no next version, compare with current content
                    addedContent = getAddedContent(history.content, note.content);
                }
            }
            
            historyItem.innerHTML = `
                <div class="history-content">
                    <p><strong>Title:</strong> ${history.noteName}</p>
                    <p><strong>Modified by</strong> ${history.editedBy}</p>
                    <p><strong>${editDate} (V.${versionNumber})</strong></p>
                    <p><strong>By</strong> ${history.editedBy}</p>
                </div>
            `;
            
            // Add click event to show historical content
            historyItem.addEventListener('click', () => {
                // Remove 'active' class from previously selected item
                const currentActive = document.querySelector('.history-item.active');
                if (currentActive) {
                    currentActive.classList.remove('active');
                }
                // Add 'active' class to the clicked item
                historyItem.classList.add('active');
                showHistoricalNote(history, editType);
            });
            
            editHistoryList.appendChild(historyItem);
        });
    }

    function showHistoricalNote(history, editType) {
        // Update the main note view with historical content
        viewNoteName.textContent = history.noteName || 'Untitled Note';
        viewNoteContent.innerHTML = history.content.replace(/\n/g, '<br>');
        
        // Update author and last edited info for historical version
        const noteAuthor = document.getElementById('noteAuthor');
        const noteLastEdited = document.getElementById('noteLastEdited');
        
        noteAuthor.textContent = `By: ${history.editedBy}`;
        noteLastEdited.textContent = `Viewing historical version - ${new Date(history.editedAt).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', hour12: false })}`;
        
        // Add visual indication that this is a historical version
        viewNoteContent.style.backgroundColor = '#fff3cd';
        viewNoteContent.style.border = '1px solid #ffeaa7';
        viewNoteContent.style.padding = '15px';
        viewNoteContent.style.borderRadius = '5px';
        
        // Add a small note about historical view
        const historicalNote = document.createElement('div');
        historicalNote.style.backgroundColor = '#fff3cd';
        historicalNote.style.color = '#856404';
        historicalNote.style.padding = '10px';
        historicalNote.style.borderRadius = '5px';
        historicalNote.style.marginBottom = '10px';
        historicalNote.style.fontSize = '0.9rem';
        historicalNote.innerHTML = '<strong>📚 Historical Version</strong> - Click on another history item to view different versions';
        
        // Insert historical note before content
        const parent = viewNoteContent.parentNode;
        if (parent.querySelector('.historical-indicator')) {
            parent.querySelector('.historical-indicator').remove();
        }
        historicalNote.className = 'historical-indicator';
        parent.insertBefore(historicalNote, viewNoteContent);
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
