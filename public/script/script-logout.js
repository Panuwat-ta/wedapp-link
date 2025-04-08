// Mobile menu toggle
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            const navLinks = document.getElementById('navLinks');
            if (navLinks) {
                navLinks.classList.toggle('active');
            }
        });
    }

    // Set up logout button event listener
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            const oldConfirmBox = document.getElementById('confirmBox');
            if (oldConfirmBox) {
                oldConfirmBox.remove();
            }
            
            confirmLogout(
                'Do you want to log out?',
                () => logout(),
                () => alertBox('Cancel logout', 'info')
            );
        });
    }

    // Set up edit profile button
    const editProfileButton = document.getElementById('editProfileButton');
    if (editProfileButton) {
        editProfileButton.addEventListener('click', showEditProfileModal);
    }

    // Initial setup
    const isLoggedIn = localStorage.getItem('username') ? true : false;
    updateNavLinks(isLoggedIn);
    fetchUserLinksCount();
    fetchUserProfile();
});

function setActive(element) {
    if (!element) return;
    
    document.querySelectorAll('nav a').forEach(link => {
        link.classList.remove('active');
    });
    element.classList.add('active');
}

// ฟังก์ชันตรวจสอบผู้ใช้พิเศษ
function isSpecialUser() {
    const username = localStorage.getItem('currentUsername') || '';
    const email = localStorage.getItem('currentUserEmail') || '';
    
    return username === 'panuwat' && email === 'panuwat@gmail.com';
}

// Fetch and display total links count for logged-in user
async function fetchUserLinksCount() {
    const linksCountElement = document.getElementById('number_of_links');
    if (!linksCountElement) return;
    
    const username = localStorage.getItem('username');
    if (!username) {
        linksCountElement.textContent = "Please login to see your links";
        return;
    }

    try {
        const response = await fetch(`/user-links-count?username=${encodeURIComponent(username)}`);
        const data = await response.json();
        
        linksCountElement.textContent = ` ${data.count}`;
    } catch (error) {
        console.error("Error fetching user links count:", error);
        linksCountElement.textContent = "Unable to load your links count.";
    }
}

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

// ฟังก์ชันสำหรับแสดง alertBox พร้อมปุ่มตกลงและยกเลิก
function confirmLogout(message, onConfirm, onCancel) {
    const confirmElement = document.createElement('div');
    confirmElement.id = 'confirmBox';
    confirmElement.className = 'alert-box confirm';
    confirmElement.innerHTML = `
        <p>${message}</p>
        <div class="alert-actions">
            <button id="cancelButton" class="alert-btn cancel-btn">Cancel</button>
            <button id="confirmButton" class="alert-btn confirm-btn">OK</button>
        </div>
    `;
    
    document.body.appendChild(confirmElement);
    
    setTimeout(() => {
        confirmElement.classList.add('show');
    }, 10);

    const confirmButton = document.getElementById('confirmButton');
    const cancelButton = document.getElementById('cancelButton');
    
    if (confirmButton && cancelButton) {
        confirmButton.onclick = () => {
            confirmElement.classList.remove('show');
            setTimeout(() => {
                confirmElement.remove();
            }, 300);
            if (onConfirm) onConfirm();
        };

        cancelButton.onclick = () => {
            confirmElement.classList.remove('show');
            setTimeout(() => {
                confirmElement.remove();
            }, 300);
            if (onCancel) onCancel();
        };
    }
}

// ฟังก์ชันสำหรับแสดงข้อความแจ้งเตือน
function alertBox(message, type = 'info') {
    const oldAlerts = document.querySelectorAll('.alert-message');
    oldAlerts.forEach(alert => {
        alert.remove();
    });
    
    const alertElement = document.createElement('div');
    alertElement.id = `alertMessage-${Date.now()}`;
    alertElement.className = `alert-message ${type}`;
    alertElement.textContent = message;
    
    document.body.appendChild(alertElement);
    
    setTimeout(() => {
        alertElement.classList.add('show');
    }, 10);

    setTimeout(() => {
        alertElement.classList.remove('show');
        setTimeout(() => {
            alertElement.remove();
        }, 300);
    }, 2000);
}

// ฟังก์ชัน logout
async function logout() {
    try {
        const response = await fetch('/logout', { method: 'POST' });
        if (response.ok) {
            alertBox('Logout successful!', 'success');
            localStorage.removeItem('username');
            localStorage.removeItem('currentUsername');
            localStorage.removeItem('currentUserEmail');
            localStorage.removeItem('email');
            updateNavLinks(false);
            setTimeout(() => {
                window.location.href = "login.html";
            }, 1000);
        } else {
            alertBox('Logout failed.', 'error');
        }
    } catch (err) {
        console.error('Error during logout:', err);
        alertBox('An error occurred during logout.', 'error');
    }
}

