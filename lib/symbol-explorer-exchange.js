const {Emitter, CompositeDisposable, Disposable} = require('via');
const _ = require('underscore-plus');
const SymbolExplorerMarket = require('./symbol-explorer-market');

const etch = require('etch');
const $ = etch.dom;

module.exports = class SymbolExplorerExchange {
    constructor({exchange, explorer}){
        this.disposables = new CompositeDisposable();
        this.emitter = new Emitter();
        this.exchange = exchange;
        this.entries = new Map();
        this.explorer = explorer;

        etch.initialize(this);

        if(explorer.state && explorer.state.exchanges && explorer.state.exchanges[exchange.id] && explorer.state.exchanges[exchange.id].expanded){
            this.expand();
        }
    }

    render(){
        return $.li({classList: `category entry list-nested-item root ${this.expanded ? 'expanded' : 'collapsed'}`},
            $.div({classList: `header list-item root-header`, onClick: () => this.toggle()},
                $.div({classList: 'caret'}),
                $.div({classList: 'name', title: this.exchange.name}, this.exchange.name)
            ),
            $.ul({classList: 'entries list-tree', ref: 'entries'}, this.markets())
        );
    }

    update(){
        etch.update(this);
    }

    markets(){
        if(this.expanded){
            let markets = via.markets.exchange(this.exchange);

            return markets.sort((a, b) => a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1)
                .map(market => $(SymbolExplorerMarket, {market, explorer: this.explorer}));
        }else{
            return '';
        }
    }

    toggle(){
        this.expanded ? this.collapse() : this.expand();
    }

    expand(){
        this.expanded = true;
        if(this.explorer.state.exchanges) this.explorer.state.exchanges[this.exchange.id] = {expanded: true};
        this.update();
        this.emitter.emit('did-expand');
    }

    collapse(){
        this.expanded = false;
        if(this.explorer.state.exchanges) this.explorer.state.exchanges[this.exchange.id] = {expanded: false};
        this.update();
        this.emitter.emit('did-collapse');
    }

    serialize(){
        return {expanded: this.expanded};
    }

    onDidCollapse(callback){
        return this.emitter.on('did-collapse', callback);
    }

    onDidExpand(callback){
        return this.emitter.on('did-expand', callback);
    }
}
