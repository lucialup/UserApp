function generateHTML(logs) {
    let html = `
        <html>
            <head>
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
                    <tbody>
    `;

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
            </tr>
        `;
    }

    html += `
                    </tbody>
                </table>
            </body>
        </html>
    `;

    return html;
}
module.exports = { generateHTML };
