class MoveGenerator {
    constructor() {
    }

    generateAttacksAndPins() {
        var attacks = new Uint8Array(64)
        var pinned = new Uint8Array(64)
        var checked = new Array()
        var blockcheck = new Uint8Array(64)
        var pawnblocked = new Uint8Array(64)

        var moves = this.getAttacks()
        let kingpos = null
        var len = moves.length

        for (let i = 0; i < len; i++) {
            let move = moves[i]
            attacks[move.endSq] = true
            if (move.attack != null && move.attack.type == 6 && move.attack.col == board.col) {
                if (!checked.includes(move.startSq)) {
                    checked.push(move.startSq)
                }
                kingpos = move.endSq
                if (checked.length == 1) {
                    if (board.pos[move.startSq].type == 2 || board.pos[move.startSq].type == 4 || board.pos[move.startSq].type == 5) {
                        let rowdif = Math.floor(move.endSq / 8) - Math.floor(move.startSq / 8)
                        let coldif = move.endSq % 8 - move.startSq % 8
                        let offsetlen = Math.max(Math.abs(rowdif), Math.abs(coldif))
                        let offset = (move.endSq - move.startSq) / offsetlen
                        for (let i = 0; i < offsetlen; i++) {
                            blockcheck[move.startSq + offset * i] = true
                        }
                    } else {
                        blockcheck[move.startSq] = true
                    }
                }
            }
        }

        if (kingpos == null) {
            for (let i = 0; i < 64; i++) {
                if (board.pos[i] != null && board.pos[i].type == 6 && board.pos[i].col == board.col) {
                    kingpos = i
                }
            }
        }

        if (checked.length > 0) {
            board.checked = true
        } else {
            board.checked = false
        }

        let numnorth = 7 - (Math.floor(kingpos / 8))
        let numsouth = (Math.floor(kingpos / 8))
        let numwest = kingpos % 8
        let numeast = 7 - (kingpos % 8)

        var edges = [
            numnorth, numsouth, numwest, numeast,
            Math.min(numnorth, numwest),
            Math.min(numsouth, numeast),
            Math.min(numnorth, numeast),
            Math.min(numsouth, numwest)
        ]
        var offsets = [8, -8, -1, 1, 7, -7, 9, -9]
        var index = [2, 2, 2, 2, 4, 4, 4, 4]

        for (let dir = 0; dir < 8; dir++) {
            let target = 0
            let pospin = null
            let pinnotpos = false
            let enPassantPos = null
            let enPassantPawn = false
            let enPassantNotPos = false
            let coloff = board.col == 1 ? 8 : -8
            for (let n = 0; n < edges[dir]; n++) {
                target = kingpos + offsets[dir] * (n+1)
                if (board.pos[target] != null) {
                    if (enPassantPos != null && board.pos[target].col != board.col && !(enPassantNotPos) && (board.pos[target].type == index[dir] || board.pos[target].type == 5) && !(offsets[dir] == coloff)) {
                        pawnblocked[enPassantPos] = true
                    }
                    if (board.enPassant == target) {
                        enPassantPos = target + coloff
                    } else {
                        if (board.pos[target].type == 1 && !enPassantPawn && board.pos[target].col == board.col && index[dir] == 2) {
                            enPassantPawn = true
                        } else {
                            enPassantNotPos = true
                        }
                    }
                    if (board.pos[target].col != board.col && !pinnotpos) {
                        if (pospin && board.pos[target].type == index[dir] || board.pos[target].type == 5) {
                            pinned[pospin] = (dir - dir % 2) + 1
                        } else {
                            pinnotpos = true
                        }
                    } else {
                        if (!pospin) {
                            pospin = target
                        } else {
                            pinnotpos = true
                        }
                    }
                }
            }
        }

        if (checked.length == 1 && checked[0] == board.enPassant) {
            let coloff = board.col == 1 ? 8 : -8
            blockcheck[board.enPassant + coloff] = true
        }

        // print_bitarr(attacks)
        // print_bitarr(blockcheck)
        // print_bitarr(pinned)
        // print_bitarr(pawnblocked)

        return {attacks: attacks, pinned: pinned, checked: checked, blockcheck: blockcheck, kingpos: kingpos, pawnblocked: pawnblocked}
    }

