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
const signOutBtn = document.getElementById('signOutBtn');
const createFolderBtn = document.getElementById('createFolderBtn');

let selectedFolderId = null;
const folderPromptModal = document.getElementById('folderPrompt');
const folderList = document.getElementById('folderList');
const cancelFolderSelect = document.getElementById('cancelFolderSelect');
const confirmFolderSelect = document.getElementById('confirmFolderSelect');

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
        authBtn.style.display = 'block';
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
    sessionStorage.removeItem('access_token');
    localStorage.removeItem('access_token');
    gapi.client.setToken(null);
    authBtn.style.display = 'block';
    signOutBtn.style.display = 'none';
    uploadBtn.disabled = true;
    showSuccess('You have signed out successfully.');
}

// Check if we have access to the target folder
async function checkFolderAccess() {
    try {
        const response = await fetch(`/api/folders?parentId=${FOLDER_ID}`, {
            headers: {
                'Authorization': `Bearer ${gapi.client.getToken().access_token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to access folder');
        }
        
        const data = await response.json();
        console.log('Folder accessible:', data.length, 'subfolders found');
    } catch (error) {
        console.error('Error accessing folder:', error);
        showError('Select the file you want to upload.');
    }
}

// Handle file selection via button
selectFilesBtn.addEventListener('click', () => {
    fileInput.value = '';
    fileInput.click();
});

// Handle file selection change
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFiles(e.target.files);
    }
});

// Handle drag and drop events
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

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
async function handleFiles(files) {
    const newFiles = Array.from(files);
    filesToUpload = [...filesToUpload, ...newFiles];
    updateFileList();
    
    if (gapi.client.getToken() !== null) {
        uploadBtn.disabled = filesToUpload.length === 0;
    }

    // Store files in sessionStorage for persistence
    sessionStorage.setItem('pendingUploads', JSON.stringify(
        filesToUpload.map(f => ({
            name: f.name,
            size: f.size,
            type: f.type
        }))
    ));
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

// Custom folder prompt function
function showFolderPrompt(message, callback) {
    const promptBox = document.createElement('div');
    promptBox.className = 'folder-prompt';
    promptBox.innerHTML = `
        <div class="prompt-content">
            <h3>${message || 'Enter folder name:'}</h3>
            <div class="input-container">
                <input type="text" class="folder-input" placeholder="Folder name" autocomplete="off" id="folderNameInput">
                <div id="folderNameError" class="error-prompt" style="display: none;">
                    <i class="fas fa-exclamation-triangle"></i> <span>Please enter name</span>
                </div>
            </div>
            <div class="prompt-buttons">
                <button class="btn btn-cancel cancel-btn">Cancel</button>
                <button class="btn confirm-btn">Create</button>
            </div>
        </div>
    `;

    document.body.appendChild(promptBox);
    
    const input = document.getElementById('folderNameInput');
    const errorMsg = document.getElementById('folderNameError');
    const cancelBtn = promptBox.querySelector('.cancel-btn');
    const confirmBtn = promptBox.querySelector('.confirm-btn');
    
    input.focus();
    
    const cleanUp = () => {
        document.body.removeChild(promptBox);
    };
    
    const handleConfirm = () => {
        const folderName = input.value.trim();
        if (folderName) {
            callback(folderName);
            cleanUp();
        } else {
            errorMsg.style.display = 'flex';
            input.classList.add('invalid-input');
        }
    };
    
    const handleCancel = () => {
        callback(null);
        cleanUp();
    };
    
    cancelBtn.addEventListener('click', handleCancel);
    confirmBtn.addEventListener('click', handleConfirm);
    
    input.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            handleConfirm();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    });
    
    promptBox.addEventListener('click', (e) => {
        if (e.target === promptBox) {
            handleCancel();
        }
    });

    input.addEventListener('input', () => {
        if (input.value.trim()) {
            errorMsg.style.display = 'none';
            input.classList.remove('invalid-input');
        }
    });
}

// Handle folder creation
createFolderBtn.addEventListener('click', () => {
    showFolderPrompt('Enter folder name:', async (folderName) => {
        if (!folderName) return;

        try {
            const response = await fetch('/api/folders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${gapi.client.getToken().access_token}`
                },
                body: JSON.stringify({
                    name: folderName,
                    parentId: selectedFolderId || FOLDER_ID
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to create folder: ${response.statusText}`);
            }

            const newFolder = await response.json();
            showSuccess(`Folder "${newFolder.name}" created successfully`);
            
            await listFolders(selectedFolderId || FOLDER_ID);
            
            const newFolderElement = Array.from(folderList.children)
                .find(el => el.querySelector('.folder-name').textContent === newFolder.name);
            if (newFolderElement) {
                selectFolder(newFolder.id, newFolderElement);
            }
        } catch (error) {
            console.error('Error creating folder:', error);
            showError('Failed to create folder');
        }
    });
});

// Handle upload button click
uploadBtn.addEventListener('click', async () => {
    if (filesToUpload.length === 0) {
        showError('Please select at least one file to upload.');
        return;
    }

    folderPromptModal.style.display = 'block';
    selectedFolderId = null;
    confirmFolderSelect.disabled = true;
    await listFolders(FOLDER_ID);
});

// Folder prompt event listeners
cancelFolderSelect.addEventListener('click', () => {
    folderPromptModal.style.display = 'none';
});

confirmFolderSelect.addEventListener('click', async () => {
    if (!selectedFolderId) return;
    
    folderPromptModal.style.display = 'none';
    clearMessages();

    // Check if there's an ongoing upload
    const currentUploadId = sessionStorage.getItem('currentUploadId');
    
    try {
        const formData = new FormData();
        filesToUpload.forEach(file => {
            formData.append('files', file);
        });
        formData.append('folderId', selectedFolderId);

        let response;
        if (currentUploadId) {
            response = await fetch(`/add-files/${currentUploadId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${gapi.client.getToken().access_token}`
                },
                body: formData
            });
        } else {
            response = await fetch('/start-upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${gapi.client.getToken().access_token}`
                },
                body: formData
            });

            if (response.ok) {
                const { uploadId } = await response.json();
                sessionStorage.setItem('currentUploadId', uploadId);
            }
        }

        if (!response.ok) {
            throw new Error(await response.text() || 'Upload failed');
        }

        // Clear files immediately after successful upload initiation
        filesToUpload = [];
        updateFileList();
        uploadBtn.disabled = true;
        dropArea.innerHTML = `
            <div class="upload-icon">
                <i class="fas fa-cloud-upload-alt"></i>
            </div>
            <h3>Drag & Drop files here</h3>
            <p>or</p>
            <button class="btn" id="selectFiles">Select Files</button>
        `;
        
        // Re-attach event listener to new selectFiles button
        document.getElementById('selectFiles').addEventListener('click', () => {
            fileInput.value = '';
            fileInput.click();
        });

        if (!currentUploadId) {
            showUploadPrompt('Starting upload...');
            startUploadProgressPolling();
        }

        showSuccess('Files added to upload queue');

    } catch (error) {
        console.error('Upload error:', error);
        showError(error.message || 'Failed to upload files');
        uploadBtn.disabled = false;
    }
});

