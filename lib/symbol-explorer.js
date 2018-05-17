const {Emitter, CompositeDisposable, Disposable} = require('via');
const _ = require('underscore-plus');
const base = 'via://symbol-explorer';
const SymbolExplorerExchange = require('./symbol-explorer-exchange');

const etch = require('etch');
const $ = etch.dom;

module.exports = class SymbolExplorer {
    constructor(state = {}){
        this.emitter = new Emitter();
        this.disposables = new CompositeDisposable();
        this.state = state;

        etch.initialize(this);

        process.nextTick(() => {
            this.onStylesheetsChanged();
            const onStylesheetsChanged = _.debounce(this.onStylesheetsChanged, 100);
            this.disposables.add(via.styles.onDidAddStyleElement(onStylesheetsChanged));
            this.disposables.add(via.styles.onDidRemoveStyleElement(onStylesheetsChanged));
            this.disposables.add(via.styles.onDidUpdateStyleElement(onStylesheetsChanged));
        });

        if(state.scrollTop || state.scrollLeft){
            const observer = new IntersectionObserver(() => {
                if(this.isVisible()){
                    this.element.scrollTop = state.scrollTop;
                    this.element.scrollLeft = state.scrollLeft;
                }

                observer.disconnect();
            });

            observer.observe(this.element);
        }

        if(state.width && state.width > 0){
            this.element.style.width = `${state.width}px`;
        }

        if(state.selected){
            this.select(state.selected);
        }

        this.disposables.add(via.config.observe('symbol-explorer.hideInactiveMarkets', () => this.update()))
        this.initialize(state);
    }

    async initialize(state){
        await via.markets.initialize();

        if(state.selected){
            this.select(via.markets.get(state.selected));
        }

        etch.update(this);
    }

    serialize(){
        return {
            deserializer: 'SymbolExplorer',
            selected: this.selected ? this.selected.id : '',
            scrollLeft: this.element.scrollLeft,
            scrollTop: this.element.scrollTop,
            width: parseInt(this.element.style.width || 0),
            exchanges: this.state.exchanges || {}
        };
    }

    render(){
        const exchanges = this.exchanges();

        return $.div({classList: 'tool-panel focusable-panel symbol-explorer', tabIndex: -1},
            $.div({classList: 'symbol-explorer-header toolbar', ref: 'header'}, `${exchanges.length} Exchanges`),
            $.div({classList: 'list-container'},
                $.ul({classList: 'full-menu list-tree has-collapsable-children'}, exchanges)
            )
        );
    }

    exchanges(){
        let exchanges = via.exchanges.all();

        if(via.config.get('symbol-explorer.hideInactiveMarkets')){
            exchanges = exchanges.filter(exchange => {
                return via.markets.exchange(exchange).find(market => market.active);
            });
        }

        return exchanges.sort((a, b) => a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1)
            .map(exchange => $(SymbolExplorerExchange, {exchange, explorer: this}));
    }

    update(){
        etch.update(this);
    }

    changeMarket(market){
        this.selected = market;
        etch.update(this);
    }

    getMarket(){
        return this.selected;
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

    getTitle(){
        return 'Symbol Explorer';
    }

    select(market, e){
        if(e && e.detail === 2){
            via.workspace.open(`via://charts/market/${market.uri()}`, {});
        }

        if(this.selected !== market){
            this.selected = market;
            this.emitter.emit('did-change-market', market);
            this.update();
        }
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

    selectEntry(entry){
        if(!entry){
            return;
        }

        this.selectedPath = entry.getPath();

        const selectedEntries = this.getSelectedEntries();

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
        for(const selected of elementsToDeselect){
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
        const element = (entry && entry.classList.contains('directory')) ? entry.header : entry;

        if(element){
            element.scrollIntoViewIfNeeded(center);
        }
    }

    scrollToBottom(){
        const lastEntry = _.last(this.list.querySelectorAll('.entry'));

        if(lastEntry){
            this.selectEntry(lastEntry)
            this.scrollToEntry(lastEntry);
        }
    }

    scrollToTop(){
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

    onDidChangeMarket(callback){
        return this.emitter.on('did-change-market', callback);
    }
}
