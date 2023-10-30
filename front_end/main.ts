

interface HttpPostCallback {
	(x:any): any;
}

const random_id = (len:number) => {
    let p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return [...Array(len)].reduce(a => a + p[Math.floor(Math.random() * p.length)], '');
}

const g_origin = new URL(window.location.href).origin;
const g_id = random_id(12);
let g_name = "nonameyet";

// Payload is a marshaled (but not JSON-stringified) object
// A JSON-parsed response object will be passed to the callback
const httpPost = (page_name: string, payload: any, callback: HttpPostCallback) => {
	let request = new XMLHttpRequest();
    
    
	request.onreadystatechange = () => {
		if(request.readyState === 4)
		{
			if(request.status === 200) {
				let response_obj;
				try {
					response_obj = JSON.parse(request.responseText);
				} catch(err) {}
				if (response_obj) {
					callback(response_obj);
				} else {
					callback({
						status: 'error',
						message: 'response is not valid JSON',
						response: request.responseText,
					});
				}
			} else {
				if(request.status === 0 && request.statusText.length === 0) {
					callback({
						status: 'error',
						message: 'connection failed',
					});
				} else {
					callback({
						status: 'error',
						message: `server returned status ${request.status}: ${request.statusText}`,
					});
				}
			}
		}
	};
	request.open('post', `${g_origin}/${page_name}`, true);
	request.setRequestHeader('Content-Type', 'application/json');
	request.send(JSON.stringify(payload));
}



//let g_id_to_sprite: Record<string, Sprite> = {};
//g_id_to_sprite[id] = sprite;



class Sprite {
    x: number;
    y: number;
    id: string;
    speed: number;
    image: HTMLImageElement;
    update: () => void;
    onclick: (x: number, y: number) => void;
    dest_x: number | undefined;
    dest_y: number | undefined;
    name: string;

    constructor(x: number, y: number, id: string, image_url: string, update_method: () => void, onclick_method: (x: number, y: number) => void, name: string) {
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

    set_destination(x: number, y: number) {
        this.dest_x = x;
        this.dest_y = y;
    }

    ignore_click(x: number, y: number) {
    }

    move(dx: number, dy: number) {
        if (this.dest_x !== undefined && this.dest_y !== undefined) {
            this.dest_x = this.x + dx;
            this.dest_y = this.y + dy;
        }
    }

    go_toward_destination() {
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
    }

    sit_still() {
    }
}

class Model {
    sprites: Sprite[];
    turtle: Sprite;

    constructor() {
        this.sprites = [];
        this.turtle = new Sprite(50, 50, g_id.toString(), "green_robot.png", () => this.turtle.go_toward_destination(), (x, y) => this.turtle.set_destination(x, y), (g_name));
        console.log(`g_id=${g_id}`);
        this.sprites.push(this.turtle);
        
    }

    update() {
        //console.log('------------------');
        for (const sprite of this.sprites) {
            sprite.update();
            
        }
    }

    onclick(x: number, y: number) {
        for (const sprite of this.sprites) {
            sprite.onclick(x, y);
        }
    }

    move(dx: number, dy: number) {
        this.turtle.move(dx, dy);
        if(this.turtle.x == dx && this.turtle.y == dy){
            window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
        }
    }
}

let g_scroll_x = 0;
let g_scroll_y = 0;

class View {
    model: Model;
    canvas: HTMLCanvasElement;
    turtle: HTMLImageElement;
    

    constructor(model: Model) {
        this.model = model;
        this.canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
        
        console.log(`canvas=${this.canvas}`);
        this.turtle = new Image();
        this.turtle.src = "turtle.png";
    }

    update() {
        const ctx = this.canvas.getContext("2d");
			if(ctx){
            ctx.clearRect(0, 0, 1000, 500);
            for (const sprite of this.model.sprites) {
                ctx.drawImage(sprite.image, sprite.x - sprite.image.width / 2 - g_scroll_x, sprite.y - sprite.image.height - g_scroll_y);
                ctx.font = "20px Verdana";
                ctx.fillText(sprite.name, sprite.x - sprite.image.width / 2 - g_scroll_x, sprite.y - sprite.image.height - 10 - g_scroll_y);
                
                
            }
            const center_x = 500;
            const center_y = 270;
            const scroll_rate = 0.03;
            g_scroll_x += scroll_rate * (this.model.turtle.x - g_scroll_x - center_x);
            g_scroll_y += scroll_rate * (this.model.turtle.y - g_scroll_y - center_y);

            
            
			}
            
        
    }

