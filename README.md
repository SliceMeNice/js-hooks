# JS Hooks

Manage filter and actions hooks in JavaScript.

## API Usage
API functions can be called via the global `hooks` like this `hooks.addAction(...)`, etc.

* `addAction( 'namespace.identifier', callback, priority )`
* `addFilter( 'namespace.identifier', callback, priority )`
* `removeAction( 'namespace.identifier' )`
* `removeFilter( 'namespace.identifier' )`
* `doAction( 'namespace.identifier', arg1, arg2, moreArgs, finalArg )`
* `applyFilters( 'namespace.identifier', content )`

## Features

* Priorities system ensures hooks with lower integer priority are fired first.
* Uses native object hash lookup for finding hook callbacks.
* Utilizes insertion sort for keeping priorities correct. Best Case: O(n), worst case: O(n^2)

## Release History

__1.0.0__

  * Forked from https://github.com/carldanley/WP-JS-Hooks and slightly adapted the existing code. 