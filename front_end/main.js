"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var random_id = function (len) {
    var p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return __spreadArray([], Array(len), true).reduce(function (a) { return a + p[Math.floor(Math.random() * p.length)]; }, '');
};
var g_origin = new URL(window.location.href).origin;
var g_id = random_id(12);
var g_name = "nonameyet";
// Payload is a marshaled (but not JSON-stringified) object
// A JSON-parsed response object will be passed to the callback
var httpPost = function (page_name, payload, callback) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if (request.readyState === 4) {
            if (request.status === 200) {
                var response_obj = void 0;
                try {
                    response_obj = JSON.parse(request.responseText);
                }
                catch (err) { }
                if (response_obj) {
                    callback(response_obj);
                }
                else {
                    callback({
                        status: 'error',
                        message: 'response is not valid JSON',
                        response: request.responseText,
                    });
                }
            }
            else {
                if (request.status === 0 && request.statusText.length === 0) {
                    callback({
                        status: 'error',
                        message: 'connection failed',
                    });
                }
                else {
                    callback({
                        status: 'error',
                        message: "server returned status ".concat(request.status, ": ").concat(request.statusText),
                    });
                }
            }
        }
    };
    request.open('post', "".concat(g_origin, "/").concat(page_name), true);
    request.setRequestHeader('Content-Type', 'application/json');
    request.send(JSON.stringify(payload));
};
var Sprite = /** @class */ (function () {
    function Sprite(x, y, id, image_url, update_method, onclick_method, name) {
        this.x = x;
        this.y = y;
        this.speed = 4;
        this.id = id;
        this.image = new Image();
        this.image.src = image_url;
        this.update = update_method;
        this.onclick = onclick_method;
        this.name = name;
    }
    Sprite.prototype.set_destination = function (x, y) {
        this.dest_x = x;
        this.dest_y = y;
    };
    Sprite.prototype.ignore_click = function (x, y) {
    };
    Sprite.prototype.move = function (dx, dy) {
        if (this.dest_x !== undefined && this.dest_y !== undefined) {
            this.dest_x = this.x + dx;
            this.dest_y = this.y + dy;
        }
    };
    Sprite.prototype.go_toward_destination = function () {
        if (this.dest_x === undefined || this.dest_y === undefined)
            return;
        if (this.x < this.dest_x)
            this.x += Math.min(this.dest_x - this.x, this.speed);
        else if (this.x > this.dest_x)
            this.x -= Math.min(this.x - this.dest_x, this.speed);
        if (this.y < this.dest_y)
            this.y += Math.min(this.dest_y - this.y, this.speed);
        else if (this.y > this.dest_y)
            this.y -= Math.min(this.y - this.dest_y, this.speed);
    };
    Sprite.prototype.sit_still = function () {
    };
    return Sprite;
}());
var Model = /** @class */ (function () {
    function Model() {
        var _this = this;
        this.sprites = [];
        this.turtle = new Sprite(50, 50, g_id, "green_robot.png", function () { return _this.turtle.go_toward_destination(); }, function (x, y) { return _this.turtle.set_destination(x, y); }, (g_name));
        console.log("g_id=".concat(g_id));
        this.sprites.push(this.turtle);
    }
    Model.prototype.update = function () {
        //console.log('------------------');
        for (var _i = 0, _a = this.sprites; _i < _a.length; _i++) {
            var sprite = _a[_i];
            sprite.update();
        }
    };
    Model.prototype.onclick = function (x, y) {
        for (var _i = 0, _a = this.sprites; _i < _a.length; _i++) {
            var sprite = _a[_i];
            sprite.onclick(x, y);
        }
    };
    Model.prototype.move = function (dx, dy) {
        this.turtle.move(dx, dy);
        if (this.turtle.x == dx && this.turtle.y == dy) {
            window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
        }
    };
    return Model;
}());
var g_scroll_x = 0;
var g_scroll_y = 0;
var View = /** @class */ (function () {
    function View(model) {
        this.model = model;
        this.canvas = document.getElementById("myCanvas");
        console.log("canvas=".concat(this.canvas));
        this.turtle = new Image();
        this.turtle.src = "turtle.png";
    }
    View.prototype.update = function () {
        var ctx = this.canvas.getContext("2d");
        if (ctx) {
            ctx.clearRect(0, 0, 1000, 500);
            for (var _i = 0, _a = this.model.sprites; _i < _a.length; _i++) {
                var sprite = _a[_i];
                ctx.drawImage(sprite.image, sprite.x - sprite.image.width / 2 - g_scroll_x, sprite.y - sprite.image.height - g_scroll_y);
                ctx.font = "20px Verdana";
                ctx.fillText(sprite.name, sprite.x - sprite.image.width / 2 - g_scroll_x, sprite.y - sprite.image.height - 10 - g_scroll_y);
            }
            var center_x = 500;
            var center_y = 270;
            var scroll_rate = 0.03;
            g_scroll_x += scroll_rate * (this.model.turtle.x - g_scroll_x - center_x);
            g_scroll_y += scroll_rate * (this.model.turtle.y - g_scroll_y - center_y);
        }
    };
    View.prototype.content = function () {
    };
    return View;
}());
var Controller = /** @class */ (function () {
    function Controller(model, view) {
        var _this = this;
        this.last_updates_request_time = 0;
        /*
        {
            Format of the response object:
            "updates": [
                [id, x, y, name],
                [id, x, y],
                ...
            ]
        */
        this.updateFront = function (ob) {
            if (ob.updates) {
                if (ob.updates.length > 0)
                    console.log("Response to update: ".concat(JSON.stringify(ob)));
                for (var i = 0; i < ob.updates.length; i++) {
                    var bool = false;
                    var found = 0;
                    // Checks to see if the robot already exists
                    for (var j = 0; j < _this.model.sprites.length; j++) {
                        //If statment checks the generated ID with the ID of the robot stored on the server
                        //If Robot does not exist then the bool will remain false
                        //If Robot does exist then the bool will be true and the index of the robot will be stored in found
                        //ID of sprites is declared in the constructor of the Sprite class
                        if (+_this.model.sprites[j].id < 100)
                            continue;
                        console.log("Client ID: ".concat(JSON.stringify(_this.model.sprites[j].id)));
                        console.log("Server ID : ".concat(JSON.stringify(ob.updates[i].id)));
                        if (_this.model.sprites[j].id === ob.updates[i].id) {
                            console.log(ob.updates[i].name);
                            //console.log(this.model.sprites[j].id);
                            bool = true;
                            found = j;
                        }
                    }
                    //If the robot does not exist then a new robot will be created
                    if (!bool) {
                        console.log("Make New Robot");
                        //window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
                        //Change later
                        _this.model.sprites.push(new Sprite(0, 0, ob.updates[i].x, "blue_robot.png", Sprite.prototype.go_toward_destination, _this.model.turtle.ignore_click, ob.updates[i].name));
                        _this.model.sprites[_this.model.sprites.length - 1].dest_x = ob.updates[i].x;
                        _this.model.sprites[_this.model.sprites.length - 1].dest_y = ob.updates[i].y;
                        //If the robot does exist then the robot will be moved to the new location based off of the found index
                    }
                    else {
                        var sprite = _this.model.sprites[found];
                        var dx = ob.updates[i].x;
                        var dy = ob.updates[i].y;
                        sprite.set_destination(dx, dy);
                    }
                }
            }
        };
        this.model = model;
        this.view = view;
        this.key_right = false;
        this.key_left = false;
        this.key_up = false;
        this.key_down = false;
        var self = this;
        this.last_updates_request_time = 0;
        view.canvas.addEventListener("click", function (event) { self.onClick(event); });
        document.addEventListener('keydown', function (event) { self.keyDown(event); }, false);
        document.addEventListener('keyup', function (event) { self.keyUp(event); }, false);
    }
    Controller.prototype.onClick = function (event) {
        var x = event.pageX - this.view.canvas.offsetLeft + g_scroll_x;
        var y = event.pageY - this.view.canvas.offsetTop + g_scroll_y;
        this.model.onclick(x, y);
        this.model.turtle.set_destination(x, y);
        //this.model.turtle.go_toward_destination();
        httpPost('ajax.html', {
            id: g_id,
            name: g_name,
            action: 'move',
            x: x,
            y: y,
        }, this.onAcknowledgeClick);
    };
    Controller.prototype.keyDown = function (event) {
        if (event.key === 'ArrowRight')
            this.key_right = true;
        else if (event.key === 'ArrowLeft')
            this.key_left = true;
        else if (event.key === 'ArrowUp')
            this.key_up = true;
        else if (event.key === 'ArrowDown')
            this.key_down = true;
    };
    Controller.prototype.keyUp = function (event) {
        if (event.key === 'ArrowRight')
            this.key_right = false;
        else if (event.key === 'ArrowLeft')
            this.key_left = false;
        else if (event.key === 'ArrowUp')
            this.key_up = false;
        else if (event.key === 'ArrowDown')
            this.key_down = false;
    };
    Controller.prototype.update = function () {
        var dx = 0;
        var dy = 0;
        var speed = this.model.turtle.speed;
        if (this.key_right)
            dx += speed;
        if (this.key_left)
            dx -= speed;
        if (this.key_up)
            dy -= speed;
        if (this.key_down)
            dy += speed;
        if (dx != 0 || dy != 0)
            this.model.move(dx, dy);
        var time = Date.now();
        if (time - this.last_updates_request_time >= 1000) {
            this.last_updates_request_time = time;
            // Send a request to the server for updates
            httpPost('ajax.html', {
                id: g_id,
                action: 'update',
            }, this.updateFront);
        }
    };
    Controller.prototype.onAcknowledgeClick = function (ob) {
        console.log("Response to move: ".concat(JSON.stringify(ob)));
    };
    return Controller;
}());
var Game = /** @class */ (function () {
    function Game() {
        this.model = new Model();
        this.view = new View(this.model);
        this.controller = new Controller(this.model, this.view);
    }
    Game.prototype.onTimer = function () {
        this.controller.update();
        this.model.update();
        this.view.update();
    };
    return Game;
}());
var push = function () {
    var s = [];
    g_name = document.getElementById("name").value;
    console.log("g_name=".concat(g_name));
    s.push("<canvas id=\"myCanvas\" width=\"1000\" height=\"500\" style=\"border:1px solid #cccccc;\">");
    s.push("</canvas>");
    var content = document.getElementById('content');
    console.log(content);
    if (content) {
        content.innerHTML = s.join('');
    }
    var game = new Game();
    g_game = game;
    var timer = setInterval(function () { game.onTimer(); }, 40);
    httpPost('ajax.html', {
        action: 'get_map',
    }, onReceiveMap);
};
var thing_names = [
    "chair",
    "lamp",
    "mushroom",
    "outhouse",
    "pillar",
    "pond",
    "rock",
    "statue",
    "tree",
    "turtle",
];
var g_game;
var onReceiveMap = function (ob) {
    var things = ob.map.things;
    for (var i = 0; i < things.length; i++) {
        var thing = things[i];
        g_game.model.sprites.push(new Sprite(thing.x, thing.y, thing.kind, "".concat(thing_names[thing.kind], ".png"), Sprite.prototype.sit_still, Sprite.prototype.ignore_click, ''));
    }
};
var story = function () {
    var l = [];
    // Push a story to the array
    l.push("<p>");
    l.push("You are a turtle. You are in a maze. You must escape.");
    l.push("</p>");
    l.push("<input type=\"text\" id=\"name\" name=\"name\"><br><br>");
    l.push("<button onclick=\"push()\">Start</button>");
    var content = document.getElementById('content');
    console.log(content);
    if (content) {
        content.innerHTML = l.join('');
    }
};
story();
