// Mobile menu toggle
document.getElementById('menuToggle').addEventListener('click', function() {
    document.getElementById('navLinks').classList.toggle('active');
});

let API_KEY, CLIENT_ID, FOLDER_ID;

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
        const env = await fetchEnvVariables();
        API_KEY = env.API_KEY;
        CLIENT_ID = env.CLIENT_ID;
        FOLDER_ID = env.FOLDER_ID;

        // Initialize the Google API client
        loadGapiClient();
    } catch (error) {
        console.error('Failed to initialize application:', error);
    }
});

function loadGapiClient() {
    gapi.load('client', async () => {
        try {
            await gapi.client.init({
                apiKey: API_KEY,
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
            });
            listFiles();
        } catch (error) {
            showError(error);
        }
    });
}

async function listFiles() {
    try {
        const response = await gapi.client.drive.files.list({
            q: `'${FOLDER_ID}' in parents`,
            fields: 'files(id, name, webViewLink, mimeType)',
            pageSize: 50,
            orderBy: 'name'
        });

        console.log('API Response:', response);

        const files = response.result.files;
        const fileList = document.getElementById('fileList');
        const fileCount = document.getElementById('fileCount');

        fileList.innerHTML = '';

        if (files && files.length > 0) {
            fileCount.textContent = `${files.length} files`;
            
            files.forEach(file => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';

                const fileInfo = document.createElement('div');
                fileInfo.className = 'file-info';

                const fileIcon = document.createElement('div');
                fileIcon.className = 'file-icon';
                
                // Set icon based on file type
                if (file.mimeType.includes('application/vnd.google-apps.folder')) {
                    fileIcon.innerHTML = '<i class="fas fa-folder"></i>';
                } else if (file.mimeType.includes('image/')) {
                    fileIcon.innerHTML = '<i class="fas fa-image"></i>';
                } else if (file.mimeType.includes('video/')) {
                    fileIcon.innerHTML = '<i class="fas fa-video"></i>';
                } else if (file.mimeType.includes('audio/')) {
                    fileIcon.innerHTML = '<i class="fas fa-music"></i>';
                } else if (file.mimeType.includes('application/pdf')) {
                    fileIcon.innerHTML = '<i class="fas fa-file-pdf"></i>';
                } else if (file.mimeType.includes('application/vnd.ms-excel') || 
                           file.mimeType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
                    fileIcon.innerHTML = '<i class="fas fa-file-excel"></i>';
                } else if (file.mimeType.includes('application/msword') || 
                           file.mimeType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
                    fileIcon.innerHTML = '<i class="fas fa-file-word"></i>';
                } else if (file.mimeType.includes('application/vnd.ms-powerpoint') || 
                           file.mimeType.includes('application/vnd.openxmlformats-officedocument.presentationml.presentation')) {
                    fileIcon.innerHTML = '<i class="fas fa-file-powerpoint"></i>';
                } else {
                    fileIcon.innerHTML = '<i class="fas fa-file"></i>';
                }

                const fileName = document.createElement('div');
                fileName.className = 'file-name';
                fileName.textContent = file.name;

                const fileLink = document.createElement('a');
                fileLink.href = file.webViewLink;
                fileLink.textContent = 'View';
                fileLink.className = 'file-link';
                fileLink.target = '_blank';
                fileLink.innerHTML = 'View <i class="fas fa-external-link-alt"></i>';

                const downloadButton = document.createElement('a');
                if (file.mimeType.includes('application/vnd.google-apps.')) {
                    // Use export endpoint for Google Docs Editors files
                    let exportMimeType = null;
                    if (file.mimeType === 'application/vnd.google-apps.document') {
                        exportMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                    } else if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
                        exportMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                    } else if (file.mimeType === 'application/vnd.google-apps.presentation') {
                        exportMimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
                    }

                    if (exportMimeType) {
                        downloadButton.href = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=${exportMimeType}&key=${API_KEY}`;
                        downloadButton.className = 'file-download';
                        downloadButton.target = '_blank';
                        downloadButton.download = file.name;
                        downloadButton.innerHTML = 'Download <i class="fas fa-download"></i>';
                    } else {
                        // Unsupported Docs Editors file type
                        downloadButton.href = '#';
                        downloadButton.className = 'file-download disabled';
                        downloadButton.innerHTML = 'Not Available'; 
                        downloadButton.style.cursor = 'not-allowed';
                        downloadButton.onclick = (e) => e.preventDefault();
                    }
                } else {
                    // Use direct download for binary files
                    downloadButton.href = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&key=${API_KEY}`;
                    downloadButton.className = 'file-download';
                    downloadButton.target = '_blank';
                    downloadButton.download = file.name;
                    downloadButton.innerHTML = 'Download <i class="fas fa-download"></i>';
                }

                fileInfo.appendChild(fileIcon);
                fileInfo.appendChild(fileName);
                fileItem.appendChild(fileInfo);
                fileItem.appendChild(fileLink);
                fileItem.appendChild(downloadButton);
                fileList.appendChild(fileItem);
            });
        } else {
            fileCount.textContent = '0 files';
            fileList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <h3>No files found</h3>
                    <p>This folder is currently empty</p>
                </div>
            `;
        }
    } catch (error) {
        showError(error);
    }
}

function showError(error) {
    console.error('Error:', error);
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Error loading files</h3>
            <p>${error.message || 'An unknown error occurred'}</p>
            <button onclick="location.reload()" style="margin-top: 15px; padding: 8px 15px; background-color: var(--primary-color); color: white; border: none; border-radius: 5px; cursor: pointer;">
                <i class="fas fa-sync-alt"></i> Try Again
            </button>
        </div>
    `;
    document.getElementById('fileCount').textContent = 'Error';
}
