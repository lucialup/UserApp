const gi = require('node-gtk');
const Gtk = gi.require('Gtk', '3.0');
const { exec } = require('child_process');

function createDiagnosticsPage(win) {
    let apkPath = '';
    let logProc = null;

    const page = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });
    const vbox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });
    const fetchLogs = Gtk.Button.new();
    const fs = require('fs');

    page.on('destroy', () => {
        if(logProc){
            logProc.kill();
        }
    });
    page.on('delete-event', () => false);

    fetchLogs.setLabel('Fetch Logs');
    fetchLogs.on('clicked', () => {
        exec('adb shell dmesg > logs.txt', (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
        });
    });

    page.add(vbox);
    vbox.add(fetchLogs)
    return page;
}
module.exports = { createDiagnosticsPage };
