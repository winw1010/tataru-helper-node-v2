'use strict';

// communicate with main process
const { ipcRenderer } = require('electron');

// http
const http = require('http');

// system channel
const systemChannel = [
    '0039',
    '0839',
    '0003',
    '0038',
    '003C',
    '0048',
    '001D',
    '001C',
];

// text history
let textHistory = {};

// last id
let lastTimestamp = 0;

// create server
const server = http.createServer(function(request, response) {
    if (request.method === 'POST') {
        request.on('data', function(data) {
            dataProcess(data);
        });

        request.on('end', function() {
            response.writeHead(200, { 'Content-Type': 'text/html' });
            response.end('POST completed');
        });
    } else if (request.method === 'GET') {
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.end('GET is not supported');
    }
});

server.on('listening', () => {
    console.log('Opened server on', server.address());
});

server.on('error', (err) => {
    ipcRenderer.send('send-preload', 'show-notification', err.message);
    server.close();
});

// start server
function startServer() {
    const config = ipcRenderer.sendSync('load-config');
    const host = config.server.host;
    const port = config.server.port;

    server.close();
    server.listen(port, host);
}

// data process
function dataProcess(data) {
    try {
        const config = ipcRenderer.sendSync('load-config');
        let dialogData = JSON.parse(data.toString());

        if (dataCheck(dialogData)) {
            // check code
            if (dialogData.text !== '' && config.channel[dialogData.code]) {
                // history check
                if (textHistory[dialogData.text] && new Date().getTime() - textHistory[dialogData.text] < 5000) {
                    return;
                } else {
                    textHistory[dialogData.text] = new Date().getTime();
                }

                // set id and timestamp
                const timestamp = new Date().getTime();
                if (timestamp === lastTimestamp) {
                    dialogData.id = 'id' + (timestamp + 1);
                    dialogData.timestamp = timestamp + 1;
                } else {
                    dialogData.id = 'id' + timestamp;
                    dialogData.timestamp = timestamp;
                }
                lastTimestamp = dialogData.timestamp;

                // name check
                if (dialogData.name === '...') {
                    dialogData.name = '';
                }

                // system message process
                if (isSystemMessage(dialogData)) {
                    if (dialogData.name !== '') {
                        dialogData.text = dialogData.name + ': ' + dialogData.text;
                        dialogData.name = '';
                    }
                }

                // start correction
                ipcRenderer.send('send-preload', 'start-translation', dialogData, config.translation);

                // show data
                console.warn('data:', dialogData);
            } else {
                // show data
                console.log('data:', dialogData);
                console.log('Chat code is not in list.');
            }
        }
    } catch (error) {
        console.error(error);
    }
}

// dialog data check
function dataCheck(dialogData) {
    const names = Object.getOwnPropertyNames(dialogData);

    return names.includes('code') &&
        names.includes('playerName') &&
        names.includes('name') &&
        names.includes('text');
}

// channel check
function isSystemMessage(dialogData) {
    return systemChannel.includes(dialogData.code);
}

exports.startServer = startServer;