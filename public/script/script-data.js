// script-data.js
// Mobile menu toggle
document.getElementById('menuToggle').addEventListener('click', function () {
    document.getElementById('navLinks').classList.toggle('active');
});

// Function to highlight active navigation link
function setActive(element) {
    document.querySelectorAll('nav a').forEach(link => {
        link.classList.remove('active');
    });
    element.classList.add('active');
}

// Check if user is panuwat with special privileges
function isSpecialUser() {
    const username = localStorage.getItem('currentUsername') || localStorage.getItem('username') || '';
    const email = localStorage.getItem('currentUserEmail') || localStorage.getItem('email') || '';
    return username === 'panuwat' && email === 'panuwat@gmail.com';
}

// Custom prompt function
function customPrompt(message, defaultValue = '', callback) {
    const promptBox = document.createElement('div');
    promptBox.className = 'password-prompt';
    promptBox.innerHTML = `
        <div class="prompt-content">
            <h3>${message}</h3>
            <input type="text" class="password-input" value="${defaultValue}" autocomplete="off">
            <div class="prompt-buttons">
                <button class="cancel-btn">Cancel</button>
                <button class="confirm-btn">OK</button>
            </div>
        </div>
    `;

    document.body.appendChild(promptBox);

    const input = promptBox.querySelector('input');
    input.focus();
    input.select();

    promptBox.querySelector('.cancel-btn').addEventListener('click', () => {
        promptBox.remove();
        callback(null);
    });

    promptBox.querySelector('.confirm-btn').addEventListener('click', () => {
        const value = input.value;
        promptBox.remove();
        callback(value);
    });

    input.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            const value = input.value;
            promptBox.remove();
            callback(value);
        }
    });
}

// Custom confirm function
function customConfirm(message, callback) {
    const confirmBox = document.createElement('div');
    confirmBox.className = 'password-prompt';
    confirmBox.innerHTML = `
        <div class="prompt-content">
            <h3>${message}</h3>
            <div class="prompt-buttons">
                <button class="cancel-btn">Cancel</button>
                <button class="confirm-btn">Confirm</button>
            </div>
        </div>
    `;

    document.body.appendChild(confirmBox);
    
    // Add to history for back button support
    history.pushState({ modal: 'confirmDelete' }, '');
    console.log('Confirm dialog opened with history support');

    confirmBox.querySelector('.cancel-btn').addEventListener('click', () => {
        // Remove from history if it was added
        if (window.history.state && window.history.state.modal === 'confirmDelete') {
            history.back();
        }
        confirmBox.remove();
        callback(false);
    });

    confirmBox.querySelector('.confirm-btn').addEventListener('click', () => {
        // Remove from history if it was added
        if (window.history.state && window.history.state.modal === 'confirmDelete') {
            history.back();
        }
        confirmBox.remove();
        callback(true);
    });
}

