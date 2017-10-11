const {Disposable, CompositeDisposable} = require('via');
const WatchlistCategory = require('./watchlist-category');
const WatchlistSymbolView = require('./watchlist-symbol-view');

module.exports = class WatchlistCategoryView {
    constructor(category){
        this.category = category;
        this.disposables = new CompositeDisposable();
        this.disposables.add(this.category.onDidDestroy(() => this.subscriptions.dispose()));
        this.subscribeToCategory();

        this.element = document.createElement('li');
        this.element.setAttribute('is', 'watchlist-category');
        this.element.classList.add('category', 'entry', 'list-nested-item', 'collapsed');

        this.header = document.createElement('div');
        this.header.classList.add('header', 'list-item');

        this.categoryName = document.createElement('span');
        this.categoryName.classList.add('name');

        this.entries = document.createElement('ul');
        this.entries.classList.add('entries', 'list-tree');

        this.categoryName.title = this.category.name;
        this.categoryName.textContent = this.category.name;


        this.element.appendChild(this.header);
        this.header.appendChild(this.categoryName);
        this.element.appendChild(this.entries);

        if(this.category.isRoot){
            this.element.classList.add('category-root');
            this.header.classList.add('category-root-header');
        }else{
            // this.subscriptions.add(this.category.onDidStatusChange(() => this.updateStatus()));
            // this.updateStatus();
        }

        if(this.category.expansionState.isExpanded){
            this.expand();
        }

        this.element.collapse = this.collapse.bind(this);
        this.element.expand = this.expand.bind(this);
        this.element.toggleExpansion = this.toggleExpansion.bind(this);
        this.element.reload = this.reload.bind(this);
        this.element.isExpanded = this.isExpanded;
        // this.element.updateStatus = this.updateStatus.bind(this);
        // this.element.isPathEqual = this.isPathEqual.bind(this);
        this.element.getPath = this.getPath.bind(this);
        this.element.category = this.category;
        this.element.header = this.header;
        this.element.entries = this.entries;
        this.element.categoryName = this.categoryName;
    }

    getPath(){
        return this.category.path;
    }

    updateStatus(){
        this.element.classList.remove('status-ignored', 'status-modified',  'status-added');
        //TODO add classes to handle changes
        // this.element.classList.add("status-#{this.file.status}") if this.file.status?
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

    scrollIntoViewIfNeeded() {
        if (this.selected) {
            this.element.scrollIntoViewIfNeeded()
        }
    }

    createViewForEntry(entry){
        let view = (entry instanceof WatchlistCategory) ? new WatchlistCategoryView(entry) : new WatchlistSymbolView(entry);

        this.disposables.add(this.category.onDidRemoveEntries(removedEntries => {
            if(removedEntries.has(entry)){
                view.element.remove();
                subscription.dispose();
            }
        }));

        return view;
    }

    subscribeToCategory(){
        this.disposables.add(this.category.onDidAddEntries(addedEntries => {
            if(!this.isExpanded){
                return;
            }

            let numberOfEntries = this.entries.children.length;

            for(let entry of addedEntries){
                let view = this.createViewForEntry(entry);
                let insertionIndex = entry.indexInParentCategory;

                if(insertionIndex < numberOfEntries){
                    this.entries.insertBefore(view.element, this.entries.children[insertionIndex]);
                }else{
                    this.entries.appendChild(view.element);
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
            this.element.isExpanded = this.isExpanded;
            this.element.classList.add('isExpanded');
            this.element.classList.remove('collapsed');
            this.category.expand();
        }

        if(isRecursive){
            for(entry of this.entries.children){
                if(entry.classList.contains('category')){
                entry.expand(true);
                }
            }
        }
    }

    collapse(isRecursive = false){
        this.isExpanded = false;
        this.element.isExpanded = false;

        if(isRecursive){
            for(entry of this.entries.children){
                if(entry.isExpanded){
                    entry.collapse(true);
                }
            }
        }

        this.element.classList.remove('isExpanded');
        this.element.classList.add('collapsed');
        this.category.collapse();
        this.entries.innerHTML = '';
    }
}
