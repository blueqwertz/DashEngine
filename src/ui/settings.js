function readTextFile(file, callback) {
    var rawFile = new XMLHttpRequest()
    rawFile.overrideMimeType("application/json")
    rawFile.open("GET", file, true)
    rawFile.onreadystatechange = function () {
        if (rawFile.readyState === 4 && rawFile.status == "200") {
            callback(rawFile.responseText)
        }
    }
    rawFile.send(null)
}

readTextFile("./settings.json", function (text) {
    settings = JSON.parse(text)
    setSettings()
})

var settingsDiv = document.getElementById("settingsContainer")
var settingsNames = {
    searchtime: "Search Time (ms)",
    usebook: "Opening Book",
    alpha_beta: "Alpha-Beta Pruning",
    darkmode: "Dark Mode",
    timer: "Game Time (s)",
    filerank: "Disp. File/Ranks",
    premoves: "Enable Premoves",
}

function addSetting(name, value) {
    function getBetterName(name) {
        if (settingsNames[name]) {
            return settingsNames[name]
        }
        return name
    }
    if (typeof value == "boolean") {
        var checked = value ? "checked" : ""
        settingsDiv.innerHTML += `<div class="container">
                                    <div class="eval">${getBetterName(name)}</div>
                                    <label class="switch">
                                    <input type="checkbox" ${checked} id="${name}" oninput="settings['${name}'] = this.checked;
                                    document.getElementById('allSettingsString').innerHTML = JSON.stringify(settings)">
                                    <span class="slider round"></span>
                                    </label> 
                                </div>`
    }
    if (typeof value == "number") {
        settingsDiv.innerHTML += `<div class="container">
                                    <span>${getBetterName(name)}</span><input type="number" id="${name}" value="${value}" max="100000" oninput="settings['${name}'] = parseFloat(this.value) || 0;document.getElementById('allSettingsString').innerHTML = JSON.stringify(settings)">
                                </div>`
    }
    if (Array.isArray(value)) {
        settingsDiv.innerHTML += `<div class="container">
                                    <span>Game Time</span>
                                    <select name="${name}" id="${name}">
                                        
                                    </select>
                                </div>`
        for (let val of value[0]) {
            document.getElementById(name).innerHTML += `<option value="${val}">${formatTime(val)}</option>`
        }
        setTimeout(() => {
            document.getElementById(name).selectedIndex = value[1]
        }, 100)
    }
}

function setSettings() {
    for (let key in settings) {
        if (settings.hasOwnProperty(key)) {
            addSetting(key, settings[key])
        }
    }
    document.getElementById("allSettingsString").innerHTML = JSON.stringify(settings)
    for (let key in settings["ui"]) {
        if (!settings["ui"][key]) {
            document.getElementById(key).classList.add("hide")
        }
    }

    if (!settings["darkmode"]) {
        document.body.classList.add("light")
    }

    async function waitForUserInput() {
        return new Promise((resolve) => {
            document.getElementById("cancel").onclick = () => {
                settings["darkmode"] = true
                resolve(0)
            }
            document.getElementById("yes").onclick = () => {
                resolve(1)
            }
        })
    }

    document.getElementById("darkmode").oninput = async () => {
        if (document.getElementById("darkmode").checked) {
            document.body.classList.remove("light")
            document.getElementById("dark_warn").classList.remove("active")
            console.log("light")
            settings["darkmode"] = true
            document.getElementById("allSettingsString").innerHTML = JSON.stringify(settings)
        } else {
            document.getElementById("dark_warn").classList.add("active")
            await waitForUserInput().then((data) => {
                if (data == 1) {
                    document.body.classList.add("light")
                    document.getElementById("dark_warn").classList.remove("active")
                    settings["darkmode"] = false
                    document.getElementById("allSettingsString").innerHTML = JSON.stringify(settings)
                    console.log("light 2")
                } else {
                    document.getElementById("dark_warn").classList.remove("active")
                    document.getElementById("darkmode").checked = true
                }
            })
        }
    }

    timeall = settings["timer"][0][settings["timer"][1]]
    changeTime(timeall, 0)
    changeTime(timeall, 1)
    timewhite = timeall
    timeblack = timeall

    document.getElementById("timer").oninput = () => {
        animateValue(timeall, parseFloat(document.getElementById("timer").value), 400)
        timeall = parseFloat(document.getElementById("timer").value)
        timewhite = timeall
        timeblack = timeall
        settings["timer"][1] = settings["timer"][0].indexOf(parseFloat(document.getElementById("timer").value))
        document.getElementById("allSettingsString").innerHTML = JSON.stringify(settings)
    }

    document.getElementById("filerank").addEventListener("input", () => {
        console.log(document.getElementById("filerank").checked)
        let opacity = document.getElementById("filerank").checked ? "1" : "0"
        document.getElementById("filerankdisp").style = `opacity: ${opacity}`
    })

    document.getElementById("premoves").addEventListener("input", () => {
        if (!settings.premoves) {
            removePreMoves()
        }
    })

    setupBoard()

    isBack = true
}
