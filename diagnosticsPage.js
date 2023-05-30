const gi = require('node-gtk');
const Gtk = gi.require('Gtk', '3.0');
const execSync = require('child_process').execSync;
const fs = require('fs');
const { generateHTML } = require('./generateReport');

function parseLogs(logsString) {
    const lines = logsString.split('\n');
    const logPattern = /\[(\s*\d+\.\d+)\]\s+Syscall:\s+(\w+),\s+File descriptor:\s+(\d+)(?:,\s+Path:\s+(.*?))?(?:,\s+Count:\s+(\d+))?(?:,\s+Buf:\s+(.*?))?,\s+Process ID:\s+(\d+)/;

    const parsedLogs = [];
    for (let line of lines) {
        const match = line.match(logPattern);
        if (match) {
            const log = {
                timestamp: match[1].trim(),
                syscall: match[2].trim(),
                fd: match[3].trim(),
                path: match[4] ? match[4].trim() : undefined,
                count: match[5] ? match[5].trim() : undefined,
                buf: match[6] ? match[6].trim() : undefined,
                pid: match[7].trim(),
            };
            parsedLogs.push(log);
        }
    }
    return parsedLogs;
}


function createDiagnosticsPage(win) {
    let apkPath = '';
    let logProc = null;

    const page = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });
    const vbox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });
    const fetchLogs = Gtk.Button.new();

    page.on('destroy', () => {
        if (logProc) {
            logProc.kill();
        }
    });
    page.on('delete-event', () => false);

    fetchLogs.setLabel('Fetch Logs');
    fetchLogs.on('clicked', () => {
        execSync('adb shell dmesg > logs.txt');

        const logs = parseLogs(fs.readFileSync('logs.txt', 'utf-8'));
        const html = generateHTML(logs);

        fs.writeFileSync('report.html', html);
        // execSync('open report.html'); // Open the report file
    });

    const scanLogs = Gtk.Button.new();
    scanLogs.setLabel('Scan Logs for Malware');
    scanLogs.on('clicked', () => {
        try {
            const stdout = execSync('/usr/local/bin/yara image_malware.yara logs.txt');
            if (stdout.toString()) {
                console.log(`Possible malware behavior detected:\n${stdout}`);
                // Show a dialog or alert in the UI here
            } else {
                console.log('No malware behavior detected');
                // Show a dialog or alert in the UI here
            }
        } catch (error) {
            console.error(`Error: ${error}`);
        }
    });

    page.add(vbox);
    vbox.add(fetchLogs);
    vbox.add(scanLogs);
    return page;
}

module.exports = { createDiagnosticsPage };
