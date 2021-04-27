importScripts("../../src/core/move.js", "../../src/core/piece.js", "../../src/core/transpositionTable.js", "../../src/core/zobristHashing.js", "../../src/core/board.js", "../../src/core/dashengine.js", "../../src/core/openingMoves.js", "../../src/core/openingsData.js", "../../src/core/search.js")
var settings
self.addEventListener(
    "message",
    function (e) {
        self.postMessage("started")
        settings = e.data
        self.postMessage(e.data["searchtime"])
        var bestMove = Deepening(e.data["searchtime"])
        bestMove.then((move) => {
            self.postMessage(move)
        })
    },
    false
)
