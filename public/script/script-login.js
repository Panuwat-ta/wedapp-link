// Notification system
function alertBox(message, type = 'info') {
    const alertElement = document.getElementById('alertBox');
    if (!alertElement) {
        console.error('Alert box element not found.');
        return;
    }
    alertElement.textContent = message;
    alertElement.className = `alert-box ${type} show`;

    // Hide after 5 seconds
    setTimeout(() => {
        alertElement.classList.remove('show');
    }, 5000);
}

function updateNavLinks(isLoggedIn) {
    const loginLink = document.getElementById('loginLink');
    const logoutLink = document.getElementById('logoutLink');
    if (isLoggedIn) {
        loginLink.style.display = 'none';
        logoutLink.style.display = 'block';
    } else {
        loginLink.style.display = 'block';
        logoutLink.style.display = 'none';
    }
}

async function login() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
            const data = await response.json();
            alertBox('Login successful!', 'success');
            // login สำเร็จ
            localStorage.setItem('username', data.user.username); // เก็บ username ใน localStorage
            localStorage.setItem('email', data.user.email);
            updateNavLinks(true); // Update navigation links
            window.location.href = "logout.html"; // Redirect to logout page
        } else {
            const error = await response.json();
            console.error('Login failed:', error.message);
            alertBox(error.message || 'Login failed. Please check your credentials.', 'error');
        }
    } catch (err) {
        console.error('Error during login:', err);
        alertBox('An error occurred during login.', 'error');
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isGmail(email) {
    return email.toLowerCase().endsWith('@gmail.com');
}

async function verifyGmailExists(email) {
    // ตรวจสอบรูปแบบ Gmail ก่อน
    if (!isGmail(email)) {
        return { valid: false, message: 'Please use a Gmail address (@gmail.com)' };
    }
    
    // ตรวจสอบรูปแบบพื้นฐาน
    const gmailRegex = /^[a-zA-Z0-9._-]+@gmail\.com$/;
    if (!gmailRegex.test(email)) {
        return { valid: false, message: 'Invalid Gmail format' };
    }
    
    // ตรวจสอบความยาวของ username
    const username = email.split('@')[0];
    if (username.length < 6 || username.length > 30) {
        return { valid: false, message: 'Gmail username must be between 6-30 characters' };
    }
    
    // ตรวจสอบว่าไม่มีอักขระพิเศษที่ไม่ถูกต้อง
    if (username.startsWith('.') || username.endsWith('.') || username.includes('..')) {
        return { valid: false, message: 'Invalid Gmail format (check dots placement)' };
    }
    
    return { valid: true };
}

// Store registration data temporarily
let tempRegistrationData = null;
let tempResetEmail = null;
let countdownInterval = null;
let resetCountdownInterval = null;
let profileImageFile = null;
let profileImageUrl = null;
let currentImageOption = 'upload'; // 'upload' or 'url'

// Toggle between upload and URL options
function toggleImageOption(option) {
    currentImageOption = option;
    const uploadBtns = document.querySelectorAll('.option-btn');
    const urlInput = document.getElementById('imageUrlInput');
    const uploadOverlay = document.querySelector('.upload-overlay');
    
    uploadBtns.forEach(btn => btn.classList.remove('active'));
    
    if (option === 'upload') {
        uploadBtns[0].classList.add('active');
        urlInput.style.display = 'none';
        uploadOverlay.style.pointerEvents = 'auto';
        profileImageUrl = null;
    } else {
        uploadBtns[1].classList.add('active');
        urlInput.style.display = 'flex';
        uploadOverlay.style.pointerEvents = 'none';
        profileImageFile = null;
    }
}

// Preview image from URL
function previewImageUrl() {
    const url = document.getElementById('profileImageUrl').value.trim();
    
    if (!url) {
        alertBox('Please enter an image URL', 'error');
        return;
    }
    
    // Basic URL validation
    try {
        new URL(url);
    } catch (e) {
        alertBox('Please enter a valid URL', 'error');
        return;
    }
    
    // Check if URL ends with image extension
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const hasImageExtension = imageExtensions.some(ext => url.toLowerCase().includes(ext));
    
    if (!hasImageExtension && !url.includes('imgur.com') && !url.includes('googleusercontent.com')) {
        alertBox('URL should point to an image file', 'warning');
    }
    
    // Try to load the image
    const img = new Image();
    img.onload = function() {
        document.getElementById('profilePreview').src = url;
        profileImageUrl = url;
        alertBox('Image loaded successfully!', 'success');
    };
    img.onerror = function() {
        alertBox('Failed to load image from URL. Please check the URL.', 'error');
    };
    img.src = url;
}

// Preview profile image
function previewProfileImage(event) {
    const file = event.target.files[0];
    if (file) {
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alertBox('Image size must be less than 5MB', 'error');
            return;
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
            alertBox('Please select an image file', 'error');
            return;
        }

        profileImageFile = file;
        profileImageUrl = null; // Clear URL if file is selected
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('profilePreview').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// Start countdown timer
function startCountdown(duration) {
    // Clear any existing countdown
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    const timerElement = document.getElementById('countdownTimer');
    const timerContainer = timerElement.parentElement;
    const verifyBtn = document.getElementById('verifyBtn');
    const resendBtn = document.getElementById('resendBtn');
    const codeInputs = document.querySelectorAll('#verificationForm .code-input');
    
    let timeLeft = duration;
    let expiredTime = 0; // เวลาที่หมดอายุแล้ว
    
    // Update display immediately
    const updateDisplay = () => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 30 && timeLeft > 0) {
            timerContainer.classList.add('expired');
        }
    };
    
    // Show current time immediately
    updateDisplay();

    countdownInterval = setInterval(() => {
        timeLeft--;
        
        if (timeLeft < 0) {
            // รหัสหมดอายุแล้ว
            if (expiredTime === 0) {
                // เพิ่งหมดอายุ
                clearInterval(countdownInterval);
                timerElement.textContent = 'Expired';
                timerContainer.classList.add('expired');
                verifyBtn.disabled = true;
                verifyBtn.style.opacity = '0.5';
                verifyBtn.style.cursor = 'not-allowed';
                codeInputs.forEach(input => input.disabled = true);
                
                // ไม่แสดง alert แต่เริ่มนับเวลา 5 นาที
                expiredTime = 300; // 5 minutes = 300 seconds
                
                // เริ่มนับถอยหลัง 5 นาที
                const redirectInterval = setInterval(() => {
                    expiredTime--;
                    
                    if (expiredTime <= 0) {
                        clearInterval(redirectInterval);
                        // ล้างข้อมูลและกลับไปหน้า login
                        sessionStorage.removeItem('verificationData');
                        tempRegistrationData = null;
                        profileImageFile = null;
                        profileImageUrl = null;
                        stopCountdown();
                        toggleForm('login');
                    }
                }, 1000);
            }
        } else {
            updateDisplay();
        }
    }, 1000);
}

