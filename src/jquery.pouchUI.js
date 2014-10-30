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
var pouchUILib = {
	

}

var methods = {
	init : function(options) {
		// START PLUGIN - ONCE OFF INITIALISATION ON PAGE LOAD
		var pluginElements=this;
		var pouchLists=[];
		var databasesToListen={};
		var databaseConfigs={};
		var pluginTemplate='';
		// mash all elements handed to jquery into a single template and 
		// - set a path on all pouch-lists
		// - extract configuration per database
		$(this).each(function(tk,tv) {
			$(tv).attr('data-root-pouch','true')
			pluginTemplate=pluginTemplate+tv.outerHTML;
		});
		
		//console.log("PTEMP",pluginTemplate);
		pluginTemplate=$('<div id="root">'+pluginTemplate+'</div>');
		// set path for every list regardless of nesting depth
		$('.pouch-list',pluginTemplate).each(function(k,v) {
			$(v).attr('data-templatepath',pouchUILib.view.getDomPath(v,1));
			if ($(v).data('pouchDb')) {
				if ($.type(databaseConfigs[$(v).data('pouchDb')])!='object') databaseConfigs[$(v).data('pouchDb')]={};
				if ($(v).data('pouchSheetsource')) databaseConfigs[$(v).data('pouchDb')]['pouchSheetsource']=$(v).data('pouchSheetsource');
				if ($(v).data('pouchDbsource')) databaseConfigs[$(v).data('pouchDb')]['pouchDbsource']=$(v).data('pouchDbsource');	
			}
		});
		//console.log('PLUGIN TEMPLATE');
		// gather top level lists for listening to changes
		this.each(function() {
			if ($(this).hasClass('pouch-list')) {
				pouchLists.push($(this));
				$(this).attr('data-templatepath',pouchUILib.view.getDomPath(this,2));
			}
			else $('.pouch-list:not(.pouch-list .pouch-list)',$(this)).each(function() {
				pouchLists.push($(this));
				$(this).attr('data-templatepath',pouchUILib.view.getDomPath(this,2));
				//console.log('TT',typeof databasesToListen[$(this).data('pouchDb')]);
				if (typeof databasesToListen[$(this).data('pouchDb')] === 'undefined' ) databasesToListen[$(this).data('pouchDb')]=[]; 
				databasesToListen[$(this).data('pouchDb')].push($(this));
			});
			// BIND CLICK AND KEYUP EVENTS ON SEARCH FORMS THAT ARE NOT INSIDE OF POUCH-LISTS
			$(this).data('options',options);
			$(this).addClass('data-pouch-root');
			pouchUILib.view.bindEventsTo($(this));	
		});
			
		// init and activate lists
		pouchUILib.init.initialiseDesignDocuments(options.design,options).then(function() {
			$.each(pouchLists,function(lk,lv) {
				//console.log('ini/load/render',lv,$(lv).data())
				pouchUILib.init.initialiseList(lv,options).then(function() {
					//console.log('ini');
					pouchUILib.controller.actionReloadList(lv,options);
				});
			});
		});	
		// LISTEN TO CHANGES ON LOCAL DB AND UPDATE CONTENT
		setTimeout(function() {
			$.each(databasesToListen,function(dk,dv) {
				var pouch=pouchUILib.model.getDB(dk,options);
				// CREATE
				var changes = pouch.changes({ live: true,include_docs:true,since:'now'}).on('create', function(change) { 
					//console.log('changes create','.pouch-list-item[data-pouch-id="'+change.doc._id+'"]',$('.pouch-list-item[data-pouch-id="'+change.doc._id+'"]'));
					$('.pouch-list',pluginElements).each(function(pk,pv) {
						pouchUILib.model.loadList(pv,options).then(function(results) {
							if (results && results.rows && results.rows.length>0) {
								$.each(results.rows,function(k,row) {
									//console.log('check',row);
									if (row.id==change.doc._id) {
										pouchUILib.view.renderList(results,pv,options).then(function(rres) {
											pouchUILib.controller.actionReloadList(pv,options);
										});
									}
								});
							}
						});
					});
				});
				// UPDATE
				var changes = pouch.changes({ live: true,include_docs:true,since:'now'}).on('update', function(change) { 
					console.log('changes UPDATE','.pouch-list-item[data-pouch-id="'+change.doc._id+'"]',$('.pouch-list-item[data-pouch-id="'+change.doc._id+'"]'));
					var item=$('.pouch-list .pouch-list-item[data-pouch-id="'+change.doc._id+'"]');
					var list=item.parents('.pouch-list').first();
					pouchUILib.view.updateListItem(change,item,list);
				});
				// DELETE
				var changes = pouch.changes({ live: true,include_docs:true,since:'now'}).on('delete', function(change) { 
					//console.log('changes DEL','.pouch-list-item[data-pouch-id="'+change.doc._id+'"]',$('.pouch-list-item[data-pouch-id="'+change.doc._id+'"]'));
					$('.pouch-list .pouch-list-item[data-pouch-id="'+change.doc._id+'"]').remove();
				});
			});
		},5000);

		jhg
		
		
		var db=null;
		// private internal copy of options for this instance of the plugin
		var settings=$.extend(true,{},$.fn.quickDB.defaultOptions);
		// init parameters
		if(options) {
			$.extend(true,settings, options);
		}
		return this.each(function() {
			var plugin = this;
			//console.log('iniit plugin on ',this)
		
			plugin.saveCallbackStack=[]; 	
			// DOM configuration through data attributes
			$.extend(true,settings, $(plugin).data());
			// access to settings for methods in other scopes
			plugin.settings = settings;
			plugin.DBInitialised=false;
			// plugin.settings.db is wholy generated
			plugin.settings.db = {table:{}};
			//plugin.settings.db.table.fields={};
			// ensure DOM targets for list/form/searcher with default of this plugin
			if (plugin.settings.formtarget && $(plugin.settings.formtarget).length>0) plugin.formTarget=$(plugin.settings.formtarget);
			else plugin.formTarget=$(plugin);
			if (plugin.settings.listtarget && $(plugin.settings.listtarget).length>0) plugin.listTarget=$(plugin.settings.listtarget);
			else plugin.listTarget=$(plugin);
			if (plugin.settings.searchtarget && $(plugin.settings.searchtarget).length>0) plugin.searchTarget=$(plugin.settings.searchtarget);
			else plugin.searchTarget=$(plugin);
			//console.log('set targets',plugin.searchTarget,plugin.listTarget,plugin.formTarget);
			
			// bind functions in with plugin scope
			var pluginMethods=[];
			if ($.fn.quickDB && $.fn.quickDB.api) {
				//console.log('bind plaugin to api',plugin);
				$.each($.extend(true,{},$.fn.quickDB.api),function(key,value) {
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
			// single form wrapper around whole plugin
			$(plugin).wrap("<form></form>");
			// kickstart
			plugin.api.controller.init.apply(plugin);
		});
	}
};
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
		$.error("Method " +  method + " does not exist on jQuery.quickDB");
	}    
};
	
