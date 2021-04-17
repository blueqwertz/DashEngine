var zobristTable = new Array(64)
var colorTable = new Array(2)

for (let i = 0; i < 64; i++) {
    zobristTable[i] = new Array(12)
    for (let j = 0; j < 12; j++) {
        zobristTable[i][j] = randomUint64()
    }
    colorTable[0] = randomUint64()
    colorTable[1] = randomUint64()
    function randomUint64() {
        return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
    }
}

function hash(position = board.pos) {
    let h = 0
    for (let pos of position) {
        if (pos != null) {
            h = xor(h, zobristTable[pos.pos][pos.type - 1 + pos.col * 6])
        }
    }
    h = xor(h, colorTable[board.col])
    return h
}

var zeros = ""
for (var i = 0; i < 32; i = (i + 1) | 0) {
    zeros += "0"
}

function divide(bit) {
    var bitString = (zeros + zeros + Number(bit).toString(2)).slice(-64)

    return [parseInt(bitString.slice(0, 32), 2), parseInt(bitString.slice(-32), 2)]
}

function pad(bit) {
    return (zeros + bit.toString(2)).slice(-32)
}

var Hi = 0
var Lo = 1

function xor(a, b) {
    var _a = divide(a)
    var _b = divide(b)
    return parseInt(pad((_a[Hi] ^ _b[Hi]) >>> 0) + pad((_a[Lo] ^ _b[Lo]) >>> 0), 2)
}
