"use jsx";

const {Emitter, CompositeDisposable, Disposable} = require('via');
const etch = require('etch');
const $ = etch.dom;

module.exports = class WatchlistView {
    constructor(state = {}) {
        this.emitter = new Emitter();
        this.disposables = new CompositeDisposable();

        etch.initialize(this);

        // this.refs.chart.appendChild(this.chart.element);
    }

    destroy() {
        this.disposables.dispose();
        this.emitter.dispose();

        return etch.destroy(this);
    }

    render(){
        return <div class="watchlist">
            <div class="watchlist-toolbar toolbar">
                <input type="text" class="toolbar-search" placeholder="Filter..." ref="filter" />
                <a class="toolbar-button" ref="add">Add</a>
            </div>
        </div>;
    }

    update () {}

    getTitle(){
        return 'Watchlist';
    }

    getURI(){
        return 'via://watchlist';
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
}
