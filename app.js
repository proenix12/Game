var mongojs = require('mongojs');
var db = mongojs('localhost:27017/myGame', ['account', 'progress']);
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
    self.x = 1;
    self.number = "" + Math.floor(10 * Math.random());
    self.pressingRight = false;
    self.pressingLeft = false;
    self.pressingUp = false;
    self.pressingDown = false;
    self.pressingAttack = false;
    self.mouseAngle = 0;
    self.maxSpd = 10;
    self.hp = 10;
    self.hpMax = 10;
    self.score = 0;

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
        if(self.pressingRight) {
            self.spdX = self.maxSpd;
        } else if(self.pressingLeft) {
            self.spdX = -self.maxSpd;
        } else {
            self.spdX = 0;
        }

        if(self.pressingUp) {
            self.spdY = -self.maxSpd;
        } else if(self.pressingDown) {
            self.spdY = self.maxSpd;
        } else {
            self.spdY = 0;
        }
    };

    self.getInitPack = function () {
        return {
            id:self.id,
            x:self.x,
            y:self.y,
            number:self.number,
            hp:self.hp,
            hpMax:self.hpMax,
            score:self.score
        }
    };
    self.getUpdatePack = function () {
        return{
            id:self.id,
            x:self.x,
            y:self.y,
            hp:self.hp,
            score:self.score
        }
    };
    Player.list[id] = self;
    initPack.player.push(self.getInitPack());
    return self;
};
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


    socket.emit('init', {
       selfid: socket.id,
       player:Player.getAllInitPack(),
       attack:Attack.getAllInitPack(),
       monster:Monster.getAllInitPack()
    });

    console.log('New player: %s just connect', player.number);
};
Player.getAllInitPack = function () {
    var players = [];
    for(var i in Player.list){
        players.push(Player.list[i].getInitPack());
    }
    return players;
};

Player.onDisconnect = function (socket) {
    delete Player.list[socket.id];
    removePack.player.push(socket.id);
};

Player.update = function () {
    var pack = [];
    for (var i in Player.list) {
        var player = Player.list[i];
        player.update();
        pack.push(player.getUpdatePack());
    }
    return pack;
}

var Monster = function (angle) {
    var self = Entity();
    self.id = 1;
    self.name = 'Monster';
    self.hp = 10;
    self.maxSpd = 10;
    self.pressingAttack = false;
    //self.spdX = Math.cos(angle/180*Math.PI) * 10;
    //self.spdY = Math.sin(angle/180*Math.PI) * 10;

    // self.timer = 0;
    self.toRemove = false;

    var super_update = self.update;
    self.update = function() {
        if(self.timer++ > 50) {
            self.toRemove = true;
        }

        super_update();
        for(var i in Player.list){

            var m = Player.list[i];

        if(self.pressingAttack){
            var angle = Math.atan2(self.y - m.y, self.x - m.x);
            self.attackAction(angle);

            var m = Player[i];
        }
        if(self.pressingAttack){
            self.attackAction(Player.x);
        }
    }
    };

    for(var i in Player.list){
        var p = Player.list[i];

        if(self.getDistance(p) < 300 && self.parent !== p.id ){
            self.pressingAttack = true;
        }
        self.attackAction = function () {
            var att = Attack(self.id, angle);
            att.x = self.x;
            att.y = self.y;
        };
    }
    self.getInitPack = function () {
        return{
            id:self.id,
            x:self.x,
            y:self.y
        }
    };
    self.getUpdatePack = function () {
        return{
            id:self.id,
            x:self.x,
            y:self.y
        }
    };
    Monster.list[self.id] = self;
    initPack.monster.push(self.getInitPack());
    return self;
};
Monster.list = {};

Monster.update = function () {
    if(Math.random() < 0.1){
        Monster(Math.random()*360);
    }
    var pack = [];
    for (var i in Monster.list) {
        var monster = Monster.list[i];
        if(monster.toRemove) {
            delete Monster.list[i];
        }
        monster.update(monster.getUpdatePack());
        pack.push(monster.getUpdatePack());
    }
    return pack;
};
Monster.getAllInitPack = function () {
    var monster = [];
    for(var i in Monster.list){
        monster.push(Monster.list[i].getInitPack())
    }
    return monster;
};

