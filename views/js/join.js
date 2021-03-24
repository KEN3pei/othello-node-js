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
                visibleBtn('btn')
            }else{
                hiddenBtn('btn')
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
    hiddenBtn('btn')
    if(urlplayer === '2'){
        visibleBtn('finbtn2')
    }else{
        visibleBtn('finbtn')
    }
})

socket.on('href', (url) => {
    window.location.href = `${url}`
})


// ---以下関数--- //

function changePlayer(){
    const {urlplayer, roomname} = getObjectFromurl()
    socket.emit('chengePlayerFunc', roomname, urlplayer)
    hiddenBtn('btn')
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