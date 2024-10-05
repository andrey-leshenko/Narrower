let DEFAULT_PADDING = 20;

let slider = document.getElementById('slider');
let sliderLabel = document.getElementById('slider-value');

let currTabId = (await chrome.tabs.query({active: true, currentWindow: true}))[0].id;

slider.addEventListener('input', function() {
    sliderLabel.textContent = this.value * 2 + '%';
    chrome.runtime.sendMessage({type: 'setPadding', value: this.value, tabId: currTabId});
});

slider.addEventListener('change', function() {
    chrome.runtime.sendMessage({type: 'setSavedPadding', value: this.value, tabId: currTabId});
});

let savedPadding = await chrome.runtime.sendMessage({type: 'getSavedPadding', tabId: currTabId});
let startPadding =  isNaN(parseInt(savedPadding)) ? DEFAULT_PADDING : savedPadding;
slider.value = startPadding;
slider.dispatchEvent(new Event('input'));
