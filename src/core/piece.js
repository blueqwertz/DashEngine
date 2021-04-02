class Piece {
    constructor(pos, type, col) {
        this.pos = pos
        // 1 Pawn, 2 Rook, 3 Knight, 4 Bishop, 5 Queen, 6 King
        this.type = type
        this.col = col
        this.moved = false
    }
}

class Move {
    constructor(sq, eq, enpa=null, castle=null, promotion=null) {
        this.startSq = sq
        this.endSq = eq
        this.enPassant = enpa
        this.attack = board.pos[this.endSq]
        this.castle = castle
        this.movedChanged = !board.pos[this.startSq].moved
        this.promotionType = promotion
    }
}