    content(){
        
    }
}

class Controller {
    model: Model;
    view: View;
    key_right: boolean;
    key_left: boolean;
    key_up: boolean;
    key_down: boolean;

    last_updates_request_time: number = 0;

    constructor(model: Model, view: View) {
        this.model = model;
        this.view = view;
        this.key_right = false;
        this.key_left = false;
        this.key_up = false;
        this.key_down = false;
        const self = this;
        this.last_updates_request_time = 0; 
        view.canvas.addEventListener("click", (event) => { self.onClick(event); });
        document.addEventListener('keydown', (event) => { self.keyDown(event); }, false);
        document.addEventListener('keyup', (event) => { self.keyUp(event); }, false);
    }

    onClick(event: MouseEvent) {
        const x = event.pageX - this.view.canvas.offsetLeft + g_scroll_x;
        const y = event.pageY - this.view.canvas.offsetTop + g_scroll_y;
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
    }

    keyDown(event: KeyboardEvent) {
        if (event.key === 'ArrowRight') this.key_right = true;
        else if (event.key === 'ArrowLeft') this.key_left = true;
        else if (event.key === 'ArrowUp') this.key_up = true;
        else if (event.key === 'ArrowDown') this.key_down = true;
    }

    keyUp(event: KeyboardEvent) {
        if (event.key === 'ArrowRight') this.key_right = false;
        else if (event.key === 'ArrowLeft') this.key_left = false;
        else if (event.key === 'ArrowUp') this.key_up = false;
        else if (event.key === 'ArrowDown') this.key_down = false;
    }



    update() {
        let dx = 0;
        let dy = 0;
        const speed = this.model.turtle.speed;
        if (this.key_right) dx += speed;
        if (this.key_left) dx -= speed;
        if (this.key_up) dy -= speed;
        if (this.key_down) dy += speed;
        if (dx != 0 || dy != 0)
            this.model.move(dx, dy);
            const time = Date.now();
            if (time - this.last_updates_request_time >= 1000) {
              this.last_updates_request_time = time;

              // Send a request to the server for updates
              httpPost('ajax.html', {
                id: g_id,
                action: 'update',
            }, this.updateFront);
            }
    }
    onAcknowledgeClick(ob: any) {
		console.log(`Response to move: ${JSON.stringify(ob)}`);
	}
/*
{
    Format of the response object:
    "updates": [
        [id, x, y, name],
        [id, x, y],
        ...
    ]
*/
    updateFront = (ob: any) => {
    
// Loads Sprites
    if (ob.updates) {
        for (let i = 0; i < ob.updates.length; i++) {
            const serverID = ob.updates[i].id;
    

            // Check if a sprite with the same ID already exists
    
            let existingSprite: Sprite | null = null;
            for (let j = 0; j < this.model.sprites.length; j++) {
        
                if (this.model.sprites[j].id === serverID) {
                    existingSprite = this.model.sprites[j];
                    console.log(`serverID= ${serverID}`);
                    console.log(`clientID= ${this.model.sprites[j].id}`);
                    break;
                }
            }

            if (existingSprite) {
                // Update the position of the existing sprite
                const dx = ob.updates[i].x;
                const dy = ob.updates[i].y;
                existingSprite.set_destination(dx, dy);
                console.log(`Updated existing sprite with ID ${serverID}`);
            } else {
                // Create a new sprite
                this.model.sprites.push(new Sprite(0, 0, serverID, "blue_robot.png", Sprite.prototype.go_toward_destination, this.model.turtle.ignore_click, ob.updates[i].name));
                this.model.sprites[this.model.sprites.length - 1].dest_x = ob.updates[i].x;
                this.model.sprites[this.model.sprites.length - 1].dest_y = ob.updates[i].y;
                console.log(`Created a new sprite with ID ${serverID}`);
            }
        }
    }

    update_count(ob);
    
    //Update chats with ob.chats

    if(ob.chats){
        const chatWindow = document.getElementById("chatWindow") as HTMLSelectElement;
        console.log(ob.chats); 
        
            // make an array of chats
        for(let i = 0; i < ob.chats.length; i++ ){
            
            const text = ob.chats[i];
            const option = document.createElement("option");
            option.text = text;
            option.scrollIntoView();
            chatWindow.add(option);

        }

        
        

    }
    
}
}

const update_count = (ob: any) => {
    if (ob.gold !== undefined && ob.bananas !== undefined) {
             // Update the Gold and Bananas counts on the client side
             const goldElement = document.getElementById('gold') as HTMLElement;
             const bananasElement = document.getElementById('bananas')as HTMLElement;
 
             if (goldElement && bananasElement) {
                 goldElement.innerText = ob.gold;
                 bananasElement.innerText = ob.bananas;
             }
     }
 }

class Game {
    model: Model;
    view: View;
    controller: Controller;
   

