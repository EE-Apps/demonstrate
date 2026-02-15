window.ws.connect()

function sendClick(num) {
    window.ws.sendSet('click', num)
}