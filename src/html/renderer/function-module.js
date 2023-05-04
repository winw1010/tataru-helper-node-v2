'use strict';
/* eslint-disable */

// get config
function getConfig() {
    return window?.myAPI?.getConfig();
}

// drag window
function dragWindow(clientX, clientY, windowWidth, windowHeight) {
    window?.myAPI?.dragWindow(clientX, clientY, windowWidth, windowHeight);
}

// on document ready
function onDocumentReady(callback = () => {}) {
    window.addEventListener('DOMContentLoaded', () => {
        callback();
    });
}