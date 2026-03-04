// Global state
let allData = [];
let currentView = 'list'; // Changed default to 'list'
let currentTheme = localStorage.getItem('theme') || 'dark';
let isDataLoaded = false; // Flag to track if data has been loaded

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    initializeTheme();
    createModal();
    updateNavLinks();
    setupMobileMenu();

    // Load saved view preference, default to 'list'
    const savedView = localStorage.getItem('viewPreference') || 'list';

    // Set initial view without rendering (data not loaded yet)
    currentView = savedView;
    const gridBtn = document.querySelector('[data-view="grid"]');
    const listBtn = document.querySelector('[data-view="list"]');
    const gridView = document.getElementById('gridView');
    const listView = document.getElementById('listView');

    if (savedView === 'grid') {
        gridView.classList.add('active');
        listView.classList.remove('active');
        gridBtn.classList.add('active');
        listBtn.classList.remove('active');
    } else {
        listView.classList.add('active');
        gridView.classList.remove('active');
        listBtn.classList.add('active');
        gridBtn.classList.remove('active');
    }

    // Fetch data after setting up the view
    await fetchData();

    // Handle back button for modal
    window.addEventListener('popstate', function (e) {
        const modal = document.getElementById('imageModal');
        if (modal && modal.classList.contains('active')) {
            e.preventDefault();
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
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
    // Mobile menu is handled by mobile-menu.js
    // This function is no longer needed
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
        // Only render if data is loaded
        if (isDataLoaded) {
            renderGridView(allData);
        }
    } else {
        listView.classList.add('active');
        gridView.classList.remove('active');
        listBtn.classList.add('active');
        gridBtn.classList.remove('active');
        // Only render if data is loaded
        if (isDataLoaded) {
            renderListView(allData);
        }
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

        // Mark data as loaded
        isDataLoaded = true;

        populateCategoryFilter();

        if (currentView === 'grid') {
            renderGridView(allData);
        } else {
            renderListView(allData);
        }

    } catch (error) {
        console.error('Error fetching data:', error);
        isDataLoaded = true; // Mark as loaded even on error to prevent infinite loading
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
                <button class="card-btn secondary-btn" onclick="openQrModal('${item.url}', '${escapeHtml(item.name).replace(/'/g, "\\'")}')">
                    <i class="fas fa-qrcode"></i> QR
                </button>
                <button class="card-btn" onclick="window.open('${item.url}', '_blank')">
                    <i class="fas fa-external-link-alt"></i> Open
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
                <td colspan="6" class="empty-state">
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
            <td data-label="QR Code">
                <button class="action-btn secondary-btn" onclick="openQrModal('${item.url}', '${escapeHtml(item.name).replace(/'/g, "\\'")}')">
                    <i class="fas fa-qrcode"></i> QR
                </button>
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

    // Filter by search query (search only in link name)
    if (searchQuery) {
        filteredData = filteredData.filter(item => {
            const name = (item.name || '').toLowerCase();
            return name.includes(searchQuery);
        });
    }

    if (currentView === 'grid') {
        renderGridView(filteredData);
    } else {
        renderListView(filteredData);
    }
}

// Modal Functions
let currentQrCode = null;

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
        <div class="modal-overlay" id="qrModal">
            <div class="modal-content qr-modal-content">
                <button class="close-modal" onclick="closeQrModal()">&times;</button>
                <h3 id="qrModalTitle" class="qr-modal-title"></h3>
                <div id="qrCodeContainer" class="qr-code-wrapper"></div>
                <div class="modal-actions qr-actions">
                    <button class="action-btn" onclick="downloadQrCode()"><i class="fas fa-download"></i> Download</button>
                    <button class="action-btn secondary-btn" onclick="copyQrCode(this)"><i class="fas fa-copy"></i> Copy</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Close on overlay click
    document.getElementById('imageModal').addEventListener('click', function (e) {
        if (e.target === this) {
            closeModal();
        }
    });
    document.getElementById('qrModal').addEventListener('click', function (e) {
        if (e.target === this) {
            closeQrModal();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeModal();
            closeQrModal();
        }
    });
}

