const {Disposable, CompositeDisposable} = require('via');
const SymbolExplorerCategory = require('./symbol-explorer-category');
const SymbolExplorerSymbolView = require('./symbol-explorer-symbol-view');
const etch = require('etch');
const $ = etch.dom;

module.exports = class SymbolExplorerCategoryView {
    constructor(category){
        this.category = category;
        this.isExpanded = false;
        this.disposables = new CompositeDisposable();
        this.disposables.add(this.category.onDidDestroy(() => this.destroy()));
        this.subscribeToCategory();

        etch.initialize(this);

        if(this.category.expansionState.isExpanded){
            this.expand();
        }
    }

    render(){
        return $.li({
                is: 'symbol-explorer-category',
                classList: `category entry list-nested-item ${this.category.isRoot ? 'root' : ''} ${this.isExpanded ? 'expanded' : 'collapsed'}`,
                collapse: this.collapse.bind(this),
                expand: this.expand.bind(this),
                toggleExpansion: this.toggleExpansion.bind(this),
                reload: this.reload.bind(this),
                getPath: this.getPath.bind(this)
            },
            $.div({classList: `header list-item ${this.category.isRoot ? 'root-header' : ''}`},
                $.div({classList: 'caret'}),
                $.div({classList: 'name', title: this.category.name}, this.category.name)
            ),
            $.ul({classList: 'entries list-tree', ref: 'entries'})
        );
    }

    update(){

    }

    getPath(){
        return this.category.path;
    }

    mouseDown(event) {
        event.preventDefault();
    }

    mouseUp() {
        event.preventDefault();
    }

    didClick(event) {
        event.preventDefault();
    }

    destroy() {
        etch.destroy(this);
        this.category.destroy();
        this.disposables.dispose();
    }

    scrollIntoViewIfNeeded(){
        if(this.selected){
            this.element.scrollIntoViewIfNeeded();
        }
    }

    createViewForEntry(entry){
        let view = (entry instanceof SymbolExplorerCategory) ? new SymbolExplorerCategoryView(entry) : new SymbolExplorerSymbolView(entry);

        let subscription = this.category.onDidRemoveEntries(removedEntries => {
            if(removedEntries.has(entry)){
                view.element.remove();
                subscription.dispose();
            }
        });

        this.disposables.add(subscription);

        return view;
    }

    subscribeToCategory(){
        this.disposables.add(this.category.onDidAddEntries(addedEntries => {
            if(!this.isExpanded){
                return;
            }

            let numberOfEntries = this.refs.entries.children.length;

            for(let entry of addedEntries){
                let view = this.createViewForEntry(entry);
                let insertionIndex = entry.indexInParentCategory;

                if(insertionIndex < numberOfEntries){
                    this.refs.entries.insertBefore(view.element, this.refs.entries.children[insertionIndex]);
                }else{
                    this.refs.entries.appendChild(view.element);
                }

                numberOfEntries++;
            }
        }));
    }

    reload(){
        if(this.isExpanded){
            this.category.reload();
        }
    }

    toggleExpansion(isRecursive = false){
        this.isExpanded ? this.collapse(isRecursive) : this.expand(isRecursive);
    }

    expand(isRecursive = false){
        if(!this.isExpanded){
            this.isExpanded = true;
            this.element.classList.add('expanded');
            this.element.classList.remove('collapsed');
            this.category.expand();
        }

        if(isRecursive){
            for(entry of this.refs.entries.children){
                if(entry.classList.contains('category')){
                    entry.expand(true);
                }
            }
        }
    }

    collapse(isRecursive = false){
        this.isExpanded = false;
        this.element.classList.remove('expanded');
        this.element.classList.add('collapsed');

        if(isRecursive){
            for(entry of this.refs.entries.children){
                if(entry.isExpanded){
                    entry.collapse(true);
                }
            }
        }

        this.category.collapse();
        this.refs.entries.innerHTML = '';
    }
}
