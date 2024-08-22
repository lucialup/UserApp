const gi = require('node-gtk');
const Gtk = gi.require('Gtk', '3.0');
const { spawn } = require('child_process');
const Gdk = gi.require('Gdk', '3.0');

function createHomePage(win) {
    let emulatorProc = null;
    let emulatorPath = '';
    let kernelImagePath = '';

    const page = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 10, margin: 20 });
    const vbox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 10 });

    const emulatorPathEntry = new Gtk.Entry();
    const kernelPathEntry = new Gtk.Entry();
    const emulatorPathLabel = new Gtk.Label({ label: 'Emulator Path:' });
    const kernelPathLabel = new Gtk.Label({ label: 'Kernel Image Path:' });

    const provider = Gtk.CssProvider.new();
    provider.loadFromPath('styles.css');
    Gtk.StyleContext.addProviderForScreen(Gdk.Screen.getDefault(), provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

    const browseEmulatorPathBtn = Gtk.Button.newWithLabel('Browse emulator path');
    browseEmulatorPathBtn.name = 'custom-button';

    const browseKernelImagePathBtn = Gtk.Button.newWithLabel('Browse kernel image path');
    browseKernelImagePathBtn.name = 'custom-button';

    const startEmulatorBtn = Gtk.Button.newWithLabel('Start emulator!');
    startEmulatorBtn.name = 'custom-button';

    const stopEmulatorBtn = Gtk.Button.newWithLabel('Stop emulator!');
    stopEmulatorBtn.name = 'custom-button';

    const browseEmulatorPathIcon = Gtk.Image.newFromIconName('folder-open', Gtk.IconSize.BUTTON);
    browseEmulatorPathBtn.setImage(browseEmulatorPathIcon);
    browseEmulatorPathBtn.setTooltipText('Select the emulator folder');

    const browseKernelImagePathIcon = Gtk.Image.newFromIconName('document-open', Gtk.IconSize.BUTTON);
    browseKernelImagePathBtn.setImage(browseKernelImagePathIcon);
    browseKernelImagePathBtn.setTooltipText('Select the kernel image');

    const startEmulatorIcon = Gtk.Image.newFromIconName('media-playback-start', Gtk.IconSize.BUTTON);
    startEmulatorBtn.setImage(startEmulatorIcon);
    startEmulatorBtn.setTooltipText('Start the emulator');

    const stopEmulatorIcon = Gtk.Image.newFromIconName('media-playback-stop', Gtk.IconSize.BUTTON);
    stopEmulatorBtn.setImage(stopEmulatorIcon);
    stopEmulatorBtn.setTooltipText('Stop the emulator');

    const emulatorBox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 10});
    emulatorBox.packStart(browseEmulatorPathBtn, false, false, 0);
    emulatorBox.packStart(emulatorPathEntry, true, true, 0);

    const kernelBox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 10});
    kernelBox.packStart(browseKernelImagePathBtn, false, false, 0);
    kernelBox.packStart(kernelPathEntry, true, true, 0);


    vbox.packStart(emulatorPathLabel, false, false, 5);
    vbox.packStart(emulatorBox, false, false, 5);
    vbox.packStart(kernelPathLabel, false, false, 5);
    vbox.packStart(kernelBox, false, false, 5);
    vbox.packStart(startEmulatorBtn, false, false, 5);
    vbox.packStart(stopEmulatorBtn, false, false, 5);

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
        spawn('pkill', ['-f', 'emulator']);
    });

    page.add(vbox);
    return page;
}

module.exports = { createHomePage };
