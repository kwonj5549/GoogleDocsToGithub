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

        const selectedFile = document.getElementById('fileDropdown').value;

        const docId = await getGoogleDocId();

        const docContent = await getGoogleDocContent(docId);
        await editGitHubFile('EnglProject2', selectedFile, docContent);
    } catch (error) {
        console.error('Error editing GitHub file:', error);
    }
});

async function getGitHubFiles(repo, path) {
    const token = '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'; // Replace with your GitHub token
    const url = `https://api.github.com/repos/kwonj5549/${repo}/contents/${path}`;

    const response = await fetch(url, {
        headers: {
            'Authorization': `token ${token}`,
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

async function getGoogleDocId() {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({type: 'getDocId'}, response => {
            if(response.docId) {
                console.log('Google Doc ID:', response.docId); // Logging Doc ID to console
                resolve(response.docId);
            } else {
                reject('Doc ID not found');
            }
        });
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
    const token = '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'; // Replace with your GitHub token
    const url = `https://api.github.com/repos/kwonj5549/${repo}/contents/${filePath}`;

    // Construct request for GitHub API
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: 'Commit message', // Replace with your commit message
            content: btoa(content), // GitHub requires the content to be base64 encoded
        }),
    });

    const data = await response.json();
    // Handle the response, check for errors, etc.
}

