'use strict'
// Express
const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
// const session = require('express-session')


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
            // { player1,2 : cookie_login_id }でplayerの管理をする
            const result = await Redis.createRoomStatusAndGetRoomStatus(roomname, Number(player), socket.id)
            socket.join(roomname)
            // redisにすでに値がなければ初期値をset&get, あればあるものをget
            const othello = await Redis.setIniarrayAndGetOthello(roomname, rogic.iniArray())
          
            socket.emit('viewOthello', JSON.parse(othello), player)
            // defaultのゲーム開始時のユーザを設定
            const reply = await Redis.createPlayerStatus(roomname, player)
            const playerStatus = await Redis.getPlayerStatus(roomname)
            socket.emit('setPlayerInfo', playerStatus)
            
        }catch(err){
            console.log(err)
            // ここでリダイレクト処理か戻るボタンを表示するevent発火させる
            socket.emit('href', '/rooms.html')
        }
    })
    socket.on('checkPlayer', async (roomname, cb) => {
        const playerStatus = await Redis.getPlayerStatus(roomname)
        cb(playerStatus)
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
                const putxandy = await rogic.xandyPutarray(JSON.parse(othelloArray), player)
                socket.emit('deleteEvent', putxandy)

                player = 3 - Number(player)
                const reply = await Redis.updatePlayerStatus(roomname, player)

                // socket.to(roomname).emit('viewOthello', JSON.parse(updatedArray), player)
                socket.emit('viewOthello', JSON.parse(updatedArray), player)
                socket.to(roomname).broadcast.emit('viewOthello', JSON.parse(updatedArray), player)
                socket.emit('setPlayerInfo', player)
                socket.to(roomname).broadcast.emit('setPlayerInfo', player)
            }
        }else{
            // playerを変えても0か調べる
            player = 3 - Number(player)
            const nextplayerCount = await rogic.countOthelloSet(JSON.parse(othelloArray), Number(player))
            if(nextplayerCount === 0){
                console.log("ゲーム終了")
                // delete room data
                const result = await Promise.all([
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
                socket.emit('viewOthello', JSON.parse(othelloArray), player)
                socket.to(roomname).broadcast.emit('viewOthello', JSON.parse(othelloArray), player)
                socket.emit('setPlayerInfo', player)
                socket.to(roomname).broadcast.emit('setPlayerInfo', player)
            }
        }
    })
    socket.on('getHtml', async (html, array, player) => {
        const putxandy = await rogic.xandyPutarray(array, player)
        socket.emit('setOthelloHtml', `${html}`, putxandy)
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
            const reply = await Redis.deleteRoomStatusOfPlayer(dataWhenDisconnecting[1], 1)
            socket.to(socket.id).emit('connect')
        }else if(player2Id === dataWhenDisconnecting[0]){
            const reply = await Redis.deleteRoomStatusOfPlayer(dataWhenDisconnecting[1], 2)
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