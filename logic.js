
// 初期値取得関数
exports.iniArray = () => {
    let x_num = 6
    let y_num = 6
    let iniarray = []
    for (let x = 0; x < x_num; x++) {
        iniarray.push([])
        for (let y = 0; y < y_num; y++) {
            iniarray[x].push(-1)
        }
    }
    for (let w = 1; w < x_num - 1; w++) {
        for (let h = 1; h < y_num - 1; h++) {
            iniarray[w][h] = 0
        }
    }
    iniarray[2][2] = 1
    iniarray[3][3] = 1
    iniarray[2][3] = 2
    iniarray[3][2] = 2
    return iniarray
}

// module.exports.allSettledOthello(x, y, array, player)
// othelloの置ける数を数える関数
exports.countOthelloSet = async (array, player) => {
    let h = 6
    let w = 6
    let prevArray = []
    array.forEach(element => {
        prevArray.push(element.slice())
    })
    let othellocount = 0
    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            nextArray = await module.exports.allSettledOthello(x, y, array, player)
            if(JSON.stringify(prevArray) !== JSON.stringify(nextArray)){ 
                othellocount += 1 
                // console.log('y = ', y, 'x = ', x)
            }
        }  
    }
    return othellocount
}
// 置ける場所を配列にして返す関数
exports.xandyPutarray = async (array, player) => {
    let h = 6
    let w = 6
    let prevArray = []
    array.forEach(element => {
        prevArray.push(element.slice())
    })
    let putxandy = []
    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            nextArray = await module.exports.allSettledOthello(x, y, array, player)
            if(JSON.stringify(prevArray) !== JSON.stringify(nextArray)){ 
                putxandy.push([y, x])
                // console.log('y = ', y, 'x = ', x)
            }
        }  
    }
    return putxandy
}

// -----------------------------------------
// これ以下othello置き換え関数
// -----------------------------------------

// 返り値を <result>[x, y] <reject>error にすればPromiseAllで早く処理できそう
// 全方向置き換え関数
exports.allSettledOthello =  async (x, y, array, player) => {
    let result = []
    array.forEach(element => {
        result.push(element.slice())
    })
    if(y < 1 || y > 4 || x < 1 || x > 4){
        return result
    }
    if (array[y][x] !== 0){
        return result
    }
    result = await top(x, y, result, player)
    result = await under(x, y, result, player)
    result = await left(x, y, result, player)
    result = await right(x, y, result, player)
    result = await topright(x, y, result, player)
    result = await topleft(x, y, result, player)
    result = await underright(x, y, result, player)
    result = await underleft(x, y, result, player)
    return result
}

// 右下
async function underright(x, y, array, player) {
    let h = 4
    let w = 4
    let backarray = []
    array.forEach(element => {
        backarray.push(element.slice())
    });
    if(array[y + 1][x + 1] === (3 - player)){
        array[y][x] = player
    }
    while(array[y + 1][x + 1] === (3 - player)){
        x += 1
        y += 1
        array[y][x] = player
        // console.log(array[y - 1][x - 1] === 0)
        if(array[y + 1][x + 1] === 0 || x === w || y === h){
            array = backarray
            // throw new Error('エラー')
            break;
        }
    }
    return array
}

// 左下
async function underleft(x, y, array, player) {
    let h = 4
    let backarray = []
    array.forEach(element => {
        backarray.push(element.slice())
    });
    if(array[y + 1][x - 1] === (3 - player)){
        array[y][x] = player
    }
    while(array[y + 1][x - 1] === (3 - player)){
        x -= 1
        y += 1
        array[y][x] = player
        // console.log(array[y - 1][x - 1] === 0)
        if(array[y + 1][x - 1] === 0 || x === 1 || y === h){
            array = backarray
            break;
        }
    }
    return array
}

// 右上
async function topright(x, y, array, player) {
    let w = 4
    let backarray = []
    array.forEach(element => {
        backarray.push(element.slice())
    });
    if(array[y - 1][x + 1] === (3 - player)){
        array[y][x] = player
    }
    while(array[y - 1][x + 1] === (3 - player)){
        x += 1
        y -= 1
        array[y][x] = player
        // console.log(array[y - 1][x - 1] === 0)
        if(array[y - 1][x + 1] === 0 || x === w || y === 1){
            array = backarray
            break;
        }
    }
    return array
}

// 左上方向
async function topleft(x, y, array, player) {
    let backarray = []
    array.forEach(element => {
        backarray.push(element.slice())
    });
    if(array[y - 1][x - 1] === (3 - player)){
        array[y][x] = player
    }
    while(array[y - 1][x - 1] === (3 - player)){
        x -= 1
        y -= 1
        array[y][x] = player
        // console.log(array[y - 1][x - 1] === 0)
        if(array[y - 1][x - 1] === 0 || x === 1 || y === 1){
            array = backarray
            break;
        }
    }
    return array
}

// 左方向の処理
async function left(x, y, array, player) {
    let backarray = []
    array.forEach(element => {
        backarray.push(element.slice())
    });
    if(array[y][x - 1] === (3 - player)){
        array[y][x] = player
    }
    while(array[y][x - 1] === (3 - player)){
        x -= 1
        array[y][x] = player
        if(array[y][x - 1] === 0 || x === 1){
            array = backarray
            break;
        }
    }
    return array
}

// 右方向の処理
async function right(x, y, array, player) {
    let w = 4
    let backarray = []
    array.forEach(element => {
        backarray.push(element.slice())
    });
    if(array[y][x + 1] === (3 - player)){
        array[y][x] = player
    }
    while(array[y][x + 1] === (3 - player)){
        x += 1
        array[y][x] = player
        if(array[y][x + 1] === 0 || x === w){
            array = backarray
            break;
        }
    }
    return array
}

// 下方向の処理
async function under(x, y, array, player) {
    let h = 4
    let backarray = []
    array.forEach(element => {
        backarray.push(element.slice())
    });
    if(array[y + 1][x] === (3 - player)){
        array[y][x] = player
    }
    while(array[y + 1][x] === (3 - player)){
        y += 1
        array[y][x] = player
        if(array[y + 1][x] === 0 || y === h){
            array = backarray
            break;
        }
    }
    return array
}

// 上方向の処理
async function top(x, y, array, player) {
    let backarray = []
    array.forEach(element => {
        backarray.push(element.slice())
    });
    if(array[y - 1][x] === (3 - player)){
        array[y][x] = player
    }
    while(array[y - 1][x] === (3 - player)){
        y -= 1
        array[y][x] = player
        if(array[y - 1][x] === 0 || y === 1){
            array = backarray
            break;
        }
    }
    return array
}