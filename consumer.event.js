const ConsumerWorker = require('./consumer.worker')
const process = require('process')
const EventEmitter = require('events');
const { emit } = require('process');
const event = new EventEmitter()

const log = true;// controla logs
let i = 0; // contador para saber quantas mensagens foram mandadas
let started = 0; // contador para saber quantas mensagens foram mandadas

const startProcess = (data) => {
    log && console.info(`starting`, data)
    ++started
    setImmediate(() => event.emit('run', data))
}
event.on('start', startProcess)

const runProcess = async (data) => {
    log && console.info(`running`)
    // setImmediate(() => event.emit('finish'))

    new ConsumerWorker(event, data);

    // setTimeout(() => event.emit('finish', data), 5000)
}
event.on('run', runProcess)

const finishProcess = (data) => {
    log && console.info(`finished`)
    ++i
    setImmediate(() => event.emit('next', data))
}
event.on('finish', finishProcess)

const next = () => {
    //     log && console.info(`next`)
    //     setImmediate(() => event.emit('start', new Date().toISOString()))
}
event.on('next', next)

// tratamento para fechamento do programa
const handler = (err => {
    console.error(`Total de ${i}`, err?.stack ?? err);
    process.exit(1); // mandatory (as per the Node.js docs)
});

// tratamento caso node quebre
process.on('uncaughtException', handler)
// tratamento caso cancele
process.on('SIGINT', handler)


// event.emit('start',new Date().toISOString())
// setInterval(() => console.log(`Total ${i}`), 2000);

module.exports = {
    start(ev, data) {
        event.emit('start', data);
    },
    onTotal(){
        return i;
    }
}