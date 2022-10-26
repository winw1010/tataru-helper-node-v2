'use strict';

// electron
const { contextBridge, ipcRenderer } = require('electron');

// log location
const logPath = ipcRenderer.sendSync('get-user-data-path', 'log');

// DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
    setContextBridge();
    setIPC();

    setView();
    setEvent();
    setButton();
});

// set context bridge
function setContextBridge() {
    contextBridge.exposeInMainWorld('myAPI', {
        ipcRendererSend: (channel, ...args) => {
            ipcRenderer.send(channel, ...args);
        },
        ipcRendererSendSync: (channel, ...args) => {
            return ipcRenderer.sendSync(channel, ...args);
        },
        ipcRendererInvoke: (channel, ...args) => {
            return ipcRenderer.invoke(channel, ...args);
        },
    });
}

// set IPC
function setIPC() {
    // change UI text
    ipcRenderer.on('change-ui-text', () => {
        document.dispatchEvent(new CustomEvent('change-ui-text'));
    });
}

// set view
function setView() {
    readLogList();
}

// set enevt
function setEvent() {}

// set button
function setButton() {
    // read
    document.getElementById('button_read_log').onclick = () => {
        const file = document.getElementById('select_log').value;
        readLog(file);
    };

    // view
    document.getElementById('button_view_log').onclick = () => {
        try {
            ipcRenderer.send('execute-command', `start "" "${logPath}"`);
        } catch (error) {
            console.log(error);
        }
    };

    // close
    document.getElementById('img_button_close').onclick = () => {
        ipcRenderer.send('close-window');
    };
}

function readLogList() {
    try {
        const logs = ipcRenderer.sendSync('directory-reader', logPath);

        if (logs.length > 0) {
            const select = document.getElementById('select_log');

            let innerHTML = '';
            for (let index = 0; index < logs.length; index++) {
                const log = logs[index];
                innerHTML += `<option value="${log}">${log}</option>`;
            }

            select.innerHTML = innerHTML;
            select.value = logs[logs.length - 1];
        }
    } catch (error) {
        console.log(error);
    }
}

function readLog(fileName) {
    if (fileName === 'none') {
        ipcRenderer.send('send-index', 'show-notification', '檔案不存在');
        return;
    }

    try {
        const fileLocation = ipcRenderer.sendSync('get-path', logPath, fileName);
        const log = ipcRenderer.sendSync('json-reader', fileLocation, false);
        const logNames = Object.getOwnPropertyNames(log);

        if (logNames.length > 0) {
            ipcRenderer.send('send-index', 'clear-dialog');

            for (let index = 0; index < logNames.length; index++) {
                const logElement = log[logNames[index]];

                if (logElement.code !== 'FFFF') {
                    ipcRenderer.send(
                        'send-index',
                        'append-dialog',
                        logElement.id,
                        logElement.code,
                        logElement.translated_name,
                        logElement.translated_text
                    );
                }
            }

            ipcRenderer.send('send-index', 'move-to-bottom');
        }
    } catch (error) {
        console.log(error);
        ipcRenderer.send('send-index', 'show-notification', '無法讀取檔案');
    }
}