// Custom edit dialog function
function customEditDialog(currentName, currentUrl, callback) {
    console.log('customEditDialog called with:', currentName, currentUrl);
    
    const editBox = document.createElement('div');
    editBox.className = 'password-prompt';
    editBox.innerHTML = `
        <div class="prompt-content edit-dialog" style="width: 450px;">
            <h3>Edit Link</h3>
            <div class="edit-options">
                <button id="editNameBtn" class="edit-option-btn active">Edit Name</button>
                <button id="editUrlBtn" class="edit-option-btn">Edit URL</button>
                <button id="editBothBtn" class="edit-option-btn">Edit Both</button>
            </div>
            <div id="editNameSection">
                <div class="form-group">
                    <label>Link Name:</label>
                    <input type="text" id="editNameInput" class="form-input" value="${currentName}" autocomplete="off">
                </div>
            </div>
            <div id="editUrlSection" style="display: none;">
                <div class="form-group">
                    <label>Link URL:</label>
                    <input type="text" id="editUrlInput" class="form-input" value="${currentUrl}" autocomplete="off">
                </div>
            </div>
            <div id="editBothSection" style="display: none;">
                <div class="form-group">
                    <label>Link Name:</label>
                    <input type="text" id="editBothNameInput" class="form-input" value="${currentName}" autocomplete="off">
                </div>
                <div class="form-group">
                    <label>Link URL:</label>
                    <input type="text" id="editBothUrlInput" class="form-input" value="${currentUrl}" autocomplete="off">
                </div>
            </div>
            <div class="prompt-buttons">
                <button class="cancel-btn">Cancel</button>
                <button class="confirm-btn">Save Changes</button>
            </div>
        </div>
    `;

    console.log('Appending editBox to body');
    document.body.appendChild(editBox);
    
    // Add to history for back button support
    history.pushState({ modal: 'editLink' }, '');
    
    console.log('editBox appended, checking if visible');
    console.log('editBox display:', window.getComputedStyle(editBox).display);
    console.log('editBox visibility:', window.getComputedStyle(editBox).visibility);
    console.log('editBox opacity:', window.getComputedStyle(editBox).opacity);

    // ตัวเลือกการแก้ไข
    const editNameBtn = editBox.querySelector('#editNameBtn');
    const editUrlBtn = editBox.querySelector('#editUrlBtn');
    const editBothBtn = editBox.querySelector('#editBothBtn');
    const editNameSection = editBox.querySelector('#editNameSection');
    const editUrlSection = editBox.querySelector('#editUrlSection');
    const editBothSection = editBox.querySelector('#editBothSection');

    editNameBtn.addEventListener('click', () => {
        editNameBtn.classList.add('active');
        editUrlBtn.classList.remove('active');
        editBothBtn.classList.remove('active');
        editNameSection.style.display = 'block';
        editUrlSection.style.display = 'none';
        editBothSection.style.display = 'none';
    });

    editUrlBtn.addEventListener('click', () => {
        editNameBtn.classList.remove('active');
        editUrlBtn.classList.add('active');
        editBothBtn.classList.remove('active');
        editNameSection.style.display = 'none';
        editUrlSection.style.display = 'block';
        editBothSection.style.display = 'none';
    });

    editBothBtn.addEventListener('click', () => {
        editNameBtn.classList.remove('active');
        editUrlBtn.classList.remove('active');
        editBothBtn.classList.add('active');
        editNameSection.style.display = 'none';
        editUrlSection.style.display = 'none';
        editBothSection.style.display = 'block';
    });

    // ปุ่มยกเลิก
    editBox.querySelector('.cancel-btn').addEventListener('click', () => {
        // Remove from history if it was added
        if (window.history.state && window.history.state.modal === 'editLink') {
            history.back();
        }
        editBox.remove();
        callback(null);
    });

    // ปุ่มยืนยัน
    editBox.querySelector('.confirm-btn').addEventListener('click', () => {
        let newName = currentName;
        let newUrl = currentUrl;

        if (editNameBtn.classList.contains('active')) {
            newName = editBox.querySelector('#editNameInput').value;
        }
        else if (editUrlBtn.classList.contains('active')) {
            newUrl = editBox.querySelector('#editUrlInput').value;
        }
        else {
            newName = editBox.querySelector('#editBothNameInput').value;
            newUrl = editBox.querySelector('#editBothUrlInput').value;
        }

        // Remove from history if it was added
        if (window.history.state && window.history.state.modal === 'editLink') {
            history.back();
        }
        editBox.remove();
        callback({ newName, newUrl });
    });
}

// Alert box function
function alertBox(message, type) {
    const alertBox = document.createElement('div');
    alertBox.className = `alert-box ${type}`;
    alertBox.textContent = message;

    document.body.appendChild(alertBox);

    setTimeout(() => {
        alertBox.classList.add('fade-out');
        setTimeout(() => {
            alertBox.remove();
        }, 500);
    }, 2000);
}

