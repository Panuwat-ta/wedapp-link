// Mobile menu toggle
document.getElementById('menuToggle').addEventListener('click', function() {
    document.getElementById('navLinks').classList.toggle('active');
});

let API_KEY, CLIENT_ID, FOLDER_ID;
let allFiles = [];
let cachedAllFiles = [];
let currentView = 'list'; // 'list' or 'grid'
let folderSelect, typeSelect; // DOM elements

// View toggle functionality
document.getElementById('listViewBtn').addEventListener('click', () => {
    if (currentView !== 'list') {
        currentView = 'list';
        document.querySelector('.list-view-container').style.display = 'block';
        document.getElementById('gridView').classList.remove('active');
        document.getElementById('listViewBtn').classList.add('active');
        document.getElementById('gridViewBtn').classList.remove('active');
        displayFiles(allFiles);
    }
});

document.getElementById('gridViewBtn').addEventListener('click', () => {
    if (currentView !== 'grid') {
        currentView = 'grid';
        document.querySelector('.list-view-container').style.display = 'none';
        document.getElementById('gridView').classList.add('active');
        document.getElementById('listViewBtn').classList.remove('active');
        document.getElementById('gridViewBtn').classList.add('active');
        displayFiles(allFiles);
    }
});

async function fetchEnvVariables() {
    try {
        const response = await fetch('/env');
        if (!response.ok) {
            throw new Error('Failed to fetch environment variables');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching environment variables:', error);
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize DOM elements
    folderSelect = document.getElementById('folderSelect');
    typeSelect = document.getElementById('typeSelect');
    
    // Check login status and update navbar
    const username = localStorage.getItem('username');
    const userEmail = localStorage.getItem('email');
    const loginLink = document.getElementById('loginLink');
    const logoutLink = document.getElementById('logoutLink');
    const navUsername = document.getElementById('navUsername');
    const navUserAvatar = document.getElementById('navUserAvatar');
    
    if (loginLink && logoutLink) {
        if (username) {
            loginLink.style.display = 'none';
            logoutLink.style.display = 'flex';
            
            // Update username in navbar
            if (navUsername) {
                navUsername.textContent = username;
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

    try {
        const env = await fetchEnvVariables();
        API_KEY = env.API_KEY;
        CLIENT_ID = env.CLIENT_ID;
        FOLDER_ID = env.FOLDER_ID;

        loadGapiClient();
    } catch (error) {
        console.error('Failed to initialize application:', error);
        showError(error);
    }

    // Check for ongoing downloads
    const downloadId = sessionStorage.getItem('currentDownloadId');
    if (downloadId) {
        showDownloadPrompt();
        startProgressPolling();
    }

    // Restore active downloads from localStorage
    const savedDownloads = localStorage.getItem('activeDownloads');
    if (savedDownloads) {
        const downloads = JSON.parse(savedDownloads);
        downloads.forEach(([id, download]) => activeDownloads.set(id, download));
        if (activeDownloads.size > 0) {
            showDownloadPrompt();
            startProgressPolling();
        }
    }
});

function loadGapiClient() {
    gapi.load('client', async () => {
        try {
            await gapi.client.init({
                apiKey: API_KEY,
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
            });
            listFiles();
        } catch (error) {
            console.error('Error initializing GAPI client:', error);
            showError('Failed to initialize Google API client.');
        }
    });
}

async function listFiles() {
    try {
        // Get all folders first
        const foldersResponse = await gapi.client.drive.files.list({
            q: `mimeType='application/vnd.google-apps.folder' and '${FOLDER_ID}' in parents`,
            fields: 'files(id, name)',
            orderBy: 'name'
        });

        // Populate folder select
        const folders = foldersResponse.result.files;
        folderSelect.innerHTML = '<option value="all">All Files</option>';
        folders.forEach(folder => {
            const option = document.createElement('option');
            option.value = folder.id;
            option.textContent = folder.name;
            folderSelect.appendChild(option);
        });

        // Get all files from root and subfolders
        let allFilesResponse = [];
        
        // Get files from root folder
        const rootFiles = await gapi.client.drive.files.list({
            q: `'${FOLDER_ID}' in parents`,
            fields: 'files(id, name, webViewLink, mimeType, modifiedTime, parents, size)',
            pageSize: 1000
        });
        allFilesResponse = allFilesResponse.concat(rootFiles.result.files);

        // Get files from each subfolder
        for (const folder of folders) {
            const folderFiles = await gapi.client.drive.files.list({
                q: `'${folder.id}' in parents`,
                fields: 'files(id, name, webViewLink, mimeType, modifiedTime, parents, size)',
                pageSize: 1000
            });
            allFilesResponse = allFilesResponse.concat(folderFiles.result.files);
        }

        // Update both allFiles and cachedAllFiles
        allFiles = allFilesResponse;
        cachedAllFiles = [...allFilesResponse];
        
        // Display all files
        displayFiles(allFiles);
    } catch (error) {
        showError(error);
    }
}

function showLoadingFiles() {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Loading files...</p>
        </div>
    `;
    document.getElementById('fileCount').textContent = 'Loading...';
}

function displayFiles(files) {
    setTimeout(() => {
        const selectedFolder = folderSelect.value;
        const selectedType = typeSelect.value || 'files';

        // Filter files based on selected folder and type
        let filteredFiles = files;
        
        if (selectedFolder !== 'all') {
            filteredFiles = files.filter(file => 
                file.parents && file.parents.includes(selectedFolder)
            );
        }

        if (selectedType !== 'all') {
            filteredFiles = filteredFiles.filter(file => {
                const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                return selectedType === 'folders' ? isFolder : !isFolder;
            });
        }

        // Sort files by modification time
        filteredFiles.sort((a, b) => 
            new Date(b.modifiedTime) - new Date(a.modifiedTime)
        );

        // Count folders and files
        const folderCount = filteredFiles.filter(file => 
            file.mimeType === 'application/vnd.google-apps.folder'
        ).length;
        const fileOnlyCount = filteredFiles.length - folderCount;
        
        document.getElementById('fileCount').textContent = `${folderCount} folders, ${fileOnlyCount} files`;

        if (currentView === 'list') {
            document.getElementById('fileList').style.display = 'block';
            document.getElementById('gridView').classList.remove('active');
            displayListView(filteredFiles);
        } else {
            document.getElementById('fileList').style.display = 'none';
            document.getElementById('gridView').classList.add('active');
            displayGridView(filteredFiles);
        }
    }, 300);
}

function displayListView(files) {
    const fileList = document.getElementById('fileList');
    
    if (files.length === 0) {
        fileList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <h3>No files found</h3>
                <p>This folder is currently empty</p>
            </div>
        `;
        return;
    }

    fileList.innerHTML = '';

    files.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';

        const fileName = document.createElement('div');
        fileName.className = 'file-name';
        fileName.innerHTML = `
            ${getFileIcon(file.mimeType)}
            <span>${file.name}</span>
        `;

        const fileOrigin = document.createElement('div');
        fileOrigin.className = 'file-origin';
        fileOrigin.textContent = getParentFolderName(file.parents);

        const fileDate = document.createElement('div');
        fileDate.className = 'file-date';
        fileDate.textContent = formatDate(file.modifiedTime);

        const fileSize = document.createElement('div');
        fileSize.className = 'file-size';
        fileSize.textContent = file.size ? formatFileSize(file.size) : 'N/A';

        const fileView = document.createElement('div');
        fileView.className = 'file-view';
        const viewLink = document.createElement('a');
        viewLink.href = file.webViewLink;
        viewLink.className = 'file-link';
        viewLink.target = '_blank';
        viewLink.innerHTML = '<i class="fas fa-external-link-alt"></i> View';
        fileView.appendChild(viewLink);

        const fileDownload = document.createElement('div');
        fileDownload.className = 'file-download-table';
        const downloadBtn = createDownloadButton(file);
        fileDownload.appendChild(downloadBtn);

        // Create button container for mobile
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'file-item-buttons';
        buttonContainer.appendChild(fileView);
        buttonContainer.appendChild(fileDownload);

        fileItem.appendChild(fileName);
        fileItem.appendChild(fileOrigin);
        fileItem.appendChild(fileDate);
        fileItem.appendChild(fileSize);
        fileItem.appendChild(buttonContainer);

        fileList.appendChild(fileItem);
    });
}

function displayGridView(files) {
    const gridContainer = document.getElementById('gridContainer');
    gridContainer.innerHTML = '';

    if (files.length === 0) {
        gridContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <h3>No files found</h3>
                <p>This folder is currently empty</p>
            </div>
        `;
        return;
    }

    files.forEach(file => {
        const gridItem = document.createElement('div');
        gridItem.className = 'grid-item';

        const itemIcon = document.createElement('div');
        itemIcon.className = 'grid-item-icon';
        itemIcon.innerHTML = getFileIcon(file.mimeType, true);

        const itemName = document.createElement('div');
        itemName.className = 'grid-item-name';
        itemName.textContent = file.name;

        const itemFolder = document.createElement('div');
        itemFolder.className = 'grid-item-folder';
        itemFolder.textContent = getParentFolderName(file.parents);

        const itemDate = document.createElement('div');
        itemDate.className = 'grid-item-date';
        itemDate.textContent = formatDate(file.modifiedTime);

        const itemSize = document.createElement('div');
        itemSize.className = 'grid-item-size';
        itemSize.textContent = file.size ? formatFileSize(file.size) : 'N/A';

        const itemActions = document.createElement('div');
        itemActions.className = 'grid-item-actions';

        const viewLink = document.createElement('a');
        viewLink.href = file.webViewLink;
        viewLink.className = 'file-link';
        viewLink.target = '_blank';
        viewLink.innerHTML = '<i class="fas fa-external-link-alt"></i> View';
        itemActions.appendChild(viewLink);

        const downloadBtn = createDownloadButton(file, true);
        itemActions.appendChild(downloadBtn);

        gridItem.appendChild(itemIcon);
        gridItem.appendChild(itemName);
        gridItem.appendChild(itemFolder);
        gridItem.appendChild(itemDate);
        gridItem.appendChild(itemSize);
        gridItem.appendChild(itemActions);

        gridContainer.appendChild(gridItem);
    });
}

function getFileIcon(mimeType, large = false) {
    if (mimeType.includes('application/vnd.google-apps.folder')) {
        return `<i class="fas fa-folder${large ? '' : ''}"></i>`;
    } else if (mimeType.includes('image/')) {
        return `<i class="fas fa-image${large ? '' : ''}"></i>`;
    } else if (mimeType.includes('video/')) {
        return `<i class="fas fa-video${large ? '' : ''}"></i>`;
    } else if (mimeType.includes('audio/')) {
        return `<i class="fas fa-music${large ? '' : ''}"></i>`;
    } else if (mimeType.includes('application/pdf')) {
        return `<i class="fas fa-file-pdf${large ? '' : ''}"></i>`;
    } else if (mimeType.includes('application/vnd.ms-excel') || 
               mimeType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
        return `<i class="fas fa-file-excel${large ? '' : ''}"></i>`;
    } else if (mimeType.includes('application/msword') || 
               mimeType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
        return `<i class="fas fa-file-word${large ? '' : ''}"></i>`;
    } else if (mimeType.includes('application/vnd.ms-powerpoint') || 
               mimeType.includes('application/vnd.openxmlformats-officedocument.presentationml.presentation')) {
        return `<i class="fas fa-file-powerpoint${large ? '' : ''}"></i>`;
    } else {
        return `<i class="fas fa-file${large ? '' : ''}"></i>`;
    }
}

function createDownloadButton(file, isGrid = false) {
    const downloadButton = document.createElement('a');
    
    if (file.mimeType === 'application/vnd.google-apps.folder') {
        downloadButton.className = 'file-download';
        downloadButton.href = '#';
        downloadButton.innerHTML = '<i class="fas fa-download"></i> Download';
        downloadButton.onclick = async (e) => {
            e.preventDefault();
            await downloadFolderAsZip(file);
        };
    } else if (file.mimeType.includes('application/vnd.google-apps.')) {
        let exportMimeType = null;
        if (file.mimeType === 'application/vnd.google-apps.document') {
            exportMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        } else if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
            exportMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        } else if (file.mimeType === 'application/vnd.google-apps.presentation') {
            exportMimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        }

        downloadButton.href = exportMimeType ? 
            `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=${exportMimeType}&key=${API_KEY}` :
            `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&key=${API_KEY}`;
        downloadButton.className = 'file-download';
        downloadButton.target = '_blank';
        downloadButton.download = file.name;
        downloadButton.innerHTML = '<i class="fas fa-download"></i> Download';
    } else {
        downloadButton.href = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&key=${API_KEY}`;
        downloadButton.className = 'file-download';
        downloadButton.target = '_blank';
        downloadButton.download = file.name;
        downloadButton.innerHTML = '<i class="fas fa-download"></i> Download';
    }

    return downloadButton;
}

function getParentFolderName(parents) {
    if (!parents || parents.length === 0) return 'Root';
    const folderId = parents[0];
    const folderOption = folderSelect.querySelector(`option[value="${folderId}"]`);
    return folderOption ? folderOption.textContent : 'Default folder';
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function formatFileSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    return (bytes / 1073741824).toFixed(1) + ' GB';
}

// Add new global variable for managing downloads
const activeDownloads = new Map();

// Modified downloadFolderAsZip function
async function downloadFolderAsZip(folder) {
    try {
        const response = await fetch('/start-folder-download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                folderId: folder.id,
                folderName: folder.name
            })
        });
        
        if (!response.ok) throw new Error('Failed to start download');
        const data = await response.json();
        
        // Add to active downloads
        activeDownloads.set(data.downloadId, {
            id: data.downloadId,
            folderName: folder.name,
            progress: 0,
            status: 'preparing',
            timestamp: Date.now()
        });

        // Save to localStorage
        localStorage.setItem('activeDownloads', JSON.stringify(Array.from(activeDownloads.entries())));
        
        showDownloadPrompt();
        startProgressPolling();
    } catch (error) {
        console.error('Error starting download:', error);
    }
}