async function fetchUserProfile() {
    try {
        const username = localStorage.getItem('username');
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const usernameHeader = document.getElementById('usernameHeader');
        const profileImg = document.querySelector('.profile-img');
        
        if (!profileName || !profileEmail) return;
        
        if (!username) {
            profileName.textContent = 'ผู้เยี่ยมชม';
            profileEmail.textContent = 'กรุณาเข้าสู่ระบบ';
            if (usernameHeader) usernameHeader.textContent = 'Welcome';
            if (profileImg) profileImg.src = '/img/b1.jpg';
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
                const displayName = user.username.length > 20 
                    ? user.username.substring(0, 20) + '...' 
                    : user.username;
                
                profileName.textContent = displayName;
                profileEmail.textContent = user.email;
                
                if (usernameHeader) {
                    usernameHeader.textContent = `Welcome ${displayName}`;
                    usernameHeader.title = user.username;
                }
                
                // Update profile image
                if (profileImg) {
                    profileImg.src = user.profileImage || '/img/b1.jpg';
                    profileImg.onerror = () => {
                        profileImg.src = '/img/b1.jpg';
                    };
                }
                
                localStorage.setItem('currentUsername', user.username);
                localStorage.setItem('currentUserEmail', user.email);
                localStorage.setItem('email', user.email);
            } else {
                profileName.textContent = 'ไม่พบข้อมูลผู้ใช้';
                profileEmail.textContent = '';
                if (usernameHeader) usernameHeader.textContent = 'Welcome';
            }
        } else {
            console.error('ไม่สามารถดึงข้อมูลผู้ใช้ได้');
            profileName.textContent = 'เกิดข้อผิดพลาด';
            profileEmail.textContent = '';
            if (usernameHeader) usernameHeader.textContent = 'Welcome';
        }
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้:', error);
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        if (profileName) profileName.textContent = 'เกิดข้อผิดพลาด';
        if (profileEmail) profileEmail.textContent = '';
        const usernameHeader = document.getElementById('usernameHeader');
        if (usernameHeader) usernameHeader.textContent = 'Welcome';
    }
}

