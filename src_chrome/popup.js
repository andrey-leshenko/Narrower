var DEFAULT_PADDING = 20;

var slider = document.getElementById('slider');
var sliderLabel = document.getElementById('slider-value');

function setSliderLabel(value) {
    sliderLabel.textContent = value * 2 + '%';
}

function setHorizontalMargin(value) {
    chrome.tabs.executeScript(
    {code:
     'document.documentElement.style.paddingLeft="' + value + '%";'
     + 'document.documentElement.style.paddingRight="' + value + '%";'
    });
}

chrome.tabs.executeScript(
    {code: 'localStorage.getItem("narrowerExtention_pagePadding")'},
    function(result) {
    var startPadding = isNaN(parseInt(result)) ? DEFAULT_PADDING : result;
    
    setHorizontalMargin(startPadding);
    
    slider.value = startPadding;
    setSliderLabel(startPadding);
    });

slider.addEventListener('input', function() {
    setHorizontalMargin(this.value);
    setSliderLabel(this.value);
});

slider.addEventListener('change', function() {
    chrome.tabs.executeScript(
    {code:
     'localStorage.setItem("narrowerExtention_pagePadding", ' + this.value + ')'
    });
});
