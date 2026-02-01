// Global state
let allData = [];
let currentView = 'list'; // Changed default to 'list'
let currentTheme = localStorage.getItem('theme') || 'dark';

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    createModal();
    fetchData();
    updateNavLinks();
    setupMobileMenu();
    
    // Load saved view preference, default to 'list'
    const savedView = localStorage.getItem('viewPreference') || 'list';
    toggleView(savedView);
});

// Theme Management
function initializeTheme() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon();
}

function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const themeToggles = document.querySelectorAll('.theme-toggle i, .theme-toggle-nav i');
    themeToggles.forEach(toggle => {
        if (toggle) {
            toggle.className = currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    });
}

// Mobile Menu
function setupMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    const navUser = document.getElementById('navUser');
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            if (navUser) {
                navUser.classList.toggle('active');
            }
        });
        
        // Close menu when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                if (navUser) {
                    navUser.classList.remove('active');
                }
            });
        });
    }
}

// View Toggle
function toggleView(view) {
    currentView = view;
    localStorage.setItem('viewPreference', view);
    
    const gridView = document.getElementById('gridView');
    const listView = document.getElementById('listView');
    const gridBtn = document.querySelector('[data-view="grid"]');
    const listBtn = document.querySelector('[data-view="list"]');
    
    if (view === 'grid') {
        gridView.classList.add('active');
        listView.classList.remove('active');
        gridBtn.classList.add('active');
        listBtn.classList.remove('active');
        renderGridView(allData);
    } else {
        listView.classList.add('active');
        gridView.classList.remove('active');
        listBtn.classList.add('active');
        gridBtn.classList.remove('active');
        renderListView(allData);
    }
}

// Fetch Data
async function fetchData() {
    try {
        showLoading();
        const response = await fetch('/data');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Sort by date (newest first)
        allData = data.sort((a, b) => {
            return parseThaiDate(b.date) - parseThaiDate(a.date);
        });
        
        populateCategoryFilter();
        
        if (currentView === 'grid') {
            renderGridView(allData);
        } else {
            renderListView(allData);
        }
        
    } catch (error) {
        console.error('Error fetching data:', error);
        showError(error.message);
    }
}

// Parse Thai date format
function parseThaiDate(dateStr) {
    try {
        const [datePart, timePart] = dateStr.split(' ');
        const [day, month, year] = datePart.split('/').map(Number);
        const christianYear = year - 543;
        const [hour, minute] = timePart ? timePart.split(':').map(Number) : [0, 0];
        return new Date(christianYear, month - 1, day, hour, minute).getTime();
    } catch (e) {
        return 0;
    }
}

// Populate Category Filter
function populateCategoryFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    const categories = new Set(['all']);
    
    allData.forEach(item => {
        if (item.username) {
            categories.add(item.username);
        }
    });
    
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';
    Array.from(categories).sort().forEach(category => {
        if (category !== 'all') {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        }
    });
}

