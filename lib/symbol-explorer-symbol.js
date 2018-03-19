const {Emitter, CompositeDisposable, Disposable} = require('via');

module.exports = class SymbolExplorerSymbol {
    constructor({market, path, explorer}){
        this.emitter = new Emitter();
        this.disposables = new CompositeDisposable();
        this.market = market;
        this.path = path;
        this.explorer = explorer;
    }

    getPath(){
        return this.path;
    }

    getMarket(){
        return this.market;
    }

    getTitle(){
        return this.market.symbol;
    }

    getExchange(){
        return this.market.exchange.name;
    }

    isAvailable(){
        return true;
    }

    updateStatus(){
        this.emitter.emit('did-status-change');
    }

    destroy(){
        this.emitter.emit('did-destroy');
        this.disposables.dispose();
    }

    onDidStatusChange(callback){
        return this.emitter.on('did-status-change', callback);
    }

    onDidDestroy(callback){
        return this.emitter.on('did-destroy', callback);
    }
}
