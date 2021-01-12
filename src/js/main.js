/*******************************************************************************************************

███╗   ██╗██╗██╗  ██╗ ██████╗ ███╗   ██╗            ****************************************************                 
████╗  ██║██║╚██╗██╔╝██╔═══██╗████╗  ██║            * This application is simulation of crane storage 
██╔██╗ ██║██║ ╚███╔╝ ██║   ██║██╔██╗ ██║            * sistem's controller.                 
██║╚██╗██║██║ ██╔██╗ ██║   ██║██║╚██╗██║            * Free to use for non commercial usage.  
██║ ╚████║██║██╔╝ ██╗╚██████╔╝██║ ╚████║            * Feel free to contact me for customization. 
╚═╝  ╚═══╝╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝            *                 
 ██████╗██████╗  █████╗ ███╗   ██╗███████╗          *      live demo at: nixonsresume.online
██╔════╝██╔══██╗██╔══██╗████╗  ██║██╔════╝          ****************************************************                 
██║     ██████╔╝███████║██╔██╗ ██║█████╗                             
██║     ██╔══██╗██╔══██║██║╚██╗██║██╔══╝                             ~
╚██████╗██║  ██║██║  ██║██║ ╚████║███████╗                           
 ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝                           
 ██████╗ ██████╗ ███╗   ██╗████████╗██████╗  ██████╗ ██╗     ██╗     
██╔════╝██╔═══██╗████╗  ██║╚══██╔══╝██╔══██╗██╔═══██╗██║     ██║     
██║     ██║   ██║██╔██╗ ██║   ██║   ██████╔╝██║   ██║██║     ██║     
██║     ██║   ██║██║╚██╗██║   ██║   ██╔══██╗██║   ██║██║     ██║     
╚██████╗╚██████╔╝██║ ╚████║   ██║   ██║  ██║╚██████╔╝███████╗███████╗
 ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚══════╝
*******************************************************************************************************
Last Update: 12/2/2020

Todos: 

Select the box - display the box info
Ease the movement to the station
Make a div for adding new boxes to the storage
Make order array*(ok) and complete the orders one by one
crane movement sound
maxspeed of the crane and the twister
if pickup location is selected show a cancel button to cancel the order creation
ALL OF THE TEXTS TRANSFORM TO DATA CARRIER OBJECT

*******************************************************************************************************/
import { makeCanvas, sprite, group, particles, particleEffect, tilingSprite, emitter, stage, render, rectangle, text, grid, circle, button} from "./library/display"
import { assets, randomInt, contain, wait, distance, collision} from "./library/utilities"
import { makePointer, keyboard, hitTestSprite, draggable} from "./library/interactive"
import { hit, hitTestCircleRectangle, hitTestRectangle, hitTestPoint, circleRectangleCollision, } from "./library/collision"
import { wobble } from "./library/tween"
import { newOrder } from "./order"
import { loadBoxes } from "./loadBoxes"
import { generateBox } from "./GenerateBox"
import Box from './box';

//Load assets
assets.load([
    "./json/craneImg.json"
]).then(()=>setup())


//Handling things outsicde of the app - divs etc
let overlay = document.getElementById("overlay")
document.getElementById("send-box-cancel").addEventListener("click", ()=>{ overlay.style.visibility = "hidden"})
let indexLocSent = document.getElementById("indLocation")
let generateBoxmessage = document.getElementById("boxMessage")
document.getElementById("send-box").addEventListener("click",()=>{makeInboundBox(generateBoxmessage.value,indexLocSent.value,-1); overlay.style.visibility = "hidden"})

// Declare shared variables
let pointer,startDeliveryFlag = false, pickupFlag = false, canvas, crane, twister, box, craneAll, textBox, textSpeed, textTwisterY, textCraneX, textTwisterSpeed, rack, texttargetLocation, inboundJob=false, order, dot, inbound, outbound, inboundText, outboundTExt, addBoxButton, incommingSwitchButton, incommingSwitch = true;
let orders = [] //Array used to store the orders
let pickUpLocation = [] //Array used to store the pickup location x and y until the destination is not selected
let destinationLocation = [] //Array used to store the destination x and y 
let boxesArray = [] // Array which will store the boxes

