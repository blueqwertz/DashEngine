function formatTime(time) {
    let minutes = Math.floor(time / 60)
    let seconds = makeFull(Math.floor(time - minutes * 60))
    if (minutes == 0) {
        let seconds = Math.floor(time)
        time -= seconds
        let milli = Math.ceil(time * 10)
        if (milli == 10) {
            seconds++
            milli = 0
        }
        return seconds + "." + milli
    }
    return minutes + ":" + seconds
}

function makeFull(x) {
    if (x < 10) {
        return "0" + x
    }
    return x
}

function animateValue(start = 0, end = 100, duration = 300, steps = 100) {
    if (start === end) return
    var range = end - start
    var current = start
    steps = Math.max(1, steps)
    var increment = (end - start) / steps
    var stepTime = Math.abs(Math.floor(duration / (range / increment)))
    var timer = setInterval(function () {
        changeTime(current, 0)
        changeTime(current, 1)
        if (end > start ? current >= end : current <= end) {
            changeTime(end, 0)
            changeTime(end, 1)
            clearInterval(timer)
        }
        current += increment
    }, stepTime)
}

function changeTime(time, col) {
    let format = formatTime(time)

    if (col == 1) {
        document.getElementById("time-white").innerHTML = format
        return
    }
    document.getElementById("time-black").innerHTML = format

    if (col == 1) {
        if (time < 10 && timer != null) {
            document.getElementById("time-white").classList.add("low")
            document.getElementById("time-black").classList.remove("low")
        } else {
            document.getElementById("time-black").classList.remove("low")
            document.getElementById("time-black").classList.remove("low")
        }
        document.getElementById("time-white").innerHTML = seconds + "." + milli
        return
    }
    if (time < 10 && timer != null) {
        document.getElementById("time-black").classList.add("low")
        document.getElementById("time-white").classList.remove("low")
    } else {
        document.getElementById("time-white").classList.remove("low")
        document.getElementById("time-black").classList.remove("low")
    }
}

changeTime(timeall, 1)
changeTime(timeall, 0)

function updateTime() {
    if (!gameOver) {
        if (movegenerator.generateMoves().length == 0) {
            if (movegenerator.generateAttacksAndPins().checked.length > 0) {
                if (board.col == 1) {
                    scoreDash++
                    document.getElementById("win-draw").innerHTML = "DashEngine won!"
                    document.getElementById("score").innerHTML = `${scoreYou} - ${scoreDash}`
                }
                if (board.col == 0) {
                    scoreYou++
                    document.getElementById("win-draw").innerHTML = "You won!"
                    document.getElementById("score").innerHTML = `${scoreYou} - ${scoreDash}`
                }
            } else {
                scoreDash += 1 / 2
                scoreYou += 1 / 2
                document.getElementById("win-draw").innerHTML = "Draw"
                document.getElementById("score").innerHTML = `${scoreYou} - ${scoreDash}`
            }
            document.getElementById("win-loss-cont").classList.add("show")
            gameOver = true
        }
        if (checkDraw()) {
            scoreDash += 1 / 2
            scoreYou += 1 / 2
            document.getElementById("win-lostt-cont").classList.add("show")
            document.getElementById("win-draw").innerHTML = "Draw"
            document.getElementById("score").innerHTML = `${scoreYou} - ${scoreDash}`
            gameOver = true
        }
        let now = new Date()
        let timepassed = (now - lasttimestart) / 1000
        if (board.col == 1 || !isBack) {
            document.getElementById("user-black").classList.remove("cur")
            document.getElementById("user-white").classList.add("cur")
            timewhite -= timepassed
            changeTime(timewhite, 1)
        } else {
            document.getElementById("user-white").classList.remove("cur")
            document.getElementById("user-black").classList.add("cur")
            timeblack -= timepassed
            changeTime(timeblack, 0)
        }
        lasttimestart = new Date()

        if (timeblack < 0) {
            scoreYou++
            document.getElementById("win-draw").innerHTML = "You won!"
            document.getElementById("score").innerHTML = `${scoreYou} - ${scoreDash}`
            document.getElementById("win-loss-cont").classList.add("show")
            gameOver = true
            changeTime(timewhite, 1)
            changeTime(0, 0)
        } else if (timewhite < 0) {
            scoreDash++
            document.getElementById("win-draw").innerHTML = "DashEngine won!"
            document.getElementById("score").innerHTML = `${scoreYou} - ${scoreDash}`
            document.getElementById("win-loss-cont").classList.add("show")
            changeTime(0, 1)
            changeTime(timeblack, 0)
            gameOver = true
        }
    } else {
        document.getElementById("time-black").classList.remove("low")
        document.getElementById("time-white").classList.remove("low")
        clearInterval(timer)
        document.getElementById("timer").parentElement.classList.remove("inactive")
        timer = null
    }
}
