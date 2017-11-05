const {Disposable, CompositeDisposable} = require('via');
const _ = require('underscore-plus');
const path = require('path');
const unavailable = `${path.join(__dirname, '../images/caution.svg')}`;

module.exports = class WatchlistSymbolView {
    constructor(symbol){
        this.disposables = new CompositeDisposable();
        this.symbol = symbol;

        this.disposables.add(this.symbol.onDidDestroy(this.destroy.bind(this)));
        this.disposables.add(this.symbol.onDidStatusChange(this.updateStatus.bind(this)));

        this.element = document.createElement('li');
        this.element.setAttribute('is', 'watchlist-symbol');
        this.element.draggable = true;
        this.element.classList.add('symbol', 'entry');

        this.header = document.createElement('div');
        this.header.classList.add('header', 'list-item');

        this.favorite = document.createElement('div');
        this.favorite.classList.add('favorite-icon');

        this.unavailable = document.createElement('div');
        this.unavailable.classList.add('unavailable-icon');
        this.unavailable.style.backgroundImage = `url(${unavailable})`;

        this.title = document.createElement('div');
        this.title.classList.add('name');
        this.title.textContent = this.symbol.getTitle();

        this.last = document.createElement('div');
        this.last.classList.add('last');
        this.last.textContent = '—';

        this.element.appendChild(this.header);
        this.header.appendChild(this.favorite);
        this.header.appendChild(this.title);
        this.header.appendChild(this.last);
        this.header.appendChild(this.unavailable);

        this.element.symbol = symbol;
        this.element.getPath = this.getPath.bind(this);
        this.element.getSymbol = this.getSymbol.bind(this);

        this.updateStatus();
    }

    getPath(){
        return this.symbol.path;
    }

    getSymbol(){
        return this.symbol.getSymbol();
    }

    updateStatus(){
        this.element.classList.remove('status-ignored', 'status-modified',  'status-added', 'status-unavailable');

        if(this.symbol.isFavorite){
            this.element.classList.add('favorite');
        }else{
            this.element.classList.remove('favorite');
        }

        if(!this.symbol.isAvailable()){
            this.element.classList.add('status-unavailable');
        }

        this.last.textContent = _.isNull(this.symbol.price) ? '-' : this.symbol.price;
    }

    destroy(){
        this.element.remove();
        this.disposables.dispose();
    }

    scrollIntoViewIfNeeded(){
        if(this.selected){
            this.element.scrollIntoViewIfNeeded();
        }
    }
}
