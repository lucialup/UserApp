const express = require('express');
const https = require('https');
const fs = require('fs');
const { spawn } = require('child_process');

const key = fs.readFileSync('resources/key.pem', 'utf-8');
const cert = fs.readFileSync('resources/cert.pem', 'utf-8');

const credentials = { key, cert };

const app = express();
const port = 3000;

app.use(express.json());

app.post('/startEmulator', (req, res) => {
    let emulatorPath = req.body.emulatorPath;
    let kernelImagePath = req.body.kernelImagePath;

    if (!emulatorPath) {
        return res.status(400).send('Invalid path');
    }

    const command = '/bin/bash';
    const args = [
        '-c',
        `cd ${emulatorPath} && ./emulator -verbose @tutorial1 -kernel ${kernelImagePath} -show-kernel -qemu -enable-kvm -read-only`
    ];
    emulatorProc = spawn('gnome-terminal', ['--', command, ...args]);

    res.send('Emulator started');
});

app.post('/stopEmulator', (req, res) => {
    spawn('pkill', ['-f', 'emulator']);
    res.send('Emulator stopped');
});

const httpsServer = https.createServer(credentials, app);
httpsServer.listen(port, () => console.log(`HTTPS Server running on port ${port}`));