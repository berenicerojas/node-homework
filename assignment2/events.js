const EventEmitter = require ('events');
const myEmitter = new EventEmitter();

myEmitter.on('time', (timeString)=>{
    console.log("Time received:" + timeString);
});

setInterval(()=> {
    const currentTime = new Date().toLocaleTimeString();
    myEmitter.emit('time', currentTime);
}, 5000);

console.log("Emitter is running. Press Ctrl-C to stop...");

module.exports = myEmitter;