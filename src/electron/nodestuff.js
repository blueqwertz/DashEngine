const remote = require("electron").remote
const { ipcRenderer } = require("electron")
const win = remote.getCurrentWindow()

document.onreadystatechange = (event) => {
    if (document.readyState == "complete") {
        handleWindowControls()
    }
}

window.onbeforeunload = (event) => {
    win.removeAllListeners()
}

const jsonfile = require("jsonfile")

var settingsContent

async function storeSettings() {
    return new Promise((resolve) => {
        let data = document.getElementById("allSettingsString").innerText
        if (data.length > 0) {
            console.log(data)
            jsonfile.writeFile("src/settings.json", JSON.parse(data), { spaces: 2 }, function (err) {
                if (err) throw err
                resolve(1)
            })
        } else {
            resolve(1)
        }
    })
}

async function handleWindowControls() {
    const version = document.getElementById("version")

    version.innerHTML = remote.version

    document.getElementById("github").onclick = function () {
        require("electron").shell.openExternal("https://github.com/blueqwertz/DashEngine")
    }

    document.getElementById("min-button").addEventListener("click", (event) => {
        win.minimize()
    })

    document.getElementById("version").innerHTML = remote.app.getVersion()

    document.getElementById("max-button").addEventListener("click", (event) => {
        win.maximize()
    })

    var target = document.getElementById("allSettingsString")
    var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            storeSettings()
        })
    })
    var config = { attributes: true, childList: true, characterData: true }
    observer.observe(target, config)

    document.getElementById("restore-button").addEventListener("click", (event) => {
        win.unmaximize()
    })

    document.getElementById("close-button").addEventListener("click", (event) => {
        win.close()
    })

    toggleMaxRestoreButtons()
    win.on("maximize", toggleMaxRestoreButtons)
    win.on("unmaximize", toggleMaxRestoreButtons)

    function toggleMaxRestoreButtons() {
        if (win.isMaximized()) {
            document.body.classList.add("maximized")
        } else {
            document.body.classList.remove("maximized")
        }
    }
}

const isPackaged = require("electron-is-packaged").isPackaged

if (!isPackaged) {
    document.addEventListener("keydown", function (e) {
        if (e.which === 123) {
            remote.getCurrentWindow().toggleDevTools()
        } else if (e.which === 116) {
            location.reload()
        }
    })
}
