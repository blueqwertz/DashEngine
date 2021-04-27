importScripts("../../src/core/move.js", "../../src/core/piece.js", "../../src/core/transpositionTable.js", "../../src/core/zobristHashing.js", "../../src/core/board.js", "../../src/core/dashengine.js", "../../src/core/search.js")
var settings
self.addEventListener(
    "message",
    function (e) {
        settings = e.data.settings
        board.pos = e.data.board.pos
        board.col = e.data.board.col
        board.enPassant = e.data.board.enPassant
        board.checked = e.data.board.checked
        board.kingWhite = e.data.board.kingWhite
        board.kingBlack = e.data.board.kingBlack
        board.checkMate = e.data.board.checkMate
        board.movesMade = e.data.board.movesMade
        board.moves = e.data.board.moves
        board.movesHistory = e.data.board.movesHistory
        board.hash = e.data.board.hash
        board.history = e.data.board.history
        var bestMove = Deepening(settings["searchtime"])
        bestMove.then((move) => {
            self.postMessage({ move: move })
        })
    },
    false
)
