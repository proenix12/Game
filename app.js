var express = require('express');
var app = express();

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

var server = app.listen(3000, '0.0.0.0', function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Server run on http://%s:%s/', host, port);
});

var SOCKET_LIST= {};

var Entity = function () {
    var self = {
        x:500,
        y:250,
        spdX:0,
        spdY:0,
        id:""
    };
    self.update = function () {
        self.updatePosition();
    };
    self.updatePosition = function () {
        self.x += self.spdX;
        self.y += self.spdY
    };
    self.getDistance = function (pt) {
        return Math.sqrt(Math.pow(self.x-pt.x,2) + Math.pow(self.y-pt.y,2));
    };
    return self;
};

var Player = function (id) {
    var self = Entity();
    self.id = id;
    self.number = "" + Math.floor(10 * Math.random());
    self.pressingRight = false;
    self.pressingLeft = false;
    self.pressingUp = false;
    self.pressingDown = false;
    self.pressingAttack = false;
    self.mouseAngle = 0;
    self.maxSpd = 10;

    var super_update = self.update;
    self.update = function () {
        self.updateSpd();
        super_update();

        if(self.pressingAttack){
            self.attackAction(self.mouseAngle);
        }
    };
    self.attackAction = function (angle) {
        var att = Attack(self.id, angle);
        att.x = self.x;
        att.y = self.y;
    };

    self.updateSpd = function () {
        if(self.pressingRight)
            self.spdX = self.maxSpd;
        else if(self.pressingLeft)
            self.spdX = -self.maxSpd;
        else
            self.spdX = 0;

        if(self.pressingUp)
            self.spdY = -self.maxSpd;
        else if(self.pressingDown)
            self.spdY = self.maxSpd;
        else
            self.spdY = 0;
    }
    Player.list[id] = self;
    return self;
}
Player.list = {};

Player.onConnect = function (socket) {
    var player = Player(socket.id);

    //Catching mouse action
    socket.on('keyPress', function (data) {
        if(data.inputId === 'left')
            player.pressingLeft = data.state;
        else if(data.inputId === 'right') {
            player.pressingRight = data.state;
        } else if(data.inputId === 'up') {
            player.pressingUp = data.state;
        } else if(data.inputId === 'down') {
            player.pressingDown = data.state;
        } else if(data.inputId === 'attack') {
            player.pressingAttack = data.state;
        } else if(data.inputId === 'mouseAngle'){
            player.mouseAngle = data.state;
        }
    });

    console.log('New player: %s just connect', player.number);
};

Player.onDisconnect = function (socket) {
    delete Player.list[socket.id];
};

Player.update = function () {
    var pack = [];
    for (var i in Player.list) {
        var player = Player.list[i];
        player.update();
        pack.push({
            x: player.x,
            y: player.y,
            number: player.number
        });
    }
    return pack;
}

var Bullet = function (angle) {
    var self = Entity();
    self.id = Math.random();
    self.spdX = Math.cos(angle/180*Math.PI) * 10;
    self.spdY = Math.sin(angle/180*Math.PI) * 10;

    self.timer = 0;
    self.toRemove = false;
    var super_update = self.update;
    self.update = function(){
        if(self.timer++ > 30)
            self.toRemove = true;

        super_update();
        for(var i in Player.list){
            var p = Player.list[i];
            if(self.getDistance(p) < 32 && self.parent !== p.id ){
                self.toRemove = true;
            }
        }
    };
    Bullet.list[self.id] = self;
    return self;
};
Bullet.list = {};

Bullet.update = function () {
    if(Math.random() < 0.1){
        Bullet(Math.random()*360);
    }
    var pack = [];
    for (var i in Bullet.list) {
        var bullet = Bullet.list[i];
        if(bullet.toRemove)
            delete Bullet.list[i];
        bullet.update();
        pack.push({
            x: bullet.x,
            y: bullet.y
        });
    }
    return pack;
}

var Attack = function (parent, angle) {
    var self = Entity();
    self.id = Math.random();
    self.maxSpd = 20;
    self.parent = parent;
    self.spdX = Math.cos(angle/180*Math.PI) * 10;
    self.spdY = Math.sin(angle/180*Math.PI) * 10;

    self.timer = 0;
    self.toRemove = false;
    var super_update = self.update;
    self.update = function(){
        if(self.timer++ > 30) {
            self.toRemove = true;
        }
        super_update();
        for(var i in Player.list){
            var p = Player.list[i];
            if(self.getDistance(p) < 32 && self.parent !== p.id ){
                self.toRemove = true;
            }
        }
    };
    Attack.list[self.id] = self;
    return self;
};
Attack.list = {};

Attack.update = function () {

    var pack = [];
    for (var i in Attack.list) {
        var attack = Attack.list[i];
        if(attack.toRemove)
            delete Attack.list[i];
        attack.update();
        pack.push({
            x: attack.x,
            y: attack.y
        });
    }
    return pack;
}


var io = require('socket.io')(server, {});
io.sockets.on('connection', function (socket) {

    socket.id = Math.random();
    SOCKET_LIST[socket.id] = socket;


    Player.onConnect(socket);
    socket.on('disconnect', function () {
        delete SOCKET_LIST[socket.id];
        Player.onDisconnect(socket);
    });

    socket.on('sendMsgToServer', function (data) {
        var playerName = ("" + socket.id).slice(2, 7);
        for(var i in SOCKET_LIST){
            SOCKET_LIST[i].emit('addToChact', playerName + ':' + data);
        }
    });


});

setInterval(function () {
    var pack = {
        player: Player.update(),
        bullet: Bullet.update(),
        attack: Attack.update()
    }

    for (var i in SOCKET_LIST) {
        var socket = SOCKET_LIST[i];
        socket.emit('newPositions', pack);
    }

}, 1000 / 25);