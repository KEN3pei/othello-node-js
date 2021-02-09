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
socket.on('setPlayerInfo', player => {
    playerhtml.innerHTML = `player${player}の番です`
})

socket.on('disconnect', (reason) => {
    // socket.connect()
    console.log(reason)
})

socket.on('viewOthello', (array, player) => {
    socket.emit('getHtml', htmlFromOthello(array), array, player)
})

// rooms.htmlにて表示される
function htmlFromOthello(array){
    let html = "<table border='1'>"
    for (let y = 1; y < 5 ; y++) {
        html += "<tr>"
        for (let x = 1; x < 5 ; x++) {
            let x_y = `x:${x},y:${y}`
            if(array[y][x] === 1){
                html += `<td id = "${x_y}" class="icon othello">●</td>`
            }else if(array[y][x] === 2){
                html += `<td id = "${x_y}" class="icon othello">◯</td>`
            }else{
                html += `<td id = "${x_y}" class="icon othello">&emsp;</td>`
            }
        }
        html += "</tr>"
    }
    html += "</table>"
    return html
}

socket.on('setOthelloHtml', (html, putxandy) => {
    othelloHtml.innerHTML = html
    const urlArray = url.slice(1).split('&')
    const roomname = urlArray[0].slice(5)
    const urlplayer = urlArray[1].slice(7)
    socket.emit('checkPlayer', roomname, (status) => {
        // console.log(status, typeof status, urlplayer)
        if(Number(status) === Number(urlplayer)){
            if(putxandy.length === 0){
                socket.emit('getMessage', '置くところがないのでplayerを交代します')
                // 最初からあると他の人も見えてしまう
                document.getElementById('btn').style.display = "block"
            }else{
                document.getElementById('btn').style.display = "none"
            }
            for (let index = 0; index < putxandy.length; index++) {
                let id = `x:${putxandy[index][1]},y:${putxandy[index][0]}`
                document.getElementById(id).addEventListener('click', {id: id, handleEvent: getXandY});
                document.getElementById('btn').addEventListener('click', {id: 'x:0,y:0', handleEvent: getXandY});
            }
        }
    })
})

socket.on('deleteEvent', (putxandy) => {
    for (let index = 0; index < putxandy.length; index++) {
        let id = `x:${putxandy[index][1]},y:${putxandy[index][0]}`
        document.getElementById(id).removeEventListener('click', {id: id, handleEvent: getXandY});
    }
})

function getXandY(event){
    const urlArray = url.slice(1).split('&')
    const player = urlArray[1].slice(7)
    const roomname = urlArray[0].slice(5)
    // roomnameにあるplayerStatusと一致するか確認する
    socket.emit('checkPlayer', roomname, (playerStatus) => {
        if(playerStatus === player){
            socket.emit('startGame', this.id.split(','), player, roomname)
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
