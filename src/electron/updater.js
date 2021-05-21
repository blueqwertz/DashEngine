const request = require("request")
const fs = require("fs")
const {ipcRenderer} = require("electron")

var app_library = (process.env.APPDATA || (process.platform == "darwin" ? process.env.HOME + "/Library/Preferences" : process.env.HOME + "/.local/share")) + "\\"

var git_api
var new_version = "unknown"
var current_version = "unknown"

var dl_bar = null
var dl_label = null

const defaultStages = {
    Checking: "Checking For Updates!",
    Found: "Update Found!",
    NotFound: "No Update Found.",
    Downloading: "Downloading...",
    Unzipping: "Installing...",
    Cleaning: "Finalizing...",
    Launch: "Launching...",
}

const defaultOptions = {
    useGithub: true,
    gitRepo: "unknown",
    gitUsername: "unknown",
    isGitRepoPrivate: false,
    gitRepoToken: "uknown",

    appName: "unknown",
    appExecutableName: this.appName + "",

    appDirectory: app_library + this.appName,
    versionFile: this.appDirectory + "/settings/version.json",
    tempDirectory: this.appDirectory + "/tmp",

    progressBar: null,
    label: null,
    forceUpdate: false,
    stageTitles: defaultStages,
    percentShow: null,

    allowDowngrade: false,
}

/**
 * @param {defaultOptions} options
 */
function testOptions(options) {
    return !(options.appName === "unknown" || (options.useGithub && (options.gitUsername === "unknown" || options.gitRepo === "unknown")) || (options.isGitRepoPrivate && options.gitRepoToken === "unknown"))
}

/**
 * @param {defaultOptions} options
 */
function setOptions(options) {
    options.useGithub = options.useGithub == null ? true : options.appDirectory
    options.forceUpdate = options.forceUpdate == null ? false : options.forceUpdate
    options.appDirectory = options.appDirectory == null ? app_library + options.appName : options.appDirectory
    options.versionFile = options.versionFile == null ? options.appDirectory + "\\settings\\version.json" : options.versionFile
    options.tempDirectory = options.tempDirectory == null ? options.appDirectory + "\\tmp" : options.tempDirectory
    options.appExecutableName = options.appExecutableName == null ? options.appName : options.appExecutableName
    options.stageTitles = options.stageTitles == null ? defaultOptions.stageTitles : options.stageTitles
    options.allowDowngrade = options.allowDowngrade == null ? defaultOptions.allowDowngrade : options.allowDowngrade

    if (options.label !== null) dl_label = options.label
    if (options.progressBar !== null) dl_bar = options.progressBar
    if (options.useGithub) setupGitProtocol(options)
    return options
}

/**
 * @param {defaultOptions} options
 */
function setupGitProtocol(options) {
    options.gitRepo = options.gitRepo.toString().replace("/ /gi", "-")
    git_api = `https://api.github.com/repos/${options.gitUsername}/${options.gitRepo}/releases/latest`
}

/**
 * @param {defaultOptions} options
 */

function createDirectories(options) {
    if (!fs.existsSync(options.appDirectory)) fs.mkdirSync(options.appDirectory, {recursive: true})
    if (!fs.existsSync(options.tempDirectory)) fs.mkdirSync(options.tempDirectory, {recursive: true})
    if (!fs.existsSync(require("path").dirname(options.versionFile))) fs.mkdirSync(require("path").dirname(options.versionFile), {recursive: true})
}

/**
 * @param {defaultOptions} options
 * @returns {*}
 */
async function GetUpdateURL(options) {
    return fetch(git_api)
        .then((response) => response.json())
        .then((data) => {
            json = data
        })
        .catch((e) => {
            try {
                alert(`Something went wrong: ${e}`)
            } catch {
                console.error(`Something went wrong: ${e}`)
                return
            }
        })
        .then(() => {
            let zip
            for (i = 0; i < json["assets"].length; i++) {
                if (json["assets"][i]["name"] === `${options.appName}.zip`) zip = json["assets"][i]
            }
            return zip["browser_download_url"]
        })
}

async function GetUpdateVersion() {
    return fetch(git_api)
        .then((response) => response.json())
        .then((data) => {
            json = data
        })
        .catch((e) => {
            try {
                alert(`Something went wrong: ${e}`)
            } catch {
                console.error(`Something went wrong: ${e}`)
                return
            }
        })
        .then(() => {
            return json["tag_name"]
        })
}

/**
 * @param {defaultOptions} options
 */

/**
 * @param {defaultOptions} options
 */
