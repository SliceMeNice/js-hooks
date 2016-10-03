( function( window, undefined ) {
	'use strict';

	/**
	 * Handles adding, removing and triggering of filter and action hooks.
	 * Priorities of hooks are based on lowest to highest, i.e. hooks with lower priority are fired first.
	 */
	var HookManager = function() {
		var slice = Array.prototype.slice;
		
		/**
		 * Maintain a reference to the object scope so our public methods never get confusing.
		 */
		var MethodsAvailable = {
			addAction: addAction,
			addFilter: addFilter,
			applyFilters: applyFilters,
			doAction: doAction,
			removeAction: removeAction,
			removeFilter: removeFilter
		};

		/**
		 * Stores all registered hooks separated by type.
		 */
		var registeredHooks = {
			actions : {},
			filters : {}
		};

		/**
		 * Adds an action hook callback.
		 *
		 * @param action The action name / identifier
		 * @param callback Must be a valid callback function
		 * @param [priority=10] Used to control the order of when the callback function is executed in relation to other callbacks bound to the same hook
		 * @param [context] Supply a value to be used for this
		 */
		function addAction( action, callback, priority, context ) {
			if ( typeof action === 'string' && typeof callback === 'function' ) {
				priority = parseInt( ( priority || 10 ), 10 );
				_addHook( 'actions', action, callback, priority, context );
			}

			return MethodsAvailable;
		}

		/**
		 * Performs an action, if it exists. You can pass as many arguments as you want to this function; the only rule is
		 * that the first argument must always be the action name / identifier.
		 */
		function doAction( /* action, arg1, arg2, ... */ ) {
			var args = slice.call( arguments );
			var action = args.shift();

			if ( typeof action === 'string' ) {
				_runHook( 'actions', action, args );
			}

			return MethodsAvailable;
		}

		/**
		 * Removes the specified action callback, if it exists.
		 *
		 * @param action The action name / identifier
		 * @param [callback] The callback function to remove
		 */
		function removeAction( action, callback ) {
			if ( typeof action === 'string' ) {
				_removeHook( 'actions', action, callback );
			}

			return MethodsAvailable;
		}

		/**
		 * Adds a filter hook callback.
		 *
		 * @param filter The filter name / identifier
		 * @param callback Must be a valid callback function before this action is added
		 * @param [priority=10] Used to control when the function is executed in relation to other callbacks bound to the same hook
		 * @param [context] Supply a value to be used for this
		 */
		function addFilter( filter, callback, priority, context ) {
			if ( typeof filter === 'string' && typeof callback === 'function' ) {
				priority = parseInt( ( priority || 10 ), 10 );
				_addHook( 'filters', filter, callback, priority, context );
			}

			return MethodsAvailable;
		}

		/**
		 * Performs a filter if it exists. You should only ever pass 1 argument to be filtered. The only rule is that
		 * the first argument must always be the filter.
		 */
		function applyFilters( /* filter, filtered arg, arg2, ... */ ) {
			var args = slice.call( arguments );
			var filter = args.shift();

			if ( typeof filter === 'string' ) {
				return _runHook( 'filters', filter, args );
			}

			return MethodsAvailable;
		}

		/**
		 * Removes the specified filter if it contains a namespace.identifier & exists.
		 *
		 * @param filter The action to remove
		 * @param [callback] Callback function to remove
		 */
		function removeFilter( filter, callback ) {
			if ( typeof filter === 'string') {
				_removeHook( 'filters', filter, callback );
			}

			return MethodsAvailable;
		}

		/**
		 * Removes the specified hook by resetting the value of it.
		 *
		 * @param type Type of hook, either 'actions' or 'filters'
		 * @param hook The hook (namespace.identifier) to remove
		 * @private
		 */
		function _removeHook( type, hook, callback, context ) {
			var handlers, handler, i;
			
			if ( !registeredHooks[ type ][ hook ] ) {
				return;
			}

			if ( !callback ) {
				registeredHooks[ type ][ hook ] = [];
			} else {
				handlers = registeredHooks[ type ][ hook ];

				if ( !context ) {
					for ( i = handlers.length; i--; ) {
						if ( handlers[i].callback === callback ) {
							handlers.splice( i, 1 );
						}
					}
				} else {
					for ( i = handlers.length; i--; ) {
						handler = handlers[i];
						if ( handler.callback === callback && handler.context === context) {
							handlers.splice( i, 1 );
						}
					}
				}
			}
		}

		/**
		 * Adds the hook to the appropriate storage container
		 *
		 * @param type 'actions' or 'filters'
		 * @param hook The hook (namespace.identifier) to add to our event manager
		 * @param callback The function that will be called when the hook is executed.
		 * @param priority The priority of this hook. Must be an integer.
		 * @param [context] A value to be used for this
		 * @private
		 */
		function _addHook( type, hook, callback, priority, context ) {
			var hookObject = {
				callback : callback,
				priority : priority,
				context : context
			};

			// Utilize 'prop itself' : http://jsperf.com/hasownproperty-vs-in-vs-undefined/19
			var hooks = registeredHooks[ type ][ hook ];

			if( hooks ) {
				hooks.push( hookObject );
				hooks = _hookInsertSort( hooks );
			} else {
				hooks = [ hookObject ];
			}

			registeredHooks[ type ][ hook ] = hooks;
		}

		/**
		 * Use an insert sort for keeping our hooks organized based on priority. This function is ridiculously faster
		 * than bubble sort, etc: http://jsperf.com/javascript-sort
		 *
		 * @param hooks The custom array containing all of the appropriate hooks to perform an insert sort on.
		 * @private
		 */
		function _hookInsertSort( hooks ) {
			var tmpHook, j, prevHook;

			for ( var i = 1, len = hooks.length; i < len; i++ ) {
				tmpHook = hooks[ i ];
				j = i;

				while ( ( prevHook = hooks[ j - 1 ] ) &&  prevHook.priority > tmpHook.priority ) {
					hooks[ j ] = hooks[ j - 1 ];
					--j;
				}

				hooks[ j ] = tmpHook;
			}

			return hooks;
		}

		/**
		 * Runs the specified hook. If it is an action, the value is not modified but if it is a filter, it is.
		 *
		 * @param type 'actions' or 'filters'
		 * @param hook The hook ( namespace.identifier ) to be ran.
		 * @param args Arguments to pass to the action/filter. If it's a filter, args is actually a single parameter.
		 * @private
		 */
		function _runHook( type, hook, args ) {
			var handlers = registeredHooks[ type ][ hook ], i, len;
			
			if ( !handlers ) {
				return ( type === 'filters' ) ? args[0] : false;
			}

			len = handlers.length;
			
			if ( type === 'filters' ) {
				for ( i = 0; i < len; i++ ) {
					args[ 0 ] = handlers[ i ].callback.apply( handlers[ i ].context, args );
				}
			} else {
				for ( i = 0; i < len; i++ ) {
					handlers[ i ].callback.apply( handlers[ i ].context, args );
				}
			}

			return ( type === 'filters' ) ? args[ 0 ] : true;
		}

		// return all of the publicly available methods
		return MethodsAvailable;
	};
	
	window.hooks = window.hooks || new HookManager();

} )( window );
