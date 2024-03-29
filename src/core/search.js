//#region Deepening
async function Deepening(time, view = false) {
    totalNodes = 0
    let bestMove = null
    let bestScore = -99999
    let start = Date.now()
    for (let tempDepth = 1; true; tempDepth++) {
        if (Date.now() - start > time) {
            break
        }
        let [curBestMove, curScore] = Search(tempDepth, true, time - (Date.now() - start) - 10)
        if (curBestMove == null) {
            return new Promise((resolve) => {
                resolve(bestMove)
            })
        }
        if (curScore > bestScore) {
            bestMove = curBestMove
        }
        bestScore = Math.max(bestScore, curScore)
        await updateEvalDepthDisp(curScore, tempDepth)
        if (view) {
            console.log(`${tempDepth} ply: ${totalNodes}, time left: ${time - (Date.now() - start)}`)
        }
    }
    tt.clear()
    return new Promise((resolve) => {
        resolve(bestMove)
    })
}

function updateEvalDepthDisp(eval, depth) {
    return new Promise((resolve) => {
        self.postMessage({ eval: Math.round((eval / 7) * -10) / 10, depth: depth })
        setTimeout(() => {
            resolve(1)
        }, 10)
    })
}

function IterativeDeepening(depth) {
    var iterativeNodes = 0
    let bestMove = null
    let bestScore = -999999
    let begin = Date.now()
    for (let tempDepth = 1; tempDepth < depth + 1; tempDepth++) {
        let start = Date.now()
        let [curBestMove, curScore] = Search(tempDepth, true)
        if (curScore > bestScore) {
            bestMove = curBestMove
            bestScore = curScore
        }
        console.log(`${tempDepth} ply: ${Date.now() - start} ms, nodes: ${totalNodes}, cutoffs: ${cutOffsrs}`)
        iterativeNodes += totalNodes
        if (bestScore == infinity) {
            return bestMove
        }
    }
    console.log((Date.now() - begin).toString() + "ms, nodes", iterativeNodes.toString())
    tt.clear()
    return bestMove
}
//#endregion

//#region VARS
var totalNodes = 0
var cutOffs = 0
var totalTranspositions
var tt = new TranspositionTable()
var [LOWERBOUND, EXACT, UPPERBOUND] = [-1, 0, 1]

var infinity = 999999
var negativeInfinity = -infinity
//#endregion

