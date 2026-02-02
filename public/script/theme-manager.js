// Theme Manager - Shared across all pages
(function() {
    // Initialize theme on page load
    const currentTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    // Update theme icon when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        updateThemeIcon();
    });
    
    // Toggle theme function
    window.toggleTheme = function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon();
    };
    
    // Update theme icon
    function updateThemeIcon() {
        const themeToggles = document.querySelectorAll('.theme-toggle i, .theme-toggle-nav i');
        themeToggles.forEach(toggle => {
            if (toggle) {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                toggle.className = currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        });
    }
    
    // Mobile menu is handled by mobile-menu.js
    window.setupMobileMenu = function() {
        // This function is no longer needed
    };
    
    // Update navigation links based on login status
    window.updateNavLinks = function() {
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
    };
    
    // Initialize common features
    document.addEventListener('DOMContentLoaded', () => {
        setupMobileMenu();
        updateNavLinks();
    });
})();
