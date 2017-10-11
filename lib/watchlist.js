const {Emitter, CompositeDisposable, Disposable} = require('via');
const WatchlistURI = 'via://watchlist';
const WatchlistCategory = require('./watchlist-category');
const WatchlistCategoryView = require('./watchlist-category-view');

const WatchlistFavorites = require('./watchlist-favorites-view');
const WatchlistFavoritesView = require('./watchlist-favorites-view');

module.exports = class Watchlist {
    constructor(state = {}) {
        this.emitter = new Emitter();
        this.disposables = new CompositeDisposable();
        this.disposables.add(via.symbols.observeSymbols(this.didAddSymbol.bind(this)));

        this.element = document.createElement('div');
        this.element.classList.add('tool-panel', 'watchlist');
        this.element.tabIndex = -1;

        this.list = document.createElement('ul');
        this.list.classList.add('list', 'focusable-panel');
        this.element.appendChild(this.list);

        // this.search = document.createElement('ul');
        // this.search.classList.add('list', 'focusable-panel');

        this.favorites = state.favorites || [];
        this.roots = new Map();

        this.selectedWatchlistItem = null;
        this.currentlyOpening = new Map();
        this.dragEventCounts = new WeakMap();
        this.handleEvents();

        if(state.width && state.width > 0){
            this.element.style.width = `${state.width}px`;
        }
    }
    
    handleEvents(){
        this.element.addEventListener('click', e => {
            if(e.target.classList.contains('entries')){
                return;
            }

            if(!e.shiftKey && !e.metaKey && !e.ctrlKey){
                this.entryClicked(e);
            }
        });

        // this.element.addEventListener('mousedown', this.onMouseDown.bind(this));
    }

    destroy(){
        this.disposables.dispose();
        this.emitter.emit('did-destroy');
    }

    isSubCategory(path){
        return path.indexOf('.') !== -1;
    }

    categoryExists(path){
        return this.roots.has(path.split('.').shift());
    }

    didAddSymbol(symbol){
        let favorite = this.favorites.includes(symbol.id);

        for(let path of symbol.categories){
            if(this.categoryExists(path)){
                continue;
            }

            let category = new WatchlistCategory({path, watchlist: this, isRoot: true});
            let root = new WatchlistCategoryView(category);

            this.list.appendChild(root.element);
            this.roots.set(path, root);
        }
    }

    getTitle(){
        return 'Watchlist';
    }

    getURI(){
        return WatchlistURI;
    }

    getDefaultLocation(){
        return 'left';
    }

    getPreferredLocation(){
        return via.config.get('watchlist.showOnRightSide') ? 'right' : 'left';
    }

    isPermanentDockItem(){
        return true;
    }

    getAllowedLocations(){
        return ['left', 'right', 'bottom'];
    }

    onDidDestroy(callback){
        return this.emitter.on('did-destroy', callback);
    }

    entryClicked(e){
        let entry = e.target.closest('.entry');

        if(entry){
            this.selectEntry(entry);

            if(entry.classList.contains('category')){
                entry.toggleExpansion()
            }else if(entry.classList.contains('symbol')){
                this.watchlistSymbolViewEntryClicked(e);
            }
        }
    }

    watchlistSymbolViewEntryClicked(e){
        let symbol = e.target.closest('.entry').getSymbol();
        let detail = e.detail || 1;
        let alwaysOpenExisting = via.config.get('watchlist.alwaysOpenExisting');

        if(detail === 1){
            //   if atom.config.get('core.allowPendingPaneItems')
            //     openPromise = atom.workspace.open(filePath, pending: true, activatePane: false, searchAllPanes: alwaysOpenExisting)
            //     @currentlyOpening.set(filePath, openPromise)
            //     openPromise.then => @currentlyOpening.delete(filePath)
        }else if(detail === 2){
            if(typeof symbol.openDefaultLocation === 'function'){
                symbol.openDefaultLocation();
            }else{
                let state = {series: [{uri: symbol.uri, type: 'candlestick'}]};
                via.workspace.open('via://charts', {state});
            }
        }
    }

    selectedEntry(){
        return this.list.querySelector('.selected');
    }

    selectEntry(entry){
        if(!entry){
            return;
        }

        this.selectedPath = entry.getPath();

        let selectedEntries = this.getSelectedEntries();

        if(selectedEntries.length > 1 || selectedEntries[0] !== entry){
            this.deselect(selectedEntries);
            entry.classList.add('selected');
        }

        return entry;
    }

    getSelectedEntries(){
        return this.list.querySelectorAll('.selected');
    }

    deselect(elementsToDeselect = this.getSelectedEntries()){
        for(let selected of elementsToDeselect){
            selected.classList.remove('selected');
        }
    }

    scrollTop(top){
        if(top){
            this.element.scrollTop = top;
        }else{
            return this.element.scrollTop;
        }
    }

    scrollBottom(bottom){
        if(bottom){
            this.element.scrollTop = bottom - this.element.offsetHeight;
        }else{
            this.element.scrollTop + this.element.offsetHeight;
        }
    }

    scrollToEntry(entry, center = true){
        let element = (entry && entry.classList.contains('directory')) ? entry.header : entry;

        if(element){
            element.scrollIntoViewIfNeeded(center);
        }
    }

    scrollToBottom(){
        let lastEntry = _.last(this.list.querySelectorAll('.entry'));

        if(lastEntry){
            this.selectEntry(lastEntry)
            this.scrollToEntry(lastEntry);
        }
    }

    scrollToTop(){
        // this.selectEntry(this.[0]) if @roots[0]?
        this.element.scrollTop = 0;
    }

    pageUp(){
        this.element.scrollTop -= this.element.offsetHeight;
    }

    pageDown(){
        this.element.scrollTop += this.element.offsetHeight;
    }

    onStylesheetsChanged(){
        if(this.isVisible()){
            this.element.style.display = 'none';
            this.element.offsetWidth;
            this.element.style.display = '';
        }
    }

    isVisible(){
        return this.element.offsetWidth || this.element.offsetHeight;
    }
}
