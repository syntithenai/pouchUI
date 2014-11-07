$.fn.pouchUI.api.model = {
	// CONNECT TO POUCH AND RETURN DATABASE HANDLE
	getDB : function(db) {
		var plugin=this;
		var dbOptions={};
		if (plugin.settings && plugin.settings['dbOptions'] && plugin.settings['dbOptions'][db]) dbOptions=plugin.settings['dbOptions'][db];
		//console.log('CONNECT DB',db,options['dbOptions'][db],options['dbOptions'],options,dbOptions);
		return new PouchDB(db,dbOptions);
	},
	// CHECK IF DATABASE IS LOCAL POUCH OR ONLINE COUCH
	isCouch : function(db) {
		var plugin=this;
		var p=db.substr(0,7);
		if (p=='http://' || p=='https:/') {
			// have config but connect string not http://
			return true;
		} else {
			return false;
		}
	},
	// RETURN THE MAX FILE SIZE SUPPORTED BY POUCH FOR FILE UPLOADS
	// LATEST VERSION OF POUCH ONLY SUPPORTS PUTATTACHMENT UP TO 20M. OLDER VERSIONS COPED WITH UP TO 150M ??
	maxFileSize : function() {
		var plugin=this;
		if (plugin.settings.maxFileSize) return plugin.settings.maxFileSize 
		else return 20*1024*1024;
	},
	// LOAD RECORDS BASED ON LIST META DATA
	// @ return deferred 
	// @ resolve list results
	// uses list data - pouchDb, pouchIndex, pouchLimit, pouchSkip, pouchMmseperator 
	loadList : function(list,recurse) {
		var plugin=this;
		var buttonDOM=plugin.api.view.findSearchDOM(list);
		//console.log('LOAD LIST',$(list).data(),buttonDOM.html())
		//$(list).html('<b>eek</b>')
		var dfr=$.Deferred();
		var limit=0;
		var skip=0;
		var attachments=false;
		// PAGINATION
		// override from dom selector
		if ($('.pouch-limit',buttonDOM).length>0 && $('.pouch-limit',buttonDOM).val()>0) {
			limit=$('.pouch-limit',buttonDOM).val();
			$(list).data('pouchLimit',parseInt(limit))
			console.log('limit from DOM value',limit);
		// otherwise use the value stored in the list
		} else if ($(list).data('pouchLimit')>0) {
			limit=$(list).data('pouchLimit');
			//console.log('limit from attr',limit);
		}
		if ($(list).attr('data-pouch-skip')>0) {
			skip=$(list).attr('data-pouch-skip');
			console.log('limit from attr',limit);
		}
		var d=$.extend({include_docs:true},plugin.settings,$(list).data());
		//console.log('list data',$(list).data());
		if (d.keys) {
			//console.log("PREP KEYS",d.keys);
			d.keys=d.keys.split($(list).data('pouchMmseperator'));
			//console.log("PREPPED KEYS",d.keys);
		}
		
		if (limit>0) d.limit=parseInt(limit);
		if (skip>0) d.skip=parseInt(skip);
		//if (d.pouchIndex=="people/persons")  
		console.log('now query local',d);
		// NOW LOAD RESULTS
		var pouch=plugin.api.model.getDB(d.pouchDb);
		if (d.pouchIndex) {
			console.log('now query local',d.pouchIndex,d);
			//if (d.descending) d.skip=0;
			if (d.descending) {
				var backup=d.endkey;
				if (d.startkey) d.endkey=d.startkey;
				if (backup) d.startkey=backup;
			}
			//if (recurse>0) console.log('DBDBDB now queryindex',recurse,d.pouchIndex);
			pouch.query(d.pouchIndex,d).then(function(res) {
				// reverse array again so keys count forward
				if (d.descending && res.rows) {
					console.log('REVERSE');
					res.rows=res.rows.reverse();
					$(list).data('descending',false);
				}
				//if (d.pouchIndex=="people/persons") console.log('DBDBDB query res',d.pouchIndex,res)
				//console.log('RESULTS query',res,list);	
				dfr.resolve(res);
			}).catch(function(err) {
				console.log('Query index err',err);
				dfr.reject();
			});
		} else {
			//console.log('now alldocs');
			pouch.allDocs(d).then(function(res) {
				//console.log('RESULTS alldocs',res,list);	
				dfr.resolve(res);
			});
		}
		return dfr;
	}
}
