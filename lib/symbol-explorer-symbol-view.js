const {Disposable, CompositeDisposable} = require('via');
const _ = require('underscore-plus');
const etch = require('etch');
const $ = etch.dom;

module.exports = class SymbolExplorerSymbolView {
    constructor(symbol){
        this.disposables = new CompositeDisposable();
        this.symbol = symbol;

        this.disposables.add(this.symbol.onDidDestroy(this.destroy.bind(this)));
        this.disposables.add(this.symbol.onDidStatusChange(this.update.bind(this)));

        etch.initialize(this);
    }

    render(){
        return $.li({
                    is: 'symbol-explorer-market',
                    classList: `market symbol entry ${this.symbol.isAvailable() ? 'status-available' : 'status-unavailable'}`,
                    draggable: true,
                    getPath: this.getPath.bind(this),
                    getMarket: this.getMarket.bind(this),
                    symbol: this.symbol
                },
                $.div({classList: 'header list-item'},
                    $.div({classList: 'type'}, 'FX'),
                    $.div({classList: 'name'}, this.symbol.getTitle()),
                    $.div({classList: 'source'}, this.symbol.getExchange()),
                    $.div({classList: 'unavailable-icon'}
                )
            )
        );
    }

    update(){
        etch.update(this);
    }

    getPath(){
        return this.symbol.path;
    }

    getMarket(){
        return this.symbol.getMarket();
    }

    destroy(){
        etch.destroy(this);
        this.disposables.dispose();
    }

    scrollIntoViewIfNeeded(){
        if(this.selected){
            this.element.scrollIntoViewIfNeeded();
        }
    }
}