// Load all links from the server
async function loadLinks() {
    const container = document.getElementById('link-container');
    const linkCount = document.getElementById('linkCount');
    container.innerHTML = '<div class="loading">Loading links...</div>';

    try {
        const response = await fetch('/data');
        const links = await response.json();

        links.sort((a, b) => {
            // แปลงวันที่เป็น timestamp เพื่อเปรียบเทียบ
            function parseThaiDate(str) {
                const [datePart, timePart] = str.split(' ');
                const [day, month, year] = datePart.split('/').map(Number);
                const christianYear = year - 543; // แปลง พ.ศ. เป็น ค.ศ.
                const [hour, minute] = timePart ? timePart.split(':').map(Number) : [0, 0];
                return new Date(christianYear, month - 1, day, hour, minute).getTime();
            }
            return parseThaiDate(b.date) - parseThaiDate(a.date);
        });

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
            editBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Edit button clicked for:', _id, name, url);
                editLink(_id, name, url);
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'action-btn delete-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Delete button clicked for:', _id);
                deleteLink(_id);
            });

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

    const username = localStorage.getItem('username');

    try {
        const response = await fetch('/add-link', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-username': username || ''
            },
            body: JSON.stringify({ url, name, date: formattedDateTime }),
        });

        if (response.ok) {
            loadLinks();
            alertBox('Link added successfully!', 'success');
        } else {
            alertBox('Failed to add link', 'error');
        }
    } catch (error) {
        console.error('Error saving link:', error);
        alertBox('Error saving link', 'error');
    }
}

// Password prompt function
function passwordPrompt(message, callback) {
    const promptBox = document.createElement('div');
    promptBox.className = 'password-prompt';
    promptBox.innerHTML = `
        <div class="prompt-content">
            <h3>${message}</h3>
            <input type="password" class="password-input" placeholder="Enter password" autocomplete="off">
            <div class="prompt-buttons">
                <button class="cancel-btn">Cancel</button>
                <button class="confirm-btn">Confirm</button>
            </div>
        </div>
    `;

    document.body.appendChild(promptBox);
    
    // Add to history for back button support
    history.pushState({ modal: 'passwordPrompt' }, '');
    console.log('Password prompt opened with history support');

    const passwordInput = promptBox.querySelector('.password-input');
    passwordInput.focus();

    promptBox.querySelector('.cancel-btn').addEventListener('click', () => {
        // Remove from history if it was added
        if (window.history.state && window.history.state.modal === 'passwordPrompt') {
            history.back();
        }
        promptBox.remove();
        callback(null);
    });

    promptBox.querySelector('.confirm-btn').addEventListener('click', () => {
        const password = passwordInput.value;
        // Remove from history if it was added
        if (window.history.state && window.history.state.modal === 'passwordPrompt') {
            history.back();
        }
        promptBox.remove();
        callback(password);
    });

    passwordInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            const password = passwordInput.value;
            // Remove from history if it was added
            if (window.history.state && window.history.state.modal === 'passwordPrompt') {
                history.back();
            }
            promptBox.remove();
            callback(password);
        }
    });
}

// Edit link function
async function editLink(id, currentName, currentUrl) {
    try {
        console.log('editLink called with:', id, currentName, currentUrl);
        console.log('isSpecialUser:', isSpecialUser());
        
        if (isSpecialUser()) {
            console.log('User is special, showing edit dialog directly');
            console.log('About to call customEditDialog');
            console.log('customEditDialog type:', typeof customEditDialog);
            customEditDialog(currentName, currentUrl, (result) => {
                console.log('Edit dialog result:', result);
                if (result) {
                    editLinkRequest(id, result.newName, result.newUrl);
                }
            });
            console.log('customEditDialog called');
        } else {
            console.log('User is not special, showing password prompt');
            passwordPrompt('Please enter password to edit link:', (password) => {
                const correctPassword = 'panuwat';

                if (password === null) return;
                if (password === correctPassword) {
                    customEditDialog(currentName, currentUrl, (result) => {
                        if (result) {
                            editLinkRequest(id, result.newName, result.newUrl);
                        }
                    });
                } else {
                    alertBox('Incorrect password', 'error');
                }
            });
        }
    } catch (error) {
        console.error('Error in editLink:', error);
    }
}

