'use strict'
// Express
const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const session = require('express-session')

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

// session管理
const sessionMiddleware = session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    // store: new RedisStore({ client: Client }),
    cookie: { httpOnly: true, secure: false, maxage: 1000 * 60 * 30 }
})
io.use((socket, next) => {
    sessionMiddleware(socket.request, socket.request.res || {}, next)
})

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
    socket.on('getHtml', html => {
        socket.emit('setOthelloHtml', `${html}`)
    })
    socket.on('getMessage', message => {
        socket.emit('message', message)
    })
    socket.on('joinRoom', async (name, cookie) => {
        try{
            const roomname = name[0].slice(5)
            const player = name[1].slice(7)
            const cookie_login_id = cookie.allCookies.split(';')[0].slice(6) 

            await Redis.existCheckRoomnamesofMember(roomname)
            // { player1,2 : cookie_login_id }でplayerの管理をする
            const players = await Redis.createRoomStatusAndGetRoomStatus(roomname, player, cookie_login_id)
            socket.join(roomname)
            // redisにすでに値がなければ初期値をset&get, あればあるものをget
            const othello = await Redis.setIniarrayAndGetOthello(roomname, rogic.iniArray())
          
            console.log('namespace2')
            socket.emit('viewOthello', JSON.parse(othello))
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
    socket.on('checkPlayer', async (roomname) => {
        const playerStatus = await Redis.getPlayerStatus(roomname)
        socket.emit('result', playerStatus)
    })
    socket.on('startGame', async (elem_id, player, roomname) => {
        const x = Number(elem_id[0].slice(2))
        const y = Number(elem_id[1].slice(2))
        const othelloArray = await Redis.client.hget("othellos", roomname)

        // 1, 更新前に置くところがあるかcheck
        const count = await rogic.countOthelloSet(JSON.parse(othelloArray), Number(player))
        if(count !== 0){
            // 2, 置く場所があればそのまま処理&最後にplayerの更新
            // 盤面の更新
            const result = await rogic.allSettledOthello(x, y, JSON.parse(othelloArray), Number(player))
            // 盤面が変更されたらredisのplayerと盤面の更新
            if(othelloArray !== JSON.stringify(result)){
                const updatedArray = await Redis.updateOthellosAndGetOthellos(roomname, result)
                player = 3 - Number(player)
                const reply = await Redis.updatePlayerStatus(roomname, player)
                // 変更後の盤面を表示
                socket.emit('viewOthello', JSON.parse(updatedArray))
                socket.broadcast.emit('viewOthello', JSON.parse(updatedArray))
                socket.broadcast.emit('reload')
            }
            socket.emit('reload')
        }else{
            // playerを変えても0か調べる
            player = 3 - Number(player)
            const nextplayerCount = await rogic.countOthelloSet(JSON.parse(othelloArray), Number(player))
            if(nextplayerCount === 0){

                console.log("ゲーム終了")
                // ゲーム終了

                // redisにあるデータの削除
                const result = await Promise.all([
                    Redis.deleteRoomnamesOfRoomname(roomname),
                    Redis.deleteOthellosRoom(roomname),
                    Redis.deletePlayerStatus(roomname),
                    Redis.deleteRoomStatus(roomname)
                ])
                // Mysqlに永続化

                // 別URLに飛ばす
                socket.emit('href', `/finished?name=${roomname}&player=${player}`)
                socket.broadcast.emit('href', `/finished?name=${roomname}&player=${player}`)
            }else{
                const reply = await Redis.updatePlayerStatus(roomname, player)
                socket.emit('message2', `置くところがないのでplayerを交代します`)
                socket.broadcast.emit('message2', `置くところがないのでplayerを交代します`)
                socket.emit('setPlayerInfo', player)
                socket.broadcast.emit('setPlayerInfo', player)
            }
        }
    })
    socket.on('disconnecting', (reason) => {
        console.log(reason)
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