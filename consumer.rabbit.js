const process = require('process')
const EventEmitter = require('events')
const event = new EventEmitter()
const { connect } = require('amqplib')

const log = false;// controla logs
let i = 0; // contador para saber quantas mensagens foram mandadas
let status = 'stopped';

// tratamento para inici0
const startProcess = (data) => {
    console.info(`> starting`)
    setImmediate(() => event.emit(status = 'run', data))
}
event.on('start', startProcess)

// tratamento para executar tarefa
const runProcess = async (data) => {
    console.info(`>> running`)
    setImmediate(() => event.emit(status = 'finish', data))
}
event.on('run', runProcess)

// tratamento para fechamento do programa
const handler = (err => {
    console.error(`\nTotal de ${i}`, err?.stack ?? err);
    process.exit(1); // mandatory (as per the Node.js docs)
});

// tratamento caso node quebre
process.on('uncaughtException', handler)
// tratamento caso cancele
process.on('SIGINT', handler)

// envia mensagem pro rabbit
const sendMessage = async (send) => {
    setImmediate(() => {
        status = 'next'
        send.sendToQueue(
            'queues',
            Buffer.from(new Date().toISOString()))
        })
    console.info('next')
}

// metodos para rabbitmq
const startQueue = async (conn) => {
    const ch = await conn.createChannel();
    await ch.assertQueue('queues')
    await ch.prefetch(1)

    const sendChannel = await conn.createChannel(); // canal pra envio de msg
    const send = () => sendMessage(sendChannel)

    // detecta quando terminou o processamento  dos dados
    event.on('finish', async (d) => {
        ch.ack(d)  // tira da fila de processamento rabbitmq
        console.info('>>> finished')
        status = 'finish'
        i++;
        setTimeout(send, 500)
    })

    // consumer pega as mensagem que chegam
    await ch.consume(
        'queues',
        (msg) => {
            if (msg !== null) {
                event.emit(status = 'start', msg)
            }
        },
        { consumerTag: `consumer ${process?.pid}` }
    )
    setTimeout(send, 500)
}

const rabbit = async () => {
    let conn = await connect('amqp://localhost')
    conn.on('error', handler);
    conn.on('connection', handler);

    console.info('Begin')
    startQueue(conn)
}

// iife
rabbit()
setInterval(() => { console.clear(); console.info(`Total ${i}\nStatus=>${status}`) }, 250);