// Upload file to Google Drive
async function uploadFileToDrive(file, folderId) {
    const metadata = {
        name: file.name,
        mimeType: file.type,
        parents: [folderId],
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

// List folders in Google Drive using our backend API
async function listFolders(parentId) {
    try {
        folderList.innerHTML = '<div class="folder-item loading"><i class="fas fa-spinner fa-spin"></i> Loading folders...</div>';
        
        const response = await fetch(`/api/folders?parentId=${parentId}`, {
            headers: {
                'Authorization': `Bearer ${gapi.client.getToken().access_token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch folders: ${response.statusText}`);
        }
        
        const folders = await response.json();
        folderList.innerHTML = '';

        // Add back button if not in root folder
        if (parentId !== FOLDER_ID) {
            const backButton = document.createElement('div');
            backButton.className = 'folder-item';
            backButton.innerHTML = '<i class="fas fa-arrow-left"></i> Back';
            backButton.onclick = async () => {
                await listFolders(FOLDER_ID);
            };
            folderList.appendChild(backButton);
        } else {
            // Only show root folder option when in root directory
            const rootFolder = document.createElement('div');
            rootFolder.className = 'folder-item';
            rootFolder.innerHTML = '<i class="fas fa-folder"></i> Default folder';
            rootFolder.onclick = () => selectFolder(FOLDER_ID, rootFolder);
            folderList.appendChild(rootFolder);
        }

        // Add all subfolders
        folders.forEach(folder => {
            const folderElement = document.createElement('div');
            folderElement.className = 'folder-item';
            folderElement.innerHTML = `
                <i class="fas fa-folder"></i> 
                <span class="folder-name">${folder.name}</span>
                <i class="fas fa-chevron-right folder-nav" style="margin-left: auto;"></i>
            `;
            
            // Make the entire folder element clickable to select
            folderElement.onclick = (e) => {
                // Don't select if clicking on the chevron
                if (!e.target.classList.contains('folder-nav')) {
                    selectFolder(folder.id, folderElement);
                }
            };
            
            // Make chevron icon clickable to navigate
            const chevron = folderElement.querySelector('.folder-nav');
            chevron.onclick = (e) => {
                e.stopPropagation(); // Prevent the folder selection from happening
                listFolders(folder.id);
            };
            
            folderList.appendChild(folderElement);
        });

        return folders;
    } catch (error) {
        console.error('Error listing folders:', error);
        showError('Failed to load folders');
        return [];
    }
}

// Select a folder
function selectFolder(folderId, element) {
    document.querySelectorAll('.folder-item').forEach(item => {
        item.classList.remove('selected');
    });
    element.classList.add('selected');
    selectedFolderId = folderId;
    confirmFolderSelect.disabled = false;
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
}

// Clear all messages
function clearMessages() {
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';
}

// Toggle mobile menu
menuToggle.addEventListener('click', function() {
    navLinks.classList.toggle('active');
});

// Fetch environment variables
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

// Initialize the application
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

        console.log('Loading Google API client...');
        gapi.load('client', async () => {
            await initializeGapiClient();
            gisInit();

            const savedToken = localStorage.getItem('access_token');
            if (savedToken) {
                console.log('Restoring access token from localStorage...');
                gapi.client.setToken({ access_token: savedToken });

                gapi.client.load('drive', 'v3', () => {
                    console.log('Google Drive API loaded.');
                    authBtn.style.display = 'none';
                    signOutBtn.style.display = 'block';
                    uploadBtn.disabled = filesToUpload.length === 0;
                    checkFolderAccess();
                });
            } else {
                console.log('No saved token found. User needs to sign in.');
            }
        });
        signOutBtn.addEventListener('click', handleSignOutClick);
    } catch (error) {
        console.error('Failed to initialize application:', error);
        showError('Please login before use.');
    }
});

