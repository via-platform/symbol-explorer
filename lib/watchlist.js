const {CompositeDisposable, Disposable, Emitter} = require('via');
const WatchlistView = require('./watchlist-view');

class Watchlist {
    activate(state){
        console.log('activated watchlist');
        this.subscriptions = new CompositeDisposable();
        this.watchlistView = new WatchlistView(state);
        this.emitter = new Emitter();

        this.subscriptions.add(via.commands.add('via-desktop', {
            'watchlist:toggle': () => this.toggle(),
            'watchlist:focus': () => document.querySelector('text-editor[mini].watchlist').focus()
        }));

        via.desktop.open(this.watchlistView, {activteItem: false, activatPane: false});
    }

    deactivate(){
        this.panel.destroy();
        this.watchlist.destroy();
        this.subscriptions.dispose();
        this.subscriptions = null;
    }

    serialize(){}

    destroy(){}
}

module.exports = new Watchlist();
