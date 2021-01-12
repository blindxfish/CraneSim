export
function newOrder(x,y,message,desX,desY,locName="rack",locIndex,destInd) {

   let order = {
        positionX: x,
        positionY: y,
        message: message,
        destinationX: desX,
        destinationY: desY,
        locationName: locName,
        locationIndex: locIndex,
        destinationIndex: destInd
   }

    return order
}