// Render Grid View
function renderGridView(data) {
    const gridContainer = document.getElementById('gridContainer');
    
    if (data.length === 0) {
        gridContainer.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-link"></i>
                <h3>No links found</h3>
                <p>Start by adding your first link!</p>
            </div>
        `;
        return;
    }
    
    gridContainer.innerHTML = data.map(item => `
        <div class="link-card fade-in">
            <div class="card-header">
                <img src="${item.profileImage || '/img/b1.jpg'}" 
                     alt="${item.username || 'Anonymous'}" 
                     class="card-avatar"
                     onerror="this.src='/img/b1.jpg'"
                     onclick="openModal('${item.profileImage || '/img/b1.jpg'}', '${item.username || 'Anonymous'}', '${item.date}')">
                <div class="card-user-info">
                    <div class="card-username">${item.username || 'Anonymous'}</div>
                    <div class="card-date">${item.date}</div>
                </div>
            </div>
            <div class="card-content">
                <h3 class="card-title">${escapeHtml(item.name)}</h3>
                <a href="${item.url}" target="_blank" class="card-link" title="${item.url}">
                    ${truncateUrl(item.url, 40)}
                </a>
            </div>
            <div class="card-actions">
                <button class="card-btn" onclick="window.open('${item.url}', '_blank')">
                    <i class="fas fa-external-link-alt"></i> Open Link
                </button>
            </div>
        </div>
    `).join('');
}

// Render List View
function renderListView(data) {
    const tableBody = document.querySelector('#dataTable tbody');
    
    if (data.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    <i class="fas fa-link"></i>
                    <h3>No links found</h3>
                    <p>Start by adding your first link!</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = data.map(item => `
        <tr class="fade-in">
            <td data-label="Date">${item.date}</td>
            <td data-label="Link">
                <a href="${item.url}" target="_blank" title="${item.url}">
                    ${truncateUrl(item.url, 50)}
                </a>
            </td>
            <td data-label="Name">${escapeHtml(item.name)}</td>
            <td data-label="User">
                <div class="user-info">
                    <img src="${item.profileImage || '/img/b1.jpg'}" 
                         alt="${item.username || 'Anonymous'}" 
                         class="user-avatar"
                         onerror="this.src='/img/b1.jpg'"
                         onclick="openModal('${item.profileImage || '/img/b1.jpg'}', '${item.username || 'Anonymous'}', '${item.date}')">
                    <span>${item.username || 'Anonymous'}</span>
                </div>
            </td>
            <td data-label="Actions">
                <button class="action-btn" onclick="window.open('${item.url}', '_blank')">
                    <i class="fas fa-external-link-alt"></i> Open
                </button>
            </td>
        </tr>
    `).join('');
}

// Filter Data
function filterData() {
    const searchQuery = document.getElementById('searchBox').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    let filteredData = allData;
    
    // Filter by category
    if (categoryFilter !== 'all') {
        filteredData = filteredData.filter(item => 
            item.username === categoryFilter
        );
    }
    
    // Filter by search query
    if (searchQuery) {
        filteredData = filteredData.filter(item => {
            const name = (item.name || '').toLowerCase();
            const username = (item.username || '').toLowerCase();
            const url = (item.url || '').toLowerCase();
            return name.includes(searchQuery) || 
                   username.includes(searchQuery) || 
                   url.includes(searchQuery);
        });
    }
    
    if (currentView === 'grid') {
        renderGridView(filteredData);
    } else {
        renderListView(filteredData);
    }
}

// Modal Functions
function createModal() {
    const modalHTML = `
        <div class="modal-overlay" id="imageModal">
            <div class="modal-content">
                <button class="close-modal" onclick="closeModal()">&times;</button>
                <img src="" alt="Profile Image" class="modal-image" id="modalImage">
                <div class="modal-user-info">
                    <div class="modal-username" id="modalUsername"></div>
                    <div class="modal-date" id="modalDate"></div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Close on overlay click
    document.getElementById('imageModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

function openModal(imageSrc, username, date) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const modalUsername = document.getElementById('modalUsername');
    const modalDate = document.getElementById('modalDate');
    
    modalImage.src = imageSrc;
    modalImage.onerror = function() {
        this.src = '/img/b1.jpg';
    };
    modalUsername.textContent = username || 'Anonymous';
    modalDate.textContent = `Joined: ${date || 'Unknown date'}`;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('imageModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function truncateUrl(url, maxLength) {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
}

function showLoading() {
    if (currentView === 'grid') {
        document.getElementById('gridContainer').innerHTML = `
            <div class="loading-state" style="grid-column: 1/-1;">
                <div class="spinner"></div>
                <p>Loading data...</p>
            </div>
        `;
    } else {
        document.querySelector('#dataTable tbody').innerHTML = `
            <tr>
                <td colspan="5" class="loading-state">
                    <div class="spinner"></div>
                    <p>Loading data...</p>
                </td>
            </tr>
        `;
    }
}

function showError(message) {
    const errorHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Error loading data</h3>
            <p>${escapeHtml(message)}</p>
            <button onclick="fetchData()" class="action-btn" style="margin-top: 16px;">
                <i class="fas fa-sync-alt"></i> Try Again
            </button>
        </div>
    `;
    
    if (currentView === 'grid') {
        document.getElementById('gridContainer').innerHTML = errorHTML;
    } else {
        document.querySelector('#dataTable tbody').innerHTML = `
            <tr>
                <td colspan="5">${errorHTML}</td>
            </tr>
        `;
    }
}

// Update Navigation Links
function updateNavLinks() {
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
}

// Export functions for global access
window.toggleTheme = toggleTheme;
window.toggleView = toggleView;
window.filterData = filterData;
window.openModal = openModal;
window.closeModal = closeModal;
