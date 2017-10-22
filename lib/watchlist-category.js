const {Emitter, CompositeDisposable, Disposable} = require('via');
const _ = require('underscore-plus');
const WatchlistSymbol = require('./watchlist-symbol');

module.exports = class WatchlistCategory {
    constructor({path, isRoot, expansionState = {}, watchlist}){
        this.destroyed = false;
        this.emitter = new Emitter();
        this.disposables = new CompositeDisposable();

        this.path = path;
        this.name = path.split('/').pop().split('_').join(' ');
        this.isRoot = isRoot || false;
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

    isCategoryIgnored(){

    }

    isSubCategory(id){
        if(this.id.indexOf(id + '/') !== 0){
            return false;
        }

        return id.slice(this.id.length + 1).length;
    }

    categoryExists(id){
        return this.entries.has(id.slice(this.id.length + 1).split('/').shift());
    }

    unwatch(){
        if(this.watchSubscription){
            this.watchSubscription.dispose();
        }

        this.entries.forEach((entry, key) => {
            entry.destroy();
            this.entries.delete(key);
        });
    }

    watch(){
        this.watchSubscription = via.symbols.onDidAddSymbol(symbol => {
            if(symbol.categories.filter(path => path.indexOf(this.path) === 0).length){
                this.reload();
            }
        });
    }

    isIgnored(item){
        return false;
    }

    directDescendents(paths){
        paths = paths
            .filter(path => path.indexOf(this.path + '/') === 0)
            .map(path => this.path + '/' + path.slice(this.path.length + 1).split('/').shift());

        return _.uniq(paths);
    }

    getEntries(){
        let symbols = via.symbols.getSymbols();
        let paths = symbols.map(symbol => symbol.categories).reduce((a, b) => a.concat(b), []);
        let descendents = this.directDescendents(paths);

        let symbolsToDisplay = [];
        let categoriesToDisplay = [];

        for(let path of descendents){
            if(this.isIgnored(path)){
                continue;
            }

            if(this.entries.has(path)){
                categoriesToDisplay.push(path);
            }else{
                let expansionState = this.expansionState.entries.get(path);
                categoriesToDisplay.push(new WatchlistCategory({path, expansionState, watchlist: this.watchlist}));
            }
        }

        for(let symbol of symbols){
            if(this.isIgnored(symbol.id)){
                continue;
            }

            if(symbol.categories.includes(this.path)){
                if(this.entries.has(symbol.id)){
                    symbolsToDisplay.push(symbol.id);
                }else{
                    symbolsToDisplay.push(new WatchlistSymbol({
                        isFavorite: this.watchlist.favorites.includes(symbol.id),
                        symbol,
                        path: this.path + '/' + symbol.id,
                        watchlist: this.watchlist
                    }));
                }
            }
        }

        return this.sortEntries(categoriesToDisplay.concat(symbolsToDisplay));
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

            if(this.expansionState.entries.has(name)){
                this.expansionState.entries.delete(name);
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
        if(via.config.get('watchlist.sortCategoriesBeforeSymbols')){
            return combinedEntries;
        }else{
            return combinedEntries.sort((a, b) => {
                let first = a.path || a.id || a;
                let second = b.path || b.id || b;

                return first.localeCompare(second);
            });
        }
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
        let expansionState = {
            isExpanded: this.expansionState.isExpanded,
            entries: new Map()
        };

        this.entries.forEach((entry, name) => {
            if(entry.expansionState){
                expansionState.entries.set(name, entry.serializeExpansionState());
            }
        });

        return expansionState;
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