// แสดง modal สำหรับแก้ไขโปรไฟล์
function showEditProfileModal() {
    const username = localStorage.getItem('currentUsername');
    const email = localStorage.getItem('currentUserEmail');
    const profileImage = document.querySelector('.profile-img').src;

    const modalHTML = `
        <div class="edit-modal active" id="editProfileModal">
            <div class="edit-modal-content">
                <div class="edit-modal-header">
                    <h2>Edit Profile</h2>
                </div>
                <form id="editProfileForm">
                    <div class="edit-form-group">
                        <label for="editUsername">Username</label>
                        <input type="text" id="editUsername" value="${username || ''}" required>
                        <div id="usernameError" class="error-message"></div>
                    </div>
                    <div class="edit-form-group">
                        <label for="editEmail">Email</label>
                        <input type="email" id="editEmail" value="${email || ''}" required>
                        <div id="emailError" class="error-message"></div>
                    </div>
                    <div class="edit-form-group">
                        <label for="editProfileImage">Profile Image URL</label>
                        <input type="text" id="editProfileImage" value="${profileImage || ''}" placeholder="Enter image URL">
                        <img src="${profileImage || '/img/b1.jpg'}" alt="Profile Preview" class="image-preview" id="profileImagePreview">
                    </div>
                    <div class="edit-modal-actions">
                        <button type="button" class="cancel-btn" id="cancelEditProfile">Cancel</button>
                        <button type="submit" class="save-btn" id="saveProfileBtn">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Preview image when URL changes
    const imageUrlInput = document.getElementById('editProfileImage');
    const imagePreview = document.getElementById('profileImagePreview');
    
    if (imageUrlInput && imagePreview) {
        imageUrlInput.addEventListener('input', function() {
            imagePreview.src = this.value || '/img/b1.jpg';
        });
    }

    // Handle cancel button
    const cancelButton = document.getElementById('cancelEditProfile');
    if (cancelButton) {
        cancelButton.addEventListener('click', closeEditProfileModal);
    }

    // Handle form submission
    const editForm = document.getElementById('editProfileForm');
    if (editForm) {
        editForm.addEventListener('submit', handleProfileUpdate);
    }

    // Real-time validation for username and email
    const usernameInput = document.getElementById('editUsername');
    const emailInput = document.getElementById('editEmail');
    const saveBtn = document.getElementById('saveProfileBtn');

    // Debounce function to limit API calls
    const debounce = (func, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(null, args);
            }, delay);
        };
    };

    // Check username availability
    const checkUsernameAvailability = debounce(async (username) => {
        if (!username || username === localStorage.getItem('currentUsername')) {
            document.getElementById('usernameError').textContent = '';
            usernameInput.classList.remove('invalid');
            return;
        }

        try {
            const response = await fetch('/check-username?username=' + encodeURIComponent(username));
            const data = await response.json();
            
            if (data.available) {
                document.getElementById('usernameError').textContent = '';
                usernameInput.classList.remove('invalid');
            } else {
                document.getElementById('usernameError').textContent = 'Username already exists';
                usernameInput.classList.add('invalid');
            }
        } catch (error) {
            console.error('Error checking username:', error);
        }
    }, 500);

    // Check email availability
    const checkEmailAvailability = debounce(async (email) => {
        if (!email || email === localStorage.getItem('currentUserEmail')) {
            document.getElementById('emailError').textContent = '';
            emailInput.classList.remove('invalid');
            return;
        }

        try {
            const response = await fetch('/check-email?email=' + encodeURIComponent(email));
            const data = await response.json();
            
            if (data.available) {
                document.getElementById('emailError').textContent = '';
                emailInput.classList.remove('invalid');
            } else {
                document.getElementById('emailError').textContent = 'Email already exists';
                emailInput.classList.add('invalid');
            }
        } catch (error) {
            console.error('Error checking email:', error);
        }
    }, 500);

    // Event listeners for real-time validation
    usernameInput.addEventListener('input', (e) => {
        const username = e.target.value.trim();
        checkUsernameAvailability(username);
    });

    emailInput.addEventListener('input', (e) => {
        const email = e.target.value.trim();
        checkEmailAvailability(email);
    });

    // Initial check
    checkUsernameAvailability(usernameInput.value.trim());
    checkEmailAvailability(emailInput.value.trim());
}

// ปิด modal แก้ไขโปรไฟล์
function closeEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// จัดการการอัปเดตโปรไฟล์
async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const username = document.getElementById('editUsername').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const profileImage = document.getElementById('editProfileImage').value;
    const usernameError = document.getElementById('usernameError').textContent;
    const emailError = document.getElementById('emailError').textContent;

    // ตรวจสอบข้อมูลก่อนส่ง
    if (!username || !email) {
        alertBox('Please fill in all required fields', 'error');
        return;
    }

    if (usernameError || emailError) {
        alertBox('Please fix all errors before saving', 'error');
        return;
    }

    // เรียกใช้ passwordPrompt ก่อนทำการอัปเดต
    passwordPrompt('Please enter your password to confirm changes:', async (password) => {
        if (password === null) return;
        
        try {
            const currentUsername = localStorage.getItem('username');
            const response = await fetch('/verify-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-username': currentUsername
                },
                body: JSON.stringify({ password })
            });

            if (!response.ok) {
                const error = await response.json();
                alertBox(error.message || 'Password verification failed', 'error');
                return;
            }

            // อัปเดตโปรไฟล์
            const updateResponse = await fetch('/update-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-username': currentUsername
                },
                body: JSON.stringify({ username, email, profileImage })
            });

            if (updateResponse.ok) {
                const data = await updateResponse.json();
                alertBox('Profile updated successfully!', 'success');
                
                // อัปเดตข้อมูลใน localStorage
                localStorage.setItem('username', username);
                localStorage.setItem('currentUsername', username);
                localStorage.setItem('currentUserEmail', email);
                localStorage.setItem('email', email);
                
                // อัปเดตการแสดงผล
                document.getElementById('profileName').textContent = username;
                document.getElementById('profileEmail').textContent = email;
                
                const profileImgElement = document.querySelector('.profile-img');
                if (profileImgElement && profileImage) {
                    profileImgElement.src = profileImage;
                }
                
                const usernameHeader = document.getElementById('usernameHeader');
                if (usernameHeader) {
                    usernameHeader.textContent = `Welcome ${username}`;
                    usernameHeader.title = username;
                }
                
                closeEditProfileModal();
                
                setTimeout(() => {
                    location.reload();
                }, 1500);
            } else {
                const error = await updateResponse.json();
                alertBox(error.message || 'Failed to update profile', 'error');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alertBox('An error occurred while updating profile', 'error');
        }
    });
}

// ฟังก์ชันแสดงหน้าต่างกรอกรหัสผ่าน
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
    
    const passwordInput = promptBox.querySelector('.password-input');
    passwordInput.focus();
    
    promptBox.querySelector('.cancel-btn').addEventListener('click', () => {
        promptBox.remove();
        callback(null);
    });
    
    promptBox.querySelector('.confirm-btn').addEventListener('click', () => {
        const password = passwordInput.value;
        promptBox.remove();
        callback(password);
    });
    
    passwordInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            const password = passwordInput.value;
            promptBox.remove();
            callback(password);
        }
    });
}