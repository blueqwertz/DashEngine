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
        drag(elmnt.id, elmnt)
        if (elmnt.classList.toString().split(" ")[1][0] == "b" && board.col == 1) {
            return
        }
        elmnt.classList.add("noTrans")
        elmnt.classList.add("grab")
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
        if (board.col == 0) {
            return
        }
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
    curDrag = ind
    removeSel()
    divoverlay.innerHTML = ""
    let cur = board.pos[ind]
    if (board.pos[ind].col == 1) {
        divoverlay.innerHTML += `<div class="selected" style="grid-column: ${(ind % 8) + 1}; grid-row: ${7 - Math.floor(ind / 8) + 1}"></div>`
    }
    if (cur.col == 1) {
        let temp = board.col
        board.col = 1
        curmoves = movegenerator.generateMoves(ind)
        board.col = temp
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