    getAttacks(change=true) {
        var moves = []
        if (change) {
            board.col = board.col == 1 ? 0 : 1
        }
        for (let i = 0; i < 64; i++) {
            let piece = board.pos[i]
            if (piece != null && piece.col == board.col) {
                let numnorth = 7 - (Math.floor(piece.pos / 8))
                let numsouth = (Math.floor(piece.pos / 8))
                let numwest = piece.pos % 8
                let numeast = 7 - (piece.pos % 8)
                var edges = [
                    numnorth, numsouth, numwest, numeast,
                    Math.min(numnorth, numwest),
                    Math.min(numsouth, numeast),
                    Math.min(numnorth, numeast),
                    Math.min(numsouth, numwest)
                ]
                switch (piece.type) {
                    case 1:
                        this.generatePawn(piece, moves, edges, true)
                        break
                    case 2:
                        this.generateSlidingPieces(piece, moves, edges, new Uint8Array(64), false, new Uint8Array(64), true)
                        break
                    case 3:
                        this.generateKnight(piece, moves, edges, new Uint8Array(64), false, true)
                        break
                    case 4:
                        this.generateSlidingPieces(piece, moves, edges, new Uint8Array(64), false, new Uint8Array(64), true)
                        break
                    case 5:
                        this.generateSlidingPieces(piece, moves, edges, new Uint8Array(64), false, new Uint8Array(64), true)
                        break
                    case 6:
                        this.generateKing(piece, moves, edges, new Uint8Array(64), false, true)
                }
            }
        }
        if (change) {
            board.col = board.col == 1 ? 0 : 1
        }
        return moves
    }

    generateMoves(ind=null) {
        var moves = []

        var info = this.generateAttacksAndPins()

        var attacked = info.attacks
        var pinned = info.pinned
        var checked = info.checked
        var blockcheck = info.blockcheck
        var kingpos = info.kingpos
        var pawnblocked = info.pawnblocked

        if (ind != null) {
            if (checked.length > 1 && kingpos != ind) {
                return []
            }
            let piece = board.pos[ind]
            if (piece != null && piece.col == board.col) {
                let numnorth = 7 - (Math.floor(piece.pos / 8))
                let numsouth = (Math.floor(piece.pos / 8))
                let numwest = piece.pos % 8
                let numeast = 7 - (piece.pos % 8)
                var edges = [
                    numnorth, numsouth, numwest, numeast,
                    Math.min(numnorth, numwest),
                    Math.min(numsouth, numeast),
                    Math.min(numnorth, numeast),
                    Math.min(numsouth, numwest)
                ]
                if (piece.type == 3 && pinned[piece.pos]) {
                    return []
                }
                switch (piece.type) {
                    case 1:
                        this.generatePawn(piece, moves, edges, false, blockcheck, checked.length > 0, pinned, pawnblocked)
                        break
                    case 2:
                        this.generateSlidingPieces(piece, moves, edges, blockcheck, checked.length > 0, pinned)
                        break
                    case 3:
                        this.generateKnight(piece, moves, edges, blockcheck, checked.length > 0)
                        break
                    case 4:
                        this.generateSlidingPieces(piece, moves, edges, blockcheck, checked.length > 0, pinned)
                        break
                    case 5:
                        this.generateSlidingPieces(piece, moves, edges, blockcheck, checked.length > 0, pinned)
                        break
                    case 6:
                        this.generateKing(piece, moves, edges, attacked, checked)
                        break
                }
            }
            return moves
        } if (checked.length > 1) {
            let numnorth = 7 - (Math.floor(kingpos / 8))
                let numsouth = (Math.floor(kingpos / 8))
                let numwest = kingpos % 8
                let numeast = 7 - (kingpos % 8)
                var edges = [
                    numnorth, numsouth, numwest, numeast,
                    Math.min(numnorth, numwest),
                    Math.min(numsouth, numeast),
                    Math.min(numnorth, numeast),
                    Math.min(numsouth, numwest)
                ]
            this.generateKing(board.pos[kingpos], moves, edges, attacked, checked)
            if (moves.length == 0) {
                board.checkMate = board.col
            }
            return moves
        } for (let i = 0; i < 64; i++) {
            let piece = board.pos[i]
            if (piece != null && piece.col == board.col) {
                let numnorth = 7 - (Math.floor(piece.pos / 8))
                let numsouth = (Math.floor(piece.pos / 8))
                let numwest = piece.pos % 8
                let numeast = 7 - (piece.pos % 8)
                var edges = [
                    numnorth, numsouth, numwest, numeast,
                    Math.min(numnorth, numwest),
                    Math.min(numsouth, numeast),
                    Math.min(numnorth, numeast),
                    Math.min(numsouth, numwest)
                ]
                if (piece.type == 3 && pinned[piece.pos]) {
                    continue
                }
                switch (piece.type) {
                    case 1:
                        this.generatePawn(piece, moves, edges, false, blockcheck, checked.length > 0, pinned, pawnblocked)
                        break
                    case 2:
                        this.generateSlidingPieces(piece, moves, edges, blockcheck, checked.length > 0, pinned)
                        break
                    case 3:
                        this.generateKnight(piece, moves, edges, blockcheck, checked.length > 0)
                        break
                    case 4:
                        this.generateSlidingPieces(piece, moves, edges, blockcheck, checked.length > 0, pinned)
                        break
                    case 5:
                        this.generateSlidingPieces(piece, moves, edges, blockcheck, checked.length > 0, pinned)
                        break
                    case 6:
                        this.generateKing(piece, moves, edges, attacked, checked)
                        break
                }
            }
        }
        return moves
    }

