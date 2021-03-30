# othello-node-js

# ルール

### 部屋への入退出について
 部屋を作った人がplayer1、一覧から入室した人がplayer2。
 部屋には2人以上入れず、入ろうとするとroom一覧画面に戻される。
 ただし、その部屋からplayer1もしくはplayer2が退出した場合、その退出したplayerと同じであれば誰でも入れるようになる。

### ゲームの流れ
 順番に置く場所をクリックで選択していく。
 自分に置くところがないが、相手は次のターンにおける場所がある場合、ボタンが出てくるのでそれをクリックすることでplayerを交代させる。
 両者置くところがなくなるとまたボタンが出てくるのでそれを押すとゲーム終了画面に飛ばされる。

### 使用技術
 Node.js Express Socket.io Redis Mysql

### herokuでデプロイしたやつ
 https://realtime-othello-game.herokuapp.com/rooms
