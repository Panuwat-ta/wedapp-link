// Google Drive API configuration
let API_KEY;
let CLIENT_ID;
let FOLDER_ID;

// API discovery docs and scopes
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient;
let gapiInited = false;
let gisInited = false;

// Elements
const authBtn = document.getElementById('authBtn');
const uploadBtn = document.getElementById('uploadBtn');
const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const selectFilesBtn = document.getElementById('selectFiles');
const fileList = document.getElementById('fileList');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');

const signOutBtn = document.getElementById('signOutBtn'); // Update to get the button from HTML

// Files to upload
let filesToUpload = [];

// Initialize the API client
async function initializeGapiClient() {
    try {
        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: DISCOVERY_DOCS,
        });
        gapiInited = true;
        maybeEnableButtons();
    } catch (error) {
        console.error('Error initializing GAPI client:', error);
        showError('Failed to initialize Google API client.');
    }
}

// Initialize Google Identity Services
function gisInit() {
    try {
        console.log('Initializing Google Identity Services...');
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: (response) => {
                if (response.error) {
                    console.error('Error during authentication:', response.error);
                    showError('Authentication failed. Please try again.');
                    return;
                }
                console.log('Authentication successful.');
                const token = response.access_token;
                sessionStorage.setItem('access_token', token);
                localStorage.setItem('access_token', token);
                authBtn.style.display = 'none';
                signOutBtn.style.display = 'block';
                uploadBtn.disabled = filesToUpload.length === 0;
                checkFolderAccess();
            },
        });
        gisInited = true;
        maybeEnableButtons();
    } catch (error) {
        console.error('Error initializing Google Identity Services:', error);
        showError('Failed to initialize authentication services.');
    }
}

// Check if both GAPI and GIS are initialized
function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        authBtn.style.display = 'block'; // Ensure the button is visible
        authBtn.disabled = false;
    }
}

// Handle sign-in
function handleAuthClick() {
    console.log('Sign-in button clicked.');
    try {
        if (gapi.client.getToken() === null) {
            console.log('Requesting new access token...');
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            console.log('Using existing access token...');
            tokenClient.requestAccessToken({ prompt: '' });
        }
    } catch (error) {
        console.error('Error during sign-in:', error);
        showError('Sign-in failed. Please try again.');
    }
}

// Handle sign-out
function handleSignOutClick() {
    console.log('Sign-out button clicked.');
    sessionStorage.removeItem('access_token'); // Clear token from sessionStorage
    localStorage.removeItem('access_token'); // Clear token from localStorage
    gapi.client.setToken(null); // Clear token from Google API client
    authBtn.style.display = 'block';
    signOutBtn.style.display = 'none';
    uploadBtn.disabled = true;
    showSuccess('You have signed out successfully.');
}

// Check if we have access to the target folder
async function checkFolderAccess() {
    try {
        if (!gapi.client || !gapi.client.drive) {
            throw new Error('Google API client is not initialized.');
        }
        const response = await gapi.client.drive.files.get({
            fileId: FOLDER_ID,
            fields: 'name',
        });
        console.log('Folder accessible:', response.result.name);
    } catch (error) {
        console.error('Error accessing folder:', error);
        showError('Select the file you want to upload.');
    }
}

// Handle file selection via button
selectFilesBtn.addEventListener('click', () => {
    fileInput.click();
});

// Handle file selection change
fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

// Handle drag and drop events
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
};

['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
});

function highlight() {
    dropArea.classList.add('dragover');
}

function unhighlight() {
    dropArea.classList.remove('dragover');
}

// Handle dropped files
dropArea.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
});

// Process selected files
function handleFiles(files) {
    filesToUpload = Array.from(files);
    updateFileList();
    if (gapi.client.getToken() !== null) {
        uploadBtn.disabled = filesToUpload.length === 0;
    }
}

// Update the file list display
function updateFileList() {
    fileList.innerHTML = '';

    if (filesToUpload.length === 0) {
        return;
    }
    
    filesToUpload.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const fileInfo = document.createElement('div');
        fileInfo.className = 'file-info';
        fileInfo.innerHTML = `
            <i class="fas fa-file file-icon"></i>
            <div>
                <div class="file-name">${file.name}</div>
                <div class="file-size">${formatFileSize(file.size)}</div>
            </div>
        `;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.onclick = () => removeFile(index);
        
        fileItem.appendChild(fileInfo);
        fileItem.appendChild(removeBtn);
        fileList.appendChild(fileItem);
        
        if (file.size > 750 * 1024 * 1024) {
            const warning = document.createElement('div');
            warning.style.color = '#ff9800';
            warning.style.fontSize = '0.8rem';
            warning.style.marginTop = '5px';
            warning.innerHTML = '<i class="fas fa-exclamation-triangle"></i> File exceeds 750MB limit and may not upload';
            fileItem.appendChild(warning);
        }
    });
}

