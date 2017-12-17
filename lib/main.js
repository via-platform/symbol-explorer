const {CompositeDisposable, Disposable, Emitter} = require('via');
const SymbolExplorer = require('./symbol-explorer');

class SymbolExplorerPackage {
    activate(state){
        this.subscriptions = new CompositeDisposable();
        this.explorer = new SymbolExplorer(state);
        this.emitter = new Emitter();

        this.subscriptions.add(via.commands.add('via-workspace', {
            'symbol-explorer:toggle': () => this.toggle(),
            'symbol-explorer:focus': () => document.querySelector('.symbol-explorer').focus()
        }));

        via.workspace.open(this.explorer, {activateItem: false, activatePane: false})
        .then(() => {
            const paneContainer = via.workspace.paneContainerForURI(this.explorer.getURI());

            if(paneContainer){
                paneContainer.show();
            }
        });
    }

    deactivate(){
        this.panel.destroy();
        this.explorer.destroy();
        this.subscriptions.dispose();
        this.subscriptions = null;
    }

    serialize(){}

    destroy(){}
}

module.exports = new SymbolExplorerPackage();
