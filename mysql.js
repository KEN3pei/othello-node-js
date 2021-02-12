'use strict'
// Mysql接続
const mysql = require('mysql')
const connection = mysql.createConnection({
    host: 'mysql',
    user: 'root',
    password: 'root',
    database: 'othello'
})
// 数秒後に接続しないと hundshake error みたいなんがでる
connection.connect()

exports.insertRoomDatas = async (roomname, othello, userId = null) => {
    try{
        
        const sql = "INSERT INTO room_datas (roomname, user_id, othello) VALUES (?)"
        const params = [roomname, userId, othello]
        // const sql = "INSERT INTO room_datas (roomname, user_id, othello) VALUES('room1', null, '[[-1,-1,-1,-1,-1,-1],[-1,0,0,1,0,-1],[-1,0,1,1,0,-1],[-1,0,2,1,0,-1],[-1,0,0,0,0,-1],[-1,-1,-1,-1,-1,-1]]')"
        connection.query(sql, [params], (err, result) => {
            if (err) throw err
            console.log("Number of records inserted: " + result.affectedRows)
            return result
        })
    }catch(err){
        throw new Error('insertRoomDatas err', err)
    }
}

