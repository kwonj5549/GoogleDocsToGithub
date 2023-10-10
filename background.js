let currentDocId = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'setDocId') {
        currentDocId = request.docId;
    } else if (request.type === 'getDocId') {
        sendResponse({ docId: currentDocId });
    }
});
chrome.action.onClicked.addListener(function() {
    chrome.tabs.create({url: 'index.html'});
});