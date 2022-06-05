const process = require('process')
const EventEmitter = require('events')
const event = new EventEmitter()
const amqplib = require('amqplib')

const log = false;// controla logs
let i = 0; // contador para saber quantas mensagens foram mandadas

const startProcess = (data) => {
    log && console.info(`starting`)
    setImmediate(() => event.emit('run', data))
}
event.on('start', startProcess)

const runProcess = async (data) => {
    log && console.info(`running`)
    setImmediate(() => event.emit('finish', data))
}
event.on('run', runProcess)

const next = (send) => {
    log && console.info(`next`)
    console.log(send)
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

// metodos para rabbitmq
const startQueue = async (conn) => {
    const ch = await conn.createChannel();
    await ch.assertQueue('queues')
    await ch.prefetch(1)
    const sendChannel = await conn.createChannel(); // canal pra envio de msg
    const send = () => sendMessage(sendChannel)
    // detecta quando terminou o processamento  dos dados
    event.on('finish', (d) => {
        log && console.log('finish queue')
        ch.ack(d)  // tira da fila de processamento rabbitmq
        i++;
        send()
    })

    // consumer pega as mensagem que chegam
    ch.consume(
        'queues',
        (msg) => {
            if (msg !== null) {
                event.emit('start', msg)
            }
        },
        { consumerTag: `consumer ${process?.pid}` }
    )

    send();
}
const sendMessage = (send) => {
    setTimeout(() =>
        send.sendToQueue(
            'queues',
            Buffer.from(new Date().toISOString()))
        ,250
    )
}

const rabbit = async () => {
    let conn = await amqplib.connect('amqp://localhost')
    conn.on('error', handler);
    conn.on('connection', handler);

    console.log('Begin')
    startQueue(conn)
}

// iife
rabbit()
setInterval(() => console.log(`Total ${i}`), 2000);