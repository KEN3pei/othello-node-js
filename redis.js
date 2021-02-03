// Redis接続
const redis = require('ioredis')
const Client = redis.createClient()
Client.on('connect', function() {
    console.log('Redisに接続しました')
})
Client.on('error', function (err) {
    console.log('次のエラーが発生しました：' + err)
})
module.exports.client = Client
// roomNames => [roomname, roomname, ...] で管理 Set型
module.exports.addRoomnamesAndGetMembers = async (roomname) => {
    try{
        const reply = await Client.sadd(['roomNames', roomname])
        if(!reply){ throw new Error('エラー') }
        const roomMembers = await Client.smembers('roomNames')
        return roomMembers
    }catch(err){
        throw new Error("memberが重複しています")
    }
}
module.exports.getRoomnamesMembers = async () =>{
    try{
        const roomMembers = await Client.smembers('roomNames')
        return roomMembers
    }catch(err){
        throw new Error("roomMembers is not found")
    }
} 
// roomNames内の特定のmemberが存在するか確認する
module.exports.existCheckRoomnamesofMember = async (roomname) => {
    try{
        const reply = await Client.sismember(['roomNames', roomname])
        if(!reply){ throw new Error()}
    }catch(err){
        throw new Error("existCheckRoomnamesofMember is error !")
    }
}
// roomNames内のroomnameを削除する
module.exports.deleteRoomnamesOfRoomname = async (roomname) => {
    try{
        const reply = await Client.srem(['roomNames', roomname])
        return reply
    }catch(err){
        throw new Error("deleteRoomnamesOfRoomname is error")
    }
}

// othellos : { roomname : othelloArray} で管理 Hash型
// 上書きするだけなのでエラーは出ないはず
module.exports.updateOthellosAndGetOthellos = async (room, array) => {
    try{
        await Client.hmset(["othellos", room, JSON.stringify(array)])
        const othelloArray = await Client.hget("othellos", room)
        return othelloArray
    }catch(err){
        throw new Error("updateOthellosAndGetOthellos is error")
    }
}
// Othellosキー内にあるroomHASHを削除する
module.exports.deleteOthellosRoom = async (roomname) => {
    try{
        const reply = await Client.hdel(["othellos", roomname])
        return reply
    }catch(err){
        throw new Error("updateOthellosAndGetOthellos is error")
    }
}
// 初期値をsetするための関数
module.exports.setIniarrayAndGetOthello = async (room, iniarray) => {
    try{
        await Client.hsetnx(["othellos", room, JSON.stringify(iniarray)])
        const othelloArray = await Client.hget("othellos", room)
        return othelloArray
    }catch(err){
        throw new Error("setIniarrayAndGetOthello is error")
    }
}

// roomname:{ player1,2 : cookie_id } で管理 Hash型
module.exports.createRoomStatusAndGetRoomStatus = async (roomname, player, cookie_id) => {
    try{
        const reply = await Client.hsetnx([roomname, player, cookie_id])
        // すでにそのroomにplayerがsetされている場合、cookie_idが同じならOK
        if(!reply){
            const setedCookie = await Client.hget([roomname, player])
            if(cookie_id !== setedCookie){ throw new Error('エラー') }
        }
        return reply
    }catch(err){
        throw new Error('not equel cookie_id or already exists player')
    }
}
module.exports.deleteRoomStatus = async (roomname) => {
    try{
        const reply = await Client.del(roomname)
        return reply
    }catch(err){
        throw new Error('not equel cookie_id or already exists player')
    }
}

// roomname で player を取得
module.exports.getPlayerStatus = async (roomname) => {
    try{
        const playerStatus = await Client.hget(["players", roomname])
        return playerStatus
    }catch(err){
        console.log(err)
    }
}
// roomname で player を設置 既存の値なら0, そうでなければ1
module.exports.createPlayerStatus = async (roomname, player) => {
    try{
        const reply = await Client.hsetnx(["players", roomname, player])
        return reply // 1=true 0=false
    }catch(err){
        console.log(err)
    }
}
// player を 1->2 もしくは 2->1 にする
module.exports.updatePlayerStatus = async (roomname, player) => {
    try{
        const reply = await Client.hset(["players", roomname, player])
        return reply // 新規->1 更新->0
    }catch(err){
        console.log(err)
    }
}
// 一致したplayer情報を削除
module.exports.deletePlayerStatus = async (roomname) => {
    try{
        const reply = await Client.hdel(["players", roomname])
        return reply // 存在している->1 していない->2
    }catch(err){
        console.log(err)
    }
}