    generatePawn(p, moves, edges, onlyAttacks=false, blockcheck=new Uint8Array(64), checked=false, pinned=new Uint8Array(64), blocked=new Uint8Array(64)) {
        var offsets = [8, 16, 7, 9]
        var promotion = (p.pos > 47 && p.col == 1) || (p.pos < 16 && p.col == 0)

        if (p.col == 0) {
            for (let i in offsets) {
                offsets[i] *= -1
            }
            if (!onlyAttacks) {
                // one forward
                if (!checked || blockcheck[p.pos + offsets[0]]) {
                    if (pinned[p.pos] == 1 || pinned[p.pos] == 0) {
                        if (edges[1] > 0 && board.pos[p.pos + offsets[0]] == null) {
                            if (promotion) {
                                this.promotePawn(p, p.pos + offsets[0], moves)
                            } else {
                                moves.push(new Move(p.pos, p.pos + offsets[0]))
                            }
                        }
                    }
                }
                // two forward
                if (!checked || blockcheck[p.pos + offsets[1]]) {
                    if (pinned[p.pos] == 1 || pinned[p.pos] == 0) {
                        if (edges[1] > 1 && board.pos[p.pos + offsets[1]] == null && board.pos[p.pos + offsets[0]] == null && !p.moved) {
                                if (promotion) {
                                    this.promotePawn(p, p.pos + offsets[1], moves)
                                } else {
                                    moves.push(new Move(p.pos, p.pos + offsets[1]))
                                }
                            }
                        }
                    }
            }
            // attack right
            if (!checked || blockcheck[p.pos + offsets[2]]) {
                if (pinned[p.pos] == 0 || pinned[p.pos] == 5) {
                    if (board.pos[p.pos + offsets[2]] != null) {
                        if (edges[5] > 0 && board.pos[p.pos + offsets[2]].col != p.col) {
                            if (promotion) {
                                this.promotePawn(p, p.pos+offsets[2], moves)
                            } else {
                                moves.push(new Move(p.pos, p.pos + offsets[2]))
                            }
                        } else if (edges[5] > 0 && onlyAttacks) {
                            moves.push(new Move(p.pos, p.pos + offsets[2]))
                        }
                    } else if (edges[5] > 0 && onlyAttacks) {
                        moves.push(new Move(p.pos, p.pos + offsets[2]))
                    }
                }
            }
            // attack left
            if (!checked || blockcheck[p.pos + offsets[3]]) {
                if (pinned[p.pos] == 0 || pinned[p.pos] == 7) {
                    if (board.pos[p.pos + offsets[3]] != null) {
                        if (edges[7] > 0 && board.pos[p.pos + offsets[3]].col != p.col) {
                            if (promotion) {
                                this.promotePawn(p, p.pos+offsets[3], moves)
                            } else {
                                moves.push(new Move(p.pos, p.pos + offsets[3]))
                            }
                        } else if (edges[7] > 0 && onlyAttacks) {
                            moves.push(new Move(p.pos, p.pos + offsets[3]))
                        }
                    } else if (edges[7] > 0 && onlyAttacks) {
                        moves.push(new Move(p.pos, p.pos + offsets[3]))
                    }
                }
            }

            if (p.pos >= 24 && p.pos <= 31) {
                for (let i = -1; i < 2; i+=2) {
                    if (!blocked[p.pos + i - 8]) {
                        if (!checked || blockcheck[p.pos + i - 8]) {
                            let edgeoff = i == -1 ? 2 : 3
                            if (pinned[p.pos] == 0 || pinned[p.pos] == 6 + (-i)) {
                                if (board.pos[p.pos + i] != null && board.enPassant == p.pos + i && edges[edgeoff] > 0) {
                                    moves.push(new Move(p.pos, p.pos - 8 + i, board.pos[p.pos + i]))
                                }
                            }
                        }
                    }
                }
            }  
        }

        // 0 north 1 south 2 west 3 east 4 northwest 5 southeast 6 northeast 7 southwest

        if (p.col == 1) {
            if (!onlyAttacks) { 
                // one forward
                if (!checked || blockcheck[p.pos + offsets[0]]) {
                    if (pinned[p.pos] == 1 || pinned[p.pos] == 0) {
                        if (edges[0] > 0 && board.pos[p.pos + offsets[0]] == null) {
                            if (promotion) {
                                this.promotePawn(p, p.pos + offsets[0], moves)
                            } else {
                                moves.push(new Move(p.pos, p.pos + offsets[0]))
                            }
                        }
                    }
                }
                // two forward
                if (!checked || blockcheck[p.pos + offsets[1]]) {
                    if (pinned[p.pos] == 1 || pinned[p.pos] == 0) {
                        if (edges[0] > 1 && board.pos[p.pos + offsets[1]] == null && board.pos[p.pos + offsets[0]] == null && !p.moved) {
                                if (promotion) {
                                    this.promotePawn(p, p.pos + offsets[1], moves)
                                } else {
                                    moves.push(new Move(p.pos, p.pos + offsets[1]))
                                }
                            }
                        }
                    }
            }
            // attack left
            if (!checked || blockcheck[p.pos + offsets[2]]) {
                if (pinned[p.pos] == 0 || pinned[p.pos] == 5)  {
                    if (board.pos[p.pos + offsets[2]] != null) {
                        if (edges[4] > 0 && board.pos[p.pos + offsets[2]].col != p.col) {
                            if (promotion) {
                                this.promotePawn(p, p.pos+offsets[2], moves)
                            } else {
                                moves.push(new Move(p.pos, p.pos + offsets[2]))
                            }
                        } else if (edges[4] > 0 && onlyAttacks) {
                            moves.push(new Move(p.pos, p.pos + offsets[2]))
                        }
                    } else if (edges[4] > 0 && onlyAttacks) {
                        moves.push(new Move(p.pos, p.pos + offsets[2]))
                    }
                }
            }
            // attack right
            if (!checked || blockcheck[p.pos + offsets[3]]) {
                if (pinned[p.pos] == 0 || pinned[p.pos] == 7) {
                    if (board.pos[p.pos + offsets[3]] != null) {
                        if (edges[6] > 0 && board.pos[p.pos + offsets[3]].col != p.col) {
                            if (promotion) {
                                this.promotePawn(p, p.pos+offsets[3], moves)
                            } else {
                                moves.push(new Move(p.pos, p.pos + offsets[3]))
                            }
                        } else if (edges[6] > 0 && onlyAttacks) {
                            moves.push(new Move(p.pos, p.pos + offsets[3]))
                        }
                    } else if (edges[6] > 0 && onlyAttacks) {
                        moves.push(new Move(p.pos, p.pos + offsets[3]))
                    }
                }
            }
            
            if (p.pos >= 32 && p.pos <= 39) {
                for (let i = -1; i < 2; i+=2) {
                    if (!blocked[p.pos + i + 8]) {
                        if (!checked || blockcheck[p.pos + i + 8]) {
                            let edgeoff = i == -1 ? 2 : 3
                            if (pinned[p.pos] == 0 || pinned[p.pos] == 6 + i)
                            if (board.pos[p.pos + i] != null && board.enPassant == p.pos + i && edges[edgeoff] > 0) {
                                moves.push(new Move(p.pos, p.pos + 8 + i, board.pos[p.pos + i]))
                            }
                        }
                    }
                }
            }   
        }
    }

