const remote = require('electron').remote;

const win = remote.getCurrentWindow();

document.onreadystatechange = (event) => {
    if (document.readyState == "complete") {
        handleWindowControls();
    }
};

window.onbeforeunload = (event) => {
    win.removeAllListeners();
}

function readTextFile(file, callback) {
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4 && rawFile.status == "200") {
            callback(rawFile.responseText);
        }
    }
    rawFile.send(null);
}


function handleWindowControls() {

    const jsonfile = require('jsonfile') 
    let data = '{"searchTime": 2500, "useOpenBook": true}'
    jsonfile.writeFile('./settings.json', JSON.parse(data), {spaces:2}, function(err){
        if (err) throw err;
    });

    const version = document.getElementById('version');
    
    version.innerHTML = remote.version

    document.getElementById('github').onclick = function() {
        require("electron").shell.openExternal("https://github.com/blueqwertz/DashEngine")
    }

    document.getElementById('min-button').addEventListener("click", event => {
        win.minimize();
    });

    document.getElementById("version").innerHTML = remote.app.getVersion()

    document.getElementById('max-button').addEventListener("click", event => {
        win.maximize();
    });

    document.getElementById('restore-button').addEventListener("click", event => {
        win.unmaximize();
    });

    document.getElementById('close-button').addEventListener("click", event => {
        win.close()
    });

    toggleMaxRestoreButtons();
    win.on('maximize', toggleMaxRestoreButtons);
    win.on('unmaximize', toggleMaxRestoreButtons);

    function toggleMaxRestoreButtons() {
        if (win.isMaximized()) {
            document.body.classList.add('maximized');
        } else {
            document.body.classList.remove('maximized');
        }
    }
}

const isPackaged = require('electron-is-packaged').isPackaged;

if (!isPackaged) {
    document.addEventListener("keydown", function (e) {
        if (e.which === 123) {
            remote.getCurrentWindow().toggleDevTools();
        } else if (e.which === 116) {
            location.reload();
        }
    })
}