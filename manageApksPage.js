const gi = require('node-gtk');
const Gtk = gi.require('Gtk', '3.0');
const { spawn } = require('child_process');

function createLoadApkPage(win) {
    let apkPath = '';
    let handleApkProc = null;

    const page = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });
    const vbox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });
    const browseApkPathBtn = Gtk.Button.new();
    const loadApkBtn = Gtk.Button.new();
    const runApkBtn = Gtk.Button.new();
    const stopApkBtn = Gtk.Button.new();
    const unloadApkBtn = Gtk.Button.new();

    page.on('destroy', () => {
        if(handleApkProc){
            handleApkProc.kill();
        }
    });
    page.on('delete-event', () => false);

    browseApkPathBtn.setLabel('Browse APK path');
    browseApkPathBtn.on('clicked', () => {
        let dialog = new Gtk.FileChooserDialog();
        dialog.setTitle('Select APK file');
        dialog.setTransientFor(win);
        dialog.setAction(Gtk.FileChooserAction.OPEN);
        dialog.addButton('Cancel', Gtk.ResponseType.CANCEL);
        dialog.addButton('Select', Gtk.ResponseType.OK);
        dialog.setFilter(new Gtk.FileFilter());
        dialog.getFilter().addPattern('*.apk')

        let response = dialog.run();
        if (response === Gtk.ResponseType.OK) {
            apkPath = dialog.getFilename();
        }
        dialog.destroy();
    });

    loadApkBtn.setLabel('Load APK into emulator!');
    loadApkBtn.on('clicked', () => {
        const command = '/bin/bash';
        const args = ['-c', `adb -s emulator-5554 install ${apkPath}`];

        handleApkProc = spawn('gnome-terminal', ['--', command, ...args]);
    });

    runApkBtn.setLabel('Run app!');
    runApkBtn.on('clicked', () => {
        const command = '/bin/bash';
        const args = ['-c', `aapt dump badging ${apkPath} | grep package: | awk -F "'" '{print $2}' | awk '{print $1}' | xargs -I {} adb -s emulator-5554 shell am start -n {}/.MainActivity`];

        handleApkProc = spawn('gnome-terminal', ['--', command, ...args]);
    });


    stopApkBtn.setLabel('Stop app!');
    stopApkBtn.on('clicked', () => {
        const command = '/bin/bash';
        const args = ['-c', `aapt dump badging ${apkPath} | grep package: | awk -F "'" '{print $2}' | awk '{print $1}' | xargs -I {} adb -s emulator-5554 shell am force-stop {}`];

        handleApkProc = spawn('gnome-terminal', ['--', command, ...args]);
    });

    unloadApkBtn.setLabel('Uninstall app!');
    unloadApkBtn.on('clicked', () => {
        const command = '/bin/bash';
        const args = ['-c', `aapt dump badging ${apkPath} | grep package: | awk -F "'" '{print $2}' | awk '{print $1}' | xargs -I {} adb -s emulator-5554 uninstall {}`];

        handleApkProc = spawn('gnome-terminal', ['--', command, ...args]);
    });


    page.add(vbox);
    vbox.add(browseApkPathBtn)
    vbox.add(loadApkBtn);
    vbox.add(runApkBtn);
    vbox.add(stopApkBtn);
    vbox.add(unloadApkBtn);
    return page;
}
module.exports = { createLoadApkPage };