authBtn.addEventListener('click', handleAuthClick);

// Check login status
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
});

// Update navigation links based on login status
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

// Show upload prompt
function showUploadPrompt(message = null, progress = 0, isComplete = false) {
    let promptBox = document.getElementById('uploadPrompt');
    const wasMinimized = promptBox?.classList.contains('minimized');
    
    if (!promptBox) {
        promptBox = document.createElement('div');
        promptBox.id = 'uploadPrompt';
        promptBox.className = 'upload-prompt';
        document.body.appendChild(promptBox);
    }

    promptBox.innerHTML = `
        <div class="upload-header">
            <span class="upload-title">Uploading Files${progress ? ` (${progress}%)` : ''}</span>
            <div class="upload-buttons">
                <button class="upload-button minimize-btn">
                    <i class="fas fa-chevron-down"></i>
                </button>
                <button class="upload-button cancel-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
        <div class="upload-content">
            <div class="spinner"></div>
            <p>${message || 'Uploading files...'}</p>
            <div class="progress-bar">
                <div class="progress" style="width: ${progress}%"></div>
            </div>
            <div id="uploadFileList"></div>
        </div>
    `;

    promptBox.querySelector('.minimize-btn').addEventListener('click', () => {
        promptBox.classList.toggle('minimized');
    });

    promptBox.querySelector('.cancel-btn').addEventListener('click', async () => {
        const uploadId = sessionStorage.getItem('currentUploadId');
        if (uploadId) {
            try {
                const response = await fetch(`/cancel-upload/${uploadId}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${gapi.client.getToken().access_token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to cancel upload');
                }

                showError('Upload cancelled');
                cleanupAfterUpload();
                promptBox.remove();
            } catch (error) {
                console.error('Error cancelling upload:', error);
            }
        }
        sessionStorage.removeItem('currentUploadId');
    });

    if (wasMinimized) {
        promptBox.classList.add('minimized');
    }

    if (isComplete) {
        setTimeout(() => {
            promptBox.remove();
        }, 2000);
    }

    return promptBox;
}

// Update file list in upload prompt
function updateUploadFileList(files, progress) {
    const fileList = document.getElementById('uploadFileList');
    if (!fileList) return;

    fileList.innerHTML = files.map(file => `
        <div class="upload-file-progress">
            <i class="fas fa-file"></i>
            <span class="upload-file-name">${file.name}</span>
            <span class="upload-file-percent">${file.progress}%</span>
        </div>
    `).join('');
}

// Poll upload progress
function startUploadProgressPolling() {
    const uploadId = sessionStorage.getItem('currentUploadId');
    if (!uploadId) return;

    const pollInterval = setInterval(async () => {
        try {
            const response = await fetch(`/upload-progress/${uploadId}`);
            const data = await response.json();

            if (data.error) {
                showUploadPrompt(data.error, 0, true);
                clearInterval(pollInterval);
                cleanupAfterUpload();
                return;
            }

            if (data.completed) {
                showUploadPrompt('Upload completed!', 100, true);
                clearInterval(pollInterval);
                cleanupAfterUpload();
                return;
            }

            showUploadPrompt(null, data.progress);
            if (data.files) {
                updateUploadFileList(data.files);
            }
        } catch (error) {
            console.error('Error polling upload progress:', error);
            showError('Error checking upload progress');
            clearInterval(pollInterval);
        }
    }, 1000);
}

// เพิ่มฟังก์ชันใหม่สำหรับการทำความสะอาดหลังอัปโหลด
function cleanupAfterUpload() {
    sessionStorage.removeItem('currentUploadId');
    filesToUpload = [];
    updateFileList();
    uploadBtn.disabled = false;
    uploadBtn.innerHTML = 'Upload to Google Drive';
}

// Check for ongoing uploads on page load
document.addEventListener('DOMContentLoaded', () => {
    const uploadId = sessionStorage.getItem('currentUploadId');
    if (uploadId) {
        showUploadPrompt();
        startUploadProgressPolling();
    }
});