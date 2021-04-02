let divboard = document.getElementById("board")
let divoverlay = document.getElementById("points")


let searchTime = 1000

let searchDepth = 6

var moveSound = new Audio("./sounds/move.mp3")
let captureSound = new Audio("./sounds/capture.mp3")

function setupBoard() {
    divoverlay.innerHTML = ""
    divboard.innerHTML = ""
    document.getElementById("boardbg").innerHTML = ""
    for (let i = 63; i > -1; i--) {
        x = 7 - i % 8
        y = Math.floor(i / 8)
        if ((x + y) % 2 == 0) {
            document.getElementById("boardbg").innerHTML += `<div class="file light" style="grid-collumn:${x}; grid-row:${(7 - y)}"></div>`
        } else {
            document.getElementById("boardbg").innerHTML += `<div class="file dark" style="grid-collumn:${x}; grid-row:${(7 - y)}"></div>`
        }
        if (board.pos[x + y * 8] != null) {
            let colcode = board.pos[x + y * 8].col == 1 ? "w" : "b"
            let piececode = getLookup(board.pos[x + y * 8].type, board.pos[x + y * 8].col).toLowerCase()
            let code = colcode + piececode
            divboard.innerHTML += `<div class="piece ${code}" id="${x + y * 8}" style="transform: translate(${x * 100}%, ${(7 - y) * 100}%)"></div>`
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

let curmoves = []

let z_index = 5

function dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (document.getElementById(elmnt.id + "header")) {
      document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
    } else {
      elmnt.onmousedown = dragMouseDown;
    }

    var file = null
    var rank = null

    var startX, startY

    function dragMouseDown(e) {
        if (e.button != 0) {
            return
        } if (elmnt.classList.toString().split(" ")[1][0] == "w" && board.col == 0) {
            return 
        } if (elmnt.classList.toString().split(" ")[1][0] == "b" && board.col == 1) {
            return
        }
        elmnt.classList.add("noTrans")
        elmnt.classList.add("grab")
        drag(elmnt.id, elmnt)
        e = e || window.event;
        e.preventDefault();
        [startX, startY] = [e.clientX, e.clientY]
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        elmnt.style.zIndex = z_index
        z_index++
    }

    var top, left
  
    function elementDrag(e) {
        elmnt.classList.add("noTrans")
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        var rect = divboard.getBoundingClientRect()
        top = pos4 - rect.y - elmnt.offsetHeight / 2
        left = pos3 - rect.x - elmnt.offsetWidth / 2
        if (left < 0) {
            left = 0
        } if (left > divboard.offsetWidth - elmnt.offsetHeight) {
            left = divboard.offsetWidth - elmnt.offsetHeight
        } if (top < 0) {
            top = 0
        } if (top > divboard.offsetHeight - elmnt.offsetWidth) {
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
        var dist = Math.sqrt(Math.abs(startX - e.clientX) ** 2 + Math.abs(startY - e.clientY) ** 2)
        if (dist > 20) {
            lookMove(file, rank)
        }
        let x = elmnt.id % 8
        let y = 7 - Math.floor(elmnt.id / 8)
        elmnt.style.transform = `translate(${x * 100}%, ${y * 100}%)`
        elmnt.classList.remove("grab")
        document.onmouseup = null;
        document.onmousemove = null;
        setTimeout(function() {
            elmnt.classList.remove("noTrans")
        }, 200)
    }

    function lookMove(file, rank) {
        let ind = file + rank * 8
        let found = false
        for (let i in curmoves) {
            if (curmoves[i].endSq == ind) {
                console.log(curmoves[i])
                makedisplaymove(i)
                found = true
                break
            }
        } if (!found) {
            let x = elmnt.id % 8
            let y = 7 - Math.floor(elmnt.id / 8)
            elmnt.style.transform = `translate(${x * 100}%, ${y * 100}%)`
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
        divoverlay.innerHTML += `<div class="selected" style="grid-column: ${ind % 8 + 1}; grid-row: ${7 - Math.floor(ind / 8) + 1}"></div>`
    }
    if (cur.col == board.col) {
        curmoves = movegenerator.generateMoves(ind)
        let promAdded = false
        for (let i = 0; i < curmoves.length; i++) {
            let move = curmoves[i]
            if (move.promotionType && promAdded) {
                continue
            } if (move.promotionType != null) {
                promAdded = true
            }
            divoverlay.innerHTML += `<div class="content" id="p${move.endSq}" onclick="makedisplaymove(${i})" style="grid-column: ${move.endSq % 8 + 1}; grid-row: ${7 - Math.floor(move.endSq / 8) + 1}"><div class="point"></div></div>`
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
    document.getElementById("moves").innerHTML = ""
    document.getElementById("depth").innerHTML = "-"
    document.getElementById("evaldisp").innerHTML = "-"
    timewhite = timeall
    timeblack = timeall
    movesMade = 0
    lasttimestart = new Date()
    gameOver = false
    board = new Board()
    board.setup()
    setupBoard()
    updateTime()
}

var curScore
var ycoord

function updateTime() {
    if (!gameOver) {
        if (movegenerator.generateMoves().length == 0) {
            if (movegenerator.generateAttacksAndPins().checked.length > 0) {
                if (board.col == 1) {
                    scoreDash++
                    document.getElementById("win-draw").innerHTML = "DashEngine won!"
                    document.getElementById("score").innerHTML = `${scoreYou} - ${scoreDash}`
                } if (board.col == 0) {
                    scoreYou++
                    document.getElementById("win-draw").innerHTML = "You won!"
                    document.getElementById("score").innerHTML = `${scoreYou} - ${scoreDash}`
                }
            } else {
                scoreDash += 1/2
                scoreYou += 1/2
                document.getElementById("win-draw").innerHTML = "Draw"
                document.getElementById("score").innerHTML = `${scoreYou} - ${scoreDash}`
            }
            document.getElementById("win-loss-cont").classList.add("show")
            gameOver = true
            timer = null
        } if (checkDraw()) {
            scoreDash += 1/2
            scoreYou += 1/2
            document.getElementById("win-lostt-cont").classList.add("show")
            document.getElementById("win-draw").innerHTML = "Draw"
            document.getElementById("score").innerHTML = `${scoreYou} - ${scoreDash}`
            gameOver = true
            timer = null
        }
        let now = new Date()
        let timepassed = (now - lasttimestart) / 1000
        if (board.col == 1) {
            document.getElementById("user-black").classList.remove("cur")
            document.getElementById("user-white").classList.add("cur")
            timewhite -= timepassed
            let minutes = Math.floor(timewhite / 60)
            let seconds = makeFull(Math.floor(timewhite - minutes * 60))
            document.getElementById("time-white").innerText = minutes + ":" + seconds
        } else {
            document.getElementById("user-white").classList.remove("cur")
            document.getElementById("user-black").classList.add("cur")
            timeblack -= timepassed
            let minutes = Math.floor(timeblack / 60)
            let seconds = makeFull(Math.floor(timeblack - minutes * 60))
            document.getElementById("time-black").innerText = minutes + ":" + seconds
        }
        lasttimestart = new Date()
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
    } return x
}

async function makedisplaymove(ind) {
    board.movesMade += 1/2
    if (timer == null) {
        timer = setInterval(function () {
            updateTime()
        }, 200)
    }
    removeSel()
    let move = curmoves[ind]
    console.log(move)
    if (move.promotionType != null && board.col == 1) {
        let promTypes = [5, 2, 4, 3]
        move.promotionType = promTypes[await choosePromotion(move.startSq % 8)]
    }
    
    async function choosePromotion(file) {
        document.getElementById("select").classList.add("display-normal")
        document.getElementById("select").style.left = 12.5 * file + "%"
        return new Promise((resolve) => {
            for (let i = 0; i < 4; i++) {
                document.getElementById("select").children[i].addEventListener("click", function() {
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

    if (movesMade % 2 == 0) {
        document.getElementById("moves").innerHTML += `<div class="row" id="m${movesMade / 2}"></div>`
    }
    document.getElementById("m" + Math.floor(movesMade / 2)).innerHTML += "<div class='move'>" + convertToPgn(move) +"</div>"

    var objDiv = document.getElementById("moves");
    objDiv.scrollTop = objDiv.scrollHeight;

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
        document.getElementById(move.endSq).classList.add("remove")
        document.getElementById(move.endSq).id = null
    } if (move.enPassant != null) {
        document.getElementById(move.enPassant.pos).classList.add("remove")
        document.getElementById(move.enPassant.pos).id = null
    } if (move.castle != null) {
        let x = move.castle[1] % 8
        let y = Math.floor(move.castle[1] / 8)
        document.getElementById(move.castle[0]).style = `transform: translate(${x * 100}%, ${(7 - y) * 100}%)`
        document.getElementById(move.castle[0]).id = move.castle[1]
    }
    board.makeMove(move)
    let x = move.endSq % 8
    let y = Math.floor(move.endSq / 8)
    divoverlay.innerHTML += `<div class="content lastmoveend" style="transform: translate(${x * 100}%, ${(7 - y) * 100}%)"></div>`
    divoverlay.innerHTML += `<div class="content lastmovestart" style="transform: translate(${(move.startSq % 8 - 1) * 100}%, ${(7 - (Math.floor(move.startSq / 8))) * 100}%)"></div>`
    document.getElementById(move.startSq).style = `transform: translate(${x * 100}%, ${(7 - y) * 100}%)`
    document.getElementById(move.startSq).id = move.endSq

    setTimeout(function() {
        if (board.col == 0) {
            if (!gameOver) {
                if (board.movesMade < 5) {
                    let bestMove = searchMoves(board.moves)
                    bestMove.then(move => {
                        curmoves = [move]
                        makedisplaymove(0)
                    })
                }
                else {
                    let bestMove = Deepening(searchTime)
                    if (bestMove != null) {
                        bestMove.then(move => {
                            curmoves = [move]
                            makedisplaymove(0)
                        })
                    }
                }
            }
        }
    }, 200)
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
        } return "O-O"
    }

    let pieceType = board.pos[move.startSq].type

    let moveNotation = ""

    if (pieceType != 1 && pieceType != 5) {
        var allMoves = movegenerator.generateMoves()

        for (let altMove of allMoves) {
            if (altMove.startSq != move.startSq && altMove.endSq == move.endSq) {
                moveNotation = lookup[pieceType - 1]
                if (board.pos[altMove.startSq].type == pieceType) {
                    let fromFile = Math.floor(move.startSq / 8) + 1
                    let altFromFile = Math.floor(altMove.startSq / 8) + 1
                    let fromRank = move.startSq % 8 - 1
                    let altFromRank = altMove.startSq % 8 - 1

                    if (fromFile != altFromFile) {
                        moveNotation += fromFile
                        break
                    } else if (fromRank != altFromRank) {
                        moveNotation += let[fromRank]
                        break
                    }
                }
            }
        }
    }

    if (move.attack) {
        let caputrePieceType = move.attack.type
        if (caputrePieceType == 1) {
            moveNotation += let[move.startSq % 8]
        }
        moveNotation += "x"
    } else {
        if (move.enPassant != null) {
            moveNotation += let[move.startSq % 8] + "x"
        }
    }

    moveNotation += let[move.endSq % 8]
    moveNotation += Math.floor(move.endSq / 8) + 1

    if (move.promotionType != null) {
        moveNotation += "=" + lookup[move.promotionType - 1]
    }
    return moveNotation
}