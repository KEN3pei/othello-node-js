'use strict'
// Express
const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)

// Mysql接続
// const mysql = require('mysql')
// const con = mysql.createConnection({
//     host: 'localhost',
//     user: 'ken',
//     password: '',
//     database: 'othelloExpress'
// })
// con.connect((err) => {
//     if (err) throw err;
//     console.log('Mysql Connected');
// })

// jsファイルをmoduleとして読み込み
const Redis = require('./redis.js')
const rogic = require('./logic.js')
const iniarray = rogic.iniArray()

// 静的ファイル配信
app.use(express.static(__dirname + '/public'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/finished', (req, res) => {
    const roomname = req.query.name
    res.json(roomname + "is Game 終了")
})

// socket.io使用
io.of('/Gamespace').on('connection', socket => {
    socket.on('getMessage', message => {
        socket.emit('message', message)
    })
    socket.on('joinRoom', async (name) => {
        try{
            const roomname = name[0].slice(5)
            const player = name[1].slice(7)

            await Redis.existCheckRoomnamesofMember(roomname)
            await Redis.createRoomStatusAndGetRoomStatus(roomname, Number(player), socket.id)
            
            socket.join(roomname)
            const othello = await Redis.setIniarrayAndGetOthello(roomname, rogic.iniArray())
            socket.emit('makeOthelloTable', JSON.parse(othello), player)

            // defaultのゲーム開始時のユーザを設定
            await Redis.createPlayerStatus(roomname, player)
            const playerStatus = await Redis.getPlayerStatus(roomname)
            socket.emit('settingCurrentPlayer', playerStatus)
            socket.to(roomname).broadcast.emit('settingCurrentPlayer', playerStatus)
            
        }catch(err){
            console.log(err)
            socket.emit('href', '/rooms.html')
        }
    })
    socket.on('getCurrentPlayer', async (roomname, cb) => {
        const currentPlayer = await Redis.getPlayerStatus(roomname)
        cb(currentPlayer)
    })

    socket.on('startGame', async (elem_id, player, roomname) => {
        const x = Number(elem_id[0].slice(2))
        const y = Number(elem_id[1].slice(2))
        const othelloArray = await Redis.client.hget("othellos", roomname)

        // count place to put it
        const count = await rogic.countOthelloSet(JSON.parse(othelloArray), Number(player))

        if(count !== 0){
            // get updated othello
            const result = await rogic.allSettledOthello(x, y, JSON.parse(othelloArray), Number(player))
            // redis & Browser update
            if(othelloArray !== JSON.stringify(result)){
                const updatedArray = await Redis.updateOthellosAndGetOthellos(roomname, result)
                // Eventdelete
                const clickEventArray = await rogic.arrayPutOnClickEventFunc(JSON.parse(othelloArray), player)
                socket.emit('deleteEvent', clickEventArray)

                player = 3 - Number(player)
                await Redis.updatePlayerStatus(roomname, player)

                // socket.to(roomname).emit('makeOthelloTable', JSON.parse(updatedArray), player)
                socket.emit('makeOthelloTable', JSON.parse(updatedArray), player)
                socket.to(roomname).broadcast.emit('makeOthelloTable', JSON.parse(updatedArray), player)
                socket.emit('settingCurrentPlayer', player)
                socket.to(roomname).broadcast.emit('settingCurrentPlayer', player)
            }
        }else{
            // playerを変えても0か調べる
            player = 3 - Number(player)
            const nextplayerCount = await rogic.countOthelloSet(JSON.parse(othelloArray), Number(player))
            if(nextplayerCount === 0){
                console.log("ゲーム終了")
                // delete room data
                await Promise.all([
                    Redis.deleteRoomnamesOfRoomname(roomname),
                    Redis.deleteOthellosRoom(roomname),
                    Redis.deletePlayerStatus(roomname),
                    Redis.deleteRoomStatus(roomname)
                ])
                // Mysqlに永続化

                // fin
                socket.emit('href', `/finished?name=${roomname}&player=${player}`)
                socket.to(roomname).broadcast.emit('href', `/finished?name=${roomname}&player=${player}`)
            }else{
                const reply = await Redis.updatePlayerStatus(roomname, player)
                socket.emit('makeOthelloTable', JSON.parse(othelloArray), player)
                socket.to(roomname).broadcast.emit('makeOthelloTable', JSON.parse(othelloArray), player)
                socket.emit('settingCurrentPlayer', player)
                socket.to(roomname).broadcast.emit('settingCurrentPlayer', player)
            }
        }
    })
    socket.on('getClickEventArray', async (html, array, player) => {
        const clickEventArray = await rogic.arrayPutOnClickEventFunc(array, player)
        socket.emit('showOthelloTable', `${html}`, clickEventArray)
    })
    socket.on('disconnecting', async (reason) => {
        console.log(reason)
        let dataWhenDisconnecting = []
        socket.rooms.forEach((value) => {
            dataWhenDisconnecting.push(value)
        })
        const player1Id = await Redis.getRoomStatus(dataWhenDisconnecting[1], 1)
        const player2Id = await Redis.getRoomStatus(dataWhenDisconnecting[1], 2)
        if(player1Id === dataWhenDisconnecting[0]){
            // delete処理
            await Redis.deleteRoomStatusOfPlayer(dataWhenDisconnecting[1], 1)
            socket.to(socket.id).emit('connect')
        }else if(player2Id === dataWhenDisconnecting[0]){
            await Redis.deleteRoomStatusOfPlayer(dataWhenDisconnecting[1], 2)
            socket.to(socket.id).emit('connect')
        }
    })
})

io.of('/roomList').on('connection', async socket => {
    const roomMembers = await Redis.getRoomnamesMembers()
    for (let room of roomMembers){
        socket.emit('setRoomNames', room)
    }
    // room作成時重複しなければjoin&room作成&全ユーザに配信
    socket.on('createRoom', async (name) => {
        try{
            const roomMembers = await Redis.addRoomnamesAndGetMembers(name)
            socket.broadcast.emit('deleteRoomNames')
            for (let room of roomMembers){
                socket.broadcast.emit('setRoomNames', room)
            }
        }catch(err){
            console.log('エラー')
            // ページ遷移させない
        }
    })
})

http.listen(3000)