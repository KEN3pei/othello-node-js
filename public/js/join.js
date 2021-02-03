'use strict'

const socket = io('/Gamespace')
let othelloHtml = document.getElementById('othello')
let div = document.getElementById('joinedDiv')
let playerhtml = document.getElementById('player')
let messageArea = document.getElementById('messageArea')
let messageArea2 = document.getElementById('messageArea2')
let url = location.search;

socket.on('connect', () => {
    const urlArray = url.slice(1).split('&')
    socket.emit('joinRoom', urlArray, { allCookies: document.cookie })
})

socket.on('message', message => {
    messageArea.innerHTML = message
    setTimeout(() => {
        messageArea.innerHTML = ""
    }, 5000)
})
socket.on('message2', message => {
    messageArea2.innerHTML = message
    setTimeout(() => {
        messageArea2.innerHTML = ""
    }, 10000)
})

socket.on('addHtml', html => {
    div.innerHTML += html
})
socket.on('setOthelloHtml', html => {
    othelloHtml.innerHTML = html
})
socket.on('setPlayerInfo', player => {
    playerhtml.innerHTML = `player${player}の番です`
})

socket.on('disconnect', (reason) => {
    // socket.connect()
    console.log(reason)
})

socket.on('viewOthello', (array) => {
    socket.emit('getHtml', htmlFromOthello(array))
})

// rooms.htmlにて表示される
function htmlFromOthello(array){
    let html = "<table border='1'>"
    for (let y = 1; y < 5 ; y++) {
        html += "<tr>"
        for (let x = 1; x < 5 ; x++) {
            let x_y = `x:${x},y:${y}`
            if(array[y][x] === 1){
                html += `<td id = "${x_y}" class="icon othello" onclick="getXandY(this.id)">●</td>`
            }else if(array[y][x] === 2){
                html += `<td id = "${x_y}" class="icon othello" onclick="getXandY(this.id)">◯</td>`
            }else{
                html += `<td id = "${x_y}" class="icon othello" onclick="getXandY(this.id)">&emsp;</td>`
            }
        }
        html += "</tr>"
    }
    html += "</table>"
    return html
}

function getXandY(id){
    console.log(id)
    const urlArray = url.slice(1).split('&')
    const player = urlArray[1].slice(7)
    const roomname = urlArray[0].slice(5)
    // roomnameにあるplayerStatusと一致するか確認する
    socket.emit('checkPlayer', roomname)
    socket.on('result', playerStatus => {
        // console.log(playerStatus, elem.id.split(','), player, roomname)
        if(playerStatus === player){
            socket.emit('startGame', id.split(','), player, roomname)
        }else{
            socket.emit('getMessage', `player${playerStatus}が操作中です`)
        }
    })
    return
}
socket.on('reload', () => {
    location.reload()
})
socket.on('href', (url) => {
    console.log(url)
    window.location.href = `${url}`
})
