const {Emitter, CompositeDisposable, Disposable} = require('via');
const _ = require('underscore-plus');
const base = 'via://symbol-explorer';
const SymbolExplorerCategory = require('./symbol-explorer-category');
const SymbolExplorerCategoryView = require('./symbol-explorer-category-view');

module.exports = class SymbolExplorer {
    constructor(state = {}) {
        this.emitter = new Emitter();
        this.disposables = new CompositeDisposable();
        this.roots = new Map();
        this.selectedSymbolExplorerItem = null;
        this.currentlyOpening = new Map();
        this.dragEventCounts = new WeakMap();

        this.element = document.createElement('div');
        this.element.classList.add('tool-panel', 'focusable-panel', 'symbol-explorer');
        this.element.tabIndex = -1;

        this.header = document.createElement('div');
        this.header.classList.add('symbol-explorer-header', 'toolbar');
        this.header.textContent = 'No symbols available.'
        this.element.appendChild(this.header);

        this.container = document.createElement('div');
        this.container.classList.add('list-container');
        this.element.appendChild(this.container);

        this.list = document.createElement('ul');
        this.list.classList.add('full-menu', 'list-tree', 'has-collapsable-children');
        this.container.appendChild(this.list);
        this.handleEvents();
        this.updateCategories();
        this.updateSymbols();

        if(state.width && state.width > 0){
            this.element.style.width = `${state.width}px`;
        }
    }

    handleEvents(){
        this.disposables.add(via.markets.onDidUpdateCategories(this.updateCategories.bind(this)));
        this.disposables.add(via.markets.onDidCreateMarket(this.updateSymbols.bind(this)));
        this.disposables.add(via.markets.onDidDestroyMarket(this.updateSymbols.bind(this)));

        this.element.addEventListener('click', e => {
            if(e.target.classList.contains('entries')){
                return;
            }

            if(!e.shiftKey && !e.metaKey && !e.ctrlKey){
                this.entryClicked(e);
            }
        });
    }

    toggle(){
        via.workspace.toggle(this);
    }

    show(focus){
        via.workspace.open(this, {searchAllPanes: true, activatePane: false, activateItem: false})
        .then(() => {
            via.workspace.paneContainerForURI(this.getURI()).show();
            if(focus) this.focus();
        });
    }

    hide(){
        via.workspace.hide(this);
    }

    focus(){
        this.element.focus();
    }

    unfocus(){
        via.workspace.getCenter().activate();
    }

    hasFocus(){
        return document.activeElement === this.element;
    }

    destroy(){
        this.disposables.dispose();
        this.emitter.emit('did-destroy');
    }

    isSubCategory(path){
        return path.indexOf('/') !== -1;
    }

    categoryExists(path){
        return this.roots.has(path.split('/').shift());
    }

    updateCategories(){
        const categories = via.markets.getCategories();
        const categoriesToRemove = new Map(this.roots);

        for(const cat of categories){
            if(categoriesToRemove.has(cat)){
                categoriesToRemove.delete(cat);
            }
        }

        for(const [name, cat] of categoriesToRemove.entries()){
            this.roots.delete(name);
            cat.destroy();
            this.list.removeChild(cat.element);
        }

        for(let path of categories){
            if(this.categoryExists(path)){
                continue;
            }

            let category = new SymbolExplorerCategory({path, explorer: this, isRoot: true});
            let root = new SymbolExplorerCategoryView(category);

            this.list.appendChild(root.element);
            this.roots.set(path, root);
        }
    }

    updateSymbols(){
        const markets = via.markets.all();
        this.header.textContent = markets.length ? `${markets.length} Symbols` : `No Symbols`;
    }

    getTitle(){
        return 'Symbol Explorer';
    }

    getURI(){
        return base;
    }

    getDefaultLocation(){
        return 'left';
    }

    getPreferredLocation(){
        return via.config.get('watchlist.showOnRightSide') ? 'right' : 'left';
    }

    isPermanentDockItem(){
        return false;
    }

    entryClicked(e){
        let entry = e.target.closest('.entry');

        if(entry){
            this.selectEntry(entry);

            if(entry.classList.contains('category')){
                entry.toggleExpansion()
            }else if(entry.classList.contains('symbol')){
                this.symbolViewEntryClicked(e);
            }
        }
    }

    symbolViewEntryClicked(e){
        const market = e.target.closest('.entry').getMarket();
        let detail = e.detail || 1;
        // let alwaysOpenExisting = via.config.get('watchlist.alwaysOpenExisting');

        if(detail === 1){
            //Set the active symbol
        }else if(detail === 2){
            via.workspace.open(`via://charts/${market.exchange.id}/${market.symbol}`, {});
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

    onDidAddSymbols(callback){
        return this.emitter.on('did-remove-symbol', callback);
    }

    onDidRemoveSymbol(callback){
        return this.emitter.on('did-remove-symbol', callback);
    }

    onDidDestroy(callback){
        return this.emitter.on('did-destroy', callback);
    }
}