//#region Search
function Search(depth = 1, searchScore = false, timeRemaining = 999999) {
    if (depth == 0) {
        return undefined
    }

    let start = Date.now()

    totalNodes = 0

    let moves = orderMoves(movegenerator.generateMoves())

    var bestScore = negativeInfinity
    var bestMove

    cutOffs = 0

    for (let move of moves) {
        let eval = null
        board.makeMove(move)
        if (settings.alpha_beta) {
            eval = alpha_beta(depth - 1, board.col == 0, negativeInfinity, infinity, 0)
        } else {
            eval = minimax(depth - 1, board.col == 0, 0)
        }
        // eval = -negamax(depth - 1, -beta, -alpha, -1)
        if (eval == null) {
            return [null, null]
        }
        board.unmakeMove(move)
        if (eval > bestScore) {
            bestMove = move
        }
        bestScore = Math.max(bestScore, eval)
    }

    if (searchScore) {
        return [bestMove, bestScore]
    }

    tt.clear()

    console.log((Date.now() - start).toString() + " ms, nodes:", totalNodes.toString(), ", Cutoffs: ", cutOffs.toString())

    return bestMove

    function orderMoves(moves) {
        let arr = []
        for (let move of moves) {
            let scoreGuess = 0
            let startPiece = board.pos[move.startSq]
            if (move.attack != null) {
                scoreGuess = 10 * getPieceScore(move.attack) - getPieceScore(startPiece)
            }
            if (move.promotionType != null) {
                scoreGuess += scores[move.promotionType - 1]
            }
            arr.push([scoreGuess, move])
        }
        arr = arr.sort(function (a, b) {
            if (a[0] == b[0]) return 0
            return a[0] > b[0] ? -1 : 1
        })

        for (let i in arr) {
            arr[i] = arr[i][1]
        }
        return arr
    }

    function minimax(depth, ismaximising) {
        if (depth == 0) {
            return Evaluate()
        }

        if (Date.now() - start >= timeRemaining) {
            return null
        }

        let moves = orderMoves(movegenerator.generateMoves())

        if (ismaximising) {
            if (moves.length == 0) {
                if (movegenerator.generateAttacksAndPins().checked.length > 0) {
                    return negativeInfinity
                } else {
                    return 0
                }
            }
            let maxeval = negativeInfinity
            for (let i = 0; i < moves.length; i++) {
                let move = moves[i]
                board.makeMove(move)
                let eval = minimax(depth - 1, false)
                board.unmakeMove(move)
                maxeval = Math.max(eval, maxeval)
            }
            return maxeval
        } else {
            if (moves.length == 0) {
                if (movegenerator.generateAttacksAndPins().checked.length > 0) {
                    return infinity
                } else {
                    return 0
                }
            }
            let mineval = infinity
            for (let i = 0; i < moves.length; i++) {
                let move = moves[i]
                board.makeMove(move)
                let eval = minimax(depth - 1, true)
                board.unmakeMove(move)
                mineval = Math.min(eval, mineval)
            }
            return mineval
        }
    }

    function alpha_beta(depth, ismaximising, alpha, beta) {
        let alphaOrig = alpha

        ttEntry = tt.lookup(board.hash)
        if (ttEntry?.depth > depth) {
            if (ttEntry.flag == EXACT) {
                cutOffs++
                return ttEntry.value
            } else if (ttEntry.flag == LOWERBOUND) {
                alpha = Math.max(alpha, ttEntry.value)
            } else if (ttEntry.flag == UPPERBOUND) {
                beta = Math.min(beta, ttEntry.value)
            }
            if (alpha >= beta) {
                cutOffs++
                return ttEntry.value
            }
        }

        if (depth == 0) {
            return Evaluate()
        }

        if (Date.now() - start >= timeRemaining) {
            return null
        }

        let moves = orderMoves(movegenerator.generateMoves())

        if (ismaximising) {
            if (moves.length == 0) {
                if (movegenerator.generateAttacksAndPins().checked.length > 0) {
                    return negativeInfinity
                } else {
                    return 0
                }
            }
            let maxeval = negativeInfinity
            for (let i = 0; i < moves.length; i++) {
                let move = moves[i]
                board.makeMove(move)
                let eval = alpha_beta(depth - 1, false, alpha, beta)
                if (eval == null) {
                    return null
                }
                board.unmakeMove(move)
                alpha = Math.max(alpha, eval)
                if (beta <= alpha) {
                    break
                }
                maxeval = Math.max(eval, maxeval)
            }
            let ttEntry = {}
            if (maxeval <= alphaOrig) {
                ttEntry.flag = UPPERBOUND
            } else if (maxeval >= beta) {
                ttEntry.flag = LOWERBOUND
            } else {
                ttEntry.flag = EXACT
            }
            ttEntry.depth = depth
            ttEntry.value = maxeval
            tt.store(board.hash, ttEntry.value, ttEntry.depth, ttEntry.flag)
            return maxeval
        } else {
            if (moves.length == 0) {
                if (movegenerator.generateAttacksAndPins().checked.length > 0) {
                    return infinity
                } else {
                    return 0
                }
            }
            let mineval = infinity
            for (let i = 0; i < moves.length; i++) {
                let move = moves[i]
                board.makeMove(move)
                let eval = alpha_beta(depth - 1, true, alpha, beta)
                if (eval == null) {
                    return null
                }
                board.unmakeMove(move)
                beta = Math.min(beta, eval)
                if (beta <= alpha) {
                    break
                }
                mineval = Math.min(eval, mineval)
            }
            let ttEntry = {}
            if (mineval <= alphaOrig) {
                ttEntry.flag = UPPERBOUND
            } else if (mineval >= beta) {
                ttEntry.flag = LOWERBOUND
            } else {
                ttEntry.flag = EXACT
            }
            ttEntry.depth = depth
            ttEntry.value = mineval
            tt.store(board.hash, ttEntry.value, ttEntry.depth, ttEntry.flag)
            return mineval
        }
    }
    //#region negmax
    function negamax(depth, alpha, beta, color) {
        // let alphaOrig = alpha
        // let ttEntry
        // ttEntry = tt.lookup(board.hash)
        // if (ttEntry?.depth >= depth) {
        //     if (ttEntry.flag == EXACT) {
        //         cutOffs++
        //         return ttEntry.value
        //     }
        //     else if (ttEntry.flag == LOWERBOUND) {
        //         alpha = Math.max(alpha, ttEntry.value)
        //     }
        //     else if (ttEntry.flag == UPPERBOUND) {
        //         beta = Math.min(beta, ttEntry.value)
        //     }
        //     if (alpha >= beta) {
        //         cutOffs++
        //         return ttEntry.value
        //     }
        // }

        if (depth == 0) {
            return Evaluate() * color
        }

        let nodes = orderMoves(movegenerator.generateMoves())
        let value = negativeInfinity
        tryMoves: for (let move of nodes) {
            board.makeMove(move)
            value = Math.max(value, -negamax(depth - 1, -beta, -alpha, -color))
            board.unmakeMove(move)
            alpha = Math.max(alpha, value)
            if (alpha >= beta) {
                cutOffs++
                break tryMoves
            }
        }
        return value
        // ttEntry = {}
        // ttEntry.value = value
        // ttEntry.depth = depth
        // if (value <= alphaOrig) {
        //     ttEntry.flag = UPPERBOUND
        // } else if (value >= beta) {
        //     ttEntry.flag = LOWERBOUND
        // } else {
        //     ttEntry.flag = EXACT
        // }
        // tt.store(board.hash, ttEntry.value, ttEntry.depth, ttEntry.flag)
    }
    //#endregion
}
//#endregion

