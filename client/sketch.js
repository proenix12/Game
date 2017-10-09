var ctx = document.getElementById("ctx").getContext('2d');
ctx.font = '30px Arial';

//Caching data from server and drow in client
socket.on('newPositions',function(data){
    ctx.clearRect(0,0,1000,500);
    for(var i = 0 ; i < data.player.length; i++){
        ctx.fillText(data.player[i].number, data.player[i].x, data.player[i].y);
    }
    for(var i = 0 ; i < data.monster.length; i++){
        ctx.fillRect(data.monster[i].x-5, data.monster[i].y-5, 10, 10);
    }
    for(var i = 0 ; i < data.attack.length; i++){
        ctx.fillRect(data.attack[i].x-5, data.attack[i].y-5, 10, 10);
    }
});

//Chat
socket.on('addToChact', function (data) {
    $("#chat-text").append("<div>" + data + "</div>");

});

$("#chat-form").submit(function (event) {
    event.preventDefault();

    socket.emit('sendMsgToServer', $("#chat-input").val());
    $("#chat-input").val('');
})

//Keyboard action send to server
document.onkeydown =function (event) {
    if(event.keyCode === 68) //d
        socket.emit('keyPress', {inputId: 'right', state:true});
    else if(event.keyCode === 83) //s
        socket.emit('keyPress', {inputId: 'down', state:true});
    else if(event.keyCode === 65) //a
        socket.emit('keyPress', {inputId: 'left', state:true});
    else if(event.keyCode === 87) //w
        socket.emit('keyPress', {inputId: 'up', state:true});
};
document.onkeyup =function (event) {
    if(event.keyCode === 68) //d
        socket.emit('keyPress', {inputId: 'right', state:false});
    else if(event.keyCode === 83) //s
        socket.emit('keyPress', {inputId: 'down', state:false});
    else if(event.keyCode === 65) //a
        socket.emit('keyPress', {inputId: 'left', state:false});
    else if(event.keyCode === 87) //w
        socket.emit('keyPress', {inputId: 'up', state:false});
};

//Mouse action send to server
$(document).mousedown(function (event) {
    socket.emit('keyPress', {inputId: 'attack', state:true});
});
$(document).mouseup(function (event) {
    socket.emit('keyPress', {inputId: 'attack', state:false});
});
$(document).mousemove(function (event) {
    var x = -250 + event.clientX - 8;
    var y = -250 + event.clientY - 8;
    var angle = Math.atan2(y, x) / Math.PI * 180;
    socket.emit('keyPress', {inputId:'mouseAngle', state:angle});
});

$(document).ready(function () {
    $("#main").css('display', 'block');
    $("#load").css('display', 'none');
})
$(document).load(function () {
    $("#main").css('display', 'none');
    $("#load").css('display', 'block');
})