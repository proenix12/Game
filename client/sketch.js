// Login
var userform = $("#user-form");
var username = $("#user-name").val();
var userpass = $("#user-pass").val();
var formlog = $("#form-log");
var formreg = $("#form-reg");
var gamediv = $("#game");

$("#form-log").click(function (e) {
    e.preventDefault();
    socket.emit('singIn', {
        username: $("#user-name").val(),
        password: $("#user-pass").val()
    });

});
$("#form-reg").click(function (e) {
    e.preventDefault();
    socket.emit('registerPlayer', {
        username: $("#user-name").val(),
        password: $("#user-pass").val()
    });

});
//Check for valid account
socket.on('singInResponse', function (data) {
   if(data.success){
       $("#user-form").css('display', 'none');
       $("#game").css('display', 'block');
   }else{
       alert("Sing in unsuccessul.");
   }
});

socket.on('singUpResponse', function (data) {
    if(data.success){
        alert("Sing up success.");
    }else{
        alert("Sing up unsuccessul.");
    }
});

// Game
var ctx = document.getElementById("ctx").getContext('2d');
ctx.font = '30px Arial';

//Caching data from server and drow in client
socket.on('newPositions',function(data){
    ctx.clearRect(0,0,1000,500);
    for(var i = 0 ; i < data.player.length; i++){
        ctx.fillText(data.player[i].number, data.player[i].x, data.player[i].y);
    }
    for(var i = 0 ; i < data.monster.length; i++){
        ctx.fillText(data.monster[i].name, data.monster[i].x, data.monster[i].y);
        console.log(data.monster[i]);
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