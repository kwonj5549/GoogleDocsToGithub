// On popup load
const GITHUB_TOKEN = ''; // Replace with your GitHub token
//das

// On popup load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const fileList = await getGitHubFiles('EnglProject2', 'src/store');
        populateFileDropdown(fileList);
    } catch (error) {
        console.error('Error fetching GitHub files:', error);
    }
});

document.getElementById('editButton').addEventListener('click', async () => {
    try {
        // Get the current active tab in the focused window
        chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
            if (!tabs[0]) {
                console.error('No active tab found');
                return;
            }

            const tab = tabs[0];
            const docId = getGoogleDocIdFromUrl(tab.url); // Directly extract docId from URL

            if (!docId) {
                console.error('Cannot extract Doc ID from the active tab URL');
                return;
            }

            // Proceed with the rest of your code
            const selectedFile = document.getElementById('fileDropdown').value;
            const docContent = await getGoogleDocContent(docId);
            await editGitHubFile('EnglProject2', selectedFile, docContent);
        });
    } catch (error) {
        console.error('Error editing GitHub file:', error);
    }
});
function unicodeToBase64(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function toSolidBytes(match, p1) {
        return String.fromCharCode('0x' + p1);
    }));
}
function getGoogleDocIdFromUrl(url) {
    const match = url.match(/\/d\/(.*?)(?:[\/?]|$)/);
    return match ? match[1] : null;
}

async function getGitHubFiles(repo, path) {
    const url = `https://api.github.com/repos/kwonj5549/${repo}/contents/${path}`;

    const response = await fetch(url, {
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Content-Type': 'application/json',
        },
    });

    // Check if the response is successful (status code 2xx)
    if (!response.ok) {
        console.error('GitHub API request failed:', response);
        throw new Error('GitHub API request failed with status: ' + response.status);
    }

    const data = await response.json();

    // Check if data is an array (as expected for a directory)
    if (!Array.isArray(data)) {
        console.error('Unexpected GitHub API response:', data);
        throw new Error('Unexpected GitHub API response');
    }

    // Filter out items that are not files (like subdirectories) and return file names
    return data.filter(item => item.type === 'file').map(file => file.name);
}

function populateFileDropdown(files) {
    const dropdown = document.getElementById('fileDropdown');
    files.forEach(file => {
        const option = document.createElement('option');
        option.value = file;
        option.text = file;
        dropdown.add(option);
    });
}


function getAuthToken() {
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ 'interactive': true }, function(token) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(token);
            }
        });
    });
}

async function getGoogleDocContent(docId) {
    try {
        const token = await getAuthToken();
        if (!token) throw new Error('Failed to retrieve auth token');

        const url = `https://docs.googleapis.com/v1/documents/${docId}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch Google Doc content');
        }

        const data = await response.json();
        return extractContentFromData(data);
    } catch (error) {
        console.error(error);
        // Handle error appropriately
    }
}

function extractContentFromData(data) {
    if (!data || !data.body || !data.body.content) {
        throw new Error('Invalid Google Doc data structure');
    }

    let textContent = '';

    data.body.content.forEach(contentElement => {
        if (contentElement.paragraph) {
            contentElement.paragraph.elements.forEach(paragraphElement => {
                if (paragraphElement.textRun) {
                    textContent += paragraphElement.textRun.content;
                }
            });
        }
    });
    console.log(textContent);
    return textContent;
}

async function editGitHubFile(repo, filePath, content) {
    const url = `https://api.github.com/repos/kwonj5549/${repo}/contents/src/store/${filePath}`;

    // First, retrieve the file to get its current sha
    let fileData;
    try {
        const getFileResponse = await fetch(url, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
            },
        });
        fileData = await getFileResponse.json();
        if (!getFileResponse.ok) {
            console.error('Error retrieving file data:', fileData);
            throw new Error('Error retrieving file data');
        }
    } catch (err) {
        console.error('Error retrieving file data:', err);
        throw err;
    }

    // Then, use the sha to update the file
    try {
        const updateFileResponse = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'Commit message', // Replace with your commit message
                content: unicodeToBase64(content), // GitHub requires the content to be base64 encoded
                sha: fileData.sha, // Include the sha of the file retrieved earlier
            }),
        });
        const updateData = await updateFileResponse.json();
        if (!updateFileResponse.ok) {
            console.error('Error updating file:', updateData);
            throw new Error('Error updating file');
        }
    } catch (err) {
        console.error('Error updating file:', err);
        throw err;
    }
}