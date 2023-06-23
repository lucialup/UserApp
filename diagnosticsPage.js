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
        <title>Log Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
          }
          .table-container {
            height: calc(100vh - 40px);
            overflow-y: scroll;
            padding-top: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          th {
            background-color: #4CAF50;
            color: white;
            position: sticky;
            top: 0;
            z-index: 2;
          }
          .table-content {
            margin-top: 40px;
          }
          .filter-input {
            width: 100%;
            padding: 10px;
            box-sizing: border-box;
            border: none;
            border-bottom: 2px solid #4CAF50;
            font-size: 16px;
          }
          .filter-input:focus {
            outline: none;
          }
        </style>
        <script>
          function filterTable() {
            const input = document.getElementById('filterInput');
            const filter = input.value.toUpperCase();
            const rows = document.querySelectorAll('#logTable tbody tr');

            for (let i = 0; i < rows.length; i++) {
              const cells = rows[i].querySelectorAll('td');
              let shouldDisplay = false;

              for (let j = 0; j < cells.length; j++) {
                const cell = cells[j];
                if (cell) {
                  const cellText = cell.textContent || cell.innerText;
                  if (cellText.toUpperCase().indexOf(filter) > -1) {
                    shouldDisplay = true;
                    break;
                  }
                }
              }

              rows[i].style.display = shouldDisplay ? '' : 'none';
            }
          }
        </script>
      </head>
      <body>
        <h1>Log Report</h1>
        <div class="table-container">
          <input type="text" id="filterInput" onkeyup="filterTable()" placeholder="Filter logs..." class="filter-input">
          <div class="table-content">
            <table id="logTable">
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
                  <td>${log.path}</td>
                  <td>${log.flags}</td>
                  <td>${log.count}</td>
                  <td>${log.buf}</td>
                </tr>`;
    }

    html += `
              </tbody>
            </table>
          </div>
        </div>
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