// Stop countdown timer
function stopCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}

// Start reset countdown timer
function startResetCountdown(duration) {
    if (resetCountdownInterval) {
        clearInterval(resetCountdownInterval);
    }

    const timerElement = document.getElementById('resetCountdownTimer');
    const timerContainer = timerElement.parentElement;
    const verifyBtn = document.getElementById('verifyResetBtn');
    const resendBtn = document.getElementById('resendResetBtn');
    const codeInputs = document.querySelectorAll('#resetCodeForm .code-input');
    
    let timeLeft = duration;
    let expiredTime = 0; // เวลาที่หมดอายุแล้ว
    
    // Update display immediately
    const updateDisplay = () => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 30 && timeLeft > 0) {
            timerContainer.classList.add('expired');
        }
    };
    
    // Show current time immediately
    updateDisplay();

    resetCountdownInterval = setInterval(() => {
        timeLeft--;
        
        if (timeLeft < 0) {
            // รหัสหมดอายุแล้ว
            if (expiredTime === 0) {
                // เพิ่งหมดอายุ
                clearInterval(resetCountdownInterval);
                timerElement.textContent = 'Expired';
                timerContainer.classList.add('expired');
                verifyBtn.disabled = true;
                verifyBtn.style.opacity = '0.5';
                verifyBtn.style.cursor = 'not-allowed';
                codeInputs.forEach(input => input.disabled = true);
                
                // ไม่แสดง alert แต่เริ่มนับเวลา 5 นาที
                expiredTime = 300; // 5 minutes = 300 seconds
                
                // เริ่มนับถอยหลัง 5 นาที
                const redirectInterval = setInterval(() => {
                    expiredTime--;
                    
                    if (expiredTime <= 0) {
                        clearInterval(redirectInterval);
                        // ล้างข้อมูลและกลับไปหน้า forgot password
                        sessionStorage.removeItem('resetData');
                        tempResetEmail = null;
                        stopResetCountdown();
                        toggleForm('forgot');
                    }
                }, 1000);
            }
        } else {
            updateDisplay();
        }
    }, 1000);
}

// Stop reset countdown timer
function stopResetCountdown() {
    if (resetCountdownInterval) {
        clearInterval(resetCountdownInterval);
        resetCountdownInterval = null;
    }
}

