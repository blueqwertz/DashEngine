class TranspositionTable {
    constructor() {
        this.tableSize = 2000000
        this.table = new Array(this.tableSize)
    }

    lookup(hash) {
        return this.table[hash % this.tableSize]
    }

    store(hash, score, depth, flag) {
        this.table[hash % this.tableSize] = [score, depth, flag]
    }

    clear() {
        this.table = new Array(this.tableSize)
    }
}
