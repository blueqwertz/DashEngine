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
        document.getElementById("timer").parentElement.classList.add("inactive")
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

function addDrag() {
    for (let el of divboard.children) {
        if (el.classList.toString().includes("w")) {
            dragElement(el)
        }
    }
}

function backToNormal(numMoves = tempMovesMade - movesMade) {
    // if (numMoves == 1) {
    //     numMoves = 2 - (movesMade % 2)
    // }
    numMoves = Math.min(numMoves, tempMovesMade - movesMade)
    document.getElementById("board").classList.add("back")
    if (numMoves > 0) {
        curmoves = [movesBack.pop()]
        makedisplaymove(0, true)
    }
    let i = 1
    let make = setInterval(() => {
        if (i < numMoves) {
            curmoves = [movesBack.pop()]
            makedisplaymove(0, true)
        } else {
            if (movesMade == tempMovesMade) {
                isBack = true
                addDrag()
            } else {
                isBack = false
            }
            clearInterval(make)
        }
        i++
    }, 150)
    document.getElementById("board").classList.remove("back")
}

let isBack = false
let movesBack = []
let tempMovesMade

function goBack(numMoves = movesMade) {
    if (isBack) {
        tempMovesMade = movesMade
    }
    // if (numMoves == 1) {
    //     numMoves = 2 - (movesMade % 2)
    // }
    isBack = false
    document.getElementById("board").classList.add("back")
    numMoves = Math.min(numMoves, movesMade)
    if (numMoves > 0) {
        unmakedisplaymove()
    }
    let i = 1
    let make = setInterval(() => {
        if (i < numMoves) {
            unmakedisplaymove()
        } else {
            clearInterval(make)
        }
        i++
    }, 150)
    document.getElementById("board").classList.remove("back")
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
        setTimeout(() => {
            addPiece(move.attack, move.attack.pos % 8, ~~(move.attack.pos / 8))
            if (board.pos[move.attack.pos].col == 1) {
                dragElement(document.getElementById(move.attack.pos))
            }
        }, 100)
    }
    if (move.enPassant != null) {
        setTimeout(() => {
            addPiece(move.enPassant, move.enPassant.pos % 8, ~~(move.enPassant.pos / 8))
            if (board.pos[move.enPassant.pos].col == 1) {
                dragElement(document.getElementById(move.attack.pos))
            }
        }, 100)
    }
    if (move.castle != null) {
        document.getElementById(move.castle[1]).id = move.castle[0]
    }

    UpdateButtons(tempMovesMade, movesMade)
}
