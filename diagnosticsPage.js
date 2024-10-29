const gi = require('node-gtk');
const Gdk = gi.require('Gdk', '3.0');
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




let cssProvider = new Gtk.CssProvider();

cssProvider.loadFromData(`
    dialog content label {
        font-size: 12pt;
        padding: 20px;
    }
`);

Gtk.StyleContext.addProviderForScreen(
    Gdk.Screen.getDefault(),
    cssProvider,
    Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
);

function showDialog(win, message) {
    let dialog = new Gtk.Dialog();

    // Set properties separately
    dialog.setTransientFor(win);
    dialog.setModal(true);
    dialog.setTitle("Message");

    let label = new Gtk.Label({label: message});
    let contentArea = dialog.getContentArea();
    contentArea.add(label);

    dialog.addButton("OK", Gtk.ResponseType.OK);

    dialog.showAll();
    dialog.run();
    dialog.destroy();
}

function createDiagnosticsPage(win) {
    const yaraPathEntry = new Gtk.Entry();
    const browseYaraPathBtn = Gtk.Button.newWithLabel('Browse .yara file path');
    const yaraPath = '/usr/local/bin/yara';
    let logProc = null;

    const page = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });
    const vbox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });
    const fetchLogs = Gtk.Button.new();

    const browseYaraPathIcon = Gtk.Image.newFromIconName('folder-open', Gtk.IconSize.BUTTON);
    browseYaraPathBtn.setImage(browseYaraPathIcon);
    browseYaraPathBtn.setTooltipText('Select the .yara file');
    browseYaraPathBtn.on('clicked', () => {
        let dialog = new Gtk.FileChooserDialog();
        dialog.setTitle('Select .yara file');
        dialog.setTransientFor(win);
        dialog.setAction(Gtk.FileChooserAction.OPEN); // Use OPEN for files, SELECT_FOLDER for folders
        dialog.addButton('Cancel', Gtk.ResponseType.CANCEL);
        dialog.addButton('Select', Gtk.ResponseType.OK);

        // You can add a file filter to only show .yara files (optional)
        let filter = Gtk.FileFilter.new();
        filter.addPattern('*.yara');
        dialog.setFilter(filter);

        let response = dialog.run();
        if (response === Gtk.ResponseType.OK) {
            let yaraPath = dialog.getFilename();
            yaraPathEntry.setText(yaraPath);
        }
        dialog.destroy();
    });

    const yaraBox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 10});
    yaraBox.packStart(browseYaraPathBtn, false, false, 0);
    yaraBox.packStart(yaraPathEntry, true, true, 0);

    page.on('destroy', () => {
        if (logProc) {
            logProc.kill();
        }
    });
    page.on('delete-event', () => false);

    fetchLogs.setLabel('Fetch Logs');
    fetchLogs.on('clicked', () => {
        execSync('adb shell dmesg > logs.txt');

        const logsString = fs.readFileSync('logs.txt', 'ascii');
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
                showDialog(win,`Possible malware behavior detected:\n${stdout}`)
            } else {
                console.log('No malware behavior detected');
                showDialog(win,'No malware behavior detected')
            }
        } catch (error) {
            console.error(`Error: ${error}`);
            showDialog(win,`Error: ${error}`)
        }
    });

    page.packStart(vbox, true, true, 0);
    vbox.packStart(fetchLogs, false, false, 0);
    vbox.packStart(yaraBox, false, false, 0);
    vbox.packStart(scanLogs, false, false, 0);
    return page;
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

            updateColumnWidths();
          }

          function updateColumnWidths() {
            const table = document.getElementById('logTable');
            const rows = table.querySelectorAll('tbody tr');
            const firstRow = rows[0];

            if (firstRow) {
              const cells = firstRow.querySelectorAll('td');
              const columns = table.querySelectorAll('th');
              const columnWidths = [];

              cells.forEach((cell, index) => {
                columnWidths[index] = cell.offsetWidth;
              });

              columns.forEach((column, index) => {
                column.style.width = columnWidths[index] + 'px';
              });
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
        <script>
          updateColumnWidths();
        </script>
      </body>
    </html>`;

    return html;
}

module.exports = { createDiagnosticsPage };