    promotePawn(piece, target, moves) {
        for (let i = 2; i < 6; i++) {
            moves.push(new Move(piece.pos, target, null, null, i))
        }
    }

    generateSlidingPieces(p, moves, edges, blockcheck=new Uint8Array(64), checked=false, pinned=new Uint8Array(64), onlyAttacks=false) {
        var offsets = [8, -8, -1, 1, 7, -7, 9, -9]
        let start = 0
        let end = 8
        if (p.type == 2) {
            start = 0
            end = 4
        } else if (p.type == 4) {
            start = 4
            end = 8
        } if (pinned[p.pos] != 0) {
            let newstart = pinned[p.pos] - 1
            let newend = newstart + 2
            // console.log(newstart, newend, start, end)
            if (!(start <= newstart && newstart <= end) || !(start <= newend && newend <= end)) {
                return
            }
            start = newstart
            end = newend
        }
        for (let dir = start; dir < end; dir++) {
            let target  = 0
            for (let n = 0; n < edges[dir]; n++) {
                target = p.pos + offsets[dir] * (n+1)
                if (board.pos[target] != null) {
                    if (board.pos[target].col != p.col) {
                        if (!checked || blockcheck[target]) {
                            moves.push(new Move(p.pos, target))
                        } if (!(onlyAttacks && board.pos[target].type == 6 && board.pos[target].col != board.col)) {
                            if (onlyAttacks) {
                                moves.push(new Move(p.pos, target))
                            }
                            break
                        }
                    } else if (!(onlyAttacks && board.pos[target].type == 6 && board.pos[target].col != board.col)) {
                        if (onlyAttacks) {
                            moves.push(new Move(p.pos, target))
                        }
                        break
                    } else {
                        continue
                    }
                }
                if (!checked || blockcheck[target]) {
                    moves.push(new Move(p.pos, target))
                }
            }
        }
    }