//#region Eval
function Evaluate() {
    totalNodes++

    let endgameMaterialStart = scores[2] * 2 + scores[4] + scores[3]

    let whiteEval = 0
    let blackEval = 0

    var whitePawn = 0
    var blackPawn = 0

    let whiteMaterial = countMaterial(1)
    let blackMaterial = countMaterial(0)

    let whiteOnlyKing = false
    let blackOnlyKing = false

    if (whiteMaterial == scores[5]) {
        whiteOnlyKing = true
    }
    if (blackMaterial == scores[5]) {
        blackOnlyKing = true
    }

    if (whiteOnlyKing && blackOnlyKing) {
        return NaN
    }

    let whiteWithoutPawns = whiteMaterial - whitePawn
    let blackWithouthPawns = blackMaterial - blackPawn

    let whiteEndGameWeight = EndgameWeight(whiteWithoutPawns)
    let blackEndGameWeight = EndgameWeight(blackWithouthPawns)

    whiteEval += whiteMaterial
    blackEval += blackMaterial
    whiteEval += forceKingToEdge(whiteMaterial, blackMaterial, blackEndGameWeight, true)
    blackEval += forceKingToEdge(blackMaterial, whiteMaterial, whiteEndGameWeight, false)

    whiteEval += pieceSqaureTableEval(1, whiteEndGameWeight)
    blackEval += pieceSqaureTableEval(0, blackEndGameWeight)

    function countMaterial(col) {
        let material = 0
        for (let p of board.pos) {
            if (p != null) {
                if (p.col == col) {
                    material += scores[p.type - 1]
                }
                if (col == 1 && p.type == 1 && p.col == 1) {
                    whitePawn += scores[0]
                }
                if (col == 0 && p.type == 0 && p.col == 0) {
                    blackPawn += scores[0]
                }
            }
        }
        return material
    }

    function EndgameWeight(MatWithoutPawns) {
        let multiplier = 1 / endgameMaterialStart
        return 1 - Math.min(1, MatWithoutPawns * multiplier)
    }

    function forceKingToEdge(myMat, opponentMat, endgameWeight, isWhite) {
        let eval = 0
        if (myMat > opponentMat + scores[0] * 2 && endgameWeight > 0) {
            if (isWhite) {
                myKing = board.kingWhite
                yourKing = board.kingBlack
            } else {
                myKing = board.kingBlack
                yourKing = board.kingWhite
            }

            let yourKingFile = yourKing % 8
            let yourKingRank = 7 - Math.floor(yourKing / 8)

            let opponenKingDstToCenterFile = Math.max(3 - yourKingFile, yourKingFile - 4)
            let opponenKingDstToCenterRank = Math.max(3 - yourKingRank, yourKingRank - 4)
            let opponenKingDstToCenter = opponenKingDstToCenterFile + opponenKingDstToCenterRank
            eval += opponenKingDstToCenter * 10

            let myKingFile = myKing % 8
            let myKingRank = 7 - Math.floor(myKing / 8)

            let distBtKingsFile = Math.abs(yourKingFile - myKingFile)
            let distBtKingsRank = Math.abs(yourKingRank - myKingRank)
            let distBtKings = distBtKingsFile + distBtKingsRank
            eval += 14 - distBtKings * 4
        }
        return eval * endgameWeight
    }

    function pieceSqaureTableEval(col, endgameWeight) {
        let extra = 0
        for (let p of board.pos) {
            if (p != null && p.col == col) {
                if (col == 0) {
                    extra += pieceSqaureTablesBlack[p.type - 1][p.pos]
                } else {
                    extra += pieceSqaureTablesWhite[p.type - 1][p.pos]
                }
            }
        }
        return extra * (1 + endgameWeight / 2)
    }

    return blackEval - whiteEval
}

