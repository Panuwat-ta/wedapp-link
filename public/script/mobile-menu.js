// Mobile Menu Handler - Shared across all pages
(function() {
    'use strict';
    
    function initMobileMenu() {
        const menuToggle = document.getElementById('menuToggle');
        const navLinks = document.getElementById('navLinks');
        
        if (!menuToggle || !navLinks) {
            console.log('Menu elements not found');
            return;
        }
        
        console.log('Mobile menu initialized');
        
        // Toggle menu function
        function toggleMenu(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            const isActive = navLinks.classList.contains('active');
            const icon = menuToggle.querySelector('i');
            
            if (isActive) {
                // Close menu
                navLinks.classList.remove('active');
                if (icon) {
                    icon.className = 'fas fa-bars';
                }
                console.log('Menu closed - showing bars');
            } else {
                // Open menu
                navLinks.classList.add('active');
                if (icon) {
                    icon.className = 'fas fa-times';
                }
                console.log('Menu opened - showing X');
            }
        }
        
        // Add click event to toggle button
        menuToggle.addEventListener('click', toggleMenu, false);
        menuToggle.addEventListener('touchstart', toggleMenu, { passive: false });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
                if (navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    const icon = menuToggle.querySelector('i');
                    if (icon) {
                        icon.className = 'fas fa-bars';
                    }
                    console.log('Menu closed by outside click');
                }
            }
        });
        
        // Close menu when clicking on a link
        const navLinksItems = navLinks.querySelectorAll('a');
        navLinksItems.forEach(function(link) {
            link.addEventListener('click', function() {
                navLinks.classList.remove('active');
                const icon = menuToggle.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-bars';
                }
                console.log('Menu closed by link click');
            });
        });
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileMenu);
    } else {
        initMobileMenu();
    }
})();
