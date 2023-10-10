const docId = getGoogleDocIdFromUrl(window.location.href);

function getGoogleDocIdFromUrl(url) {
    const match = url.match(/\/d\/(.*?)(?:[\/?]|$)/);
    return match ? match[1] : null;
}

chrome.runtime.sendMessage({ type: 'setDocId', docId: docId });