// Remove a file from the list
function removeFile(index) {
    filesToUpload.splice(index, 1);
    updateFileList();
    uploadBtn.disabled = filesToUpload.length === 0;
}

// Format file size for display
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Handle file upload to Google Drive
uploadBtn.addEventListener('click', async () => {
    if (filesToUpload.length === 0) {
        showError('Please select at least one file to upload.');
        return;
    }

    clearMessages();
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

    let successCount = 0;
    const errorFiles = [];

    for (const file of filesToUpload) {
        try {
            await uploadFileToDrive(file);
            successCount++;
        } catch {
            errorFiles.push(file.name);
        }
    }

    // Show upload results
    if (errorFiles.length === 0) {
        showSuccess(`Successfully uploaded ${successCount} file(s) to Google Drive!`);
        filesToUpload = [];
        fileList.innerHTML = '';
    } else {
        showError(`Uploaded ${successCount} file(s). Failed to upload: ${errorFiles.join(', ')}`);
    }

    uploadBtn.disabled = false;
    uploadBtn.innerHTML = 'Upload to Google Drive';
});

// Upload a single file to Google Drive
async function uploadFileToDrive(file) {
    const metadata = {
        name: file.name,
        mimeType: file.type,
        parents: [FOLDER_ID],
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    try {
        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: new Headers({ 'Authorization': 'Bearer ' + gapi.client.getToken().access_token }),
            body: form,
        });
        if (!response.ok) {
            throw new Error(`Upload failed with status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}

// Show success message
function showSuccess(message) {
    successMessage.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
}

// Show error message
function showError(message) {
    errorMessage.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
};

// Clear all messages
function clearMessages() {
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';
}

// Toggle mobile menu
menuToggle.addEventListener('click', function() {
    navLinks.classList.toggle('active');
});

async function fetchEnvVariables() {
    try {
        const response = await fetch('/env');
        if (!response.ok) {
            throw new Error('Failed to fetch environment variables');
        }
        const env = await response.json();
        return env;
    } catch (error) {
        console.error('Error fetching environment variables:', error);
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Fetching environment variables...');
        const env = await fetchEnvVariables();
        API_KEY = env.API_KEY;
        CLIENT_ID = env.CLIENT_ID;
        FOLDER_ID = env.FOLDER_ID;

        if (!CLIENT_ID || !API_KEY || !FOLDER_ID) {
            throw new Error('Missing required environment variables');
        }

        console.log('Environment variables loaded:', { API_KEY, CLIENT_ID, FOLDER_ID });

        // Initialize the Google API client
        console.log('Loading Google API client...');
        gapi.load('client', async () => {
            await initializeGapiClient(); // Ensure gapi.client is initialized
            gisInit();

            // Restore token from localStorage
            const savedToken = localStorage.getItem('access_token');
            if (savedToken) {
                console.log('Restoring access token from localStorage...');
                gapi.client.setToken({ access_token: savedToken });

                // Wait for gapi.client to fully initialize before proceeding
                gapi.client.load('drive', 'v3', () => {
                    console.log('Google Drive API loaded.');
                    authBtn.style.display = 'none';
                    signOutBtn.style.display = 'block'; // Show sign-out button
                    uploadBtn.disabled = filesToUpload.length === 0;

                    // Call checkFolderAccess only after gapi.client is initialized
                    checkFolderAccess();
                });
            } else {
                console.log('No saved token found. User needs to sign in.');
            }
        });
        signOutBtn.addEventListener('click', handleSignOutClick); // Bind sign-out button to click event
    } catch (error) {
        console.error('Failed to initialize application:', error);
        showError('Please login before use.');
    }
});

// Ensure the auth button is bound to the click event
authBtn.addEventListener('click', handleAuthClick);



// ตรวจสอบสถานะการล็อกอินเมื่อโหลดหน้า
document.addEventListener('DOMContentLoaded', function() {
    const isLoggedIn = localStorage.getItem('username') ? true : false;
    updateNavLinks(isLoggedIn);
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