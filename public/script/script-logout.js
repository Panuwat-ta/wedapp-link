document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    
    const isLoggedIn = localStorage.getItem('username');
    const userEmail = localStorage.getItem('email');
    
    // Redirect to login if not logged in
    if (!isLoggedIn) {
        window.location.href = '/login.html';
        return;
    }
    
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

    // Mobile menu is handled by mobile-menu.js

    fetchUserProfile();
    fetchUserLinksCount();

    const editProfileButton = document.getElementById('editProfileButton');
    if (editProfileButton) {
        editProfileButton.addEventListener('click', showEditProfileModal);
    }

    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            confirmLogout('Are you sure you want to logout?', logout);
        });
    }
    
    const deleteAccountButton = document.getElementById('deleteAccountButton');
    if (deleteAccountButton) {
        deleteAccountButton.addEventListener('click', showDeleteAccountModal);
    }
    
    // Check for active delete verification session
    checkDeleteVerificationSession();
    
    // Handle back button for modals - now handled by modal-history.js
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
        const email = localStorage.getItem('email');
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const usernameHeader = document.getElementById('usernameHeader');
        const profileImg = document.querySelector('.profile-img');

        if (!profileName || !profileEmail) return;

        if (!email) {
            profileName.textContent = 'ผู้เยี่ยมชม';
            profileEmail.textContent = 'กรุณาเข้าสู่ระบบ';
            if (usernameHeader) usernameHeader.textContent = 'Welcome';
            if (profileImg) profileImg.src = '/img/b1.jpg';
            return;
        }

        const response = await fetch('/current-user', {
            headers: {
                'x-email': email
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
    
    const modal = document.getElementById('editProfileModal');
    
    // Use Modal History Manager
    openModalWithHistory(modal, closeEditProfileModal);
    
    // Lock body scroll
    document.body.style.overflow = 'hidden';

    // Preview image when URL changes
    const imageUrlInput = document.getElementById('editProfileImage');
    const imagePreview = document.getElementById('profileImagePreview');

    if (imageUrlInput && imagePreview) {
        imageUrlInput.addEventListener('input', function () {
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
        
        // Use Modal History Manager
        closeModalWithHistory();
        
        // Unlock body scroll
        document.body.style.overflow = '';
        
        setTimeout(() => {
            modal.remove();
        }, 150);
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
    
    // Use Modal History Manager
    openModalWithHistory(promptBox, () => {
        document.body.style.overflow = '';
        promptBox.remove();
        callback(null);
    });
    
    // Lock body scroll
    document.body.style.overflow = 'hidden';

    const passwordInput = promptBox.querySelector('.password-input');
    passwordInput.focus();

    promptBox.querySelector('.cancel-btn').addEventListener('click', () => {
        // Use Modal History Manager
        closeModalWithHistory();
        // Unlock body scroll
        document.body.style.overflow = '';
        promptBox.remove();
        callback(null);
    });

    promptBox.querySelector('.confirm-btn').addEventListener('click', () => {
        const password = passwordInput.value;
        // Use Modal History Manager
        closeModalWithHistory();
        // Unlock body scroll
        document.body.style.overflow = '';
        promptBox.remove();
        callback(password);
    });

    passwordInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            const password = passwordInput.value;
            // Use Modal History Manager
            closeModalWithHistory();
            promptBox.remove();
            callback(password);
        }
    });
}


// Delete Account Functions
let deleteAccountEmail = '';
let deleteVerificationCode = '';
let deleteTimerInterval = null;
let deleteExpirationTime = null;

// Check if there's an active delete verification session on page load
function checkDeleteVerificationSession() {
    const savedEmail = localStorage.getItem('deleteAccountEmail');
    const savedExpiration = localStorage.getItem('deleteExpirationTime');
    
    if (savedEmail && savedExpiration) {
        const expirationTime = parseInt(savedExpiration);
        const now = Date.now();
        
        // Check if session is still valid (not expired)
        if (expirationTime > now) {
            deleteAccountEmail = savedEmail;
            deleteExpirationTime = expirationTime;
            
            // Show modal after a short delay to ensure DOM is ready
            setTimeout(() => {
                showDeleteVerificationModal();
            }, 50);
        } else {
            // Clear expired session
            localStorage.removeItem('deleteAccountEmail');
            localStorage.removeItem('deleteExpirationTime');
        }
    }
}

function showDeleteAccountModal() {
    const currentEmail = localStorage.getItem('email') || '';
    
    const modalHTML = `
        <div class="delete-account-modal active" id="deleteAccountModal">
            <div class="delete-modal-content">
                <div class="delete-modal-header">
                    <h2><i class="fas fa-exclamation-triangle"></i> Delete Account</h2>
                </div>
                <div class="delete-warning">
                    <p><i class="fas fa-warning"></i> Warning: This action cannot be undone. All your data will be permanently deleted.</p>
                </div>
                <div class="delete-form-group">
                    <label for="deleteEmailInput">Confirm your Gmail address</label>
                    <input type="email" id="deleteEmailInput" value="${currentEmail}" placeholder="Enter your Gmail" required>
                </div>
                <div class="delete-modal-actions">
                    <button type="button" class="delete-cancel-btn" id="cancelDeleteAccount">Cancel</button>
                    <button type="button" class="delete-send-btn" id="sendDeleteCode">Send Verification Code</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modal = document.getElementById('deleteAccountModal');
    
    // Use Modal History Manager
    openModalWithHistory(modal, closeDeleteAccountModal);
    
    document.body.style.overflow = 'hidden';

    const cancelButton = document.getElementById('cancelDeleteAccount');
    if (cancelButton) {
        cancelButton.addEventListener('click', closeDeleteAccountModal);
    }

    const sendButton = document.getElementById('sendDeleteCode');
    if (sendButton) {
        sendButton.addEventListener('click', sendDeleteVerificationCode);
    }
}

function closeDeleteAccountModal() {
    const modal = document.getElementById('deleteAccountModal');
    if (modal) {
        modal.classList.remove('active');
        
        // Use Modal History Manager
        closeModalWithHistory();
        
        document.body.style.overflow = '';
        setTimeout(() => {
            modal.remove();
        }, 150);
    }
}

async function sendDeleteVerificationCode() {
    const emailInput = document.getElementById('deleteEmailInput');
    const email = emailInput.value.trim();
    const sendButton = document.getElementById('sendDeleteCode');

    if (!email) {
        alertBox('Please enter your Gmail address', 'error');
        return;
    }

    // Validate Gmail format
    const gmailRegex = /^[a-zA-Z0-9._-]{6,30}@gmail\.com$/;
    if (!gmailRegex.test(email)) {
        alertBox('Please enter a valid Gmail address', 'error');
        return;
    }

    // Check if email matches current user
    const currentEmail = localStorage.getItem('email');
    if (email !== currentEmail) {
        alertBox('Email does not match your account', 'error');
        return;
    }

    // Disable button and show loading
    if (sendButton) {
        sendButton.disabled = true;
        sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    }

    try {
        const response = await fetch('/send-delete-verification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            deleteAccountEmail = email;
            deleteVerificationCode = data.code;
            deleteExpirationTime = Date.now() + 3 * 60 * 1000; // 3 minutes
            
            // Save to localStorage for persistence across page refreshes
            localStorage.setItem('deleteAccountEmail', email);
            localStorage.setItem('deleteExpirationTime', deleteExpirationTime.toString());
            
            // Get modal reference before closing
            const modal = document.getElementById('deleteAccountModal');
            
            // Close modal properly
            if (modal) {
                modal.classList.remove('active');
                closeModalWithHistory();
                
                // Wait a bit for modal to start closing
                setTimeout(() => {
                    document.body.style.overflow = '';
                    modal.remove();
                    
                    // Show verification modal after old modal is removed
                    setTimeout(() => {
                        showDeleteVerificationModal();
                        alertBox('Verification code sent to your Gmail', 'success');
                    }, 50);
                }, 100);
            } else {
                // If no modal found, show verification immediately
                showDeleteVerificationModal();
                alertBox('Verification code sent to your Gmail', 'success');
            }
        } else {
            alertBox(data.message || 'Failed to send verification code', 'error');
            // Re-enable button on error
            if (sendButton) {
                sendButton.disabled = false;
                sendButton.innerHTML = 'Send Verification Code';
            }
        }
    } catch (error) {
        console.error('Error sending verification code:', error);
        alertBox('An error occurred while sending verification code', 'error');
        // Re-enable button on error
        if (sendButton) {
            sendButton.disabled = false;
            sendButton.innerHTML = 'Send Verification Code';
        }
    }
}

function showDeleteVerificationModal() {
    // Remove any existing modal first
    const existingModal = document.getElementById('deleteVerifyModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Calculate remaining time immediately
    const now = Date.now();
    const remaining = Math.max(0, deleteExpirationTime - now);
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    const initialTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Check if already expired
    const isExpired = remaining === 0;
    
    const modalHTML = `
        <div class="delete-verify-modal active" id="deleteVerifyModal">
            <div class="delete-verify-content">
                <h2><i class="fas fa-shield-alt"></i> Verify Account Deletion</h2>
                <p>Enter the 6-character code sent to:</p>
                <p class="delete-verify-email">${deleteAccountEmail}</p>
                <div class="delete-otp-container">
                    <input type="text" class="delete-otp-box" maxlength="1" data-index="0">
                    <input type="text" class="delete-otp-box" maxlength="1" data-index="1">
                    <input type="text" class="delete-otp-box" maxlength="1" data-index="2">
                    <input type="text" class="delete-otp-box" maxlength="1" data-index="3">
                    <input type="text" class="delete-otp-box" maxlength="1" data-index="4">
                    <input type="text" class="delete-otp-box" maxlength="1" data-index="5">
                </div>
                <div class="delete-timer ${isExpired ? 'expired' : ''}" id="deleteTimer">${isExpired ? 'Expired' : initialTime}</div>
                <button class="delete-resend-btn" id="deleteResendBtn" ${isExpired ? '' : 'disabled'}>Resend Code</button>
                <div class="delete-verify-actions">
                    <button type="button" class="delete-verify-cancel-btn" id="cancelDeleteVerify">Cancel</button>
                    <button type="button" class="delete-verify-btn" id="verifyDeleteBtn">Delete Account</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modal = document.getElementById('deleteVerifyModal');
    
    // Use Modal History Manager with custom close function that goes back to delete account modal
    openModalWithHistory(modal, closeDeleteVerificationAndShowPrevious);
    
    document.body.style.overflow = 'hidden';

    // Setup OTP inputs
    setupDeleteOTPInputs();

    // Start timer only if not expired
    if (!isExpired) {
        startDeleteTimer();
    }

    const cancelButton = document.getElementById('cancelDeleteVerify');
    if (cancelButton) {
        cancelButton.addEventListener('click', closeDeleteVerificationAndShowPrevious);
    }

    const verifyButton = document.getElementById('verifyDeleteBtn');
    if (verifyButton) {
        verifyButton.addEventListener('click', verifyDeleteAccount);
    }

    const resendButton = document.getElementById('deleteResendBtn');
    if (resendButton) {
        resendButton.addEventListener('click', resendDeleteCode);
    }

    // Focus first input
    const firstInput = document.querySelector('.delete-otp-box[data-index="0"]');
    if (firstInput) {
        firstInput.focus();
    }
}

// Close verification modal and show delete account modal
function closeDeleteVerificationAndShowPrevious() {
    const modal = document.getElementById('deleteVerifyModal');
    if (modal) {
        modal.classList.remove('active');
        
        // Use Modal History Manager
        closeModalWithHistory();
        
        if (deleteTimerInterval) {
            clearInterval(deleteTimerInterval);
            deleteTimerInterval = null;
        }
        
        // Clear localStorage when closing modal
        localStorage.removeItem('deleteAccountEmail');
        localStorage.removeItem('deleteExpirationTime');
        
        // Reset delete variables
        const savedEmail = deleteAccountEmail;
        deleteAccountEmail = '';
        deleteVerificationCode = '';
        deleteExpirationTime = null;
        
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = '';
            
            // Show delete account modal again after a short delay
            setTimeout(() => {
                showDeleteAccountModalWithEmail(savedEmail);
            }, 50);
        }, 150);
    }
}

