const {ipcRenderer} = require("electron")
const path = require("path")
var updaterPath = path.join(__dirname, "/updater.js")
console.log(updaterPath)

document.onreadystatechange = async function () {
    if (document.readyState === "complete") {
        const defaultStages = {
            Checking: "Checking For Updates!",
            Found: "Update Found!",
            NotFound: "No Update Found.",
            Downloading: "Downloading...",
            Unzipping: "Installing...",
            Cleaning: "Finalizing...",
            Launch: "Launching...",
        }

        const updateOptions = {
            gitRepo: "DashEngine",
            gitUsername: "blueqwertz",

            appName: "DashEngine",
            appExecutableName: "DashEngine.exe",

            progressBar: document.getElementById("bar"),
            label: document.getElementById("message"),
            stageTitles: defaultStages,
        }

        const Updater = require(updaterPath)

        const isPackaged = require("electron-is-packaged").isPackaged

        if (!isPackaged) {
            ipcRenderer.send("start_app")
            return
        }

        let updateAvailabe = await Updater.CheckForUpdates(updateOptions)

        if (!updateAvailabe) {
            ipcRenderer.send("start_app")
        } else {
            Updater.Update(updateOptions)
        }
    }
}
