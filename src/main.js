'use strict';

// electron
const { app, BrowserWindow } = require('electron');

// app module
const appModule = require('./module/system/app-module');

// window module
const windowModule = require('./module/system/window-module');

// when ready
app.whenReady().then(() => {
    // start app
    appModule.startApp();

    // create index window
    windowModule.createWindow('index');
    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) windowModule.createWindow('index');
    });
});

// on window all closed
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});