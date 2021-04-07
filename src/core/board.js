class Board {
    constructor() {
        this.pos = new Array(64)
        this.col = 1
        this.enPassant = null
        this.checked = false
        this.kingWhite = null
        this.kingBlack = null
        this.checkMate = false
        this.movesMade = 0
        this.moves = new Array()
        this.movesHistory = new Array()
        this.hash = 0
        this.history = new Array()
    }

    setup () {

        this.pos = new Array(64)

        for (let i = 8; i < 16; i++) {
            this.pos[i] = new Piece(i, 1, 1)
            this.pos[i + 40] = new Piece(i + 40, 1, 0)
        }

        // Rooks
        this.pos[0] = new Piece(0, 2, 1)
        this.pos[7] = new Piece(7, 2, 1)
        this.pos[56] = new Piece(56, 2, 0)
        this.pos[63] = new Piece(63, 2, 0)

        // Knights
        this.pos[1] = new Piece(1, 3, 1)
        this.pos[6] = new Piece(6, 3, 1)
        this.pos[57] = new Piece(57, 3, 0)
        this.pos[62] = new Piece(62, 3, 0)

        // Bishops
        this.pos[2] = new Piece(2, 4, 1)
        this.pos[5] = new Piece(5, 4, 1)
        this.pos[58] = new Piece(58, 4, 0)
        this.pos[61] = new Piece(61, 4, 0)

        // Queens
        this.pos[3] = new Piece(3, 5, 1)
        this.pos[59] = new Piece(59, 5, 0)

        // Kings
        this.pos[4] = new Piece(4, 6, 1)
        this.pos[60] = new Piece(60, 6, 0)

        this.kingWhite = 4
        this.kingBlack = 60

        this.hash = hash()
    }

    makeMove(move) {
        this.enPassant = null
        if (this.pos[move.startSq].type == 6) {
            if (this.pos[move.startSq].col == 1) {
                this.kingWhite = move.endSq
            } else {
                this.kingBlack = move.endSq
            }
        }
        if (this.pos[move.startSq].type == 1 && Math.abs(move.startSq - move.endSq) == 16) {
            this.enPassant = move.endSq
        } if (move.endSq == null) {
            this.hash = xor(this.hash, zobristTable[move.startSq][this.pos[move.startSq].type - 1 + this.col * 6]) // removing piece without end pos
            this.pos[move.startSq] = null
            return
        } if (move.castle != null) {
            this.hash = xor(this.hash, zobristTable[move.castle[0]][1]) // removing castling rook
            this.pos[move.castle[1]] = this.pos[move.castle[0]]
            this.pos[move.castle[1]].pos = move.castle[1]
            this.pos[move.castle[1]].moved = false
            this.pos[move.castle[0]] = null
            this.hash = xor(this.hash, zobristTable[move.castle[1]][1]) // adding castling rook
        } if (move.enPassant != null) {
            this.hash = xor(this.hash, zobristTable[move.enPassant.pos][0]) // removing enPassant
            this.pos[move.enPassant.pos] = null
        }
        if (this.pos[move.endSq] != null) {
            this.hash = xor(this.hash, zobristTable[move.endSq][this.pos[move.endSq].type - 1 + this.col * 6]) // removing capture from hash
        }
        this.hash = xor(this.hash, zobristTable[move.startSq][this.pos[move.startSq].type - 1 + this.col * 6]) // removing piece from hash
        this.pos[move.endSq] = this.pos[move.startSq]
        this.pos[move.endSq].pos = move.endSq
        this.pos[move.endSq].moved = true
        this.pos[move.startSq] = null
        if (move.promotionType) {
            this.pos[move.endSq].type = move.promotionType
        }
        this.hash = xor(this.hash, zobristTable[move.endSq][this.pos[move.endSq].type - 1 + this.col * 6]) // adding piece to hash
        this.col = this.col == 0 ? 1 : 0
        this.hash = xor(this.hash, colorTable[board.col])
        this.history.push(this.hash)
    }

    unmakeMove(move) {
        if (this.pos[move.endSq].type == 6) {
            if (this.pos[move.endSq].col == 1) {
                this.kingWhite = move.startSq
            } else {
                this.kingBlack = move.startSq
            }
        }
        if (this.pos[move.endSq].type == 1 && Math.abs(move.startSq - move.endSq) == 16) {
            this.enPassant = null
        } if (move.startSq == null) {
            this.pos[move.startSq] = move.enPassant
            return
        } if (move.castle != null) {
            this.hash = xor(this.hash, zobristTable[move.castle[1]][1]) // removing castling rook
            this.pos[move.castle[0]] = this.pos[move.castle[1]]
            this.pos[move.castle[0]].pos = move.castle[0]
            this.pos[move.castle[0]].moved = false
            this.pos[move.castle[1]] = null
            this.hash = xor(this.hash, zobristTable[move.castle[0]][1]) // adding castling rook
        }
        this.hash = xor(this.hash, zobristTable[move.endSq][this.pos[move.endSq].type - 1 + this.col * 6]) // removing piece from hash
        this.pos[move.startSq] = this.pos[move.endSq]
        this.pos[move.startSq].pos = move.startSq
        this.pos[move.startSq].moved = !move.movedChanged
        if (move.attack != null) {
            this.hash = xor(this.hash, zobristTable[move.attack.pos][move.attack.type - 1 + 6 * (1 - this.col)]) // adding captured piece
        }
        this.pos[move.endSq] = move.attack
        if (move.enPassant) {
            this.hash = xor(this.hash, zobristTable[move.enPassant.pos][0]) // adding enPassant
            this.pos[move.enPassant.pos] = move.enPassant
        } if (move.promotionType) {
            this.pos[move.startSq].type = 1
        }
        this.hash = xor(this.hash, zobristTable[move.startSq][this.pos[move.startSq].type - 1 + this.col * 6]) // adding piece to hash
        this.col = this.pos[move.startSq].col
        this.hash = xor(this.hash, colorTable[board.col])
        this.history.pop()
    }

    fen() {
        let fen = ""
        let ind = 0
        for (let i = 63; i > -1; i--) {
            let x = 7 - i % 8
            let y = Math.floor(i / 8)
            let xy = y * 8 + x

            if (this.pos[xy] == null) {
                ind++
                if (i != 0 && i % 8 == 0) {
                    fen += ind + "/"
                    ind = 0
                }
            } else {
                if (ind >= 1) {
                    fen += ind.toString()
                    ind = 0
                }
                fen += getLookup(this.pos[xy].type, this.pos[xy].col)
                if (i != 0 && i % 8 == 0) {
                    fen += "/"
                }
            }

        }
        if (ind != 0) {
            fen += ind
        }
        return fen
    }

    setFen(fen) {
        this.pos = new Array(64)
        let ind = 0
        for (let cur of fen.split(" ")[0]) {
            if (cur == "/") {
                continue
            }
            let row = 7 - Math.floor(ind / 8)
            let col = ind % 8
            let pos = row * 8 + col
            if (cur.match('^[0-9]+$')) {
                ind += parseInt(cur)
                continue
            } else {
                switch (cur.toLowerCase()) {
                    case "p":
                        this.pos[pos] = new Piece(pos, 1, cur.toLowerCase() === cur ? 0 : 1)
                        if (cur.toLowerCase() === cur && pos < 48) {
                            this.pos[pos].moved = true
                        } else if (cur.toLowerCase() !== cur && pos > 15) {
                            this.pos[pos].moved = true
                        }
                        break
                    case "r":
                        this.pos[pos] =new Piece(pos, 2, cur.toLowerCase() === cur ? 0 : 1)
                        break
                    case "n":
                        this.pos[pos] =new Piece(pos, 3, cur.toLowerCase() === cur ? 0 : 1)
                        break
                    case "b":
                        this.pos[pos] =new Piece(pos, 4, cur.toLowerCase() === cur ? 0 : 1)
                        break
                    case "q":
                        this.pos[pos] =new Piece(pos, 5, cur.toLowerCase() === cur ? 0 : 1)
                        break
                    case "k":
                        if (cur.toLowerCase() === cur) {
                            this.kingBlack = pos
                        } else {
                            this.kingWhite = pos
                        }
                        this.pos[pos] =new Piece(pos, 6, cur.toLowerCase() === cur ? 0 : 1)
                        break
                }
            }
            ind++
        }
        this.col = fen.split(" ")[1] == "w" ? 1 : 0
        let castle = fen.split(" ")[2]
        let rights = [castle.includes("K"), castle.includes("Q"), castle.includes("k"), castle.includes("q")]
        if (!rights[0]) {
            if (board.pos[7] != null) {
                board.pos[7].moved = true
            }
        } if (!rights[1]) {
            if (board.pos[0] != null) {
                board.pos[0].moved = true
            }
        } if (!rights[2]) {
            if (board.pos[63] != null) {
                board.pos[63].moved = true
            }
        } if (!rights[3]) {
            if (board.pos[56] != null) {
                board.pos[56].moved = true
            }
        } 
        let enPassant = fen.split(" ")[3]
        let enInd = enPassant[0].charCodeAt(0) - 97 + (enPassant[1] - 1) * 8
        enInd = this.col == 0 ? enInd + 8 : enInd - 8
        if (enInd >= 0 && enInd <= 63) {
            this.enPassant = enInd
        }

        this.hash = hash()
    }

}