var Attack = function (parent, angle) {
    var self = Entity();
    self.id = Math.random();
    self.maxSpd = 10;
    self.parent = parent;
    self.spdX = Math.cos(angle/180*Math.PI) * self.maxSpd;
    self.spdY = Math.sin(angle/180*Math.PI) * self.maxSpd;

    self.timer = 0;
    self.toRemove = false;
    var super_update = self.update;
    self.update = function(){
        if(self.timer++ > 20) {
            self.toRemove = true;
        }
        super_update();
        for (var i in Player.list) {
            var p = Player.list[i];
            if (self.getDistance(p) < 32 && self.parent !== p.id) {
                p.hp -= 1;

                //if player die
                if(p.hp <= 0){
                    //if player kill
                    var shooter = Player.list[self.parent];
                    if(shooter){
                        shooter.score += 1;
                    }

                    p.hp = p.hpMax;
                    p.x = Math.random()* 1000;
                    p.y = Math.random()* 500;
                }


                self.toRemove = true;
            }
        };
        for (var i in Monster.list) {
            var m = Monster.list[i];
            if (self.getDistance(m) < 32 && self.parent !== m.id) {
                self.toRemove = true;
            }
        };
    };
    self.getInitPack = function () {
        return{
            id:self.id,
            x:self.x,
            y:self.y
        }
    };
    self.getUpdatePack = function () {
        return{
            id:self.id,
            x:self.x,
            y:self.y
        }
    };
    Attack.list[self.id] = self;
    initPack.attack.push(self.getInitPack());
    return self;
};
Attack.list = {};

Attack.update = function () {

    var pack = [];
    for (var i in Attack.list) {
        var attack = Attack.list[i];
        attack.update();
        if (attack.toRemove) {
            delete Attack.list[i];
            removePack.attack.push(attack.id);
        } else {
            pack.push(attack.getUpdatePack());
        }
    }
    return pack;
};
Attack.getAllInitPack = function () {
    var attacks = [];
    for(var i in Attack.list){
        attacks.push(Attack.list[i].getInitPack())
    }
    return attacks;
};

var USERS = {
    "george": "george",
    "mitko":"mitko",
    "mile":"mile"
};
var isValidPassword = function (data, cd) {
    db.account.find({username:data.username, password:data.password},function (err, res) {
        if(res.length > 0) {
            cd(true);
        }else{
            cd(false);
        }
    });
};
var isUserNameTaken = function (data, cd) {
    db.account.find({username:data.username},function (err, res) {
        if(res.length > 0){
            cd(true);
        }else{
            cd(false);
        }
    });
};
var addUser = function (data, cd) {
    db.account.insert({username:data.username, password:data.password},function (err) {
        cd(true);
    });
};

var io = require('socket.io')(server, {});
io.sockets.on('connection', function (socket) {

    socket.id = Math.random();
    SOCKET_LIST[socket.id] = socket;

    // login system
    // login system
    socket.on('singIn', function (data) {
        isValidPassword(data, function (res) {
            if(res){
                Player.onConnect(socket);
                socket.emit('singInResponse', {success: true});
            }else{
                socket.emit('singInResponse', {success: false});
            }
        });
    });

    socket.on('registerPlayer', function (data) {

        isUserNameTaken(data, function (res) {
            if(res){
                socket.emit('singUpResponse', {success: false});
            }else{
                addUser(data, function () {
                    socket.emit('singUpResponse', {success: true});
                });
            }
        });
    });


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

var initPack = {player:[], monster:[], attack:[]};
var removePack = {player:[], monster:[], attack:[]};

setInterval(function () {
    var pack = {
        player: Player.update(),
        monster: Monster.update(),
        attack: Attack.update()
    };

    for (var i in SOCKET_LIST) {
        var socket = SOCKET_LIST[i];
        socket.emit('init', initPack);
        socket.emit('update', pack);
        socket.emit('remove', removePack);
    }
    initPack.player = [];
    initPack.monster = [];
    initPack.attack = [];
        removePack.player = [];
        removePack.monster =[];
        removePack.attack = [];

}, 1000 / 25);
