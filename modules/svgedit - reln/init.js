var designDoc = {};
var validateMe=function(newDoc, oldDoc, userCtx, secObj) {
	if (newDoc._deleted!=true) {
		if (!newDoc.type || newDoc.type.length <=0)  {
			throw {"forbidden": "Type must have a value"};
		}
		if (!newDoc.name || newDoc.name.length <=0)  {
			throw {"forbidden": "Name must have a value"};
		}
		if (true ) {} //dd
	}
}
designDoc[0]={};
designDoc[0]['http://stever:wtfaid72@localhost:5984/svg'] =  {
	  _id: '_design/svg',
	  validate_doc_update : validateMe.toString(),
	  views: {
		'all' : {
			map: function(doc) {
				if (doc.type=='svg') emit(doc._id);
			}.toString()
		},
		'byname' : {
			map: function(doc) {
				if (doc.type=='svg') emit(doc.name);
			}.toString()
		},
	  }
}
designDoc[1]={};
designDoc[1]['http://stever:wtfaid72@localhost:5984/svg'] =  {
	  _id: '_design/svgelements',
	  validate_doc_update : validateMe.toString(),
	  views: {
		'all' : {
			map: function(doc) {
				if (doc.type=='svgelement') emit(doc._id);
			}.toString()
		},
		'bysvg' : {
			map: function(doc) {
				if (doc.type=='svgelement' && doc.svgid) emit(doc.svgid);
				//else if (doc.type=='svg') emit([doc._id,'svg']);
			}.toString()
		},
	  }
}
