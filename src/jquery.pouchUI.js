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
/**********************************************************************************
 * Initialise content 
 * @input this - DOM provided to jquery plugin. All this DOM is bound for events. Some of this DOM is rerendered using pouch data.
 * @param method - can take multiple forms
	- method parameter empty or as object calls the init method and passes the parameter object eg $('body').pouchUI({db:'pets',maxSize:898798})
	- method parameter as string matching existing methods defined in the top level of the methods object above calls the method. eg $('body').pouchUI('doit');
 * @return initialised plugin instance with properties .settings and .api for programmatic access to pouchUI methods.
 **********************************************************************************/
$.fn.pouchUI = function(method) {
	var methods = {
		init : function(options) {
			var masterPlugin=this;
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
			var databasesToListen={};
			
			// private internal copy of options for this instance of the plugin
			var settings=$.extend(true,{},$.fn.pouchUI.defaultOptions);
			// init parameters
			if(options) {
				$.extend(true,settings, options);
			}
			// set a path on all pouch-lists and collate shared database config
			$('.pouch-list',pluginTemplate).each(function(k,v) {
				//console.log('AA',$.fn.pouchUI.api.view.getDomPath(v,2));
				$(v).attr('data-templatepath',$.fn.pouchUI.api.view.getDomPath(v,2));
				// extract configuration per database
				if ($(v).data('pouchDb')) {
					if ($.type(databaseConfigs[$(v).data('pouchDb')])!='object') databaseConfigs[$(v).data('pouchDb')]={};
					if ($(v).data('pouchSheetsource')) databaseConfigs[$(v).data('pouchDb')]['pouchSheetsource']=$(v).data('pouchSheetsource');
					if ($(v).data('pouchDbsource')) databaseConfigs[$(v).data('pouchDb')]['pouchDbsource']=$(v).data('pouchDbsource');	
				}
				
			});
			//console.log('started initdd ',settings);
			$.fn.pouchUI.api.init.initialiseDesignDocuments(settings).then(function() {
				var promises=[];
				//console.log('started init  list');
				$.each(databaseConfigs,function(lk,lv) {
					var dfr=$.Deferred();
					promises.push(dfr);
					lv.pouchDb=lk;
					$.fn.pouchUI.api.init.initialiseList($.extend({},options,lv)).then(function() {
						dfr.resolve();
					});
				})
				//console.log('INIT setup lists');
				$.when.apply($,promises).then(function() {
					//console.log('INIT',settings);
					//return;
					// CONCATENTATE HTML OF ALL PLUGIN CONTENT, MARK ALL LISTS WITH TEMPLATE PATH AND COLLATE CONFIG PER DB THEN CACHE FOR TEMPLATING
					$(masterPlugin).each(function(tk,tv) {
						//$(tv).attr('data-root-pouch','true')
						pluginTemplate=pluginTemplate+tv.outerHTML;
						//console.log($(tv).data());
						var pouchLists=$('.pouch-list',tv);
						if ($(tv).hasClass('pouch-list')) pouchLists.add(tv);
						pouchLists.each(function(ik,iv) {
							if ($(iv).data('pouchDb')) {
								// COLLATE LISTS BY DB FOR LISTENING
								//console.log('collate',tv);
								if (typeof databasesToListen[$(iv).data('pouchDb')] === 'undefined' ) {
									databasesToListen[$(iv).data('pouchDb')]=[]; 
								}	
								databasesToListen[$(iv).data('pouchDb')].push($(iv));
							}
						});
					});
					pluginTemplate=$('<div id="root">'+pluginTemplate+'</div>');
					
					// LISTEN TO CHANGES ON LOCAL DB AND UPDATE CONTENT
					//setTimeout(function() {
					
					
					//console.log("PTEMP",masterPlugin);
					// EXTRACT SETTINGS PER ITEM PASSED IN SO SEARCHFORM AND LIST CAN HAVE DIFFERENT SETTINGS
					// BIND METHODS INSIDE PLUGIN AND CALL CONTROLLER INIT
					masterPlugin.each(function() {
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
						console.log('bind db change listeners',databasesToListen);
						
						setTimeout(function() {
							console.log('now bind changes');
							
							$.each(databasesToListen,function(dk,dv) {
								var pouch=plugin.api.model.getDB(dk);
								// CREATE
								var changes = pouch.changes({ live: true,include_docs:true,since:'now'}).on('create', function(change) { 
									if (location.search!='?id=') {
										console.log('changes create','.pouch-list-item[data-pouch-id="'+change.doc._id+'"]',$('.pouch-list-item[data-pouch-id="'+change.doc._id+'"]'));
										$.each(dv,function(pk,pv) {
											plugin.api.model.loadList(pv).then(function(results) {
												//plugin.api.view.updatePagination(pv,results,'update');
												if (results && results.rows && results.rows.length>0) {
													$.each(results.rows,function(k,row) {
														//console.log('check',row,pv);
														if (row.id==change.doc._id) {
															plugin.api.view.renderList(results,pv).then(function(rres) {
																plugin.api.view.reloadList(pv);
															});
														}
													});
												}
											});
										});
									}
								});
								// UPDATE
								var changes = pouch.changes({ live: true,include_docs:true,since:'now'}).on('update', function(change) { 
									//console.log('LOC',location.search);
									if (location.search!='?id=') {
										var item=$('.pouch-list .pouch-list-item[data-pouch-id="'+change.doc._id+'"]');
										console.log('changes data',change.doc,$(item).data());
										if (item && item.length>0 && change.doc._rev!=item.data('pouchRev')) {
											var list=item.parents('.pouch-list').first();
											console.log('UPDATE FORM');
											plugin.api.view.updateListItemAll(change,item,list);
										}
									}
								});
								// DELETE
								var changes = pouch.changes({ live: true,include_docs:true,since:'now'}).on('delete', function(change) { 
									console.log('changes DEL','.pouch-list-item[data-pouch-id="'+change.doc._id+'"]',$('.pouch-list-item[data-pouch-id="'+change.doc._id+'"]'));
									$('.pouch-list .pouch-list-item[data-pouch-id="'+change.doc._id+'"]').remove();
									// TODO - if count sibling pouch-list-item=0 navigate back 1
								});
							});
						},200);
						// gather top level lists for initialisation, setting template path and collating db 
						if ($(plugin).hasClass('pouch-list')) {
							plugin.pouchLists.push($(this));
							//console.log('BB',$.fn.pouchUI.api.view.getDomPath(this,2));
							//$(plugin).attr('data-templatepath',plugin.api.view.getDomPath(plugin,2));
						}
						else $('.pouch-list:not(.pouch-list .pouch-list)',$(plugin)).each(function() {
							//console.log('CC',$.fn.pouchUI.api.view.getDomPath(this,2));
							plugin.pouchLists.push($(this));
							//$(this).attr('data-templatepath',plugin.api.view.getDomPath(plugin,2));
							//console.log('TT',typeof databasesToListen[$(this).data('pouchDb')]);
							if (typeof plugin.databasesToListen[$(this).data('pouchDb')] === 'undefined' ) {
								//plugin.databasesToListen[$(this).data('pouchDb')]=[]; 
							}	
							//plugin.databasesToListen[$(this).data('pouchDb')].push($(plugin));
						});
						// kickstart
						//console.log('kickstart');
						plugin.api.controller.init.apply(plugin);
					});
				});
			});
			return masterPlugin;
		},
		doit : function(name) {
			//console.log('DONE',name);
		}
	};
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
	
