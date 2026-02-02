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

async function register() {
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const termsChecked = document.getElementById('terms').checked;

    if (!isValidEmail(email)) {
        alertBox('Please enter a valid email address.', 'error');
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

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
        });

        if (response.ok) {
            alertBox('Registration successful! You can now log in.', 'success');
            toggleForm('login');
            document.getElementById('registerForm').reset();
        } else {
            const error = await response.json();
            alertBox(error.message || 'Registration failed. Please try again.', 'error');
        }
    } catch (err) {
        console.error('Error during registration:', err);
        alertBox('This username or email already exists.', 'error');
    }
}

function toggleForm(form) {
    const loginContainer = document.getElementById('loginContainer');
    const registerContainer = document.getElementById('registerContainer');
    const forgotPasswordContainer = document.getElementById('forgotPasswordContainer');

    // Hide all containers first
    loginContainer.style.display = 'none';
    registerContainer.style.display = 'none';
    forgotPasswordContainer.style.display = 'none';

    // Show the requested container
    if (form === 'register') {
        registerContainer.style.display = 'block';
        // Add to history for back button support
        if (!window.history.state || window.history.state.form !== 'register') {
            history.pushState({ form: 'register' }, '');
            console.log('Pushed register form to history');
        }
    } else if (form === 'forgot') {
        forgotPasswordContainer.style.display = 'block';
        // Add to history for back button support
        if (!window.history.state || window.history.state.form !== 'forgot') {
            history.pushState({ form: 'forgot' }, '');
            console.log('Pushed forgot form to history');
        }
    } else {
        // Default to login - just show it without manipulating history
        loginContainer.style.display = 'block';
        console.log('Showing login form');
    }
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
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('registerContainer').style.display = 'none';
    document.getElementById('forgotPasswordContainer').style.display = 'block';
    
    // Add to history for back button support
    if (!window.history.state || window.history.state.form !== 'forgot') {
        history.pushState({ form: 'forgot' }, '');
    }
}

// Check credentials and show reset form
async function checkResetCredentials() {
    const username = document.getElementById('resetUsername').value.trim();
    const email = document.getElementById('resetEmail').value.trim();

    try {
        const response = await fetch('/check-reset-credentials', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email }),
        });

        const data = await response.json();
        if (data.valid) {
            // Show reset password form
            document.getElementById('credentialsForm').style.display = 'none';
            document.getElementById('resetForm').style.display = 'block';
        } else {
            alertBox('Invalid username or email combination', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        alertBox('An error occurred', 'error');
    }
}

// Reset password
async function resetPassword() {
    const username = document.getElementById('resetUsername').value.trim();
    const email = document.getElementById('resetEmail').value.trim();
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    if (newPassword !== confirmNewPassword) {
        alertBox('Passwords do not match', 'error');
        return;
    }

    try {
        const response = await fetch('/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, newPassword }),
        });

        const data = await response.json();
        if (response.ok) {
            alertBox('Password reset successful', 'success');
            setTimeout(() => {
                toggleForm('login');
            }, 2000);
        } else {
            alertBox(data.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        alertBox('An error occurred', 'error');
    }
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

    // Menu toggle for mobile
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
    
    // Handle back button for form switching
    window.addEventListener('popstate', function(e) {
        console.log('Popstate triggered on login page', e.state);
        
        const loginContainer = document.getElementById('loginContainer');
        const registerContainer = document.getElementById('registerContainer');
        const forgotPasswordContainer = document.getElementById('forgotPasswordContainer');
        
        // Hide all containers
        loginContainer.style.display = 'none';
        registerContainer.style.display = 'none';
        forgotPasswordContainer.style.display = 'none';
        
        // Show appropriate form based on history state
        if (e.state && e.state.form === 'register') {
            registerContainer.style.display = 'block';
        } else if (e.state && e.state.form === 'forgot') {
            forgotPasswordContainer.style.display = 'block';
            // Reset forgot password form to credentials step
            document.getElementById('credentialsForm').style.display = 'block';
            document.getElementById('resetForm').style.display = 'none';
        } else {
            // Default to login
            loginContainer.style.display = 'block';
        }
    });
});
