const path = require("path");
const { app, BrowserWindow } = require("electron");

var WIDTH = 320; 
var HEIGHT = 425;

function createWindow() {
    const win = new BrowserWindow({
        width: WIDTH,
        height: HEIGHT,
        resizable: false,
        maximizable: false,
        fullscreenable: false,
        frame: false, 
        transparent: false,
        icon: path.join(__dirname, "assets", "birb_placeholder_icon.ico"),
        webPreferences: {
            contextIsolation: true,
            scrollBars: { vertical: 'hidden', horizontal: 'hidden' }
        }
    });

    win.loadFile("index.html");
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});