const remote = require("electron").remote
const path = require("path")
const win = remote.getCurrentWindow()
document.onreadystatechange = (event) => {
    if (document.readyState == "complete") {
        handleWindowControls()
    }
}

const fs = require("fs")

async function storeSettings() {
    return new Promise((resolve) => {
        let data = JSON.stringify(JSON.parse(document.getElementById("allSettingsString").innerText), null, 4)
        if (data.length > 0) {
            fs.writeFile(path.join(__dirname, "../settings.json"), data, function (err) {
                if (err) return console.log(err)
                resolve(1)
            })
        } else {
            resolve(1)
        }
    })
}

function handleWindowControls() {
    const version = document.getElementById("version")

    version.innerHTML = remote.version

    document.getElementById("github").onclick = function () {
        require("electron").shell.openExternal("https://github.com/blueqwertz/DashEngine")
    }

    document.getElementById("min-button").addEventListener("click", (event) => {
        win.minimize()
    })

    version.innerHTML = remote.app.getVersion()

    document.getElementById("max-button").addEventListener("click", (event) => {
        win.maximize()
    })

    var target = document.getElementById("allSettingsString")
    var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function () {
            storeSettings()
        })
    })

    var config = {attributes: true, childList: true, characterData: true}
    observer.observe(target, config)

    document.getElementById("restore-button").addEventListener("click", (event) => {
        win.unmaximize()
    })

    document.getElementById("close-button").addEventListener("click", async (event) => {
        await storeSettings().then(() => {
            win.close()
        })
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