// Show delete account modal with pre-filled email
function showDeleteAccountModalWithEmail(email = '') {
    const currentEmail = email || localStorage.getItem('email') || '';
    
    const modalHTML = `
        <div class="delete-account-modal active" id="deleteAccountModal">
            <div class="delete-modal-content">
                <div class="delete-modal-header">
                    <h2><i class="fas fa-exclamation-triangle"></i> Delete Account</h2>
                </div>
                <div class="delete-warning">
                    <p><i class="fas fa-warning"></i> Warning: This action cannot be undone. All your data will be permanently deleted.</p>
                </div>
                <div class="delete-form-group">
                    <label for="deleteEmailInput">Confirm your Gmail address</label>
                    <input type="email" id="deleteEmailInput" value="${currentEmail}" placeholder="Enter your Gmail" required>
                </div>
                <div class="delete-modal-actions">
                    <button type="button" class="delete-cancel-btn" id="cancelDeleteAccount">Cancel</button>
                    <button type="button" class="delete-send-btn" id="sendDeleteCode">Send Verification Code</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modal = document.getElementById('deleteAccountModal');
    
    // Use Modal History Manager
    openModalWithHistory(modal, closeDeleteAccountModal);
    
    document.body.style.overflow = 'hidden';

    const cancelButton = document.getElementById('cancelDeleteAccount');
    if (cancelButton) {
        cancelButton.addEventListener('click', closeDeleteAccountModal);
    }

    const sendButton = document.getElementById('sendDeleteCode');
    if (sendButton) {
        sendButton.addEventListener('click', sendDeleteVerificationCode);
    }
}

function closeDeleteVerificationModal() {
    const modal = document.getElementById('deleteVerifyModal');
    if (modal) {
        modal.classList.remove('active');
        
        // Use Modal History Manager
        closeModalWithHistory();
        
        document.body.style.overflow = '';
        
        if (deleteTimerInterval) {
            clearInterval(deleteTimerInterval);
            deleteTimerInterval = null;
        }
        
        // Clear localStorage when closing modal
        localStorage.removeItem('deleteAccountEmail');
        localStorage.removeItem('deleteExpirationTime');
        
        // Reset delete variables
        deleteAccountEmail = '';
        deleteVerificationCode = '';
        deleteExpirationTime = null;
        
        setTimeout(() => {
            modal.remove();
        }, 150);
    }
}

function setupDeleteOTPInputs() {
    const otpBoxes = document.querySelectorAll('.delete-otp-box');

    otpBoxes.forEach((box, index) => {
        // Handle input
        box.addEventListener('input', (e) => {
            let value = e.target.value.toUpperCase();
            
            // Handle multiple characters (from paste or autocomplete)
            if (value.length > 1) {
                // If pasted multiple characters, distribute them
                const cleanValue = value.replace(/[^A-Z0-9]/g, '');
                for (let i = 0; i < cleanValue.length && index + i < otpBoxes.length; i++) {
                    otpBoxes[index + i].value = cleanValue[i];
                }
                // Focus next empty or last box
                const nextIndex = Math.min(index + cleanValue.length, otpBoxes.length - 1);
                otpBoxes[nextIndex].focus();
                return;
            }
            
            // Only allow A-Z and 0-9
            if (value && !/^[A-Z0-9]$/.test(value)) {
                e.target.value = '';
                return;
            }

            e.target.value = value;

            // Move to next box
            if (value && index < otpBoxes.length - 1) {
                otpBoxes[index + 1].focus();
            }
        });

        // Handle keydown for backspace
        box.addEventListener('keydown', (e) => {
            // Handle backspace
            if (e.key === 'Backspace') {
                if (!box.value && index > 0) {
                    e.preventDefault();
                    otpBoxes[index - 1].focus();
                    otpBoxes[index - 1].select();
                }
            }
            
            // Left arrow: move to previous input
            if (e.key === 'ArrowLeft' && index > 0) {
                e.preventDefault();
                otpBoxes[index - 1].focus();
                otpBoxes[index - 1].select();
            }
            
            // Right arrow: move to next input
            if (e.key === 'ArrowRight' && index < otpBoxes.length - 1) {
                e.preventDefault();
                otpBoxes[index + 1].focus();
                otpBoxes[index + 1].select();
            }
        });

        // Handle paste
        box.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '');
            
            // Fill all boxes starting from current position
            for (let i = 0; i < pastedData.length && index + i < otpBoxes.length; i++) {
                otpBoxes[index + i].value = pastedData[i];
            }
            
            // Focus next empty input or last input
            const nextIndex = Math.min(index + pastedData.length, otpBoxes.length - 1);
            otpBoxes[nextIndex].focus();
        });
        
        // Select all on focus (helpful for mobile)
        box.addEventListener('focus', (e) => {
            setTimeout(() => e.target.select(), 0);
        });
        
        // Prevent non-alphanumeric on keypress
        box.addEventListener('keypress', (e) => {
            const char = String.fromCharCode(e.which || e.keyCode);
            if (!/^[A-Za-z0-9]$/.test(char)) {
                e.preventDefault();
            }
        });
    });
}

function startDeleteTimer() {
    const timerElement = document.getElementById('deleteTimer');
    const resendButton = document.getElementById('deleteResendBtn');

    if (!timerElement) return;
    
    // Clear any existing interval
    if (deleteTimerInterval) {
        clearInterval(deleteTimerInterval);
    }

    deleteTimerInterval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, deleteExpirationTime - now);
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);

        timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        if (remaining <= 30000 && remaining > 0) {
            timerElement.classList.add('warning');
        }

        if (remaining === 0) {
            clearInterval(deleteTimerInterval);
            deleteTimerInterval = null;
            timerElement.textContent = 'Expired';
            timerElement.classList.remove('warning');
            timerElement.classList.add('expired');
            
            if (resendButton) {
                resendButton.disabled = false;
            }

            // Clear localStorage when expired
            localStorage.removeItem('deleteAccountEmail');
            localStorage.removeItem('deleteExpirationTime');
        }
    }, 1000);
}

async function resendDeleteCode() {
    const resendButton = document.getElementById('deleteResendBtn');
    if (resendButton) {
        resendButton.disabled = true;
    }

    try {
        const response = await fetch('/send-delete-verification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: deleteAccountEmail })
        });

        const data = await response.json();

        if (response.ok) {
            deleteVerificationCode = data.code;
            deleteExpirationTime = Date.now() + 3 * 60 * 1000;
            
            // Update localStorage with new expiration time
            localStorage.setItem('deleteExpirationTime', deleteExpirationTime.toString());
            
            // Clear OTP inputs
            document.querySelectorAll('.delete-otp-box').forEach(box => {
                box.value = '';
            });
            
            // Reset timer
            const timerElement = document.getElementById('deleteTimer');
            if (timerElement) {
                timerElement.classList.remove('warning', 'expired');
            }
            
            if (deleteTimerInterval) {
                clearInterval(deleteTimerInterval);
            }
            startDeleteTimer();
            
            alertBox('New verification code sent', 'success');
            
            // Focus first input
            const firstInput = document.querySelector('.delete-otp-box[data-index="0"]');
            if (firstInput) {
                firstInput.focus();
            }
        } else {
            alertBox(data.message || 'Failed to resend code', 'error');
            if (resendButton) {
                resendButton.disabled = false;
            }
        }
    } catch (error) {
        console.error('Error resending code:', error);
        alertBox('An error occurred while resending code', 'error');
        if (resendButton) {
            resendButton.disabled = false;
        }
    }
}

async function verifyDeleteAccount() {
    const otpBoxes = document.querySelectorAll('.delete-otp-box');
    const enteredCode = Array.from(otpBoxes).map(box => box.value).join('');

    if (enteredCode.length !== 6) {
        alertBox('Please enter the complete 6-character code', 'error');
        return;
    }

    // Check if code expired
    if (Date.now() > deleteExpirationTime) {
        alertBox('Verification code has expired', 'error');
        return;
    }

    try {
        const response = await fetch('/verify-delete-account', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: deleteAccountEmail,
                code: enteredCode
            })
        });

        const data = await response.json();

        if (response.ok) {
            alertBox('Account deleted successfully', 'success');
            
            // Clear delete verification data first
            localStorage.removeItem('deleteAccountEmail');
            localStorage.removeItem('deleteExpirationTime');
            
            // Clear all other data
            localStorage.clear();
            
            // Close modal
            if (deleteTimerInterval) {
                clearInterval(deleteTimerInterval);
                deleteTimerInterval = null;
            }
            
            const modal = document.getElementById('deleteVerifyModal');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
                setTimeout(() => {
                    modal.remove();
                }, 300);
            }
            
            // Redirect to login
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 1500);
        } else {
            alertBox(data.message || 'Invalid verification code', 'error');
        }
    } catch (error) {
        console.error('Error verifying delete account:', error);
        alertBox('An error occurred during verification', 'error');
    }
}
