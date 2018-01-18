const {Emitter, CompositeDisposable, Disposable} = require('via');

module.exports = class SymbolExplorerSymbol {
    constructor({symbol, path, explorer}){
        this.emitter = new Emitter();
        this.disposables = new CompositeDisposable();
        this.symbol = symbol;
        this.path = path;
        this.explorer = explorer;

        // this.disposables.add(this.symbol.onDidChangeReadyState(this.updateStatus.bind(this)));
    }

    getPath(){
        return this.path;
    }

    getSymbol(){
        return this.symbol;
    }

    getTitle(){
        return this.symbol.name;
    }

    getExchange(){
        return this.symbol.exchange;
    }

    isAvailable(){
        return this.symbol.available;
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
