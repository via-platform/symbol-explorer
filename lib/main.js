const {CompositeDisposable, Disposable, Emitter} = require('via');
const SymbolExplorer = require('./symbol-explorer');

class SymbolExplorerPackage {
    activate(){
        this.subscriptions = new CompositeDisposable();

        this.subscriptions.add(via.commands.add('via-workspace', {
            'symbol-explorer:open': () => this.getSymbolExplorerInstance().open(true),
            'symbol-explorer:focus': () => this.getSymbolExplorerInstance().focus()
        }));
    }

    getSymbolExplorerInstance(state = {}){
        if(!this.explorer){
            this.explorer = new SymbolExplorer(state);
            this.explorer.onDidDestroy(() => this.explorer = null);
        }

        return this.explorer;
    }

    deactivate(){
        if(this.explorer){
            this.explorer.destroy();
        }

        this.subscriptions.dispose();
        this.subscriptions = null;
    }

    serialize(){}

    destroy(){}
}

module.exports = new SymbolExplorerPackage();