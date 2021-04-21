let divboard = document.getElementById("board")
let divoverlay = document.getElementById("points")
let lastMovesDiv = document.getElementById("lastMoves")

var settings
var pieceArr = new Array()

let searchDepth = 6

var moveSound = new Audio("./sounds/move.mp3")
moveSound.volume = 0.5
let captureSound = new Audio("./sounds/capture.mp3")
captureSound.volume = 0.5

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
}

let curmoves = []

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
    document.getElementById("timer").parentElement.classList.remove("inactive")
    movesMade = 0
    lasttimestart = new Date()
    gameOver = false
    board = new Board()
    board.setup()
    setupBoard()
    isBack = true
    clearInterval(timer)
    timer = null
    UpdateButtons()
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