const gi = require('node-gtk');
const Gtk = gi.require('Gtk', '3.0');
const { exec } = require('child_process');
const execSync = require('child_process').execSync;
function createDiagnosticsPage(win) {
    let apkPath = '';
    let logProc = null;

    const page = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });
    const vbox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });
    const fetchLogs = Gtk.Button.new();

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
