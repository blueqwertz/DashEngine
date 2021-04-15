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


function handleWindowControls() {

    const jsonfile = require('jsonfile') 

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
        let data = {"searchTime": parseFloat(document.getElementById("searchTime").value), "useOpenBook": document.getElementById("openbook").checked}
        jsonfile.writeFile('src/settings.json', data, {spaces:2}, function(err){
            if (err) throw err;
            win.close()
        });
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