// Modified showDownloadPrompt function
function showDownloadPrompt() {
    let promptBox = document.getElementById('downloadPrompt');
    const wasMinimized = promptBox?.classList.contains('minimized');
    
    if (!promptBox) {
        promptBox = document.createElement('div');
        promptBox.id = 'downloadPrompt';
        promptBox.className = 'download-prompt';
        document.body.appendChild(promptBox);
    }

    const downloads = Array.from(activeDownloads.values())
        .sort((a, b) => b.timestamp - a.timestamp);

    promptBox.innerHTML = `
        <div class="download-header">
            <span class="download-title">Downloads (${downloads.length})</span>
            <div class="download-buttons">
                <button class="download-button minimize-btn">
                    <i class="fas fa-chevron-down"></i>
                </button>
                <button class="download-button close-btn" onclick="cancelAllDownloads ()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
        <div class="download-content">
            <div class="download-queue">
                ${downloads.map(download => `
                    <div class="download-item" data-id="${download.id}">
                        <div class="download-item-header">
                            <span class="download-item-name">${download.folderName}.zip</span>
                            <button class="download-item-cancel" onclick="cancelDownload('${download.id}')">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="download-item-progress">
                            <div class="download-item-progress-bar" style="width: ${download.progress}%"></div>
                        </div>
                        <div class="download-item-status">
                            ${download.status === 'preparing' ? 'Preparing...' : 
                              download.status === 'completed' ? 'Completed' : 
                              `${download.progress}%`}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // Add event listeners
    promptBox.querySelector('.minimize-btn').addEventListener('click', () => {
        promptBox.classList.toggle('minimized');
    });

    promptBox.querySelector('.close-btn').addEventListener('click', () => {
        promptBox.remove();
    });

    if (wasMinimized) {
        promptBox.classList.add('minimized');
    }
}

