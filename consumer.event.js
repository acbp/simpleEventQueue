const process = require('process')
const EventEmitter = require('events')
const event = new EventEmitter()

const log = true;// controla logs
let i = 0; // contador para saber quantas mensagens foram mandadas

const startProcess = (data) => {
    log && console.info(`starting`)
    setImmediate(() => event.emit('run'))
    ++i
}
event.on('start', startProcess)

const runProcess = async (data) => {
    log && console.info(`running`)
    setImmediate(() => event.emit('finish'))
}
event.on('run', runProcess)

const finishProcess = (data) => {
    log && console.info(`finished`)
    setImmediate(() => event.emit('next'))
}
event.on('finish', finishProcess)

const next = () => {
    log && console.info(`next`)
    setImmediate(() => event.emit('start', new Date().toISOString()))
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


event.emit('start',new Date().toISOString())
setInterval(() => console.log(`Total ${i}`), 2000);