// Send verification code to email
async function sendVerificationCode() {
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const termsChecked = document.getElementById('terms').checked;
    const submitBtn = document.querySelector('#registerForm .submit-btn');

    if (!username || username.length < 6) {
        alertBox('Username must be at least 6 characters long.', 'error');
        return;
    }

    if (username.length > 50) {
        alertBox('Username must not exceed 50 characters.', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        alertBox('Please enter a valid email address.', 'error');
        return;
    }

    // ตรวจสอบว่าเป็น Gmail และมีรูปแบบที่ถูกต้อง
    const gmailCheck = await verifyGmailExists(email);
    if (!gmailCheck.valid) {
        alertBox(gmailCheck.message, 'error');
        return;
    }

    if (password.length < 6) {
        alertBox('Password must be at least 6 characters long.', 'error');
        return;
    }

    if (password !== confirmPassword) {
        alertBox('Passwords do not match.', 'error');
        return;
    }

    if (!termsChecked) {
        alertBox('You must agree to the Terms and Conditions.', 'error');
        return;
    }

    // Show loading state
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    // Check if username or email already exists before sending OTP
    try {
        const checkResponse = await fetch('/check-user-exists', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email }),
        });

        if (!checkResponse.ok) {
            const checkData = await checkResponse.json();
            alertBox(checkData.message || 'Username or email already exists.', 'error');
            // Reset button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            return;
        }
    } catch (err) {
        console.error('Error checking user:', err);
        // Continue anyway if check fails (will be checked again during registration)
        console.log('Skipping user check, will verify during registration');
    }

    // Store registration data temporarily (including profile image or URL)
    tempRegistrationData = { 
        username, 
        email, 
        password,
        profileImage: profileImageFile,
        profileImageUrl: profileImageUrl
    };

    try {
        // Send verification code to email
        const response = await fetch('/send-verification-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        if (response.ok) {
            alertBox('Verification code sent to your email!', 'success');
            document.getElementById('verificationEmail').textContent = email;
            
            // Save verification data to sessionStorage
            const expiresAt = Date.now() + 180000; // 3 minutes from now
            sessionStorage.setItem('verificationData', JSON.stringify({
                email: email,
                expiresAt: expiresAt
            }));
            
            // Reset button before switching form
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            
            toggleForm('verification');
            
            // Setup code inputs after form is visible
            setupCodeInputs('#verificationForm');
            
            // Reset timer display and enable inputs
            const timerElement = document.getElementById('countdownTimer');
            const timerContainer = timerElement.parentElement;
            const verifyBtn = document.getElementById('verifyBtn');
            const resendBtn = document.getElementById('resendBtn');
            const codeInputs = document.querySelectorAll('#verificationForm .code-input');
            
            timerContainer.classList.remove('expired');
            verifyBtn.disabled = false;
            verifyBtn.style.opacity = '1';
            verifyBtn.style.cursor = 'pointer';
            codeInputs.forEach(input => {
                input.disabled = false;
                input.value = '';
            });
            
            // Focus first input
            setTimeout(() => {
                if (codeInputs.length > 0) {
                    codeInputs[0].focus();
                }
            }, 100);
            
            // Start 3-minute countdown
            startCountdown(180); // 180 seconds = 3 minutes
        } else {
            const error = await response.json();
            alertBox(error.message || 'Failed to send verification code.', 'error');
            // Reset button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    } catch (err) {
        console.error('Error sending verification code:', err);
        alertBox('An error occurred while sending verification code.', 'error');
        // Reset button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// Resend verification code
async function resendVerificationCode() {
    if (!tempRegistrationData) {
        alertBox('Please start registration again.', 'error');
        toggleForm('register');
        return;
    }

    const resendBtn = document.getElementById('resendBtn');
    const originalBtnText = resendBtn.innerHTML;
    
    // Show loading state
    resendBtn.disabled = true;
    resendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    try {
        const response = await fetch('/send-verification-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: tempRegistrationData.email }),
        });

        if (response.ok) {
            alertBox('Verification code resent!', 'success');
            
            // Update verification data in sessionStorage
            const expiresAt = Date.now() + 180000; // 3 minutes from now
            sessionStorage.setItem('verificationData', JSON.stringify({
                email: tempRegistrationData.email,
                expiresAt: expiresAt
            }));
            
            // Setup code inputs again
            setupCodeInputs('#verificationForm');
            
            // Reset timer display and enable inputs
            const timerElement = document.getElementById('countdownTimer');
            const timerContainer = timerElement.parentElement;
            const verifyBtn = document.getElementById('verifyBtn');
            const codeInputs = document.querySelectorAll('#verificationForm .code-input');
            
            timerContainer.classList.remove('expired');
            verifyBtn.disabled = false;
            verifyBtn.style.opacity = '1';
            verifyBtn.style.cursor = 'pointer';
            codeInputs.forEach(input => {
                input.disabled = false;
                input.value = '';
            });
            
            // Focus first input
            setTimeout(() => {
                if (codeInputs.length > 0) {
                    codeInputs[0].focus();
                }
            }, 100);
            
            // Restart 3-minute countdown
            startCountdown(180);
            
            // Reset button
            resendBtn.disabled = false;
            resendBtn.innerHTML = originalBtnText;
        } else {
            const error = await response.json();
            alertBox(error.message || 'Failed to resend verification code.', 'error');
            // Reset button
            resendBtn.disabled = false;
            resendBtn.innerHTML = originalBtnText;
        }
    } catch (err) {
        console.error('Error resending verification code:', err);
        alertBox('An error occurred while resending verification code.', 'error');
        // Reset button
        resendBtn.disabled = false;
        resendBtn.innerHTML = originalBtnText;
    }
}

// Verify code and register
async function verifyAndRegister() {
    // Get code from 6 separate inputs
    const codeInputs = document.querySelectorAll('#verificationForm .code-input');
    const code = Array.from(codeInputs).map(input => input.value).join('').trim();

    if (!tempRegistrationData) {
        alertBox('Please start registration again.', 'error');
        toggleForm('register');
        return;
    }

    if (code.length !== 6) {
        alertBox('Please enter all 6 digits.', 'error');
        return;
    }

    try {
        // Create FormData to send both data and file
        const formData = new FormData();
        formData.append('username', tempRegistrationData.username);
        formData.append('email', tempRegistrationData.email);
        formData.append('password', tempRegistrationData.password);
        formData.append('verificationCode', code);
        
        // Add profile image if exists (file upload)
        if (tempRegistrationData.profileImage) {
            formData.append('profileImage', tempRegistrationData.profileImage);
        }
        
        // Add profile image URL if exists
        if (tempRegistrationData.profileImageUrl) {
            formData.append('profileImageUrl', tempRegistrationData.profileImageUrl);
        }

        const response = await fetch('/verify-and-register', {
            method: 'POST',
            body: formData // Don't set Content-Type header, browser will set it automatically with boundary
        });

        if (response.ok) {
            alertBox('Registration successful! You can now log in.', 'success');
            stopCountdown(); // Stop the countdown
            
            // Clear verification data from sessionStorage
            sessionStorage.removeItem('verificationData');
            
            tempRegistrationData = null;
            profileImageFile = null;
            profileImageUrl = null;
            document.getElementById('registerForm').reset();
            // Clear all code inputs
            const codeInputs = document.querySelectorAll('#verificationForm .code-input');
            codeInputs.forEach(input => input.value = '');
            document.getElementById('profilePreview').src = '/img/b1.jpg'; // Reset preview
            document.getElementById('profileImageUrl').value = ''; // Reset URL input
            toggleForm('login');
        } else {
            const error = await response.json();
            alertBox(error.message || 'Invalid verification code.', 'error');
        }
    } catch (err) {
        console.error('Error during verification:', err);
        alertBox('An error occurred during verification.', 'error');
    }
}

async function register() {
    // This function is no longer used - replaced by sendVerificationCode and verifyAndRegister
    alertBox('Please use the new registration process with email verification.', 'info');
}

function toggleForm(form) {
    const loginContainer = document.getElementById('loginContainer');
    const registerContainer = document.getElementById('registerContainer');
    const forgotPasswordContainer = document.getElementById('forgotPasswordContainer');
    const verificationContainer = document.getElementById('verificationContainer');
    const resetCodeContainer = document.getElementById('resetCodeContainer');
    const newPasswordContainer = document.getElementById('newPasswordContainer');

    // Remove active class from all containers
    loginContainer.classList.remove('active');
    registerContainer.classList.remove('active');
    forgotPasswordContainer.classList.remove('active');
    if (verificationContainer) verificationContainer.classList.remove('active');
    if (resetCodeContainer) resetCodeContainer.classList.remove('active');
    if (newPasswordContainer) newPasswordContainer.classList.remove('active');

    // Show the requested container
    if (form === 'register') {
        registerContainer.classList.add('active');
        if (!window.history.state || window.history.state.form !== 'register') {
            history.pushState({ form: 'register' }, '');
        }
    } else if (form === 'forgot') {
        forgotPasswordContainer.classList.add('active');
        if (!window.history.state || window.history.state.form !== 'forgot') {
            history.pushState({ form: 'forgot' }, '');
        }
    } else if (form === 'verification') {
        if (verificationContainer) {
            verificationContainer.classList.add('active');
            if (!window.history.state || window.history.state.form !== 'verification') {
                history.pushState({ form: 'verification' }, '');
            }
        }
    } else if (form === 'resetCode') {
        if (resetCodeContainer) {
            resetCodeContainer.classList.add('active');
            if (!window.history.state || window.history.state.form !== 'resetCode') {
                history.pushState({ form: 'resetCode' }, '');
            }
        }
    } else if (form === 'newPassword') {
        if (newPasswordContainer) {
            newPasswordContainer.classList.add('active');
            if (!window.history.state || window.history.state.form !== 'newPassword') {
                history.pushState({ form: 'newPassword' }, '');
            }
        }
    } else {
        loginContainer.classList.add('active');
    }
    
    return false;
}

function togglePasswordVisibility(inputId, icon) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    }
}

