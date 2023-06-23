const gi = require('node-gtk');
const Gtk = gi.require('Gtk', '3.0');
const execSync = require('child_process').execSync;
const fs = require('fs');
const readline = require('readline');

function parseLogs(logsString) {
    const lines = logsString.split('\n');
    const logPattern = /\[\s*(\d+\.\d+)\] Syscall: (\w+), FD: (-?\d+)(?:,\s+Filename: (.*?))?(?:,\s+Path: (.*?))?(?:,\s+Count: (\d+))?(?:,\s+Buf: (.*?))?(?:,\s+Flags: (\d+))?, PID: (\d+)/;

    const parsedLogs = [];
    for (let line of lines) {
        const match = line.match(logPattern);
        if (match) {
            const [, timestamp, syscall, fd, filename, path, count, buf, flags, pid] = match;
            const log = {
                timestamp: parseFloat(timestamp),
                syscall,
                fd: parseInt(fd),
                filename: filename || '-',
                path: path || '-',
                count: count ? parseInt(count) : '-',
                buf: buf || '-',
                flags: flags ? parseInt(flags) : '-',
                pid: parseInt(pid),
            };
            parsedLogs.push(log);
        }
    }
    return parsedLogs;
}


function generateHTMLTable(logs) {
    let html = `
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Log Report</title>
        <style>
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid black;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #4CAF50;
            color: white;
          }
        </style>
      </head>
      <body>
        <h1>Log Report</h1>
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Syscall</th>
              <th>FD</th>
              <th>PID</th>
              <th>Filename</th>
              <th>Path</th>
              <th>Flags</th>
              <th>Count</th>
              <th>Buf</th>
            </tr>
          </thead>
          <tbody>`;

    for (const log of logs) {
        html += `
      <tr>
        <td>${log.timestamp}</td>
        <td>${log.syscall}</td>
        <td>${log.fd}</td>
        <td>${log.pid}</td>
        <td>${log.filename}</td>
        <td>${log.path || ''}</td>
        <td>${log.flags}</td>
        <td>${log.count}</td>
        <td>${log.buf || ''}</td>
      </tr>`;
    }

    html += `
          </tbody>
        </table>
      </body>
    </html>`;

    return html;
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

        const logsString = fs.readFileSync('logs.txt', 'utf8');
        const logs = parseLogs(logsString);
        const html = generateHTMLTable(logs);

        fs.writeFileSync('report.html', html);
        execSync('open report.html'); // Open the report file
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