//FUNCTIONS LATER TO EXPORT
let makeBox = function(message,currentLocI){
    let box = sprite(assets["box.png"])
    box.message = message
    box.name = "box"
    box.locationIndex = currentLocI
    boxesArray.push(box)
}

let makeInboundBox = function(message, destino, currentLocI){
    let box = sprite(assets["box.png"])
    box.message = message
    box.name = "box"
    box.destination = destino
    box.locationIndex = currentLocI
    box.waiting = true
    boxesArray.push(box)
}

// Setup everything before playing
function setup(){    
// UNCOMMENT FOR DRIVE WITH ARROWS
//keypress
        let left = keyboard(37)
        left.press = ()=>{ crane.moveLeft = true}
        left.release = ()=>{ crane.moveLeft = false}

        let right = keyboard(39)
        right.press = ()=>{ crane.moveRight = true}
        right.release = ()=>{ crane.moveRight = false}

        let up = keyboard(38)
        up.press = ()=>{ if(twister.y>50){twister.moveUp = true}}
        up.release = ()=>{ twister.moveUp = false}

        let down = keyboard(40)
        down.press = ()=>{ if(twister.y<crane.height-120)twister.moveDown = true}
        down.release = ()=>{ twister.moveDown = false}

        let stop = keyboard(32)
        stop.press = ()=>{craneAll.vx=0; twister.vy=0}
 

  //make the canvas

    canvas = makeCanvas(1600,1000)
    canvas.style.backgroundColor = "grey"
    stage.width =  window.innerWidth / canvas.width;
    stage.height = window.innerHeight / canvas.height;
    let scaleX, scaleY, scale, center;
    
    scaleX = window.innerWidth / canvas.width;
    scaleY = window.innerHeight / canvas.height;

    scale = Math.min(scaleX, scaleY);
    canvas.style.transformOrigin = "0 0";
    canvas.style.transform = "scale(" + scale + ")";
    canvas.style.paddingLeft = 0;
    canvas.style.paddingRight = 0;
    canvas.style.paddingTop = 0;
    canvas.style.paddingBottom = 0;
    canvas.style.display = "block";

    pointer = makePointer(canvas)
   
    let box = sprite(assets["box.png"])
    box.visible = false
    pointer.scale = scale;
    scale = scale;
   

//Make and assign boxes from boxesLocations array to the locations 

let boxes = loadBoxes()
boxes.boxes.forEach(el => {
      makeBox(el.message,el.LI)
})

// making the rack and the locations
    let locationIndex = 0
    rack = grid(27,20,box.width+2,box.height+5,true,0,0,
    () =>{ 
        let location = rectangle(box.width-1,box.height-1,"black");
        location.index = locationIndex++
        location.occupied = false
        location.selected = false
        location.name = "rack"
        boxesArray.forEach(b=>{
            if(location.index == b.locationIndex){
                location.addChild(b)
                location.occupied=true
            }
        })

        return location
    }
  )
    rack.setPosition(5*box.width,2*box.height)

// General properties of the crane
    crane = sprite(assets["crane.png"]),
    crane.accelerationX = 0.01
    crane.frictionX = 0.93
    crane.speed = 0.13
    crane.pivotX = 62
    crane.moveRight = false
    crane.moveLeft = false

// General movement properties of the crane
    twister = sprite(assets["twister.png"])
    twister.x = crane.pivotX
    twister.y = crane.height-110
    twister.accelerationY = 0.01
    twister.frictionY = 0.91
    twister.speed = 0.013
    twister.moveUp = false
    twister.moveDown = false
    twister.busy = false
    twister.boxFound = false

// Make the inbound and outbound stations
    inbound = rectangle(200,30,"white","white")
    inbound.x = -200
    inbound.y = 200
    inbound.name = "inbound"
    inbound.index = -1

    outbound = rectangle(200,30,"white","white")
    outbound.x = -200
    outbound.y = 300
    outbound.name = "outbound"
    outbound.index = -2
// make button for add new boxes

    addBoxButton = rectangle(120,20,"orange","black",2,20,20)
    addBoxButton.interactive = true
    addBoxButton.text = text("Create Box", "arial" , "black", addBoxButton.x, addBoxButton.centerY )

// make button to turn off incomming boxes and use it in manual

    incommingSwitchButton = rectangle(120,20,"lightgreen","black",2,20,80)
    incommingSwitchButton.interactive = true
    incommingSwitchButton.text = text("Turn OFF inbound", "arial" , "black", incommingSwitchButton.x, incommingSwitchButton.centerY )


// make the relations
    rack.addChild(inbound)
    rack.addChild(outbound)
    crane.addChild(twister)
    craneAll = group(crane,twister)
    
//the box displaying the informarion

//////////////////////////// RECREATE ALL DATA DISPLAY AND INFOS

//     textBox = rectangle(canvas.width-50,50,"lightgrey","grey")
//     textBox.x = 25
//     textBox.y = canvas.height - 75
    
// /* TODO> ALL OF THE TEXTS TRANSFORM TO DATA CARRIER OBJECT */ 
// //The texts displayed in the infobox  
//     textSpeed = text()
//     textTwisterY = text()
//     textCraneX = text()
//     textTwisterSpeed = text()
//     texttargetLocation = text("no target")
//     inboundText = text("INBOUND","arial","white", 20, -10)
//     outboundTExt = text("OUTBOUND","arial","white", 20, -10)
    
//     textSpeed.x = 100
//     textTwisterY.x = 200
//     textCraneX.x =300
//     textTwisterSpeed.x =400 
//     texttargetLocation.x = 500

//     textBox.addChild(textSpeed)
//     textBox.addChild(textTwisterY)
//     textBox.addChild(textTwisterY)
//     textBox.addChild(textCraneX)
//     textBox.addChild(textTwisterSpeed)
//     textBox.addChild(texttargetLocation)

   // inbound.addChild(inboundText)
   // outbound.addChild(outboundTExt)

    // red dot for searching the pivot
    dot = circle(6,"red")
    dot.x = 50
    dot.y = 36
    twister.addChild(dot)
    //start the game loop
    gameLoop()
    console.log(rack)
}
function gameLoop(){
    requestAnimationFrame(gameLoop)
    play()
}


