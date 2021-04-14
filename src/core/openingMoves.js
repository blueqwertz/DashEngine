var curInd = null

async function searchMoves(movesPlayed) {
    let posMoves = []
    if (curInd != null) {
        let openingMove = openings[curInd]
        let have2break = false
        for (let ind in movesPlayed) {
            if (!(movesPlayed[ind] == openingMove[ind])) {
                have2break = true
                break
            }
        }
        if (!have2break) {
            if (openingMove.length > movesPlayed.length) {
                return moveToRealMove(openingMove[movesPlayed.length])
            }
        }
    }
    for (let i = 0; i < openings.length; i++) {
        let openingMove = openings[i]
        let have2break = false
        for (let ind in movesPlayed) {
            if (!(movesPlayed[ind] == openingMove[ind])) {
                have2break = true
                break
            }
        }
        if (have2break) {
            continue
        } else {
            if (openingMove.length > movesPlayed.length) {
                posMoves.push(openingMove[movesPlayed.length])
            }
        }
    }
    if (posMoves.length ==0) {
        return await Deepening(settings.searchTime)
    }
    let randomInd = Math.floor(Math.random() * (posMoves.length - 1))
    curInd = randomInd
    return await moveToRealMove(posMoves[randomInd])
}

async function moveToRealMove(move) {
    let indStartCol = let.indexOf(move[0])
    let indStartRow = move[1] - 1
    let indStart = indStartRow * 8  + indStartCol
    let indEndCol = let.indexOf(move[2])
    let indEndRow = move[3] - 1
    let indEnd = indEndRow * 8  + indEndCol
    let castle = null
    if (board.pos[indStart].type == 6 && Math.abs(indEnd - indStart) == 2) {
        if (indEnd - indStart > 0) {
            castle = [indEnd + 1, indEnd - 1]
        } else {
            castle = [indEnd - 2, indEnd + 1]
        }
    }
    let moveToMake = new Move(indStart, indEnd, null, castle)
    return new Promise((resolve) =>  {
        resolve(moveToMake)
    })
}