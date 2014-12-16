$.fn.pouchUI.api = {
	/**************************************************************
	 * START INIT FUNCTIONS
	 **************************************************************/
	init : {
		// INITIALISE DATA SOURCES AND DATABASE SYNC
		initialiseList : function(d) {
			var plugin=this;
			//list.hide();
			var dfr=$.Deferred();
			//var d=$.extend({include_docs:true},plugin.settings,list.data());
			var pouch=$.fn.pouchUI.api.model.getDB(d.pouchDb);
			//console.log('initialise conf',d);
			function startSync() {
				// REMOTE SYNC ? - no need to wait because listening on local changes
				if (d.pouchDb && d.pouchDbsource) {
					console.log('START REMOTE SYNC DBSOURCE',d);
					// SILENT REMOTE SYNC
					pouch.sync(d.pouchDbsource,{live:true})
					.on('change', function (info) {
						console.log('sync change',info)
					})
					.on('complete', function (info) {
						console.log('sync complete',info);
					}); 
				}	
			}
			// SHEET SOURCE ?
			if (d.pouchSheetsource) {
				//console.log('impoft sheet',d);
				$.fn.pouchUI.api.init.importGoogleSheet(d.pouchDb,d.pouchSheetsource,d.sheetPreSaveHook).then(function() {
					startSync();
					dfr.resolve();
				});
			} else {
				startSync();
				dfr.resolve();
			}
			return dfr;
		},
		// IMPORT DATA FROM A GOOGLE SHEET INTO POUCH
		importGoogleSheet : function (db,url,updateValuesHook) {
			var plugin=this;
			var adfr=$.Deferred();
			var a=url+'?alt=json-in-script&callback=pouchUI_captureGoogleSheet';
			console.log('IGS',a);
			$.getScript(a,function(res) {
				console.log('IGSres',res);
				var records=[];
				// FOR EACH SHEET ROW REPRESENTING A RECORDS
				var dfrs=[];
				var pouch=$.fn.pouchUI.api.model.getDB(db);
				var errors=[];
				var rowNum=1;
				$.each(pouchUI_googleSheetResult,function(key,sheetRow) {
					//if (rowNum>1) break;
					// HOOK OVERRIDE VALUES
					//console.log('sheetRow BEFORE',sheetRow);
					//if (typeof updateValuesHook ==="function") updateValuesHook(sheetRow);
					//console.log('sheetRow AFTER HOOK',sheetRow);
					rowNum++;
					var dfr=$.Deferred();
					dfrs.push(dfr);
					//console.log('sheet row',sheetRow);
					// GATHER THE RECORD FROM TEXT FORMAT
					// LOOK IT UP
					pouch.get(sheetRow._id).then(function(current) {
						$.extend(current,sheetRow);
						// save import row
						pouch.validatingPut(current).then(function (info) {
							//console.log('google sheet row saved');
							dfr.resolve();
						}).catch(function (err) {
						  console.log('failed to save google sheet row',err);
						  errors.push('ERROR ON SAVE EXISTING -'+err.message+" at row "+rowNum);
						  dfr.resolve();
						});
						//dfr.resolve();
					// FAILING TO FIND, THEN CREATE IT
					}).catch(function(err) {
						console.log('create new',err,sheetRow);
						pouch.validatingPost(sheetRow).then(function (info) {
							console.log('google sheet entry created',sheetRow,info);
							dfr.resolve();
						}).catch(function (err) {
						  console.log('failed to save NEW google sheet row',err);
						  errors.push('ERROR ON SAVE NEW -'+err.message+" at row "+rowNum);
						  dfr.resolve();
						});
					});
					
				});	
				$.when.apply($,dfrs).then(function() {
					adfr.resolve();
					console.log('IMPORTERRS',errors)
					if (errors.length>0) alert("Sheet import error:\n"+errors.join("\n"));
				});
			});
			
			return adfr;
		},
		// CREATE/UPDATE NECESSARY DESIGN DOCSS
		initialiseDesignDocuments : function (settings) {
			console.log('init design');
			var designDocs=settings.design;
			//var plugin=this;	
			var dfr=$.Deferred();
				var promises=[];
				// first delete databases if reset flag
				if (!designDoc) designDoc={};
				//$.each(designDoc,function(dkey,dval) {
				//	promises.push($.fn.pouchUI.api.init.destroyDB(dkey));
				//});
				// try to load each existing design doc and update it
				$.when.apply($,promises).then(function() {
					//console.log('now create designs ',designDoc);
					$.each(designDocs,function(ddkey,designDoc) {
						$.each(designDoc,function(dkey,dval) {
							console.log('now create designs ',dkey,dval);
							var pouch=$.fn.pouchUI.api.model.getDB(dkey);
							
							pouch.get(dval._id).then(function(current) {
								//console.log('got');
								//console.log('got',current,dval.validate_doc_update,current.validate_doc_update);
								if (
									true ||
									!$.fn.pouchUI.api.model.equal(dval.validate_doc_update,current.validate_doc_update)
									&& !$.fn.pouchUI.api.model.equal(dval.views,current.views)
								) {
									//console.log('got not equal',current,dval);
									if (document.location.search=="?pouch-init=true" || settings.init.refreshDesignDocs===true ) {
										dval._rev=current._rev;
										//console.log('save',dval);
										pouch.post(dval).then(function (info) {
											console.log('design doc saved',info);
											dfr.resolve();
										}).catch(function (err) {
										   //console.log('design doc err r',err);
										   dfr.resolve();
										});
									} else {
										dfr.resolve();
									}
								} else {
									dfr.resolve();
								}
							// failing that create a new one
							}).catch(function(err) {
								//console.log('create new');
								pouch.post(dval).then(function (info) {
									//console.log('design doc created info',info);
									dfr.resolve();
								});
							});
						});
					});
				});
			
			return dfr;
		},
		// DESTROY POUCH DATABASE 
		destroyDB : function (db) {
			var plugin=this;
			return;
			var dfr=$.Deferred();
			// SWITCH ON URL PARAMETER ?reset=yes
			if ($.trim(location.search.split('reset=')[1])!='yes') {
				dfr.resolve();
			} else {
				console.log('RESET'); //?',$.trim(location.search.split('reset=')[1]).length,location.search,location.search.split('reset=')[1]);
				var pouch=plugin.api.model.getDB(db);
				// RESET DATABASE
				pouch.destroy()
				.then(function(err,res) {
					//console.log('destroyed',err,res);
					dfr.resolve();
				})
				.catch(function(e) {
					console.log('destroyed FAIL',err,res);
					dfr.reject();
				});	
			}
			return dfr;
		}
	}
};
	
