const gi = require('node-gtk');
const Gtk = gi.require('Gtk', '3.0');
const { spawn } = require('child_process');

function createHomePage(win) {
    let emulatorProc = null;
    let emulatorPath = '';
    let kernelImagePath = '';

    const page = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 10, margin: 20 });
    const vbox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 10 });
    const emulatorPathEntry = new Gtk.Entry();
    const kernelPathEntry = new Gtk.Entry();
    const startEmulatorBtn = Gtk.Button.new();
    const stopEmulatorBtn = Gtk.Button.new();
    const browseEmulatorPathBtn = Gtk.Button.new();
    const browseKernelImagePathBtn = Gtk.Button.new();

    page.on('destroy', () => {
        if (emulatorProc) {
            emulatorProc.kill();
        }
    });
    page.on('delete-event', () => false);

    browseEmulatorPathBtn.setLabel('Browse emulator path');
    browseEmulatorPathBtn.on('clicked', () => {
        let dialog = new Gtk.FileChooserDialog();
        dialog.setTitle('Select emulator folder');
        dialog.setTransientFor(win);
        dialog.setAction(Gtk.FileChooserAction.SELECT_FOLDER);
        dialog.addButton('Cancel', Gtk.ResponseType.CANCEL);
        dialog.addButton('Select', Gtk.ResponseType.OK);
        let response = dialog.run();
        if (response == Gtk.ResponseType.OK) {
            emulatorPath = dialog.getFilename();
            emulatorPathEntry.setText(emulatorPath);
        }
        dialog.destroy();
    });

    browseKernelImagePathBtn.setLabel('Browse kernel image path');
    browseKernelImagePathBtn.on('clicked', () => {
        let dialog = new Gtk.FileChooserDialog();
        dialog.setTitle('Select kernel image');
        dialog.setTransientFor(win);
        dialog.setAction(Gtk.FileChooserAction.OPEN);
        dialog.addButton('Cancel', Gtk.ResponseType.CANCEL);
        dialog.addButton('Select', Gtk.ResponseType.OK);
        dialog.setFilter(new Gtk.FileFilter());
        dialog.getFilter().addPattern('bzImage', 'zImage');
        let response = dialog.run();
        if (response === Gtk.ResponseType.OK) {
            kernelImagePath = dialog.getFilename();
            kernelPathEntry.setText(kernelImagePath);
        }
        dialog.destroy();
    });

    startEmulatorBtn.setLabel('Start emulator!');
    startEmulatorBtn.on('clicked', () => {
        const command = '/bin/bash';
        const args = [
            '-c',
            `cd ${emulatorPath} && ./emulator -verbose @tutorial1 -kernel ${kernelImagePath} -show-kernel -qemu -enable-kvm -read-only`
        ];

        emulatorProc = spawn('gnome-terminal', ['--', command, ...args]);
    });

    stopEmulatorBtn.setLabel('Stop emulator!');
    stopEmulatorBtn.on('clicked', () => {
        // Kill the emulator process
        spawn('pkill', ['-f', 'emulator']);
    });

    page.add(vbox);
    vbox.packStart(browseEmulatorPathBtn, false, false, 0);
    vbox.packStart(emulatorPathEntry, false, false, 0);
    vbox.packStart(browseKernelImagePathBtn, false, false, 0);
    vbox.packStart(kernelPathEntry, false, false, 0);
    vbox.packStart(startEmulatorBtn, false, false, 0);
    vbox.packStart(stopEmulatorBtn, false, false, 0);

    return page;
}

module.exports = { createHomePage };
