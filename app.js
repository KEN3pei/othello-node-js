'use strict'
// Express
const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)

// jsファイルをmoduleとして読み込み
const Redis = require('./redis.js')
const rogic = require('./logic.js')
const iniarray = rogic.iniArray()

// 静的ファイル配信
app.use(express.static(__dirname + '/views'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
// テンプレート読み込み
app.engine('pug', require('pug').__express) // docker環境だとこの行がないと表示されない
app.set('view engine', 'pug')
app.get('/join', (req, res) => {
    res.render('join', { title: 'join' })
})
app.get('/rooms', (req, res) => {
    res.render('rooms', { title: 'rooms' })
})
app.get('/finished', (req, res) => {
    const roomname = req.query.name
    res.render('finished', { title: 'finished' })
})

// socket.io使用
io.of('/Gamespace').on('connection', socket => {
    socket.emit('afterConnecting')
    socket.on('getMessage', message => {
        socket.emit('message', message)
    })
    socket.on('joinRoom', async (roomname, player) => {
        try{
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
            socket.emit('href', '/rooms')
        }
    })
    socket.on('getCurrentPlayertohundler', async (roomname, eventName) => {
        const currentPlayer = await Redis.getPlayerStatus(roomname)
        socket.emit(eventName, currentPlayer)
    })
    socket.on('chengePlayerFunc' , async (roomname, player) => {
        const othelloArray = await Redis.client.hget("othellos", roomname)
        player = 3 - Number(player)
        await Redis.updatePlayerStatus(roomname, player)

        const count = await rogic.countOthelloSet(JSON.parse(othelloArray), Number(player))
        if(count === 0){
            console.log("ゲーム終了")
            // Mysqlに永続化
            // fin
            socket.emit('finishEvent')
            socket.to(roomname).emit('finishEvent')
        }else{
            socket.emit('settingCurrentPlayer', player)
            socket.to(roomname).broadcast.emit('settingCurrentPlayer', player)
            socket.emit('makeOthelloTable', JSON.parse(othelloArray), player)
            socket.to(roomname).broadcast.emit('makeOthelloTable', JSON.parse(othelloArray), player)
        }
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
                player = 3 - Number(player)
                await Redis.updatePlayerStatus(roomname, player)

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
                // Mysqlに永続化
                socket.emit('finishEvent')
                socket.to(roomname).emit('finishEvent')
            }else{
                const reply = await Redis.updatePlayerStatus(roomname, player)
                socket.emit('makeOthelloTable', JSON.parse(othelloArray), player)
                socket.to(roomname).broadcast.emit('makeOthelloTable', JSON.parse(othelloArray), player)
                socket.emit('settingCurrentPlayer', player)
                socket.to(roomname).broadcast.emit('settingCurrentPlayer', player)
            }
        }
    })
    socket.on('getClickEventArray', async (array, player, roomname) => {
        const clickEventArray = await rogic.arrayPutOnClickEventFunc(array, player)
        const currentPlayer = await Redis.getPlayerStatus(roomname)
        socket.emit('addClickEvent', clickEventArray, currentPlayer)
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
            socket.to(socket.id).emit('afterConnecting')
        }else if(player2Id === dataWhenDisconnecting[0]){
            await Redis.deleteRoomStatusOfPlayer(dataWhenDisconnecting[1], 2)
            socket.to(socket.id).emit('afterConnecting')
        }
    })
    socket.on('lastSaveOthello', async (roomname, cb) => {
        try{
            const Mysql = require('./mysql.js')
            const othelloArray = await Redis.client.hget("othellos", roomname)
            console.log(othelloArray)
            const result = await Mysql.insertRoomDatas(roomname, othelloArray)
            // delete room data
            await Promise.all([
                Redis.deleteRoomnamesOfRoomname(roomname),
                Redis.deleteOthellosRoom(roomname),
                Redis.deletePlayerStatus(roomname),
                Redis.deleteRoomStatus(roomname)
            ])
            cb(result)
        }catch(err){
            throw new Error('lastSaveOthello err', err)
        }
    })
    socket.on('dontSaveOthello', async (roomname) => {
        try{
            await Promise.all([
                Redis.deleteRoomnamesOfRoomname(roomname),
                Redis.deleteOthellosRoom(roomname),
                Redis.deletePlayerStatus(roomname),
                Redis.deleteRoomStatus(roomname)
            ])
        }catch(err){
            throw new Error('dontSaveOthello err', err)
        }
    })
})

io.of('/roomList').on('connection', async (socket) => {
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