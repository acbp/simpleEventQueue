
const consumer = require('./consumer.event')
const express = require('express')
const app = express(express.json());
const port = process.env.PORT || 1337;

let started = 0;
let finished = 0;
const sendEvent = (req, res) => {
    const defaultData = new Date().toISOString()
    const data = req?.body ?? defaultData;
    console.warn('[http] sendEvent', data);
    consumer.start('start', data);
    ++started
    res.status(204).send('event sent');
}
const totalEvent = async (req, res) => {
    const finished = await consumer.onTotal()
    res.status(200).send(`total inicial:${started}\ntotal finalizado ${finished}\n`)
}
app.all('/send', sendEvent)
app.all('/total', totalEvent)

app.listen(port, () => console.info(`Rodando em localhost:${port}`))