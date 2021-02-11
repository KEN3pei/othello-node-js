'use strict'

const socket = io('/roomList')
let div = document.getElementById('addForm')
let roomnames = document.getElementById('roomNames')

socket.on('message', message => {
    div.innerHTML += message
    console.log(message)
})
socket.on('setRoomNames', names => {
    roomnames.innerHTML += `<li class="roomname" onclick="joinThisRoom()">${names}</li>`
    console.log(names)
})
socket.on('deleteRoomNames', names => {
    roomnames.innerHTML = ""
})
socket.on('getHtml', html => {
    let addForm = document.getElementById('addForm')
    div.innerHTML += addForm
})

function onClickSubmit(){
    const roomname = document.getElementById('myroom').value
    // const username = document.getElementById('username').value
    socket.emit('createRoom', roomname)
    window.location.href = `./join?name=${roomname}&player=1`
}
function joinThisRoom(e){
    var e = e || window.event;
    var elem = e.target || e.srcElement;
    console.log(elem)
    const roomname = elem.innerHTML;
    window.location.href = `./join?name=${roomname}&player=2`
}