function checkDraw() {
    function mat(col) {
        let material = 0
        for (let p of board.pos) {
            if (p != null) {
                if (p.col == col) {
                    material += scores[p.type - 1]
                }
            }
        }
        return material
    }

    if (mat(1) == 0 && mat(0) == 0) {
        return true
    }
    return false
}

let scores = [128, 1276, 781, 825, 2538, 0]

let pieceSqaureTablesBlack = [
    [0, 0, 0, 0, 0, 0, 0, 0, -25, 105, 135, 270, 270, 135, 105, -25, -80, 0, 30, 176, 176, 30, 0, -80, -85, -5, 25, 175, 175, 25, -5, -85, -90, -10, 20, 125, 125, 20, -10, -90, -95, -15, 15, 75, 75, 15, -15, -95, -100, -20, 10, 70, 70, 10, -20, -100, 0, 0, 0, 0, 0, 0, 0, 0],
    [-60, -30, -10, 20, 20, -10, -30, -60, 40, 70, 90, 120, 120, 90, 70, 40, -60, -30, -10, 20, 20, -10, -30, -60, -60, -30, -10, 20, 20, -10, -30, -60, -60, -30, -10, 20, 20, -10, -30, -60, -60, -30, -10, 20, 20, -10, -30, -60, -60, -30, -10, 20, 20, -10, -30, -60, -60, -30, -10, 20, 20, -10, -30, -60],
    [-200, -100, -50, -50, -50, -50, -100, -200, -100, 0, 0, 0, 0, 0, 0, -100, -50, 0, 60, 60, 60, 60, 0, -50, -50, 0, 30, 60, 60, 30, 0, -50, -50, 0, 30, 60, 60, 30, 0, -50, -50, 0, 30, 30, 30, 30, 0, -50, -100, 0, 0, 0, 0, 0, 0, -100, -200, -50, -25, -25, -25, -25, -50, -200],
    [-50, -50, -25, -10, -10, -25, -50, -50, -50, -25, -10, 0, 0, -10, -25, -50, -25, -10, 0, 25, 25, 0, -10, -25, -10, 0, 25, 40, 40, 25, 0, -10, -10, 0, 25, 40, 40, 25, 0, -10, -25, -10, 0, 25, 25, 0, -10, -25, -50, -25, -10, 0, 0, -10, -25, -50, -50, -50, -25, -10, -10, -25, -50, -50],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [50, 150, -25, -125, -125, -25, 150, 50, 50, 150, -25, -125, -125, -25, 150, 50, 50, 150, -25, -125, -125, -25, 150, 50, 50, 150, -25, -125, -125, -25, 150, 50, 50, 150, -25, -125, -125, -25, 150, 50, 50, 150, -25, -125, -125, -25, 150, 50, 50, 150, -25, -125, -125, -25, 150, 50, 150, 250, 75, -25, -25, 75, 250, 150],
]

