module.exports = class ConsumerWorker{
    #event;
    constructor( event, data ){
        this.#event = event;
        this.process(data)
    }
    async process(data){
        await console.log("ConsumerWorker - >",data)
        this.terminate()
    }
    terminate(){
        this.#event.emit('finish',{})
    }
}