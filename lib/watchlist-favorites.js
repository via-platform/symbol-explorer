const {Disposable, CompositeDisposable, Emitter} = require('via');
const _ = require('underscore-plus');
const WatchlistSymbol = require('./watchlist-symbol');

module.exports = class WatchlistFavorites {
    constructor({expansionState = {}, watchlist}){
        this.destroyed = false;
        this.emitter = new Emitter();
        this.disposables = new CompositeDisposable();
        this.expansionState = _.defaults(expansionState, {isExpanded: false, entries: new Map()});
        this.status = null;
        this.entries = new Map();
        this.watchlist = watchlist;
    }

    updateStatus(){

    }

    destroy(){
        this.disposables.dispose();
        this.unwatch();
    }

    unwatch(){
        if(this.watchSubscriptions){
            this.watchSubscriptions.dispose();
        }

        this.entries.forEach((entry, key) => {
            entry.destroy();
            this.entries.delete(key);
        });
    }

    watch(){
        if(this.watchSubscriptions){
            this.watchSubscriptions.dispose();
        }

        this.watchSubscriptions = new CompositeDisposable();

        this.watchSubscriptions.add(via.symbols.onDidAddSymbol(symbol => {
            if(symbol.categories.filter(path => path.indexOf(this.path) === 0).length){
                this.reload();
            }
        }));

        this.watchSubscriptions.add(this.watchlist.onDidAddFavorite(this.reload.bind(this)));
        this.watchSubscriptions.add(this.watchlist.onDidRemoveFavorite(this.reload.bind(this)));
    }

    isIgnored(item){
        return false;
    }

    getEntries(){
        let symbols = via.symbols.getSymbols().filter(symbol => this.watchlist.favorites.includes(symbol.id));
        let symbolsToDisplay = [];

        for(let symbol of symbols){
            if(this.isIgnored(symbol.id)){
                continue;
            }

            if(this.entries.has(symbol.id)){
                symbolsToDisplay.push(symbol.id);
            }else{
                symbolsToDisplay.push(new WatchlistSymbol({isFavorite: true, symbol, path: symbol.id, watchlist: this.watchlist}));
            }
        }

        return this.sortEntries(symbolsToDisplay);
    }

    reload(){
        let newEntries = [];
        let removedEntries = new Map(this.entries);
        let index = 0;

        for(let entry of this.getEntries()){
            if(this.entries.has(entry)){
                removedEntries.delete(entry);
                index++;
                continue;
            }

            entry.indexInParentCategory = index;
            index++;
            newEntries.push(entry);
        }

        let entriesRemoved = false;

        removedEntries.forEach((entry, name) => {
            entriesRemoved = true;
            entry.destroy();

            if(this.entries.has(name)){
                this.entries.delete(name);
            }
        });

        if(entriesRemoved){
            this.emitter.emit('did-remove-entries', new Set(removedEntries.values()));
        }

        if(newEntries.length > 0){
            newEntries.forEach(entry => this.entries.set(entry.path, entry));
            this.emitter.emit('did-add-entries', newEntries);
        }
    }

    sortEntries(combinedEntries){
        return combinedEntries.sort((a, b) => {
            let first = a.path || a;
            let second = b.path || b;

            return first.localeCompare(second);
        });
    }

    expand(){
        this.expansionState.isExpanded = true;
        this.reload();
        this.watch();
        this.emitter.emit('did-expand');
    }

    collapse(){
        this.expansionState.isExpanded = false;
        this.expansionState = this.serializeExpansionState();
        this.unwatch();
        this.emitter.emit('did-collapse');
    }

    serializeExpansionState(){
        return {isExpanded: this.expansionState.isExpanded, entries: new Map()};
    }

    onDidDestroy(callback){
        return this.emitter.on('did-destroy', callback);
    }

    onDidAddEntries(callback){
        return this.emitter.on('did-add-entries', callback);
    }

    onDidRemoveEntries(callback){
        return this.emitter.on('did-remove-entries', callback);
    }

    onDidCollapse(callback){
        return this.emitter.on('did-collapse', callback);
    }

    onDidExpand(callback){
        return this.emitter.on('did-expand', callback);
    }
}
