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

// Fetch and display today's visitor count
async function fetchDailyVisitors() {
    try {
        const response = await fetch('/daily-visitors');
        const data = await response.json();
        document.getElementById('visitorCount').textContent = 
            `Visitors today: ${data.visitors}`;
    } catch (error) {
        console.error("Error fetching daily visitors:", error);
        document.getElementById('visitorCount').textContent = 
            "Unable to load visitor count.";
    }
}


// ตรวจสอบสถานะการล็อกอินเมื่อโหลดหน้า
document.addEventListener('DOMContentLoaded', function() {
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
    
    updateNavLinks(isLoggedIn ? true : false);
    fetchDailyVisitors();
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
