
        // Mobile menu toggle
        document.getElementById('menuToggle').addEventListener('click', function() {
            document.getElementById('navLinks').classList.toggle('active');
        });

        // Function to highlight active navigation link
        function setActive(element) {
            document.querySelectorAll('nav a').forEach(link => {
                link.classList.remove('active');
            });
            element.classList.add('active');
        }

        // Load all links from the server
        async function loadLinks() {
            const container = document.getElementById('link-container');
            const linkCount = document.getElementById('linkCount');
            container.innerHTML = '<div class="loading">Loading links...</div>';
            
            try {
                const response = await fetch('/data');
                const links = await response.json();

                container.innerHTML = '';
                linkCount.textContent = `${links.length} links`;

                if (links.length === 0) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-link"></i>
                            <h3>No links found</h3>
                            <p>Add your first link using the form above</p>
                        </div>
                    `;
                    return;
                }

                links.forEach(({ _id, url, name, date }) => {
                    const linkItem = document.createElement('div');
                    linkItem.className = 'link-item';

                    const linkInfo = document.createElement('div');
                    linkInfo.className = 'link-info';

                    const linkIcon = document.createElement('div');
                    linkIcon.className = 'link-icon';
                    linkIcon.innerHTML = '<i class="fas fa-external-link-alt"></i>';

                    const linkDetails = document.createElement('div');
                    linkDetails.className = 'link-details';

                    const linkName = document.createElement('div');
                    linkName.className = 'link-name';
                    linkName.textContent = name;

                    const linkDate = document.createElement('div');
                    linkDate.className = 'link-url';
                    linkDate.textContent = date;

                    const linkUrl = document.createElement('div');
                    linkUrl.className = 'link-url';
                    linkUrl.textContent = url;

                    const linkActions = document.createElement('div');
                    linkActions.className = 'link-actions';

                    const openBtn = document.createElement('button');
                    openBtn.className = 'action-btn open-btn';
                    openBtn.innerHTML = '<i class="fas fa-external-link-alt"></i>';
                    openBtn.addEventListener('click', () => window.open(url, '_blank'));

                    const editBtn = document.createElement('button');
                    editBtn.className = 'action-btn edit-btn';
                    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
                    editBtn.addEventListener('click', () => editLink(_id, name));

                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'action-btn delete-btn';
                    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
                    deleteBtn.addEventListener('click', () => deleteLink(_id));

                    linkDetails.appendChild(linkName);
                    linkDetails.appendChild(linkDate);
                    linkDetails.appendChild(linkUrl);
                    
                    linkInfo.appendChild(linkIcon);
                    linkInfo.appendChild(linkDetails);
                    
                    linkActions.appendChild(openBtn);
                    linkActions.appendChild(editBtn);
                    linkActions.appendChild(deleteBtn);
                    
                    linkItem.appendChild(linkInfo);
                    linkItem.appendChild(linkActions);
                    
                    container.appendChild(linkItem);
                });
            } catch (error) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Error loading links</h3>
                        <p>${error.message || 'An unknown error occurred'}</p>
                        <button onclick="loadLinks()" class="action-btn open-btn" style="margin-top: 15px;">
                            <i class="fas fa-sync-alt"></i> Try Again
                        </button>
                    </div>
                `;
                linkCount.textContent = 'Error';
                console.error('Error loading links:', error);
            }
        }

        // Save the new link
        async function saveLink(url, name) {
            const now = new Date();
            const currentDate = now.toLocaleDateString('th-TH', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            });
            const currentTime = now.toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            const formattedDateTime = `${currentDate} ${currentTime}`;

            try {
                const response = await fetch('/add-link', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ url, name, date: formattedDateTime }),
                });

                if (response.ok) {
                    loadLinks();
                } else {
                    alert('Failed to add link');
                }
            } catch (error) {
                console.error('Error saving link:', error);
                alert('Error saving link');
            }
        }

        // Edit an existing link's name
        async function editLink(id, currentName) {
            const password = prompt('Please enter password to edit link:');
            const correctPassword = 'panuwat';

            if (password === correctPassword) {
                const newName = prompt('Enter new name:', currentName);
                
                if (newName && newName !== currentName) {
                    try {
                        const response = await fetch(`/edit-link/${id}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ name: newName }),
                        });

                        if (response.ok) {
                            loadLinks();
                        } else {
                            const responseData = await response.text();
                            alert(`Failed to edit link: ${responseData}`);
                        }
                    } catch (error) {
                        console.error('Error editing link:', error);
                        alert(`Error editing link: ${error.message}`);
                    }
                }
            } else {
                alert('Incorrect password');
            }
        }

        // Delete a link
        async function deleteLink(id) {
            const password = prompt('Please enter password to delete link:');
            const correctPassword = 'panuwat';

            if (password === correctPassword) {
                try {
                    const response = await fetch(`/delete-link/${id}`, {
                        method: 'DELETE',
                    });

                    if (response.ok) {
                        loadLinks();
                    } else {
                        alert('Failed to delete link');
                    }
                } catch (error) {
                    console.error('Error deleting link:', error);
                    alert('Error deleting link');
                }
            } else {
                alert('Incorrect password');
            }
        }

        // Handle the form submission for adding new links
        document.getElementById('add-link-form').addEventListener('submit', function(event) {
            event.preventDefault();
            const url = document.getElementById('link-url').value;
            const name = document.getElementById('link-name').value || url;
            if (url && name) {
                saveLink(url, name);
                document.getElementById('link-url').value = '';
                document.getElementById('link-name').value = '';
            } else {
                alert('Please enter both URL and name');
            }
        });

        // Initialize the page
        document.addEventListener('DOMContentLoaded', () => {
            loadLinks();
        });
