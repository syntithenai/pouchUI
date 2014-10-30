var pouchUILib = {
	/**************************************************************
	 * START INIT FUNCTIONS
	 **************************************************************/
	init : {
		/* INIT EVENTS, SYNC and PRELOAD SHEET DATA IF AVAILABLE*/
		initialiseList : function(list,options) {
			list.hide();
			var dfr=$.Deferred();
			var d=$.extend({include_docs:true},options,list.data());
			var pouch=pouchUILib.model.getDB(d.pouchDb,options);
			//console.log('initialise conf',d);
			// BIND LIST EVENTS
			//pouchUILib.view.bindEventsTo(list);
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
				pouchUILib.init.importGoogleSheet(d.pouchDb,d.pouchSheetsource,options).then(function() {
					startSync();
					dfr.resolve();
				});
			} else {
				startSync();
				dfr.resolve();
			}
			return dfr;
		},
		importGoogleSheet : function (db,url,options) {
			var adfr=$.Deferred();
			var a=url+'?alt=json-in-script&callback=pouchUI_captureGoogleSheet';
			console.log('IGS',a);
			$.getScript(a,function(res) {
				var records=[];
				// FOR EACH SHEET ROW REPRESENTING A RECORDS
				var dfrs=[];
				var pouch=pouchUILib.model.getDB(db,options);
				var errors=[];
				var rowNum=1;
				$.each(pouchUI_googleSheetResult,function(key,sheetRow) {
					rowNum++;
					var dfr=$.Deferred();
					dfrs.push(dfr);
					//console.log('sheet row',sheetRow);
					// GATHER THE RECORD FROM TEXT FORMAT
					// LOOK IT UP
					pouch.get(sheetRow._id).then(function(current) {
						$.extend(current,sheetRow);
						// save import row
						pouch.validatingPost(current).then(function (info) {
							//console.log('google sheet row saved');
							dfr.resolve();
						}).catch(function (err) {
						  console.log('failed to save google sheet row',err);
						  dfr.resolve();
						});
						//dfr.resolve();
					// FAILING TO FIND, THEN CREATE IT
					}).catch(function(err) {
						//console.log('create new',err);
						pouch.validatingPost(sheetRow).then(function (info) {
							//console.log('google sheet entry created',info);
							dfr.resolve();
						}).catch(function (err) {
						  console.log('failed to save NEW google sheet row',err);
						  errors.push(err.message+" at row "+rowNum);
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
		initialiseDesignDocuments : function (designDoc,options) {
			var dfr=$.Deferred();
			//console.log('got design ',designDoc);
			// load existing design doc and update it
			var promises=[];
			// first delete databases if reset flag
			$.each(designDoc,function(dkey,dval) {
				promises.push(pouchUILib.init.destroyDB(dkey,options));
			});
			//console.log('dbs destroyed');
			$.when.apply($,promises).then(function() {
				//console.log('dbs destroyed forreal');
				//console.log('DD',designDoc);
				$.each(designDoc,function(dkey,dval) {
					//console.log('now create designs ',dkey,dval);
					var pouch=pouchUILib.model.getDB(dkey,options);
					//console.log('now pouched',dval._id,pouch);
					pouch.get(dval._id).then(function(current) {
						//console.log('got design doc',current);
						dval._rev=current._rev;
						pouch.post(dval).then(function (info) {
							//console.log('design doc saved',info);
							dfr.resolve();
						}).catch(function (err) {
						   console.log('design doc err',err);
						   dfr.resolve();
						});
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
			return dfr;
		},
		destroyDB : function (db,options) {
			return;
			var dfr=$.Deferred();
			// SWITCH ON URL PARAMETER ?reset=yes
			if ($.trim(location.search.split('reset=')[1])!='yes') {
				dfr.resolve();
			} else {
				console.log('RESET'); //?',$.trim(location.search.split('reset=')[1]).length,location.search,location.search.split('reset=')[1]);
				var pouch=pouchUILib.model.getDB(db,options);
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
	