pouchUILib.model = {
	getDB : function(db,options) {
		var dbOptions={};
		if (options && options['dbOptions'] && options['dbOptions'][db]) dbOptions=options['dbOptions'][db];
		//console.log('CONNECT DB',db,options['dbOptions'][db],options['dbOptions'],options,dbOptions);
		return new PouchDB(db,dbOptions);
	},
	isCouch : function(db) {
		var p=db.substr(0,7);
		if (p=='http://' || p=='https:/') {
			// have config but connect string not http://
			return true;
		} else {
			return false;
		}
	},
	// LATEST VERSION OF POUCH ONLY SUPPORTS PUTATTACHMENT UP TO 20M. OLDER VERSIONS COPED WITH UP TO 150M ??
	maxFileSize : function(options) {
		if (options.maxFileSize) return options.maxFileSize 
		else return 20*1024*1024;
	},
	// CALLED ON INIT AND ON CHANGES TO GET RECENT DATA AND CALL UPDATE LIST
	loadList : function(list,recurse,options) {
		var buttonDOM=pouchUILib.view.findSearchDOM(list);
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
		if ($(list).data('pouchSkip')>0) {
			skip=$(list).data('pouchSkip');
			//console.log('limit from attr',limit);
		}
		var d=$.extend({include_docs:true},options,$(list).data());
		//console.log('list data',$(list).data());
		if (d.keys) {
			//console.log("PREP KEYS",d.keys);
			d.keys=d.keys.split($(list).data('pouchMmseperator'));
			//console.log("PREPPED KEYS",d.keys);
		}
		
		if (limit>0) d.limit=parseInt(limit);
		if (skip>0) d.skip=parseInt(skip);
		if (d.pouchIndex=="people/persons")  console.log('now query local',d);
		// NOW LOAD RESULTS
		var pouch=pouchUILib.model.getDB(d.pouchDb,options);
		if (d.pouchIndex) {
			console.log('now query local',d.pouchIndex,d.key);
			//if (recurse>0) console.log('DBDBDB now queryindex',recurse,d.pouchIndex);
			pouch.query(d.pouchIndex,d).then(function(res) {
				if (d.pouchIndex=="people/persons") console.log('DBDBDB query res',d.pouchIndex,res)
				//console.log('RESULTS query',res,list);	
				dfr.resolve(res);
			}).catch(function(err) {
				console.log('Query index err',err);
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