// Add new function to cancel single download
async function cancelDownload(downloadId) {
    try {
        await fetch(`/cancel-download/${downloadId}`, { method: 'POST' });
        activeDownloads.delete(downloadId);
        localStorage.setItem('activeDownloads', JSON.stringify(Array.from(activeDownloads.entries())));
        showDownloadPrompt();
    } catch (error) {
        console.error('Error canceling download:', error);
    }
}

// Add new function to cancel all downloads
async function cancelAllDownloads() {
    try {
        const promises = Array.from(activeDownloads.keys()).map(downloadId =>
            fetch(`/cancel-download/${downloadId}`, { method: 'POST' })
        );
        await Promise.all(promises);
        activeDownloads.clear();
        localStorage.removeItem('activeDownloads');
        const promptBox = document.getElementById('downloadPrompt');
        if (promptBox) promptBox.remove();
    } catch (error) {
        console.error('Error canceling all downloads:', error);
    }
}

// Modified startProgressPolling function
function startProgressPolling() {
    if (activeDownloads.size === 0) return;

    const pollInterval = setInterval(async () => {
        let hasActiveDownloads = false;

        for (const [downloadId, download] of activeDownloads) {
            try {
                const response = await fetch(`/download-progress/${downloadId}`);
                const data = await response.json();

                if (data.error) {
                    activeDownloads.delete(downloadId);
                    continue;
                }

                if (data.completed) {
                    if (data.downloadUrl) {
                        const link = document.createElement('a');
                        link.href = data.downloadUrl;
                        link.download = `${download.folderName}.zip`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }
                    activeDownloads.delete(downloadId);
                } else {
                    download.progress = data.progress;
                    download.status = data.status;
                    hasActiveDownloads = true;
                }
            } catch (error) {
                console.error('Error polling download progress:', error);
            }
        }

        localStorage.setItem('activeDownloads', JSON.stringify(Array.from(activeDownloads.entries())));
        
        if (hasActiveDownloads) {
            showDownloadPrompt();
        } else {
            clearInterval(pollInterval);
            const promptBox = document.getElementById('downloadPrompt');
            if (promptBox) promptBox.remove();
        }
    }, 1000);
}
function showError(error) {
    console.error('Error:', error);
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Error loading files</h3>
            <p>${error.message || 'An unknown error occurred'}</p>
            <button onclick="location.reload()" class="retry-button">
                <i class="fas fa-sync-alt"></i> Try Again
            </button>
        </div>
    `;
    document.getElementById('fileCount').textContent = 'Error';
}

// Add event listeners for filters
const searchBox = document.getElementById('searchBox');

// Add event listeners
document.addEventListener('DOMContentLoaded', () => {
    if (folderSelect) {
        folderSelect.addEventListener('change', async () => {
            showLoadingFiles();
            const selectedFolder = folderSelect.value;
            if (selectedFolder === 'all') {
                allFiles = [...cachedAllFiles];
                displayFiles(allFiles);
                return;
            }

            const query = `'${selectedFolder}' in parents`;
            
            try {
                const response = await gapi.client.drive.files.list({
                    q: query,
                    fields: 'files(id, name, webViewLink, mimeType, modifiedTime, parents, size)',
                    orderBy: 'name'
                });
                allFiles = response.result.files;
                displayFiles(allFiles);
            } catch (error) {
                console.error('Error fetching folder files:', error);
                showError(error);
            }
        });
    }

    if (typeSelect) {
        typeSelect.addEventListener('change', () => {
            showLoadingFiles();
            displayFiles(allFiles);
        });
    }

    if (searchBox) {
        searchBox.addEventListener('input', () => {
            const searchTerm = searchBox.value.toLowerCase();
            if (searchTerm === '') {
                displayFiles(allFiles);
                return;
            }

            const filteredFiles = allFiles.filter(file => 
                file.name.toLowerCase().includes(searchTerm)
            );
            displayFiles(filteredFiles);
        });
    }
});