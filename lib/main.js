const {CompositeDisposable, Disposable, Emitter} = require('via');
const Watchlist = require('./watchlist');

class WatchlistPackage {
    activate(state){
        this.subscriptions = new CompositeDisposable();
        this.watchlist = new Watchlist(state);
        this.emitter = new Emitter();

        this.subscriptions.add(via.commands.add('via-workspace', {
            'watchlist:toggle': () => this.toggle(),
            'watchlist:focus': () => document.querySelector('text-editor[mini].watchlist').focus()
        }));

        via.workspace.open(this.watchlist, {activateItem: false, activatePane: false})
        .then(() => {
            const paneContainer = via.workspace.paneContainerForURI(this.watchlist.getURI());

            if(paneContainer){
                paneContainer.show();
            }
        });
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

module.exports = new WatchlistPackage();