// If twister is not busy set timeout and generate a random order every 10-15 secounds - Incomming ON-OFF

setInterval(()=>{ 

    if(!twister.busy && incommingSwitch){
        let randLoc = randomInt(0,539);
        let randMes = "random message for "+randLoc;
        console.log('create box');
        makeInboundBox(randMes,randLoc,-1);
    }

}, 7000);


// The logis of the program
function play(){
    if(twister.children[1]){
        twister.busy=true
    }else{
        twister.busy=false
    }
    //Checking every location on the rack for interaction, doing the main logic of the game
    rack.children.forEach(location => {
        /* when mouse is over one location, the location is red, When we click on the location it will be pick up location,
         if we have pickpu location selected, it will be destination */
        if(pointer.hitTestSprite(location)){
            location.fillStyle='red';
                // If the pickuplocation is 0 than we know that this is position for pickup - add position as pickup
                if(pointer.isDown && pickUpLocation.length == 0 && location.children.length!=0 && location.name == "rack"){
                    pickUpLocation.push(location.centerX,location.centerY,location.index)
                    console.log(pickUpLocation[2])
                  // THE INFOBOX   texttargetLocation.content = `X:${location.x},Y:${location.y}`
                  
                    incommingSwitch = false;
                    pointer.isDown = false
                // If the pickuplocation is more than 0 we know that this is position for destination - add position as destination
                }else if(pointer.isDown && pickUpLocation.length > 0 &&  location.children.length==0 && location.name == "rack"){
                    destinationLocation.push(location.centerX,location.centerY,location.index)
                    order = newOrder(pickUpLocation[0],pickUpLocation[1],location.message,destinationLocation[0],destinationLocation[1],location.name,pickUpLocation[2],destinationLocation[2])
                    console.log(order)
                    orders.push(order)
                    pickUpLocation = []
                    destinationLocation = []
                    pointer.isDown = false
                    location.selected = true
                //If the location name is outbound than 
                }else if(pointer.isDown && pickUpLocation.length > 0 && location.name == "outbound"){
                    destinationLocation.push(location.centerX+location.width/2-27,location.centerY,location.index)
                    order = newOrder(pickUpLocation[0],pickUpLocation[1],location.message,destinationLocation[0],destinationLocation[1],location.name,pickUpLocation[2],destinationLocation[2])
                    console.log(order)
                    orders.push(order)
                    pickUpLocation = []
                    destinationLocation = [] 
                    pointer.isDown = false
                    location.selected = true
                }
        }else{
            if(location.selected){
                location.fillStyle='yellow'
            }else{
             location.fillStyle='black'
            }
        }
        // Logic and movement for in and outbound
        // OUTBOUND - recieving the box and shift it out from the silo
        // If there is a box on the outbound - move it out from the silo
        if(location.name == "outbound" && location.children!=0){
            if(location.children[0].x > 0){
                location.children[0].x -=1
            }else{
                location.children.shift()
                location.occupied=false
            }
        }
        //INBOUND - creating a new box, making it ready for the crane  
        if(location.name == "inbound" && location.children!=0){
            location.children.forEach(b=>{
                
                if(b.x + b.width < inbound.width){
                        b.x++
                }else{
                    //check if the destination is valid and make sure order happens once
                    if(rack.children[b.destination] && inboundJob == false){
                        
                        let orx = rack.children[b.destination].centerX
                        let ory = rack.children[b.destination].centerY
                        let nm = "inbound"
                        
                        destinationLocation.push(orx,ory,b.destination)

                        order = newOrder(inbound.centerX+location.width/2-27,inbound.centerY,b.message,destinationLocation[0],destinationLocation[1],nm,-1,destinationLocation[2])
                        console.log(order)
                        orders.push(order)

                        destinationLocation = []
                        inboundJob = true
                    }
                }
            })
        }
    })

    //Checking every box in boxes array, if there is a new box in array with location of -1 make it children of inbound
    boxesArray.forEach(box=>{
        if(box.locationIndex==-1 && box.waiting == true){
            inbound.addChild(box)
            box.waiting = false
        }
    })

    if(orders.length>0){
// PICKUP
      if(!twister.busy){
        let dotGlobalX = dot.globalBounds.x+dot.radius
        let dotGlobalY = dot.globalBounds.y+dot.radius
        let posXGlobal = orders[0].positionX+rack.globalBounds.x
        let posYGlobal = orders[0].positionY+rack.globalBounds.y

        var dx = (posXGlobal - dotGlobalX) * 0.02;
        var dy = (posYGlobal - dotGlobalY) * 0.05;
        //calculate the distance this would move ...
        var dist = Math.sqrt(dx*dx + dy*dy);
        //... and cap it at 5px
        if(dist > 5){
          dx *= 5/dist;
          dy *= 5/dist;
          if(!pickupFlag){ console.log('...moving to pickup...'); pickupFlag = true;}
          
        //If the twister arrived to the destination...
        }else if(dist<0.05){
            //get the location data from the order
            let loc;
            if(orders[0].locationName == "rack"){
                 loc = rack.children[orders[0].locationIndex]
            }else if(orders[0].locationName == "inbound"){
                 loc = inbound
            }
            let destLoc = rack.children[orders[0].destinationIndex]
            //check if the dot is touching box - which is children of the location, if not Delete the order and deselect the destination
            if(loc.children[0]){
                //check the touching with the box
                if(hitTestCircleRectangle(dot,loc.children[0],true)){
                    let b = loc.children[0]
                    console.log(loc.children[0])
                    twister.addChild(b)
                    b.x = dot.x-b.width/2+3
                    b.y = dot.y-b.height/2+3
                    loc.occupied = false
                    pickupFlag = false;
                }
            //If there is no box 
            }else{
                console.log('Error ! - Location is empty...\n Deleting order...')
                destLoc.selected = false
                orders.shift()
                pickupFlag = false;
            }
        }
    }
// DELIVERY
        if(twister.busy){
            let dotGlobalX = dot.globalBounds.x+dot.radius
            let dotGlobalY = dot.globalBounds.y+dot.radius
            let posXGlobal = orders[0].destinationX+rack.globalBounds.x
            let posYGlobal = orders[0].destinationY+rack.globalBounds.y
    
            var dx = (posXGlobal - dotGlobalX) * 0.02;
            var dy = (posYGlobal - dotGlobalY) * 0.05;
            //calculate the distance this would move ...
            var dist = Math.sqrt(dx*dx + dy*dy);

            //... and cap it at 5px
            if(dist > 5){
              dx *= 3/dist;
              dy *= 5/dist;
                //report the start of delivery once
                if(!startDeliveryFlag){ console.log('...start delivery...'); startDeliveryFlag = true;}
            }else if(dist<0.05){
                let arrivedToDest = hit(dot,rack.children,false,false,true,
                    (collision,location)=>{
                        console.log("check if location is used: " + location.occupied)
                        if(!location.occupied){
                            let b = twister.children[1]
                            location.addChild(b)
                            location.occupied=true
                            if(location.name == "outbound"){
                                b.x = location.width - b.width
                                b.y = location.height-b.height
                            }else{
                                b.x = 0
                                b.y = 0
                            }
                            orders.shift()
                            location.selected = false
                            console.log("box delivered")
                            startDeliveryFlag = false;
                            inboundJob = false
                        }else{
                            //Reject the box if the position is ocupied
                            console.log("placement fail! - location is occupied! \n ")
                            orders.shift()
                            order = newOrder(0,0,"Failed to deliver",-27,315,"outbound",0,-2)
                            orders = [order,...orders]
                            inboundJob = false
                            startDeliveryFlag = false;
                        }
                    }
                )
            }
        }
            
        craneAll.x += dx;
        twister.y += dy;
    }  
// Movement dinamics
    if(crane.moveRight){
        crane.speed += 0.03
    }else if(crane.moveLeft){
        crane.speed -= 0.03
    }else{
        crane.speed *= crane.frictionX
    }
    crane.accelerationX = crane.speed
    crane.vx = crane.accelerationX
    craneAll.x +=crane.vx
    
    if(twister.moveUp){
        twister.speed -= 0.03
    }else if(twister.moveDown){
        twister.speed += 0.03
    }else{
        twister.speed *=twister.frictionY
    }
    twister.accelerationY = twister.speed
    twister.vy = twister.accelerationY
    twister.y += twister.vy

//Text and info dynamics
    // textSpeed.content = `Speed: ${crane.accelerationX.toFixed(4)}`
    // textTwisterY.content = `Height: ${(crane.height -120 - twister.y).toFixed(4)}`
    // textCraneX.content = `Position X: ${craneAll.x.toFixed(4)}`
    // textTwisterSpeed.content = `Y Speed: ${twister.speed.toFixed(4)}`

// BUTTON DYNAMICS AND CONTROLL
if(pointer.hitTestSprite(addBoxButton)){
    addBoxButton.fillStyle = "darkgrey"
    if(pointer.isDown){
        console.log(overlay.style.visibility)
        overlay.style.visibility = "visible"
        pointer.isDown=false
    }
}else{
    addBoxButton.fillStyle = "grey"
}

if(pointer.hitTestSprite(incommingSwitchButton)){
    incommingSwitch?incommingSwitchButton.fillStyle = "green":incommingSwitchButton.fillStyle = "orange";
    if(pointer.isDown){
        pointer.isDown=false;
        incommingSwitch?incommingSwitch=false:incommingSwitch=true;
    }
}else{
    incommingSwitch?incommingSwitchButton.fillStyle = "lightgreen":incommingSwitchButton.fillStyle = "red";
}

//render on the canvas
    render(canvas)
}


