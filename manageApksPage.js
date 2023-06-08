const gi = require('node-gtk');
const Gtk = gi.require('Gtk', '3.0');
const { spawn, spawnSync } = require('child_process');
const Gdk = gi.require('Gdk', '3.0');
const exec = require('sync-exec');

function createLoadApkPage(win) {
    const page = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, margin: 20 });
    const vbox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 10 });
    const apkListBox = new Gtk.ListBox();
    const browseApkPathBtn = Gtk.Button.new();
    const provider = Gtk.CssProvider.new();

    provider.loadFromPath('styles.css');
    Gtk.StyleContext.addProviderForScreen(Gdk.Screen.getDefault(), provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

    page.on('destroy', () => {
        // handle clean up here
    });
    page.on('delete-event', () => false);

    const browseApkPathIcon = Gtk.Image.newFromIconName('document-open', Gtk.IconSize.BUTTON);
    browseApkPathBtn.setImage(browseApkPathIcon);
    browseApkPathBtn.setTooltipText('Select APK file');
    browseApkPathBtn.name = 'custom-button';

    const apkPathLabel = new Gtk.Label({ label: 'APK Path:' });
    const apkPathEntry = new Gtk.Entry();
    const apkPathBox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 10 });
    apkPathBox.packStart(apkPathLabel, false, false, 0);
    apkPathBox.packStart(apkPathEntry, true, true, 0);

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
            let apkPath = dialog.getFilename();
            apkPathEntry.setText(apkPath);
            createApkListItem(apkPath);
        }
        dialog.destroy();
    });

    function getApkPackageName(apkPath) {
        const command = '/bin/bash';
        const args = [
            '-c',
            `aapt dump badging "${apkPath}" | grep package: | awk -F "'" '{print $2}' | awk '{print $1}'`
        ];

        let output = spawnSync(command, args, { encoding: 'utf-8' });
        if (output.status === 0) {
            return output.stdout.trim();
        } else {
            return 'Package Name Unknown';
        }
    }
    function createApkListItem(apkPath) {
        let handleApkProc = null;
        let apkRow = new Gtk.ListBoxRow();
        let apkBox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 10 });
        let apkLabel = new Gtk.Label({ label: getApkPackageName(apkPath) });
        let loadApkBtn = Gtk.Button.newWithLabel('Load APK into emulator!');
        let runApkBtn = Gtk.Button.newWithLabel('Run app!');
        let stopApkBtn = Gtk.Button.newWithLabel('Stop app!');
        let unloadApkBtn = Gtk.Button.newWithLabel('Uninstall app!');

        loadApkBtn.name = 'custom-button';
        runApkBtn.name = 'custom-button';
        stopApkBtn.name = 'custom-button';
        unloadApkBtn.name = 'custom-button';

        loadApkBtn.on('clicked', () => {
            const command = '/bin/bash';
            const args = ['-c', `adb -s emulator-5554 install ${apkPath}`];
            handleApkProc = spawn('gnome-terminal', ['--', command, ...args]);
            loadApkBtn.setSensitive(false);
        });

        runApkBtn.on('clicked', () => {
            const command = '/bin/bash';
            const args = ['-c', `aapt dump badging ${apkPath} | grep package: | awk -F "'" '{print $2}' | awk '{print $1}' | xargs -I {} adb -s emulator-5554 shell am start -n {}/.MainActivity`];
            handleApkProc = spawn('gnome-terminal', ['--', command, ...args]);
        });

        stopApkBtn.on('clicked', () => {
            const command = '/bin/bash';
            const args = ['-c', `aapt dump badging ${apkPath} | grep package: | awk -F "'" '{print $2}' | awk '{print $1}' | xargs -I {} adb -s emulator-5554 shell am force-stop {}`];
            handleApkProc = spawn('gnome-terminal', ['--', command, ...args]);
        });

        unloadApkBtn.on('clicked', () => {
            const command = '/bin/bash';
            const args = ['-c', `aapt dump badging ${apkPath} | grep package: | awk -F "'" '{print $2}' | awk '{print $1}' | xargs -I {} adb -s emulator-5554 uninstall {}`];
            handleApkProc = spawn('gnome-terminal', ['--', command, ...args]);
            apkListBox.remove(apkRow);
        });

        apkBox.packStart(apkLabel, false, false, 5);
        apkBox.packStart(loadApkBtn, false, false, 5);
        apkBox.packStart(runApkBtn, false, false, 5);
        apkBox.packStart(stopApkBtn, false, false, 5);
        apkBox.packStart(unloadApkBtn, false, false, 5);
        apkRow.add(apkBox);
        apkListBox.add(apkRow);

        apkListBox.showAll();
    }

    page.packStart(apkPathBox, false, false, 5);
    page.packStart(browseApkPathBtn, false, false, 5);
    page.packStart(apkListBox, false, false, 5);

    return page;
}

module.exports = { createLoadApkPage };
