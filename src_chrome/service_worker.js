chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.type === 'getSavedPadding') {
            getSavedPadding(request.tabId)
                .then((result => sendResponse(result)));
            return true; // Indicate async response
        }
        else if (request.type === 'setPadding') {
            setPadding(request.tabId, request.value);
            badgeOn(request.tabId);

            // Setting slider to 0 disables the extension on the current page
            if (request.value != 0) {
                activeTabsAdd(request.tabId, request.value);
            }
            else {
                activeTabsRemove(request.tabId);
                badgeOff(request.tabId);
            }
        }
        else if (request.type === 'setSavedPadding') {
            setSavedPadding(request.tabId, request.value);
        }
    }
);

// Service Workers should register listeners synchronously, otherwise we will miss events.
// The listener will deregister itself later if it is not needed.
chrome.tabs.onUpdated.addListener(tabUpdatedListener);
chrome.tabs.onRemoved.addListener(tabRemovedListener);

// activeTab permission lets us modify other pages in the current tabs,
// as long as the user stays on the same domain.
// 
// We store a dict of (tabId, padding) of the active tabs.
// 
// Since Service Workers can be killed and later recreated,
// we can't rely on global vars and use chrome.storage instead.

async function activeTabsGet() {
    let result = await chrome.storage.session.get(['activeTabs']);
    return result['activeTabs'] || {};
}

async function activeTabsSet(activeTabs) {
    await chrome.storage.session.set({'activeTabs': activeTabs});
}

async function activeTabsAdd(tabId, padding) {
    let activeTabs = await activeTabsGet();

    if (Object.keys(activeTabs).length == 0) {
        chrome.tabs.onUpdated.addListener(tabUpdatedListener);
        chrome.tabs.onRemoved.addListener(tabRemovedListener);
    }

    activeTabs[tabId] = padding;
    activeTabsSet(activeTabs);
}

async function activeTabsRemove(tabId) {
    let activeTabs = await activeTabsGet();

    if (!(tabId in activeTabs))
        return;

    delete activeTabs[tabId];
    activeTabsSet(activeTabs);
}

async function tabUpdatedListener(tabId, changeInfo, tab) {
    let activeTabs = await activeTabsGet();

    if (Object.keys(activeTabs).length == 0) {
        // Don't waste CPU time if we don't have activeTabs
        chrome.tabs.onUpdated.removeListener(tabUpdatedListener);
        chrome.tabs.onRemoved.removeListener(tabRemovedListener);
        return;
    }

    if (!(tabId in activeTabs))
        return;
    if (changeInfo.status != 'loading')
        return;

    // Sadly the icon badge is cleared on reloads or navigation, so we need to
    // set it again. Setting it as early as possible stops most of the flickering.
    badgeOn(tabId);

    setPadding(tabId, activeTabs[tabId])
        .catch((error) => {
            activeTabsRemove(tabId)
            badgeOff(tabId);
        });
}

async function tabRemovedListener(tabId, changeInfo) {
    await activeTabsRemove(tabId);
}

// Badge stuff

function badgeOn(tabId) {
    chrome.action.setBadgeText({tabId: tabId, text: 'On'});
    chrome.action.setBadgeBackgroundColor({color: '#2c4e71'});
}

function badgeOff(tabId) {
    chrome.action.setBadgeText({tabId: tabId, text: ''});
}

// Local wrappers

function setPadding(tabId, value) {
    return chrome.scripting.executeScript({
        target: {tabId: tabId},
        func: remote_setPadding,
        args: [value],
    });
}

function getSavedPadding(tabId) {
    return chrome.scripting.executeScript({
        target: {tabId: tabId},
        func: remote_getSavedPadding,
    }).then(results => results[0].result);
}

function setSavedPadding(tabId, value) {
    return chrome.scripting.executeScript({
        target: {tabId: tabId},
        func: remote_setSavedPadding,
        args: [value],
    });
}

// Remote functions

function remote_setPadding(value) {
    document.documentElement.style.paddingLeft = value.toString() + '%';
    document.documentElement.style.paddingRight = value.toString() + '%';
}

function remote_getSavedPadding() {
    return localStorage.getItem('narrowerExtention_pagePadding');
}

function remote_setSavedPadding(value) {
    localStorage.setItem('narrowerExtention_pagePadding', value);
}
