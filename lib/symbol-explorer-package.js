const {CompositeDisposable, Disposable, Emitter} = require('via');
const SymbolExplorer = require('./symbol-explorer');

module.exports = class SymbolExplorerPackage {
    activate(){
        this.subscriptions = new CompositeDisposable();

        this.subscriptions.add(via.commands.add('via-workspace', {
            'symbol-explorer:toggle': () => this.getSymbolExplorerInstance().toggle(),
            'symbol-explorer:show': () => this.getSymbolExplorerInstance().show(),
            'symbol-explorer:hide': () => this.getSymbolExplorerInstance().hide(),
            'symbol-explorer:focus': () => this.getSymbolExplorerInstance().focus(),
            'symbol-explorer:unfocus': () => this.getSymbolExplorerInstance().unfocus()
        }));

        if(this.shouldAttachSymbolExplorer()){
            const activate = !via.workspace.getActivePaneItem();
            via.workspace.open(this.getSymbolExplorerInstance(), {activateItem: activate, activatePane: activate});
        }
    }

    shouldAttachSymbolExplorer(){
        return true;
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