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
    function Sprite(x, y, id, image_url, update_method, onclick_method) {
        this.x = x;
        this.y = y;
        this.speed = 4;
        this.id = id;
        this.image = new Image();
        this.image.src = image_url;
        this.update = update_method;
        this.onclick = onclick_method;
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
        this.turtle = new Sprite(50, 50, g_id, "green_robot.png", function () { return _this.turtle.go_toward_destination(); }, function (x, y) { return _this.turtle.set_destination(x, y); });
        console.log("g_id=".concat(g_id));
        this.sprites.push(this.turtle);
    }
    Model.prototype.update = function () {
        //console.log('------------------');
        for (var _i = 0, _a = this.sprites; _i < _a.length; _i++) {
            var sprite = _a[_i];
            sprite.update();
            console.log("id=".concat(sprite.id));
            console.log("x=".concat(sprite.dest_x));
            console.log("y=".concat(sprite.dest_y));
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
var View = /** @class */ (function () {
    function View(model) {
        this.model = model;
        this.canvas = document.getElementById("myCanvas");
        this.turtle = new Image();
        this.turtle.src = "turtle.png";
    }
    View.prototype.update = function () {
        var ctx = this.canvas.getContext("2d");
        if (ctx) {
            ctx.clearRect(0, 0, 1000, 500);
            for (var _i = 0, _a = this.model.sprites; _i < _a.length; _i++) {
                var sprite = _a[_i];
                ctx.drawImage(sprite.image, sprite.x - sprite.image.width / 2, sprite.y - sprite.image.height);
            }
        }
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
                [id, x, y],
                [id, x, y],
                ...
            ]
        */
        this.updateFront = function (ob) {
            if (ob.updates.length > 0)
                console.log("Response to move: ".concat(JSON.stringify(ob)));
            if (ob.updates) {
                for (var i = 0; i < ob.updates.length; i++) {
                    var bool = false;
                    var found = 0;
                    // Checks to see if the robot already exists
                    for (var j = 0; j < _this.model.sprites.length; j++) {
                        //If statment checks the generated ID with the ID of the robot stored on the server
                        //If Robot does not exist then the bool will remain false
                        //If Robot does exist then the bool will be true and the index of the robot will be stored in found
                        //ID of sprites is declared in the constructor of the Sprite class
                        if (_this.model.sprites[j].id === ob.updates[i][0]) {
                            bool = true;
                            found = j;
                        }
                    }
                    //If the robot does not exist then a new robot will be created
                    if (!bool) {
                        console.log("Make New Robot");
                        //window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
                        _this.model.sprites.push(new Sprite(0, 0, ob.updates[i][0], "blue_robot.png", Sprite.prototype.go_toward_destination, function (x, y) { return _this.model.turtle.set_destination(x, y); }));
                        console.log("id=".concat(ob.updates[i][0]));
                        _this.model.sprites[_this.model.sprites.length - 1].dest_x = ob.updates[i][1];
                        _this.model.sprites[_this.model.sprites.length - 1].dest_y = ob.updates[i][2];
                        //If the robot does exist then the robot will be moved to the new location based off of the found index
                    }
                    else {
                        var sprite = _this.model.sprites[found];
                        var dx = ob.updates[i][1];
                        var dy = ob.updates[i][2];
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
        var x = event.pageX - this.view.canvas.offsetLeft;
        var y = event.pageY - this.view.canvas.offsetTop;
        this.model.onclick(x, y);
        this.model.turtle.set_destination(x, y);
        //this.model.turtle.go_toward_destination();
        httpPost('ajax.html', {
            id: g_id,
            action: 'clicked',
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
                action: 'updates',
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
var game = new Game();
var timer = setInterval(function () { game.onTimer(); }, 40);
