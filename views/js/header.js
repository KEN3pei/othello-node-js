
function visibleMenu(){
    document.getElementById('menu_icon_id').style.display = "none"
    document.getElementById('close_icon_id').style.display = "block"
    const menuItems = document.getElementsByClassName('menu_item')
    let count = 0;
    var countup = () => {
        menuItems[count].style.display = "block"
        console.log(count++);
        if(count >= menuItems.length){
            return
        }else{
            setTimeout(countup, 500);
        }
    } 
    countup();
}
function hiddenMenu(){
    document.getElementById('menu_icon_id').style.display = "block"
    document.getElementById('close_icon_id').style.display = "none"
    const menuItems = document.getElementsByClassName('menu_item')
    for (let i = 0; i < menuItems.length; i++) {
        menuItems[i].style.display = "none"
    }
}
