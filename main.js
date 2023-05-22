const gi = require('node-gtk');
const Gtk = gi.require('Gtk', '3.0');

gi.startLoop();
Gtk.init();

const win = new Gtk.Window();
const vbox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });
const notebook = new Gtk.Notebook();
const homePage = require('./homePage');
const homePageLabel = new Gtk.Label({ label: 'Home' });
const loadApkPage = require('./manageApksPage');
const loadApkPageLabel = new Gtk.Label({ label: 'Manage APKs' });
const diagnosticsPage = require('./diagnosticsPage');
const diagnosticsPageLabel = new Gtk.Label({ label: 'Diagnostics' });

vbox.packStart(notebook, true, true, 0);
notebook.appendPage(homePage.createHomePage(win), homePageLabel);
notebook.appendPage(loadApkPage.createLoadApkPage(win), loadApkPageLabel);
notebook.appendPage(diagnosticsPage.createDiagnosticsPage(win), diagnosticsPageLabel);

win.on('destroy', () => {
    Gtk.mainQuit()
});
win.on('delete-event', () => false);

win.setDefaultSize(400, 400);
win.add(vbox);
win.showAll();

Gtk.main();
