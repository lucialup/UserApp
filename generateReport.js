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

module.exports = generateHTMLTable;
