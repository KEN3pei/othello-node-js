'use strict'

const socket = io('/Gamespace')
let othelloHtml = document.getElementById('othello')
let div = document.getElementById('joinedDiv')
let playerhtml = document.getElementById('player')
let messageArea = document.getElementById('messageArea')
let messageArea2 = document.getElementById('messageArea2')
let url = location.search;

socket.on('afterConnecting', () => {
    const {urlplayer, roomname} = getObjectFromurl()
    socket.emit('joinRoom', roomname, urlplayer)
})

socket.on('message', message => {
    messageArea.innerHTML = message
    setTimeout(() => {
        messageArea.innerHTML = ""
    }, 5000)
})

socket.on('addHtml', html => {
    div.innerHTML += html
})

socket.on('settingCurrentPlayer', player => {
    playerhtml.innerHTML = `player${player}の番です`
})

socket.on('makeOthelloTable', (array, player) => {
    othelloHtml.innerHTML = makeOthelloTable(array)
    const {urlplayer, roomname} = getObjectFromurl()
    socket.emit('getClickEventArray', array, player, roomname)
    socket.once('addClickEvent', (clickEventArray, currentPlayer) => {
        if(Number(currentPlayer) === Number(urlplayer)){
            if(clickEventArray.length === 0){
                socket.emit('getMessage', '置くところがないのでplayerを交代します')
                visibleBtn()
            }else{
                hiddenBtn()
            }
            for (let index = 0; index < clickEventArray.length; index++) {
                let id = `x:${clickEventArray[index][1]},y:${clickEventArray[index][0]}`
                document.getElementById(id).addEventListener('click', {id: id, handleEvent: getXandY});
            }
        }
    })
})

socket.on('finishEvent', () => {
    const {urlplayer} = getObjectFromurl()
    console.log(typeof urlplayer)
    hiddenBtn()
    if(urlplayer === '2'){
        visiblefinBtn2()
    }else{
        visiblefinBtn()
    }
})

socket.on('href', (url) => {
    console.log(url)
    window.location.href = `${url}`
})


// ---以下関数--- //

function changePlayer(){
    const {urlplayer, roomname} = getObjectFromurl()
    socket.emit('chengePlayerFunc', roomname, urlplayer)
    hiddenBtn()
}

// rooms.htmlにて表示される
function makeOthelloTable(array){
    let html = "<table border='1'>"
    for (let y = 1; y < 5 ; y++) {
        html += "<tr>"
        for (let x = 1; x < 5 ; x++) {
            let x_y = `x:${x},y:${y}`
            if(array[y][x] === 1){
                html += `<td id = "${x_y}" class="icon othello"><span class="icon-black"></span></td>`
            }else if(array[y][x] === 2){
                html += `<td id = "${x_y}" class="icon othello"><span class="icon-white"></span></td>`
            }else{
                html += `<td id = "${x_y}" class="icon othello"><span class="icon-emsp"></span></td>`
            }
        }
        html += "</tr>"
    }
    html += "</table>"
    return html
}

function getXandY(){
    const {urlplayer, roomname} = getObjectFromurl()
    // roomnameにあるplayerStatusと一致するか確認する
    socket.emit('getCurrentPlayertohundler', roomname, 'gameHundler')
    socket.on('gameHundler', (currentPlayer) => {
        if(currentPlayer === urlplayer){
            socket.emit('startGame', this.id.split(','), urlplayer, roomname)
        }else{
            socket.emit('getMessage', `player${currentPlayer}が操作中です`)
        }
    })
    return
}

// urlからplayer,roomnameを取得
function getObjectFromurl(){
    const urlArray = url.slice(1).split('&')
    const player = urlArray[1].slice(7)
    const roomname = urlArray[0].slice(5)
    return {urlplayer: player, roomname: roomname}
}

function hiddenBtn(){
    document.getElementById('btn').style.display = "none"
}

function visibleBtn(){
    document.getElementById('btn').style.display = "block"
}

function visiblefinBtn(){
    document.getElementById('finbtn').style.display = "block"
}

function visiblefinBtn2(){
    document.getElementById('finbtn2').style.display = "block"
}

// データを保存せずに退出させる
function exitWithoutSaving(){
    const {roomname} = getObjectFromurl()
    socket.emit('dontSaveOthello', roomname, (result) => {
        console.log(result)
    })
    window.location.href = './rooms'
}
// データを保存してから退出させる
function saveAndExit(){
    const {roomname} = getObjectFromurl()
    socket.emit('lastSaveOthello', roomname, (result) => {
        console.log(result)
    })
    window.location.href = './rooms'
}