// Show forgot password prompt
function showForgotPasswordPrompt() {
    toggleForm('forgot');
    return false;
}

// Send reset code to email
async function sendResetCode() {
    const email = document.getElementById('resetEmail').value.trim();
    const submitBtn = document.querySelector('#forgotPasswordForm .submit-btn');

    if (!isValidEmail(email)) {
        alertBox('Please enter a valid email address.', 'error');
        return;
    }

    if (!isGmail(email)) {
        alertBox('Please use a Gmail address.', 'error');
        return;
    }

    // Show loading state
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    try {
        const response = await fetch('/send-reset-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        if (response.ok) {
            tempResetEmail = email;
            alertBox('Reset code sent to your email!', 'success');
            document.getElementById('resetEmailDisplay').textContent = email;
            
            // Save reset data to sessionStorage
            const expiresAt = Date.now() + 180000; // 3 minutes from now
            sessionStorage.setItem('resetData', JSON.stringify({
                email: email,
                expiresAt: expiresAt
            }));
            
            // Reset button before switching form
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            
            toggleForm('resetCode');
            
            // Setup code inputs after form is visible
            setupCodeInputs('#resetCodeForm');
            
            // Reset timer and enable inputs
            const timerElement = document.getElementById('resetCountdownTimer');
            const timerContainer = timerElement.parentElement;
            const verifyBtn = document.getElementById('verifyResetBtn');
            const codeInputs = document.querySelectorAll('#resetCodeForm .code-input');
            
            timerContainer.classList.remove('expired');
            verifyBtn.disabled = false;
            verifyBtn.style.opacity = '1';
            verifyBtn.style.cursor = 'pointer';
            codeInputs.forEach(input => {
                input.disabled = false;
                input.value = '';
            });
            
            // Focus first input
            setTimeout(() => {
                if (codeInputs.length > 0) {
                    codeInputs[0].focus();
                }
            }, 100);
            
            // Start 3-minute countdown
            startResetCountdown(180);
        } else {
            const error = await response.json();
            alertBox(error.message || 'Email not found.', 'error');
            // Reset button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    } catch (err) {
        console.error('Error sending reset code:', err);
        alertBox('An error occurred.', 'error');
        // Reset button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// Resend reset code
async function resendResetCode() {
    if (!tempResetEmail) {
        alertBox('Please start password reset again.', 'error');
        toggleForm('forgot');
        return;
    }

    const resendBtn = document.getElementById('resendResetBtn');
    const originalBtnText = resendBtn.innerHTML;
    
    // Show loading state
    resendBtn.disabled = true;
    resendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    try {
        const response = await fetch('/send-reset-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: tempResetEmail }),
        });

        if (response.ok) {
            alertBox('Reset code resent!', 'success');
            
            // Update reset data in sessionStorage
            const expiresAt = Date.now() + 180000; // 3 minutes from now
            sessionStorage.setItem('resetData', JSON.stringify({
                email: tempResetEmail,
                expiresAt: expiresAt
            }));
            
            // Setup code inputs again
            setupCodeInputs('#resetCodeForm');
            
            // Reset timer and enable inputs
            const timerElement = document.getElementById('resetCountdownTimer');
            const timerContainer = timerElement.parentElement;
            const verifyBtn = document.getElementById('verifyResetBtn');
            const codeInputs = document.querySelectorAll('#resetCodeForm .code-input');
            
            timerContainer.classList.remove('expired');
            verifyBtn.disabled = false;
            verifyBtn.style.opacity = '1';
            verifyBtn.style.cursor = 'pointer';
            codeInputs.forEach(input => {
                input.disabled = false;
                input.value = '';
            });
            
            // Focus first input
            setTimeout(() => {
                if (codeInputs.length > 0) {
                    codeInputs[0].focus();
                }
            }, 100);
            
            // Restart 3-minute countdown
            startResetCountdown(180);
            
            // Reset button
            resendBtn.disabled = false;
            resendBtn.innerHTML = originalBtnText;
        } else {
            const error = await response.json();
            alertBox(error.message || 'Failed to resend code.', 'error');
            // Reset button
            resendBtn.disabled = false;
            resendBtn.innerHTML = originalBtnText;
        }
    } catch (err) {
        console.error('Error resending reset code:', err);
        alertBox('An error occurred.', 'error');
        // Reset button
        resendBtn.disabled = false;
        resendBtn.innerHTML = originalBtnText;
    }
}

// Verify reset code
async function verifyResetCode() {
    // Get code from 6 separate inputs
    const codeInputs = document.querySelectorAll('#resetCodeForm .code-input');
    const code = Array.from(codeInputs).map(input => input.value).join('').trim();

    if (!tempResetEmail) {
        alertBox('Please start password reset again.', 'error');
        toggleForm('forgot');
        return;
    }

    if (code.length !== 6) {
        alertBox('Please enter all 6 digits.', 'error');
        return;
    }

    try {
        const response = await fetch('/verify-reset-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: tempResetEmail,
                code: code
            }),
        });

        if (response.ok) {
            alertBox('Code verified! Please enter your new password.', 'success');
            stopResetCountdown();
            
            // Clear reset data from sessionStorage
            sessionStorage.removeItem('resetData');
            
            // Clear all code inputs
            const codeInputs = document.querySelectorAll('#resetCodeForm .code-input');
            codeInputs.forEach(input => input.value = '');
            toggleForm('newPassword');
        } else {
            const error = await response.json();
            alertBox(error.message || 'Invalid reset code.', 'error');
        }
    } catch (err) {
        console.error('Error verifying reset code:', err);
        alertBox('An error occurred.', 'error');
    }
}

