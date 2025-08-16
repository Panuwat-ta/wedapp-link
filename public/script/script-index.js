// Mobile menu toggle
document.getElementById('menuToggle').addEventListener('click', function () {
    document.getElementById('navLinks').classList.toggle('active');
});

function setActive(element) {
    document.querySelectorAll('nav a').forEach(link => {
        link.classList.remove('active');
    });
    element.classList.add('active');
}

// Modal functions
function createModal() {
    const modalHTML = `
        <div class="modal-overlay" id="imageModal">
            <div class="modal-content">
                <button class="close-modal" id="closeModal">&times;</button>
                <img src="" alt="Profile Image" class="modal-image" id="modalImage">
                <div class="modal-user-info">
                    <div class="modal-username" id="modalUsername"></div>
                    <div class="modal-date" id="modalDate"></div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Add event listeners for the modal
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('imageModal').addEventListener('click', function (e) {
        if (e.target === this) {
            closeModal();
        }
    });

    // Close modal when pressing Escape key
    document.addEventListener('keydown', function (e) {
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
    modalImage.onerror = function () {
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

function setupImageClickHandlers() {
    document.querySelectorAll('.user-avatar').forEach(avatar => {
        avatar.addEventListener('click', function (e) {
            e.stopPropagation();
            const row = this.closest('tr');
            const username = row.querySelector('td[data-label="Username"] span').textContent;
            const date = row.querySelector('td[data-label="Date"]').textContent;
            openModal(this.src, username, date);
        });
    });
}

async function fetchData() {
    try {
        const tableBody = document.querySelector('#dataTable tbody');
        // แสดง loading state
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="loading">
                    <div class="spinner"></div>
                    <p>Loading data...</p>
                </td>
            </tr>
        `;

        const response = await fetch('/data');
        const data = await response.json();
        tableBody.innerHTML = '';

        // เรียงข้อมูลจากวันที่ล่าสุดไปเก่าสุด
        data.sort((a, b) => {
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

        if (data.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <h3>No links found</h3>
                        <p>Add links from the Update page</p>
                    </td>
                </tr>
            `;
            return;
        }

        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td data-label="Date">${item.date}</td>
                <td data-label="Link"><a href="${item.url}" target="_blank">${item.url}</a></td>
                <td data-label="Name">${item.name}</td>
                <td data-label="Username">
                    <div class="user-info">
                        <img src="${item.profileImage || '/img/b1.jpg'}" alt="Profile" class="user-avatar" onerror="this.src='/img/b1.jpg'">
                        <span>${item.username || 'Anonymous'}</span>
                    </div>
                </td>
                <td data-label="Action"><button class="action-btn" onclick="window.open('${item.url}', '_blank')"><i class="fas fa-external-link-alt"></i> Open</button></td>
            `;
            tableBody.appendChild(row);
        });

        // Set up click handlers for the avatars
        setupImageClickHandlers();
    } catch (error) {
        const tableBody = document.querySelector('#dataTable tbody');
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error loading data</h3>
                    <p>${error.message || 'An unknown error occurred'}</p>
                    <button onclick="fetchData()" class="action-btn" style="margin-top: 15px;">
                        <i class="fas fa-sync-alt"></i> Try Again
                    </button>
                </td>
            </tr>
        `;
        console.error('Error fetching data:', error);
    }
}

function filterTable() {
    const query = document.getElementById('searchBox').value.toLowerCase();
    const rows = document.querySelectorAll('#dataTable tbody tr');

    rows.forEach(row => {
        if (row.classList.contains('empty-state')) return;

        const cells = row.getElementsByTagName('td');
        const name = cells[2].textContent.toLowerCase();       // LinkName (คอลัมน์ที่ 3)
        const username = cells[3].textContent.toLowerCase();   // Username (คอลัมน์ที่ 4)

        if (name.includes(query) || username.includes(query)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// อัพเดทการแสดงผลของลิงก์ Login/Logout
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

document.addEventListener('DOMContentLoaded', () => {
    createModal(); // Create the modal when page loads
    fetchData();
    updateNavLinks(localStorage.getItem('username') ? true : false);
});