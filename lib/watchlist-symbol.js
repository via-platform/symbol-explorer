const {Emitter, CompositeDisposable, Disposable} = require('via');

module.exports = class WatchlistSymbol {
    constructor({symbol, isFavorite, path, watchlist}){
        this.emitter = new Emitter();
        this.disposables = new CompositeDisposable();
        this.symbol = symbol;
        this.isFavorite = isFavorite;
        this.path = path;
        this.watchlist = watchlist;
        this.tickerDisposable = null;
        this.price = null;

        this.disposables.add(this.watchlist.onDidAddFavorite(this.didAddFavorite.bind(this)));
        this.disposables.add(this.watchlist.onDidRemoveFavorite(this.didRemoveFavorite.bind(this)));

        if(this.isFavorite){
            this.watch();
        }
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

    updateStatus(){
        this.emitter.emit('did-status-change');
    }

    destroy(){
        this.unwatch();
        this.emitter.emit('did-destroy');
        this.disposables.dispose();
    }

    watch(){
        this.tickerDisposable = new Disposable(this.symbol.ticker.subscribe(this.didReceiveTickerData.bind(this)));
    }

    unwatch(){
        if(this.tickerDisposable){
            this.tickerDisposable.dispose();
            this.tickerDisposable = null;
        }
    }

    didAddFavorite(symbol){
        if(symbol === this.getSymbol()){
            this.isFavorite = true;
            this.watch();
            this.updateStatus();
        }
    }

    didRemoveFavorite(symbol){
        if(symbol === this.getSymbol()){
            this.isFavorite = false;
            this.unwatch();
            this.updateStatus();
        }
    }

    didReceiveTickerData(data){
        this.price = data.price;
        this.updateStatus();
    }

    onDidStatusChange(callback){
        return this.emitter.on('did-status-change', callback);
    }

    onDidDestroy(callback){
        return this.emitter.on('did-destroy', callback);
    }
}
