var DEFAULT_PADDING = 20;

var slider = document.getElementById('slider');
var sliderLabel = document.getElementById('slider-value');

var currTabId = (await chrome.tabs.query({active: true, currentWindow: true}))[0].id;

slider.addEventListener('input', function() {
    chrome.scripting.executeScript({
        target: {tabId: currTabId},
        func: remote_setHorizontalMargin,
        args: [this.value]
    });
    sliderLabel.textContent = this.value * 2 + '%';
});

slider.addEventListener('change', function() {
    chrome.scripting.executeScript({
        target: {tabId: currTabId},
        func: remote_setSavedPadding,
        args: [this.value]
    });
});

var savedPadding = await getSavedPadding();
var startPadding =  isNaN(parseInt(savedPadding)) ? DEFAULT_PADDING : savedPadding;
slider.value = startPadding;
slider.dispatchEvent(new Event('input'));

// Local functions

async function getSavedPadding() {
    var results = await chrome.scripting.executeScript({
        target: {tabId: currTabId},
        func: remote_getSavedPadding,
    });
    return results[0].result;
}

// Remote functions

function remote_setHorizontalMargin(value) {
    document.documentElement.style.paddingLeft = value.toString() + '%';
    document.documentElement.style.paddingRight = value.toString() + '%';
}

function remote_getSavedPadding() {
    return localStorage.getItem('narrowerExtention_pagePadding');
}

function remote_setSavedPadding(value) {
    localStorage.setItem('narrowerExtention_pagePadding', value);
}
