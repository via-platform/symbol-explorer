const {Disposable, CompositeDisposable} = require('via');

module.exports = class WatchlistSymbolView {
    constructor(symbol){
        this.disposables = new CompositeDisposable();
        this.symbol = symbol;

        this.element = document.createElement('li');
        this.element.setAttribute('is', 'watchlist-symbol');
        this.element.draggable = true;
        this.element.classList.add('symbol', 'entry', 'list-item');

        this.title = document.createElement('div');
        this.title.classList.add('title');
        this.title.textContent = this.symbol.getTitle();

        this.element.appendChild(this.title);
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
        this.element.classList.remove('status-ignored', 'status-modified',  'status-added');
        //TODO add classes to handle changes
        // this.element.classList.add("status-#{@file.status}") if @file.status?
    }

    mouseDown(event) {
        event.preventDefault()
    }

    mouseUp() {
        event.preventDefault()
    }

    didClick(event) {
        event.preventDefault();
        console.log(event);
        // this.onclick()
    }

    destroy() {
        this.element.remove();
        this.model.destroy();
        // this.domEventsDisposable.dispose();
        this.disposables.dispose();
    }

    update(props) {
        // this.element.removeEventListener('mousedown', this.mouseDown);
        // this.element.removeEventListener('mouseup', this.mouseUp);
        this.element.removeEventListener('click', this.didClick);

        // this.element.addEventListener('mousedown', this.mouseDown);
        // this.element.addEventListener('mouseup', this.mouseUp);
        this.element.addEventListener('click', this.didClick.bind(this));

        this.active = props.active;
        this.onclick = props.onclick;

        // etch.getScheduler().updateDocument(this.scrollIntoViewIfNeeded.bind(this));
        return etch.update(this);
    }

    scrollIntoViewIfNeeded() {
        if (this.selected) {
            this.element.scrollIntoViewIfNeeded()
        }
    }
}