function UpdateCurrentVersion(options) {
    let version = {
        game_version: new_version,
        last_updated: Date.now().toString(),
    }
    fs.writeFileSync(options.versionFile, JSON.stringify(version))
}

/**
 * @param {number} rb
 * @param {number} tb
 */
function showProgress(rb, tb) {
    try {
        if (dl_bar !== null) dl_bar.setAttribute("value", (rb * 100) / tb)
    } catch {}
}

/**
 * @param {string} value
 */
function updateHeader(value) {
    console.log(value)
    try {
        if (dl_label !== null) dl_label.innerHTML = value
    } catch {}
}

/**
 * @param {defaultOptions} options
 */
async function Update(options = defaultOptions) {
    if (testOptions(options)) {
        options = setOptions(options)
        createDirectories(options)
        if (options.forceUpdate || (await CheckForUpdates(options))) {
            updateHeader(options.stageTitles.Found)
            await sleep(1000)
            let url = await GetUpdateURL(options)
            Download(url, `${options.tempDirectory}\\${options.appName}.zip`, options)
            UpdateCurrentVersion(options)
        } else {
            updateHeader(options.stageTitles.NotFound)
            await sleep(1000)
            LaunchApplication(options)
        }
    } else {
        try {
            alert(`Please Fill out the Options Fully`)
            window.close()
        } catch {
            console.log(`Please Fill out the Options Fully`)
            return
        }
    }
}

/**
 * @param {defaultOptions} options
 * @returns {*}
 */
async function CheckForUpdates(options = defaultOptions) {
    if (testOptions(options)) {
        options = setOptions(options)
        createDirectories(options)
        updateHeader(options.stageTitles.Checking)
        await sleep(1000)
        new_version = await GetUpdateVersion()
        current_version = window.require("electron").remote.app.getVersion()

        new_version = new_version.replace("v", "")
        current_version = current_version.replace("v", "")

        if (current_version == "unknown") {
            console.error("Unable to Load Current Version... Trying again")
            return false
        }

        function isNewerVersion(oldVer, newVer) {
            const oldParts = oldVer.split(".")
            const newParts = newVer.split(".")
            for (var i = 0; i < newParts.length; i++) {
                const a = ~~newParts[i]
                const b = ~~oldParts[i]
                if (a > b) return true
                if (a < b) return false
            }
            return false
        }

        console.log(current_version, new_version)

        if (!options.allowDowngrade && !isNewerVersion(current_version, new_version)) {
            console.log("Downgrade detected")
            return false
        }
        return current_version != new_version
    }
}

/**
 *
 * @param {string} url
 * @param {string} path
 */
function Download(url, path, options) {
    document.getElementById("bar").style.opacity = 1
    updateHeader(options.stageTitles.Downloading)
    let received_bytes = 0
    let total_bytes = 0

    var req = request({
        method: "GET",
        uri: url,
    })

    var out = fs.createWriteStream(path)
    req.pipe(out)

    req.on("response", (data) => {
        total_bytes = parseInt(data.headers["content-length"])
    })

    req.on("data", (chunk) => {
        received_bytes += chunk.length
        showProgress(received_bytes, total_bytes)
    })

    req.on("end", () => {
        Install(options)
    })
}
/**
 * @param {defaultOptions} options
 */
function Install(options) {
    updateHeader(options.stageTitles.Unzipping)
    var AdmZip = require("adm-zip")
    var zip = new AdmZip(`${options.tempDirectory}/${options.appName}.zip`)

    zip.extractAllTo(options.appDirectory, true)
    setTimeout(() => CleanUp(options), 2000)
}

/**
 * @param {defaultOptions} options
 */
function CleanUp(options) {
    updateHeader(options.stageTitles.Cleaning)
    fs.rmdirSync(options.tempDirectory, {recursive: true, maxRetries: 3, retryDelay: 500})
    setTimeout(() => LaunchApplication(options), 2000)
}

/**
 * @param {defaultOptions} options
 */
function LaunchApplication(options) {
    let executablePath = require("path").join(options.appDirectory, options.appExecutableName)
    if (fs.existsSync(executablePath)) {
        updateHeader(options.stageTitles.Launch)
        let child = require("child_process").exec
        child(`"${executablePath}"`, function (err, data) {
            if (err) {
                console.error(err)
                return
            }
            console.log(data.toString())
        })
    } else {
        console.error(`File Not Found: ${executablePath}`)
        options.forceUpdate = true
        Update(options)
        return
    }
    setTimeout(() => {
        try {
            window.close()
        } catch (e) {
            process.exit(0)
        }
    }, 1000)
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

function GetAppLibrary() {
    return app_library
}

module.exports = {Update, CheckForUpdates, GetAppLibrary}
