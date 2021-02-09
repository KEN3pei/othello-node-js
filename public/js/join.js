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

socket.on('settingCurrentPlayer', player => {
    playerhtml.innerHTML = `player${player}の番です`
})

socket.on('disconnect', (reason) => {
    console.log(reason)
})

socket.on('makeOthelloTable', (array, player) => {
    socket.emit('getClickEventArray', makeOthelloTable(array), array, player)
    socket.on('showOthelloTable', (html, clickEventArray) => {
        othelloHtml.innerHTML = html
        const urlArray = url.slice(1).split('&')
        const roomname = urlArray[0].slice(5)
        const urlplayer = urlArray[1].slice(7)
        socket.emit('getCurrentPlayer', roomname, (currentPlayer) => {
            if(Number(currentPlayer) === Number(urlplayer)){
                if(clickEventArray.length === 0){
                    socket.emit('getMessage', '置くところがないのでplayerを交代します')
                    // 最初からあると他の人も見えてしまう
                    document.getElementById('btn').style.display = "block"
                }else{
                    document.getElementById('btn').style.display = "none"
                }
                for (let index = 0; index < clickEventArray.length; index++) {
                    let id = `x:${clickEventArray[index][1]},y:${clickEventArray[index][0]}`
                    document.getElementById(id).addEventListener('click', {id: id, handleEvent: getXandY});
                    document.getElementById('btn').addEventListener('click', {id: 'x:0,y:0', handleEvent: getXandY});
                }
            }
        })
    })
})

// rooms.htmlにて表示される
function makeOthelloTable(array){
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

socket.on('deleteEvent', (clickEventArray) => {
    for (let index = 0; index < clickEventArray.length; index++) {
        let id = `x:${clickEventArray[index][1]},y:${clickEventArray[index][0]}`
        document.getElementById(id).removeEventListener('click', {id: id, handleEvent: getXandY});
    }
})

function getXandY(event){
    const urlArray = url.slice(1).split('&')
    const player = urlArray[1].slice(7)
    const roomname = urlArray[0].slice(5)
    // roomnameにあるplayerStatusと一致するか確認する
    socket.emit('getCurrentPlayer', roomname, (currentPlayer) => {
        if(currentPlayer === player){
            socket.emit('startGame', this.id.split(','), player, roomname)
        }else{
            socket.emit('getMessage', `player${currentPlayer}が操作中です`)
        }
    })
    return
}

socket.on('href', (url) => {
    console.log(url)
    window.location.href = `${url}`
})