    constructor() {
        this.model = new Model();
        this.view = new View(this.model);
        this.controller = new Controller(this.model, this.view);
    }

    onTimer() {
        this.controller.update();
        this.model.update();
        this.view.update();
    }
}

let g_game: Game;

//Runs after the start button is pressed
const push = () => {
    
let s: string[] = [];
g_name = (document.getElementById("name") as HTMLInputElement).value;
console.log(`g_name=${g_name}`);
s.push(`<canvas id="myCanvas" width="1000" height="500" style="border:1px solid #cccccc;">`);
s.push(`</canvas>`);
s.push(`<br><big><big><b>`);
s.push(`Gold: <span id="gold">0</span>,`)
s.push(`Bananas: <span id="bananas">0</span>`);
s.push(`</b></big></big><br>`); 
s.push(`<br>`);
s.push(`<select id="chatWindow" size="8" style="width:1000px"></select>`);
s.push(`<br>`);
s.push(`<input type="input" id="chatMessage"></input>`);
s.push(`<button onclick="postChatMessage()">Post</button>`);

const content = document.getElementById('content');


console.log(content);
if (content) {
    content.innerHTML = s.join('');

}

//Gets the map from the server after starting the game
const game = new Game();

g_game = game;
const timer = setInterval(() => { game.onTimer(); }, 40);
httpPost('ajax.html', {
    action: 'get_map',
}, onReceiveMap);




}

const story = () => {

    let l: string[] = [];

    // Push a story to the array

    
    l.push(`<p>`);
    l.push(`You are a turtle. You are in a maze. You must escape.`);
    l.push(`</p>`);
    l.push(`<input type="text" id="name" name="name"><br><br>`)
    l.push(`<button onclick="push()">Start</button>`);
   
    
    const content = document.getElementById('content');
    console.log(content);
    if (content) {
        content.innerHTML = l.join('');
    }
    


    

}


const postChatMessage = () => {
    //prepare message
    const chatMessage = (document.getElementById("chatMessage") as HTMLInputElement);
    const message = chatMessage.value;
    
   console.log(message);
    //send http post with message. Return function should not update anything.

    httpPost('ajax.html', {
        action: 'chat',
        text : message,
        id : g_id,
    }, print_chat_status);



}

const print_chat_status = (ob: any) => {

    console.log(ob.status); //should be ok
    

}


const onReceiveMap = (ob: any) => {
    
    const things = ob.map.things; 

    for(let i = 0; i < things.length; i++ ){
        let thing = things[i];
        g_game.model.sprites.push(new Sprite(thing.x, thing.y, thing.kind,`${thing_names[thing.kind]}.png`, Sprite.prototype.sit_still, Sprite.prototype.ignore_click, '' ));

    }




} 


//Array of thing names
const thing_names = [
	"chair", // 0
	"lamp",
	"mushroom", // 2
	"outhouse",
	"pillar", // 4
	"pond",
	"rock", // 6
	"statue",
	"tree", // 8
	"turtle",
];

//Starts the game by calling the story function 
story();









