function getLookup(type, col) {
    return col == 1 ? lookup[type - 1] : lookup[type - 1].toLowerCase()
}

var lookup = ["P", "R", "N", "B", "Q", "K"]

function print_board() {
    output = ""
    for (let i = 63; i > -1; i--) {
        if (i % 8 == 0 && i != 0) {
            x = 7 - i % 8
            y = Math.floor(i / 8)
            if (board.pos[y * 8 + x] == null) {
                output += "|   | " + (y + 1)
            } else {
                if (board.pos[y * 8 + x].col == 0) {
                    output += "|\x1b[40m " + getLookup(board.pos[y * 8 + x].type, 0) + " \x1b[0m| " + (y+1)
                } else {
                    output += "|\x1b[47m\x1b[30m " + getLookup(board.pos[y * 8 + x].type, 1) + " \x1b[0m| " + (y+1)
                }
            }
            console.log("+---+---+---+---+---+---+---+---+")
            console.log(output)
            output = ""
        } else {
            x = 7 - i % 8
            y = Math.floor(i / 8)
            if (board.pos[y * 8 + x] == null) {
                output += "|   "
            } else {
                if (board.pos[y * 8 + x].col == 0) {
                    output += "|\x1b[40m " + getLookup(board.pos[y * 8 + x].type, 0) + " \x1b[0m"
                } else {
                    output += "|\x1b[47m\x1b[30m " + getLookup(board.pos[y * 8 + x].type, 1) + " \x1b[0m"
                }
            }
        }
    }
    console.log("+---+---+---+---+---+---+---+---+")
    console.log(output + "| " + 1)
    console.log("+---+---+---+---+---+---+---+---+")
    console.log("  a   b   c   d   e   f   g   h")
}

function print_bitarr(arr) {
    output = ""
    console.log("\n")
    for (let i = 63; i > -1; i--) {
        if (i % 8 == 0 && i != 0) {
            x = 7 - i % 8
            y = Math.floor(i / 8)
            if (arr[y * 8 + x] == false) {
                output += "|   | " + (y + 1)
            } else {
                output += "| X | " + (y + 1)
            }
            console.log("+---+---+---+---+---+---+---+---+")
            console.log(output)
            output = ""
        } else {
            x = 7 - i % 8
            y = Math.floor(i / 8)
            if (arr[y * 8 + x] == false) {
                output += "|   "
            } else {
                output += "| X "
            }
        }
    }
    console.log("+---+---+---+---+---+---+---+---+")
    console.log(output + "| " + 1)
    console.log("+---+---+---+---+---+---+---+---+")
    console.log("  a   b   c   d   e   f   g   h")
}

let movegenerator = new MoveGenerator()

var board = new Board()
let testFen = "3k4/3r4/8/8/8/8/3K4/8 w - - 0 1"
board.setup()
// board.setFen(testFen)

var let = ["a", "b", "c", "d", "e", "f", "g", "h"]

function posToLetter(ind) {
    var row = Math.floor(ind / 8)
    var col = ind % 8
    return let[col] + (row + 1)
}


function test (d, fen=null) {
    if (fen != null) {
        board.setFen(fen)
    }
    let moves = movegenerator.generateMoves()
    let debug = []
    var positions = 0
    let start = new Date()
    for (let ind = 0; ind < moves.length; ind++) {
        let move = moves[ind]
        board.makeMove(move)
        numcur = moveGenTest(d - 1)
        positions += numcur
        if (move.promotionType == null) {
            console.log(posToLetter(move.startSq) + posToLetter(move.endSq) + ": " + numcur.toString())
        } else {
            console.log(posToLetter(move.startSq) + posToLetter(move.endSq) + getLookup(move.promotionType, 0) + ": " + numcur.toString())
        }
        board.unmakeMove(move)
    }
    for (let el of debug) {
        console.log(el)
    }
    let end = new Date()

    console.log("Nodes searched:", positions.toString())

    console.log("time calculated: " + (end - start), "ms")

    console.log("nodes/s: " + Math.floor((positions * 1000) / (end - start)))
}

function moveGenTest(depth) {
    if (depth == 0) {
        return 1
    }

    let moves = movegenerator.generateMoves()
    var positions = 0
    for (let ind = 0; ind < moves.length; ind++) {
        let move = moves[ind]
        board.makeMove(move)
        positions += moveGenTest(depth - 1)
        board.unmakeMove(move)
    }
    return positions
}

// print_board()

// let depth = 6

// test(depth)