/*********************************************************
 * jQuery plugin to render pouch query results into a DOM template
 * DOM elements provided to plugin are searched for .pouch-list elements which are initialised
 * All elements that are to be used as lists and as link targets must be initialised before use
 * attributes of the pouch-list define the query
 *		 data-pouch-db='testdb' - primary database source
 *		 data-pouch-index='people/byage' - index to query
 * 		 data-pouch-startkey=''  data-pouch-endkey='' - criteria
 *		 data-pouch-dbSource='https://syntithenai.iriscouch.com/people' - sync data from this source
 for rendering
 *		class='pouch-list'||class='pouch-list-item'||class='pouch-list-value' - identify list subtemplates 
 
 * 
 *********************************************************/
var methods = {
	init : function(options) {
		// START PLUGIN - ONCE OFF INITIALISATION ON PAGE LOAD
		// SCOPE/CONFIGURATION EXISTS FOR 
		// - PER PLUGIN (ONE INSTANCE FOR ALL SELECTED DOM)
		// - PER SELECTED ELEMENT WHERE JQUERY PASSES MANY ELEMENTS AS THIS.
		//		- .settings and .api  
		//		- allows $('#pluginselector')[0].api.model.refresh();		
		// - PER LIST
		var databaseConfigs={}; // CONFIGURATION COLLATED BY DATABASE
		var pluginTemplate='';  // CONCATENATED HTML OF ALL SELECTED ELEMENTS 
		var pouchLists=[];  // TOP LEVEL LISTS
		
		// private internal copy of options for this instance of the plugin
		var settings=$.extend(true,{},$.fn.pouchUI.defaultOptions);
		// init parameters
		if(options) {
			$.extend(true,settings, options);
		}
		// set a path on all pouch-lists and collate shared database config
		$('.pouch-list',pluginTemplate).each(function(k,v) {
			$(v).attr('data-templatepath',$.fn.pouchUI.api.view.getDomPath(v,2));
			// extract configuration per database
			if ($(v).data('pouchDb')) {
				if ($.type(databaseConfigs[$(v).data('pouchDb')])!='object') databaseConfigs[$(v).data('pouchDb')]={};
				if ($(v).data('pouchSheetsource')) databaseConfigs[$(v).data('pouchDb')]['pouchSheetsource']=$(v).data('pouchSheetsource');
				if ($(v).data('pouchDbsource')) databaseConfigs[$(v).data('pouchDb')]['pouchDbsource']=$(v).data('pouchDbsource');	
			}
		});
		//console.log('INIT',settings);
		// CONCATENTATE HTML OF ALL PLUGIN CONTENT, MARK ALL LISTS WITH TEMPLATE PATH AND COLLATE CONFIG PER DB THEN CACHE FOR TEMPLATING
		$(this).each(function(tk,tv) {
			//$(tv).attr('data-root-pouch','true')
			pluginTemplate=pluginTemplate+tv.outerHTML;
		});
		pluginTemplate=$('<div id="root">'+pluginTemplate+'</div>');
		//console.log("PTEMP",pluginTemplate);
		// EXTRACT SETTINGS PER ITEM PASSED IN SO SEARCHFORM AND LIST CAN HAVE DIFFERENT SETTINGS
		// BIND METHODS INSIDE PLUGIN AND CALL CONTROLLER INIT
		return this.each(function() {
			var plugin = this;
			plugin.pluginTemplate=pluginTemplate;
			plugin.databaseConfigs=databaseConfigs;
			plugin.pouchLists=pouchLists;
			plugin.databasesToListen={};
			plugin.settings = settings;
			// bind functions in with plugin scope
			var pluginMethods=[];
			if ($.fn.pouchUI.api) {
				//console.log('bind plaugin to api',plugin);
				$.each($.extend(true,{},$.fn.pouchUI.api),function(key,value) {
					if ($.isFunction(value)) { 	
						pluginMethods[key]=value.bind(plugin);
					} else {
						pluginMethods[key]={};
						$.each(value,function(ikey,ivalue) {
							if ($.isFunction(ivalue)) { 	
								pluginMethods[key][ikey]=ivalue.bind(plugin);
							}
						});
					}
				});
			}
			// access to api for functions defined in other scopes
			plugin.api = pluginMethods;
			// gather top level lists for initialisation, setting template path and collating db 
			if ($(plugin).hasClass('pouch-list')) {
				plugin.pouchLists.push($(this));
				$(plugin).attr('data-templatepath',plugin.api.view.getDomPath(plugin,2));
			}
			else $('.pouch-list:not(.pouch-list .pouch-list)',$(plugin)).each(function() {
				plugin.pouchLists.push($(this));
				$(this).attr('data-templatepath',plugin.api.view.getDomPath(plugin,2));
				//console.log('TT',typeof databasesToListen[$(this).data('pouchDb')]);
				if (typeof plugin.databasesToListen[$(this).data('pouchDb')] === 'undefined' ) {
					plugin.databasesToListen[$(this).data('pouchDb')]=[]; 
				}	
				plugin.databasesToListen[$(this).data('pouchDb')].push($(plugin));
			});
			// kickstart
			plugin.api.controller.init.apply(plugin);
		});
	},
	doit : function(name) {
		//console.log('DONE',name);
	}
};
/**********************************************************************************
 * Initialise content 
 * @input this - DOM provided to jquery plugin. All this DOM is bound for events. Some of this DOM is rerendered using pouch data.
 * @param method - can take multiple forms
	- method parameter empty or as object calls the init method and passes the parameter object eg $('body').pouchUI({db:'pets',maxSize:898798})
	- method parameter as string matching existing methods defined in the top level of the methods object above calls the method. eg $('body').pouchUI('doit');
 * @return initialised plugin instance with properties .settings and .api for programmatic access to pouchUI methods.
 **********************************************************************************/
$.fn.pouchUI = function(method) {
	// PUBLIC METHODS - TODO with jquery style method calls $('dd').plugin('methodName',restOfParams) with direct access to plugins.api
	// support for nesting as per model,view,controller subkeys of api
	if( $.isFunction(methods[method])) {
		return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
	} 
	else if(typeof method === 'object' || !method) {
		return methods.init.apply(this, arguments);
	} 
	else {
		$.error("Method " +  method + " does not exist on jQuery.pouchUI");
	}    
};
	