var pieceSqaureTablesWhite = []

for (let arr of pieceSqaureTablesBlack) {
    pieceSqaureTablesWhite.push(arr.slice().reverse())
}

function getPieceScore(p) {
    let x = p.pos % 8
    let y = 7 - Math.floor(p.pos / 8)
    if (p.col == 1) {
        return scores[p.type - 1]
    } else {
        return scores[p.type - 1]
    }
}
//#endregion

//#region OldSearch
function OldSearch(depth) {
    let totalNodes = 0
    let start = Date.now()
    let moves = orderMoves(movegenerator.generateMoves())

    var infinity = 999999
    var negativeInfinity = -infinity

    var bestScore = negativeInfinity
    var bestMove

    let isBlack = board.col == 0 ? true : false

    for (let move of moves) {
        board.makeMove(move)
        let eval = minimax(depth - 1, isBlack, negativeInfinity, infinity)
        board.unmakeMove(move)
        if (eval > bestScore) {
            bestMove = move
        }
        bestScore = Math.max(bestScore, eval)
    }

    console.log((Date.now() - start).toString() + " ms, nodes:", totalNodes)

    return bestMove

    function orderMoves(moves) {
        let arr = []
        for (let move of moves) {
            let scoreGuess = 0
            let startPiece = board.pos[move.startSq]
            if (move.attack != null) {
                scoreGuess = 10 * getPieceScore(move.attack) - getPieceScore(startPiece)
            }
            if (move.promotionType != null) {
                scoreGuess += scores[move.promotionType - 1]
            }
            arr.push([scoreGuess, move])
        }
        arr = arr.sort(function (a, b) {
            if (a[0] == b[0]) return 0
            return a[0] > b[0] ? -1 : 1
        })
        for (let i in arr) {
            arr[i] = arr[i][1]
        }
        return arr
    }

    function minimax(depth, ismaximising, alpha, beta) {
        if (depth == 0) {
            totalNodes++
            return Evaluate()
        }

        let moves = orderMoves(movegenerator.generateMoves())

        if (ismaximising) {
            if (moves.length == 0) {
                if (movegenerator.generateAttacksAndPins().checked.length > 0) {
                    return negativeInfinity
                } else {
                    return 0
                }
            }
            let maxeval = negativeInfinity
            for (let i = 0; i < moves.length; i++) {
                let move = moves[i]
                board.makeMove(move)
                let eval = minimax(depth - 1, false, alpha, beta)
                board.unmakeMove(move)
                alpha = Math.max(alpha, eval)
                if (beta <= alpha) {
                    break
                }
                maxeval = Math.max(eval, maxeval)
            }
            return maxeval
        } else {
            if (moves.length == 0) {
                if (movegenerator.generateAttacksAndPins().checked.length > 0) {
                    return infinity
                } else {
                    return 0
                }
            }
            let mineval = infinity
            for (let i = 0; i < moves.length; i++) {
                let move = moves[i]
                board.makeMove(move)
                let eval = minimax(depth - 1, true, alpha, beta)
                board.unmakeMove(move)
                beta = Math.min(beta, eval)
                if (beta <= alpha) {
                    break
                }
                mineval = Math.min(eval, mineval)
            }
            return mineval
        }
    }
}
//#endregion
