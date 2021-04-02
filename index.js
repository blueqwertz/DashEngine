const { app, BrowserWindow, ipcMain, ipcRenderer} = require('electron');
const path = require('path');
const nativeImage = require('electron').nativeImage;
var image = nativeImage.createFromPath(__dirname + '/icon.ico');

var mainWindow

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 0,
    height: 0,
    icon: image,
    frame: false,
    show: false,
    backgroundColor: '#363536',
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      nodeIntegrationInWorker: true,
      preload: `${__dirname}/electron/nodestuff.js`
    }
  });

  if (loadingScreen) {
    loadingScreen.close()
  }

  mainWindow.setMenu(null);
  mainWindow.maximize()

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })
};

var loadingScreen;

const createLoadingScreen = () => {
  loadingScreen = new BrowserWindow(
    Object.assign({
      width: 400,
      height: 300,
      icon: image,
      frame: false,
      backgroundColor: '#363536',
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true,
        nodeIntegrationInWorker: true,
        preload: `${__dirname}/electron/loadingScreen.js`
      }
    })
  );
  loadingScreen.setMenu(null);
  loadingScreen.setResizable(false);
  loadingScreen.loadFile(path.join(__dirname, 'loading.html'));
  loadingScreen.on('closed', () => (loadingScreen = null))
};

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.on("version", (event) => {
  event.sender.send('app_version', { version: app.getVersion() })
})

app.on('ready', createLoadingScreen)

ipcMain.on('start_app', createWindow);