// Reset password
async function resetPassword() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    if (!tempResetEmail) {
        alertBox('Please start password reset again.', 'error');
        toggleForm('forgot');
        return;
    }

    if (newPassword.length < 6) {
        alertBox('Password must be at least 6 characters long.', 'error');
        return;
    }

    if (newPassword !== confirmNewPassword) {
        alertBox('Passwords do not match.', 'error');
        return;
    }

    try {
        const response = await fetch('/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: tempResetEmail,
                newPassword: newPassword
            }),
        });

        if (response.ok) {
            alertBox('Password reset successful! You can now log in.', 'success');
            tempResetEmail = null;
            document.getElementById('forgotPasswordForm').reset();
            document.getElementById('newPasswordForm').reset();
            toggleForm('login');
        } else {
            const error = await response.json();
            alertBox(error.message || 'Failed to reset password.', 'error');
        }
    } catch (err) {
        console.error('Error resetting password:', err);
        alertBox('An error occurred.', 'error');
    }
}

// Handle code input auto-focus and navigation
function setupCodeInputs(containerSelector) {
    const inputs = document.querySelectorAll(`${containerSelector} .code-input`);
    
    inputs.forEach((input, index) => {
        // Clear previous event listeners by cloning
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);
    });
    
    // Re-query after cloning
    const freshInputs = document.querySelectorAll(`${containerSelector} .code-input`);
    
    freshInputs.forEach((input, index) => {
        // Handle input
        input.addEventListener('input', (e) => {
            let value = e.target.value;
            
            // If multiple characters (from paste or autocomplete), take only first
            if (value.length > 1) {
                value = value.charAt(0);
            }
            
            // Only allow alphanumeric
            if (value && !/^[A-Za-z0-9]$/.test(value)) {
                e.target.value = '';
                return;
            }
            
            // Convert to uppercase
            e.target.value = value.toUpperCase();
            
            // Move to next input if value entered
            if (value && index < freshInputs.length - 1) {
                freshInputs[index + 1].focus();
                freshInputs[index + 1].select();
            }
        });
        
        // Handle keydown for backspace and arrow keys
        input.addEventListener('keydown', (e) => {
            // Backspace: move to previous input if current is empty
            if (e.key === 'Backspace') {
                if (!e.target.value && index > 0) {
                    e.preventDefault();
                    freshInputs[index - 1].focus();
                    freshInputs[index - 1].select();
                }
            }
            
            // Left arrow: move to previous input
            if (e.key === 'ArrowLeft' && index > 0) {
                e.preventDefault();
                freshInputs[index - 1].focus();
                freshInputs[index - 1].select();
            }
            
            // Right arrow: move to next input
            if (e.key === 'ArrowRight' && index < freshInputs.length - 1) {
                e.preventDefault();
                freshInputs[index + 1].focus();
                freshInputs[index + 1].select();
            }
        });
        
        // Handle paste
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '');
            
            // Fill inputs with pasted data starting from current input
            for (let i = 0; i < Math.min(pastedData.length, freshInputs.length - index); i++) {
                freshInputs[index + i].value = pastedData[i];
            }
            
            // Focus next empty input or last input
            const nextEmptyIndex = index + Math.min(pastedData.length, freshInputs.length - index);
            if (nextEmptyIndex < freshInputs.length) {
                freshInputs[nextEmptyIndex].focus();
            } else {
                freshInputs[freshInputs.length - 1].focus();
            }
        });
        
        // Select all on focus
        input.addEventListener('focus', (e) => {
            setTimeout(() => e.target.select(), 0);
        });
        
        // Prevent non-alphanumeric on keypress
        input.addEventListener('keypress', (e) => {
            const char = String.fromCharCode(e.which || e.keyCode);
            if (!/^[A-Za-z0-9]$/.test(char)) {
                e.preventDefault();
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    const isLoggedIn = localStorage.getItem('username') !== null;
    
    // If logged in, redirect to profile page
    if (isLoggedIn) {
        window.location.href = 'logout.html';
        return;
    }
    
    updateNavLinks(isLoggedIn);
    
    // Setup code inputs for verification and reset forms
    setupCodeInputs('#verificationForm');
    setupCodeInputs('#resetCodeForm');

    // Mobile menu is handled by mobile-menu.js
    
    // Save current form state to sessionStorage before page unload
    window.addEventListener('beforeunload', () => {
        const activeForm = document.querySelector('.form-container.active');
        if (activeForm) {
            sessionStorage.setItem('activeFormId', activeForm.id);
        }
    });
    
    // Restore form state after page load (but clear all input data)
    const savedFormId = sessionStorage.getItem('activeFormId');
    if (savedFormId) {
        // Check if we have verification or reset data
        const verificationData = sessionStorage.getItem('verificationData');
        const resetData = sessionStorage.getItem('resetData');
        
        if (savedFormId === 'verificationContainer' && verificationData) {
            // Restore verification form with timer
            const data = JSON.parse(verificationData);
            const timeLeft = Math.max(0, Math.floor((data.expiresAt - Date.now()) / 1000));
            
            // Always show verification form (even if expired)
            document.getElementById('verificationEmail').textContent = data.email;
            toggleForm('verification');
            setupCodeInputs('#verificationForm');
            
            // Clear code inputs only
            document.querySelectorAll('#verificationForm .code-input').forEach(input => {
                input.value = '';
            });
            
            if (timeLeft > 0) {
                // Still valid, start countdown with remaining time
                startCountdown(timeLeft);
            } else {
                // Expired, show expired state
                const timerElement = document.getElementById('countdownTimer');
                const timerContainer = timerElement.parentElement;
                const verifyBtn = document.getElementById('verifyBtn');
                const codeInputs = document.querySelectorAll('#verificationForm .code-input');
                
                timerElement.textContent = 'Expired';
                timerContainer.classList.add('expired');
                verifyBtn.disabled = true;
                verifyBtn.style.opacity = '0.5';
                verifyBtn.style.cursor = 'not-allowed';
                codeInputs.forEach(input => input.disabled = true);
                
                // Show alert after a short delay
                setTimeout(() => {
                    alertBox('Verification code expired. Please click "Resend Code" to get a new one.', 'warning');
                }, 500);
                
                // เริ่มนับเวลา 5 นาทีเพื่อกลับไปหน้า login
                setTimeout(() => {
                    sessionStorage.removeItem('verificationData');
                    tempRegistrationData = null;
                    profileImageFile = null;
                    profileImageUrl = null;
                    stopCountdown();
                    toggleForm('login');
                }, 300000); // 5 minutes = 300000 milliseconds
            }
        } else if (savedFormId === 'resetCodeContainer' && resetData) {
            // Restore reset code form with timer
            const data = JSON.parse(resetData);
            const timeLeft = Math.max(0, Math.floor((data.expiresAt - Date.now()) / 1000));
            
            // Always show reset code form (even if expired)
            tempResetEmail = data.email;
            document.getElementById('resetEmailDisplay').textContent = data.email;
            toggleForm('resetCode');
            setupCodeInputs('#resetCodeForm');
            
            // Clear code inputs only
            document.querySelectorAll('#resetCodeForm .code-input').forEach(input => {
                input.value = '';
            });
            
            if (timeLeft > 0) {
                // Still valid, start countdown with remaining time
                startResetCountdown(timeLeft);
            } else {
                // Expired, show expired state
                const timerElement = document.getElementById('resetCountdownTimer');
                const timerContainer = timerElement.parentElement;
                const verifyBtn = document.getElementById('verifyResetBtn');
                const codeInputs = document.querySelectorAll('#resetCodeForm .code-input');
                
                timerElement.textContent = 'Expired';
                timerContainer.classList.add('expired');
                verifyBtn.disabled = true;
                verifyBtn.style.opacity = '0.5';
                verifyBtn.style.cursor = 'not-allowed';
                codeInputs.forEach(input => input.disabled = true);
                
                // Show alert after a short delay
                setTimeout(() => {
                    alertBox('Reset code expired. Please click "Resend Code" to get a new one.', 'warning');
                }, 500);
                
                // เริ่มนับเวลา 5 นาทีเพื่อกลับไปหน้า forgot password
                setTimeout(() => {
                    sessionStorage.removeItem('resetData');
                    tempResetEmail = null;
                    stopResetCountdown();
                    toggleForm('forgot');
                }, 300000); // 5 minutes = 300000 milliseconds
            }
        } else {
            // For other forms, clear all inputs
            document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], input[type="url"], input[type="file"]').forEach(input => {
                if (input.type !== 'checkbox') {
                    input.value = '';
                }
            });
            document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = false;
            });
            
            // Clear code inputs
            document.querySelectorAll('.code-input').forEach(input => {
                input.value = '';
            });
            
            // Reset profile image preview
            const profilePreview = document.getElementById('profilePreview');
            if (profilePreview) {
                profilePreview.src = '/img/b1.jpg';
            }
            
            // Clear temporary data
            tempRegistrationData = null;
            tempResetEmail = null;
            profileImageFile = null;
            profileImageUrl = null;
            
            // Stop any running timers
            stopCountdown();
            stopResetCountdown();
            
            // Show the saved form
            const formToShow = savedFormId === 'registerContainer' ? 'register' :
                              savedFormId === 'forgotPasswordContainer' ? 'forgot' :
                              savedFormId === 'newPasswordContainer' ? 'newPassword' : 'login';
            
            toggleForm(formToShow);
        }
        
        // Clear the saved state after restoring
        sessionStorage.removeItem('activeFormId');
    }
    
    // Handle back button for form switching
    window.addEventListener('popstate', function(e) {
        console.log('Popstate triggered on login page', e.state);
        
        const loginContainer = document.getElementById('loginContainer');
        const registerContainer = document.getElementById('registerContainer');
        const forgotPasswordContainer = document.getElementById('forgotPasswordContainer');
        const verificationContainer = document.getElementById('verificationContainer');
        const resetCodeContainer = document.getElementById('resetCodeContainer');
        const newPasswordContainer = document.getElementById('newPasswordContainer');
        
        // Remove active class from all containers
        loginContainer.classList.remove('active');
        registerContainer.classList.remove('active');
        forgotPasswordContainer.classList.remove('active');
        if (verificationContainer) verificationContainer.classList.remove('active');
        if (resetCodeContainer) resetCodeContainer.classList.remove('active');
        if (newPasswordContainer) newPasswordContainer.classList.remove('active');
        
        // Show appropriate form based on history state
        if (e.state && e.state.form === 'register') {
            registerContainer.classList.add('active');
        } else if (e.state && e.state.form === 'forgot') {
            forgotPasswordContainer.classList.add('active');
        } else if (e.state && e.state.form === 'verification') {
            if (verificationContainer) verificationContainer.classList.add('active');
        } else if (e.state && e.state.form === 'resetCode') {
            if (resetCodeContainer) resetCodeContainer.classList.add('active');
        } else if (e.state && e.state.form === 'newPassword') {
            if (newPasswordContainer) newPasswordContainer.classList.add('active');
        } else {
            // Default to login
            loginContainer.classList.add('active');
        }
    });
});

// Terms and Conditions Modal Functions
function showTermsModal() {
    const modal = document.getElementById('termsModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
}

function closeTermsModal() {
    const modal = document.getElementById('termsModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = ''; // Restore scrolling
    }
}

function acceptTerms() {
    const termsCheckbox = document.getElementById('terms');
    if (termsCheckbox) {
        termsCheckbox.checked = true;
    }
    closeTermsModal();
    alertBox('Thank you for accepting the Terms and Conditions!', 'success');
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('termsModal');
    if (modal && e.target === modal) {
        closeTermsModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('termsModal');
        if (modal && modal.classList.contains('show')) {
            closeTermsModal();
        }
    }
});
