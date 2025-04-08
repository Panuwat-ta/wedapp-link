// Mobile menu toggle
document.getElementById('menuToggle').addEventListener('click', function() {
    document.getElementById('navLinks').classList.toggle('active');
});

function setActive(element) {
    document.querySelectorAll('nav a').forEach(link => {
        link.classList.remove('active');
    });
    element.classList.add('active');
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

document.addEventListener('DOMContentLoaded', () => {
    fetchData();
    updateNavLinks(localStorage.getItem('username') ? true : false);
});

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