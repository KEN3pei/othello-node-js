// rooms.htmlにて表示される
function makeOthelloTable(array) {
// function makeOthelloTable(array){
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

function hiddenBtn(id){
    document.getElementById(id).style.display = "none"
}
function visibleBtn(id){
    document.getElementById(id).style.display = "block"
}

function getIniArray(){
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