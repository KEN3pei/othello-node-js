exports.makeOthelloTable = (array) => {
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

exports.pugMakeOthelloTable = (array) => {
    // function makeOthelloTable(array){
        let html = "table(border='1')"
        for (let y = 1; y < 5 ; y++) {
            html += "tr"
            for (let x = 1; x < 5 ; x++) {
                let x_y = `x:${x},y:${y}`
                if(array[y][x] === 1){
                    html += `td#${x_y}.icon.othello span.icon-black`
                }else if(array[y][x] === 2){
                    html += `td#${x_y}.icon.othello span.icon-white`
                }else{
                    html += `td#${x_y}.icon.othello span.icon-emsp`
                }
            }
        }
        return html
    }
    