// Delete link function
async function deleteLink(id) {
    if (isSpecialUser()) {
        customConfirm('Are you sure you want to delete this link?', (confirmed) => {
            if (confirmed) {
                deleteLinkRequest(id);
            }
        });
    } else {
        passwordPrompt('Please enter password to delete link:', (password) => {
            const correctPassword = 'panuwat';

            if (password === null) return;
            if (password === correctPassword) {
                customConfirm('Are you sure you want to delete this link?', (confirmed) => {
                    if (confirmed) {
                        deleteLinkRequest(id);
                    }
                });
            } else {
                alertBox('Incorrect password', 'error');
            }
        });
    }
}

// Edit link request
async function editLinkRequest(id, newName, newUrl) {
    try {
        const response = await fetch(`/edit-link/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: newName,
                url: newUrl
            }),
        });

        if (response.ok) {
            loadLinks();
            alertBox('Link edited successfully!', 'success');
        } else {
            const responseData = await response.text();
            alertBox(`Failed to edit link: ${responseData}`, 'error');
        }
    } catch (error) {
        console.error('Error editing link:', error);
        alertBox(`Error editing link: ${error.message}`, 'error');
    }
}

// Delete link request
async function deleteLinkRequest(id) {
    try {
        const response = await fetch(`/delete-link/${id}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            loadLinks();
            alertBox('Link deleted successfully!', 'success');
        } else {
            alertBox('Failed to delete link', 'error');
        }
    } catch (error) {
        console.error('Error deleting link:', error);
        alertBox('Error deleting link', 'error');
    }
}

// Handle the form submission for adding new links
document.getElementById('add-link-form').addEventListener('submit', function (event) {
    event.preventDefault();
    const url = document.getElementById('link-url').value;
    const name = document.getElementById('link-name').value || url;
    if (url && name) {
        saveLink(url, name);
        document.getElementById('link-url').value = '';
        document.getElementById('link-name').value = '';
    } else {
        alertBox('Please enter both URL and name', 'error');
    }
});

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Load links and user profile
    loadLinks();
    fetchUserProfile();
    
    // Check login status
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
    
    // Handle back button for modals
    window.addEventListener('popstate', function(e) {
        console.log('Popstate triggered on date page', e.state);
        
        // Close any open modal/prompt
        const editDialog = document.querySelector('.password-prompt');
        if (editDialog) {
            editDialog.remove();
            console.log('Modal closed by back button');
        }
    });
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
    
    updateNavLinks(isLoggedIn ? true : false);
});

// Update Login/Logout link display
function updateNavLinks(isLoggedIn) {
    const loginLink = document.getElementById('loginLink');
    const logoutLink = document.getElementById('logoutLink');

    if (!loginLink || !logoutLink) return;

    if (isLoggedIn) {
        loginLink.style.display = 'none';
        logoutLink.style.display = 'block';
    } else {
        loginLink.style.display = 'block';
        logoutLink.style.display = 'none';
    }
}

// Fetch user profile and store email
async function fetchUserProfile() {
    try {
        const username = localStorage.getItem('username');
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');

        if (!profileName || !profileEmail) return;

        if (!username) {
            profileName.textContent = 'ผู้เยี่ยมชม';
            profileEmail.textContent = 'กรุณาเข้าสู่ระบบ';
            return;
        }

        const response = await fetch('/current-user', {
            headers: {
                'x-username': username
            }
        });

        if (response.ok) {
            const user = await response.json();
            if (user.username && user.email) {
                profileName.textContent = user.username;
                profileEmail.textContent = user.email;
                localStorage.setItem('currentUsername', user.username);
                localStorage.setItem('currentUserEmail', user.email);
                localStorage.setItem('email', user.email);
            } else {
                profileName.textContent = 'ไม่พบข้อมูลผู้ใช้';
                profileEmail.textContent = '';
            }
        } else {
            console.error('ไม่สามารถดึงข้อมูลผู้ใช้ได้');
            profileName.textContent = 'เกิดข้อผิดพลาด';
            profileEmail.textContent = '';
        }
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้:', error);
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        if (profileName) profileName.textContent = 'เกิดข้อผิดพลาด';
        if (profileEmail) profileEmail.textContent = '';
    }
}