function openModal(imageSrc, username, date) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const modalUsername = document.getElementById('modalUsername');
    const modalDate = document.getElementById('modalDate');

    modalImage.src = imageSrc;
    modalImage.onerror = function () {
        this.src = '/img/b1.jpg';
    };
    modalUsername.textContent = username || 'Anonymous';
    modalDate.textContent = `Joined: ${date || 'Unknown date'}`;

    // Add to history for back button support
    history.pushState({ modal: 'imageModal' }, '');

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('imageModal');
    modal.classList.remove('active');

    // Remove from history if it was added
    if (window.history.state && window.history.state.modal === 'imageModal') {
        history.back();
    }

    document.body.style.overflow = 'auto';
}

function openQrModal(url, name) {
    const modal = document.getElementById('qrModal');
    const title = document.getElementById('qrModalTitle');
    const container = document.getElementById('qrCodeContainer');

    title.textContent = name;
    container.innerHTML = ''; // Clear previous

    // Create new QR Code
    currentQrCode = new QRCode(container, {
        text: url,
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    history.pushState({ modal: 'qrModal' }, '');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeQrModal() {
    const modal = document.getElementById('qrModal');
    modal.classList.remove('active');

    if (window.history.state && window.history.state.modal === 'qrModal') {
        history.back();
    }
    document.body.style.overflow = 'auto';
}

function downloadQrCode() {
    const container = document.getElementById('qrCodeContainer');
    const canvas = container.querySelector('canvas');
    if (canvas) {
        const link = document.createElement('a');
        link.download = 'qrcode.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }
}

async function copyQrCode(buttonElement) {
    const container = document.getElementById('qrCodeContainer');
    const canvas = container.querySelector('canvas');
    if (canvas) {
        try {
            canvas.toBlob(async blob => {
                const item = new ClipboardItem({ 'image/png': blob });
                await navigator.clipboard.write([item]);
                alertBox('QR Code คัดลอกแล้ว / Copied!', 'success');

                // Visual feedback on the button
                if (buttonElement) {
                    const originalHTML = buttonElement.innerHTML;
                    buttonElement.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    buttonElement.classList.remove('secondary-btn');
                    buttonElement.classList.add('success-btn'); // optional styling
                    buttonElement.style.backgroundColor = 'var(--success-color)';
                    buttonElement.style.color = 'white';
                    buttonElement.style.borderColor = 'var(--success-color)';

                    setTimeout(() => {
                        buttonElement.innerHTML = originalHTML;
                        buttonElement.classList.add('secondary-btn');
                        buttonElement.classList.remove('success-btn');
                        buttonElement.style.backgroundColor = '';
                        buttonElement.style.color = '';
                        buttonElement.style.borderColor = '';
                    }, 2000);
                }
            });
        } catch (err) {
            console.error('Failed to copy image: ', err);
            alertBox('เบราว์เซอร์นี้ไม่รองรับการคัดลอกรูป / Failed to copy QR code.', 'error');
        }
    }
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
                <td colspan="6" class="loading-state">
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
                <td colspan="6">${errorHTML}</td>
            </tr>
        `;
    }
}

function alertBox(message, type = 'info') {
    const alertElement = document.getElementById('alertBox');
    if (!alertElement) return;

    alertElement.textContent = message;
    alertElement.className = `alert-box ${type}`;

    if (alertElement.hideTimeout) {
        clearTimeout(alertElement.hideTimeout);
    }

    alertElement.style.opacity = '1';
    alertElement.style.transform = 'translateX(0)';
    alertElement.style.display = 'block';
    alertElement.style.pointerEvents = 'auto';

    alertElement.hideTimeout = setTimeout(() => {
        alertElement.style.opacity = '0';
        alertElement.style.transform = 'translateX(200px)';
        setTimeout(() => {
            alertElement.style.display = 'none';
            alertElement.style.pointerEvents = 'none';
        }, 300);
    }, 5000);
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
window.openQrModal = openQrModal;
window.closeQrModal = closeQrModal;
window.downloadQrCode = downloadQrCode;
window.copyQrCode = copyQrCode;
window.alertBox = alertBox;
