const {Emitter, CompositeDisposable, Disposable} = require('via');

module.exports = class WatchlistSymbol {
    constructor({symbol, favorite, path}){
        this.emitter = new Emitter();
        this.disposables = new CompositeDisposable();
        this.symbol = symbol;
        this.favorite = favorite;
        this.path = path;
    }

    getPath(){
        return this.path;
    }

    getSymbol(){
        return this.symbol;
    }

    getTitle(){
        return this.symbol.getTitle();
    }

    subscribeToSymbol(){
        //TODO subscribe to symbol events such as price updates
    }

    updateStatus(){

    }

    destroy(){
        this.disposables.dispose();
        this.unwatch();
    }

    unwatch(){

    }
}