    generateKnight(p, moves, edges, blockcheck=new Uint8Array(64), checked=false, onlyAttacks=false) {
        var xoff = [2, 1, -1, -2, -2, -1, 1, 2]
        var yoff = [1, 2, 2, 1, -1, -2, -2, -1]
        for (let i = 0; i < 8; i++) {
            let curx = xoff[i]
            let cury = yoff[i]
            let north = cury > 0 ? Math.abs(cury) : 0
            let south = cury < 0 ? Math.abs(cury) : 0
            let east = curx > 0 ? Math.abs(curx) : 0
            let west = curx < 0 ? Math.abs(curx) : 0
            let pos = north <= edges[0] && south <= edges[1] && west <= edges[2] && east <= edges[3]
            if (pos) {
                let target = p.pos + (cury * 8 + curx)
                if (board.pos[target] != null) {
                    if (board.pos[target].col == p.col) {
                        if (onlyAttacks) {
                            moves.push(new Move(p.pos, target))
                        }
                        continue
                    } else {
                        if (!checked || blockcheck[target]) {
                            moves.push(new Move(p.pos, target))
                        }
                        continue
                    }
                } if (!checked || blockcheck[target]) {
                    moves.push(new Move(p.pos, target))
                }
            }
        }

    }

    generateKing(p, moves, edges, attacked=new Uint8Array(64), checked=new Array(), onlyAttacks=false) {
        var offsets = [8, -8, -1, 1, 7, -7, 9,-9]
        for (let i = 0; i < 8; i++) {
            if (edges[i] > 0) {
                let target = p.pos + offsets[i]
                if (board.pos[target] != null && !attacked[target]) {
                    if (board.pos[target].col == p.col) {
                        if (onlyAttacks) {
                            moves.push(new Move(p.pos, target))
                        }
                        continue
                    } else {
                        moves.push(new Move(p.pos, target))
                    }
                } else if (!attacked[target]) {
                    moves.push(new Move(p.pos, target))
                }
            }
        }

        // castle
        if (checked.length == 0) {
            if (p.col == 1) {
                if (board.pos[4] != null && !board.pos[4].moved && p.pos == 4) {
                    if (!p.moved) {
                        if (board.pos[7] != null && !attacked[6] && !attacked[5]) {
                            if (!board.pos[7].moved) {
                                if (board.pos[5] == null && board.pos[6] == null) {
                                    moves.push(new Move(4, 6, null, [7, 5]))
                                }
                            }
                        }
                        if (board.pos[0] != null && !attacked[2] && !attacked[3]) {
                            if (!board.pos[0].moved) {
                                if (board.pos[1] == null && board.pos[2] == null && board.pos[3] == null) {
                                    moves.push(new Move(4, 2, null, [0, 3]))
                                }
                            }
                        }
                    }
                }
            }

            if (p.col == 0) {
                if (board.pos[60] != null && !board.pos[60].moved && p.pos == 60) {
                    if (!p.moved) {
                        if (board.pos[63] != null && !attacked[62] && !attacked[61]) {
                            if (!board.pos[63].moved) {
                                if (board.pos[62] == null && board.pos[61] == null) {
                                    moves.push(new Move(60, 62, null, [63, 61]))
                                }
                            }
                        }
                        if (board.pos[56] != null) {
                            if (!board.pos[56].moved && !attacked[58] && !attacked[59]) {
                                if (board.pos[57] == null && board.pos[58] == null && board.pos[59] == null) {
                                    moves.push(new Move(60, 58, null, [56, 59]))
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}