let divboard = document.getElementById("board")
let divoverlay = document.getElementById("points")
let lastMovesDiv = document.getElementById("lastMoves")

var settings
var pieceArr = new Array()

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
                                    <span>${getBetterName(name)}</span><input type="number" id="${name}" value="${value}" max="100000" oninput="settings['${name}'] = parseFloat(this.value);
                                    document.getElementById('allSettingsString').innerHTML = JSON.stringify(settings)">
                                </div>`
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
        } else {
            document.getElementById("dark_warn").classList.add("active")
            await waitForUserInput().then((data) => {
                if (data == 1) {
                    document.body.classList.add("light")
                    document.getElementById("dark_warn").classList.remove("active")
                } else {
                    document.getElementById("dark_warn").classList.remove("active")
                    document.getElementById("darkmode").checked = true
                }
            })
        }
    }

    isBack = true
}

let searchDepth = 6

var moveSound = new Audio("./sounds/move.mp3")
let captureSound = new Audio("./sounds/capture.mp3")

function setupBoard() {
    divoverlay.innerHTML = ""
    divboard.innerHTML = ""
    document.getElementById("boardbg").innerHTML = ""
    for (let i = 63; i > -1; i--) {
        x = 7 - (i % 8)
        y = Math.floor(i / 8)
        if ((x + y) % 2 != 0) {
            document.getElementById("boardbg").innerHTML += `<div class="file light" style="grid-collumn:${x}; grid-row:${7 - y}"></div>`
        } else {
            document.getElementById("boardbg").innerHTML += `<div class="file dark" style="grid-collumn:${x}; grid-row:${7 - y}"></div>`
        }
        if (board.pos[x + y * 8] != null) {
            addPiece(board.pos[x + y * 8], x, y)
        }
    }
    for (let el of divboard.children) {
        if (el.classList.toString().includes("w")) {
            dragElement(el)
        } else {
            el.classList.add("dark-piece")
        }
    }
}

function addPiece(piece, x, y) {
    let colcode = piece.col == 1 ? "w" : "b"
    let piececode = getLookup(piece.type, piece.col).toLowerCase()
    let code = colcode + piececode
    divboard.innerHTML += `<div class="piece ${code}" id="${x + y * 8}"></div>`
    pieceArr.push(document.getElementById(x + y * 8))
    pieceArr
}

let curmoves = []

let z_index = 5

function dragElement(elmnt) {
    var pos1 = 0,
        pos2 = 0,
        pos3 = 0,
        pos4 = 0
    if (document.getElementById(elmnt.id + "header")) {
        document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown
    } else {
        elmnt.onmousedown = dragMouseDown
    }

    var file = null
    var rank = null

    var startX, startY

    function dragMouseDown(e) {
        if (e.button != 0) {
            return
        }
        if (elmnt.classList.toString().split(" ")[1][0] == "w" && board.col == 0) {
            return
        }
        if (elmnt.classList.toString().split(" ")[1][0] == "b" && board.col == 1) {
            return
        }
        elmnt.classList.add("noTrans")
        elmnt.classList.add("grab")
        drag(elmnt.id, elmnt)
        e = e || window.event
        e.preventDefault()
        ;[startX, startY] = [e.clientX, e.clientY]
        document.onmouseup = closeDragElement
        document.onmousemove = elementDrag
        elmnt.style.zIndex = z_index
        z_index++
    }

    var top, left

    function elementDrag(e) {
        elmnt.classList.add("noTrans")
        e = e || window.event
        e.preventDefault()
        pos1 = pos3 - e.clientX
        pos2 = pos4 - e.clientY
        pos3 = e.clientX
        pos4 = e.clientY
        var rect = divboard.getBoundingClientRect()
        top = pos4 - rect.y - elmnt.offsetHeight / 2
        left = pos3 - rect.x - elmnt.offsetWidth / 2
        if (left < 0) {
            left = 0
        }
        if (left > divboard.offsetWidth - elmnt.offsetHeight) {
            left = divboard.offsetWidth - elmnt.offsetHeight
        }
        if (top < 0) {
            top = 0
        }
        if (top > divboard.offsetHeight - elmnt.offsetWidth) {
            top = divboard.offsetHeight - elmnt.offsetWidth
        }

        file = Math.round(left / (divboard.offsetWidth / 8))
        rank = 7 - Math.round(top / (divboard.offsetHeight / 8))

        elmnt.style.transition = ""
        elmnt.style.transform = `translate(${left}px, ${top}px)`
        if (board.pos[elmnt.id].col == board.col) {
            viewCurField(file, rank)
        }
    }

    function closeDragElement(e) {
        elmnt.removeAttribute("style")
        var dist = Math.sqrt(Math.abs(startX - e.clientX) ** 2 + Math.abs(startY - e.clientY) ** 2)
        if (dist > 20) {
            lookMove(file, rank)
        }
        let x = elmnt.id % 8
        let y = 7 - Math.floor(elmnt.id / 8)
        elmnt.classList.remove("grab")
        document.onmouseup = null
        document.onmousemove = null
        setTimeout(function () {
            elmnt.classList.remove("noTrans")
        }, 10)
    }

    function lookMove(file, rank) {
        let ind = file + rank * 8
        let found = false
        for (let i in curmoves) {
            if (curmoves[i].endSq == ind) {
                makedisplaymove(i)
                found = true
                break
            }
        }
    }

    function viewCurField(file, rank) {
        let ind = file + rank * 8
        for (let i in curmoves) {
            document.getElementById("p" + curmoves[i].endSq).classList.remove("view")
            if (curmoves[i].endSq == ind) {
                document.getElementById("p" + ind).classList.add("view")
            }
        }
    }
}

function drag(ind) {
    removeSel()
    divoverlay.innerHTML = ""
    let cur = board.pos[ind]
    if (board.pos[ind].col == board.col) {
        divoverlay.innerHTML += `<div class="selected" style="grid-column: ${(ind % 8) + 1}; grid-row: ${7 - Math.floor(ind / 8) + 1}"></div>`
    }
    if (cur.col == board.col) {
        curmoves = movegenerator.generateMoves(ind)
        let promAdded = false
        for (let i = 0; i < curmoves.length; i++) {
            let move = curmoves[i]
            if (move.promotionType && promAdded) {
                continue
            }
            if (move.promotionType != null) {
                promAdded = true
            }
            divoverlay.innerHTML += `<div class="content" id="p${move.endSq}" onclick="makedisplaymove(${i})" style="grid-column: ${(move.endSq % 8) + 1}; grid-row: ${7 - Math.floor(move.endSq / 8) + 1}"><div class="point"></div></div>`
            if (board.pos[move.endSq] != null || move.enPassant != null) {
                document.getElementById(`p${move.endSq}`).children[0].classList.add("attack")
            }
        }
    }
}

let lasttimestart = new Date()

let timeall = 300

let timewhite = timeall
let timeblack = timeall

let scoreYou = 0
let scoreDash = 0

let gameOver = false

function newGame() {
    let minutes = Math.floor(timeall / 60)
    let seconds = makeFull(Math.floor(timeall - minutes * 60))
    document.getElementById("time-white").innerHTML = minutes + ":" + seconds
    document.getElementById("time-black").innerHTML = minutes + ":" + seconds
    document.getElementById("win-loss-cont").classList.remove("show")
    lastMovesDiv.innerHTML = ""
    document.getElementById("moves").innerHTML = ""
    document.getElementById("depth").innerHTML = "-"
    document.getElementById("evaldisp").innerHTML = "-"
    timewhite = timeall
    timeblack = timeall
    changeTime(timeall, 0)
    changeTime(timeall, 1)
    movesMade = 0
    lasttimestart = new Date()
    gameOver = false
    board = new Board()
    board.setup()
    setupBoard()
    clearInterval(timer)
    timer = null
    UpdateButtons()
}

var curScore
var ycoord

function changeTime(time, col) {
    let minutes = Math.floor(time / 60)
    let seconds = makeFull(Math.floor(time - minutes * 60))

    if (minutes == 0) {
        let seconds = Math.floor(time)
        time -= seconds
        let milli = Math.ceil(time * 10)
        if (milli == 10) {
            seconds++
            milli = 0
        }
        if (col == 1) {
            if (time < 10) {
                document.getElementById("time-white").classList.add("low")
                document.getElementById("time-black").classList.remove("low")
            }
            document.getElementById("time-white").innerHTML = seconds + "." + milli
            return
        }
        if (time < 10) {
            document.getElementById("time-black").classList.add("low")
            document.getElementById("time-white").classList.remove("low")
        }
        document.getElementById("time-black").innerHTML = seconds + "." + milli

        return
    }

    if (col == 1) {
        document.getElementById("time-white").innerHTML = minutes + ":" + seconds
        return
    }
    document.getElementById("time-black").innerHTML = minutes + ":" + seconds
}

changeTime(timeall, 1)
changeTime(timeall, 0)

function updateTime() {
    if (!gameOver) {
        if (movegenerator.generateMoves().length == 0) {
            if (movegenerator.generateAttacksAndPins().checked.length > 0) {
                if (board.col == 1) {
                    scoreDash++
                    document.getElementById("win-draw").innerHTML = "DashEngine won!"
                    document.getElementById("score").innerHTML = `${scoreYou} - ${scoreDash}`
                }
                if (board.col == 0) {
                    scoreYou++
                    document.getElementById("win-draw").innerHTML = "You won!"
                    document.getElementById("score").innerHTML = `${scoreYou} - ${scoreDash}`
                }
            } else {
                scoreDash += 1 / 2
                scoreYou += 1 / 2
                document.getElementById("win-draw").innerHTML = "Draw"
                document.getElementById("score").innerHTML = `${scoreYou} - ${scoreDash}`
            }
            document.getElementById("win-loss-cont").classList.add("show")
            gameOver = true
        }
        if (checkDraw()) {
            scoreDash += 1 / 2
            scoreYou += 1 / 2
            document.getElementById("win-lostt-cont").classList.add("show")
            document.getElementById("win-draw").innerHTML = "Draw"
            document.getElementById("score").innerHTML = `${scoreYou} - ${scoreDash}`
            gameOver = true
        }
        let now = new Date()
        let timepassed = (now - lasttimestart) / 1000
        if (board.col == 1 || !isBack) {
            document.getElementById("user-black").classList.remove("cur")
            document.getElementById("user-white").classList.add("cur")
            timewhite -= timepassed
            changeTime(timewhite, 1)
        } else {
            document.getElementById("user-white").classList.remove("cur")
            document.getElementById("user-black").classList.add("cur")
            timeblack -= timepassed
            changeTime(timeblack, 0)
        }
        lasttimestart = new Date()

        if (timeblack < 0) {
            scoreYou++
            document.getElementById("win-draw").innerHTML = "You won!"
            document.getElementById("score").innerHTML = `${scoreYou} - ${scoreDash}`
            document.getElementById("win-loss-cont").classList.add("show")
            gameOver = true
            changeTime(timewhite, 1)
            changeTime(0, 0)
        } else if (timewhite < 0) {
            scoreDash++
            document.getElementById("win-draw").innerHTML = "DashEngine won!"
            document.getElementById("score").innerHTML = `${scoreYou} - ${scoreDash}`
            document.getElementById("win-loss-cont").classList.add("show")
            changeTime(0, 1)
            changeTime(timeblack, 0)
            gameOver = true
        }
    } else {
        document.getElementById("time-black").classList.remove("low")
        document.getElementById("time-white").classList.remove("low")
        clearInterval(timer)
        timer = null
    }
}

/* this.startSq = sq
        this.endSq = eq
        this.enPassant = enpa
        this.attack = board.pos[this.endSq]
        this.castle = castle
        this.movedChanged = !board.pos[this.startSq].moved
        this.promotionType = promotion*/

var timer = null
var movesMade = 0

function makeFull(x) {
    if (x < 10) {
        return "0" + x
    }
    return x
}

async function makedisplaymove(ind, show = false) {
    if (!isBack && !show) {
        return
    }
    if (board.col == 0) {
        document.getElementById("searching").classList.remove("active")
    }

    lastMovesDiv.innerHTML = ""
    board.movesMade += 1 / 2
    if (timer == null) {
        lasttimestart = new Date()
        timer = setInterval(function () {
            updateTime()
        }, 100)
    }
    removeSel()
    let move = curmoves[ind]

    if (move == null) {
        console.warn("null move")
        return
    }

    board.movesHistory.push(move)
    if (!show) {
        if (move.promotionType != null && board.col == 1) {
            let promTypes = [5, 2, 4, 3]
            move.promotionType = promTypes[await choosePromotion(move.startSq % 8)]
        }
    }

    async function choosePromotion(file) {
        document.getElementById("select").classList.add("display-normal")
        document.getElementById("select").style.left = 12.5 * file + "%"
        return new Promise((resolve) => {
            for (let i = 0; i < 4; i++) {
                document.getElementById("select").children[i].addEventListener("click", function () {
                    document.getElementById("select").classList.remove("display-normal")
                    resolve(i)
                })
            }
        })
    }

    if (move.attack == null) {
        moveSound.play()
    } else {
        captureSound.play()
    }

    if (!show) {
        if (movesMade % 2 == 0) {
            document.getElementById("moves").innerHTML += `<div class="row" id="m${movesMade / 2}"></div>`
        }
        document.getElementById("m" + Math.floor(movesMade / 2)).innerHTML += "<div class='move'>" + convertToPgn(move) + "</div>"
    }

    var objDiv = document.getElementById("moves")
    objDiv.scrollTop = objDiv.scrollHeight

    movesMade++

    if (move.promotionType == null) {
        board.moves.push(posToLetter(move.startSq) + posToLetter(move.endSq))
    } else {
        let x = move.startSq % 8
        let y = Math.floor(move.startSq / 8)
        let colcode = board.pos[x + y * 8].col == 1 ? "w" : "b"
        let piececode = getLookup(move.promotionType, board.pos[x + y * 8].col).toLowerCase()
        let code = colcode + piececode
        code += colcode == "w" ? " noTrans" : ""
        document.getElementById(move.startSq).classList = "piece " + code
        board.moves.push(posToLetter(move.startSq) + posToLetter(move.endSq) + getLookup(move.promotionType, 0))
    }

    divoverlay.innerHTML = ""
    if (board.pos[move.endSq] != null) {
        document.getElementById(move.endSq).outerHTML = ""
    }
    if (move.enPassant != null) {
        document.getElementById(move.enPassant.pos).outerHTML = ""
    }
    if (move.castle != null) {
        let x = move.castle[1] % 8
        let y = Math.floor(move.castle[1] / 8)
        document.getElementById(move.castle[0]).id = move.castle[1]
    }
    board.makeMove(move)
    let x = move.endSq % 8
    let y = Math.floor(move.endSq / 8)
    lastMovesDiv.innerHTML += `<div class="content lastmoveend" style="transform: translate(${x * 100}%, ${(7 - y) * 100}%)"></div>`
    lastMovesDiv.innerHTML += `<div class="content lastmovestart" style="transform: translate(${((move.startSq % 8) - 1) * 100}%, ${(7 - Math.floor(move.startSq / 8)) * 100}%)"></div>`
    document.getElementById(move.startSq).id = move.endSq

    UpdateButtons(tempMovesMade == null ? movesMade : tempMovesMade, movesMade)

    if (!show) {
        if (board.col == 0) {
            setTimeout(function () {
                document.getElementById("searching").classList.add("active")
                if (!gameOver) {
                    if (board.movesMade < 5 && settings["usebook"]) {
                        let bestMove = searchMoves(board.moves)
                        bestMove.then((move) => {
                            if (move != null) {
                                curmoves = [move]
                                makedisplaymove(0)
                            }
                        })
                    } else {
                        let bestMove = Deepening(settings["searchtime"])
                        bestMove.then((move) => {
                            if (move != null) {
                                curmoves = [move]
                                makedisplaymove(0)
                            }
                        })
                    }
                }
            }, 200)
        }
    }
}

var first = document.getElementById("back-front")
var back = document.getElementById("back")
var skip = document.getElementById("skip")
var last = document.getElementById("skip-last")

function UpdateButtons(movesMade, curMove) {
    if (curMove > 0) {
        first.classList.add("active")
        back.classList.add("active")
    } else {
        first.classList.remove("active")
        back.classList.remove("active")
    }
    if (curMove < movesMade) {
        skip.classList.add("active")
        last.classList.add("active")
    } else {
        skip.classList.remove("active")
        last.classList.remove("active")
    }
}

function backToNormal(numMoves = tempMovesMade - movesMade) {
    numMoves = Math.min(numMoves, tempMovesMade - movesMade)
    console.log(numMoves)
    for (let i = 0; i < numMoves; i++) {
        curmoves = [movesBack.pop()]
        makedisplaymove(0, true)
    }
    if (movesMade == tempMovesMade) {
        isBack = true
    } else {
        isBack = false
    }
}

let isBack = false
let movesBack = []
let tempMovesMade

function goBack(numMoves = movesMade) {
    if (isBack) {
        tempMovesMade = movesMade
    }
    isBack = false
    document.getElementById("board").classList.add("back")
    numMoves = Math.min(numMoves, movesMade)
    for (let i = 0; i < numMoves; i++) {
        unmakedisplaymove()
    }
    document.getElementById("board").classList.remove("back")
}

async function sleep(ms) {
    setTimeout((resolve) => {
        resolve(1)
    }, ms)
}

function unmakedisplaymove() {
    if (board.movesHistory.length < 1) {
        return false
    }

    movesMade--

    lastMovesDiv.innerHTML = ""

    movesBack.push(board.movesHistory[board.movesHistory.length - 1])
    let move = board.movesHistory.pop()

    if (move.attack == null) {
        moveSound.play()
    } else {
        captureSound.play()
    }

    board.unmakeMove(move)

    divoverlay.innerHTML = ""
    let x = move.startSq % 8
    let y = Math.floor(move.startSq / 8)
    lastMovesDiv.innerHTML += `<div class="content lastmoveend" style="transform: translate(${x * 100}%, ${(7 - y) * 100}%)"></div>`
    lastMovesDiv.innerHTML += `<div class="content lastmovestart" style="transform: translate(${((move.endSq % 8) - 1) * 100}%, ${(7 - Math.floor(move.endSq / 8)) * 100}%)"></div>`

    document.getElementById(move.endSq).id = move.startSq

    if (move.promotionType != null) {
        document.getElementById(move.endSq).classList = "piece" + board.pos[x + y * 8].col == 0 ? "b" : "w" + "p"
    }

    if (move.attack != null) {
        addPiece(move.attack, move.attack.pos % 8, ~~(move.attack.pos / 8))
        if (board.pos[move.attack.pos].col == 1) {
            dragElement(document.getElementById(move.attack.pos))
        }
    }
    if (move.enPassant != null) {
        addPiece(move.enPassant, move.enPassant.pos % 8, ~~(move.enPassant.pos / 8))
        if (board.pos[move.enPassant.pos].col == 1) {
            dragElement(document.getElementById(move.attack.pos))
        }
    }
    if (move.castle != null) {
        let x = move.castle[0] % 8
        let y = Math.floor(move.castle[0] / 8)
        document.getElementById(move.castle[1]).id = move.castle[0]
    }

    UpdateButtons(tempMovesMade, movesMade)
}

function removeSel() {
    for (let i of divboard.children) {
        i.classList.remove("selected")
    }
}

setupBoard()

function convertToPgn(move) {
    if (move.castle != null) {
        if (Math.abs(move.castle[0] - move.castle[1]) == 3) {
            return "O-O-O"
        }
        return "O-O"
    }

    let startPieceType = getLookup(board.pos[move.startSq].type, 1)
    let capturePieceType
    if (move.attack != null) {
        capturePieceType = getLookup(move.attack.type, 1)
    }

    let result = ""
    //      F I L E
    // R
    // A
    // N
    // K
    if (startPieceType != "P" && startPieceType != "K") {
        let moves = movegenerator.generateMoves()
        for (let posMove of moves) {
            if (posMove.startSq != move.startSq && posMove.endSq == move.endSq) {
                if (startPieceType == board.pos[posMove.startSq].type) {
                    let fromFile = move.startSq % 8
                    let altFromFile = ~~(posMove.startSq / 8) + 1

                    let fromRank = move.startSq % 8
                    let altFromRank = ~~(posMove.startSq / 8) + 1

                    if (fromFile != altFromFile) {
                        result += let[fromFile]
                        break
                    }
                    if (fromRank != altFromRank) {
                        result += altFromRank
                        break
                    }
                } else {
                    result += startPieceType
                    break
                }
            }
        }
    }

    if (capturePieceType) {
        if (startPieceType == "P") {
            result += let[move.startSq % 8]
        }
        result += "x"
    }
    if (move.enPassant) {
        result += let[move.startSq % 8] + "x"
    }

    result += let[move.endSq % 8]
    result += ~~(move.endSq / 8) + 1

    if (move.promotionType) {
        result += "=" + getLookup(move.promotionType, 1)
    }

    return result
}

function closeSideBar(el) {
    if (!el.parentElement.parentElement.classList.toString().includes("hide")) {
        el.parentElement.parentElement.children[1].style.maxHeight = el.parentElement.parentElement.children[1].offsetHeight + "px"
    } else {
        el.parentElement.parentElement.children[1].style.maxHeight = null
    }
    settings["ui"][el.parentElement.parentElement.id] = el.parentElement.parentElement.classList.toString().includes("hide")
    el.parentElement.parentElement.classList.toggle("hide")
    document.getElementById("allSettingsString").innerHTML = JSON.stringify(settings)
}

function listAllEventListeners() {
    let elements = []
    const allElements = document.querySelectorAll("*")
    const types = []
    for (let ev in window) {
        if (/^on/.test(ev)) types[types.length] = ev
    }

    for (let i = 0; i < allElements.length; i++) {
        const currentElement = allElements[i]
        for (let j = 0; j < types.length; j++) {
            if (typeof currentElement[types[j]] === "function") {
                elements.push({
                    node: currentElement,
                    listeners: [
                        {
                            type: types[j],
                            func: currentElement[types[j]].toString(),
                        },
                    ],
                })
            }
        }
    }

    return elements.filter((element) => element.listeners.length)
}
