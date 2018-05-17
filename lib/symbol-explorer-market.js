const {Emitter, CompositeDisposable, Disposable} = require('via');

const etch = require('etch');
const $ = etch.dom;

const TYPES = {
    SPOT: 'SPOT',
    OPTION: 'OPTS',
    FUTURES: 'FUTS'
};

module.exports = class SymbolExplorerMarket {
    constructor({market, explorer}){
        this.emitter = new Emitter();
        this.disposables = new CompositeDisposable();
        this.market = market;
        this.explorer = explorer;

        etch.initialize(this);
    }

    render(){
        return $.li({classList: `market symbol entry status-available ${(this.explorer.selected === this.market ? 'selected' : '')}`, market: this.market},
                $.div({classList: 'header list-item', onClick: e => this.explorer.select(this.market, e)},
                    $.div({classList: 'type'}, TYPES[this.market.type] || ''),
                    $.div({classList: 'name'}, this.market.name),
                    // $.div({classList: 'source'}, this.symbol.getExchange()),
                    $.div({classList: 'unavailable-icon'}
                )
            )
        );
    }

    update(){
        etch.update(this);
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
