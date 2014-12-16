var designDoc = {};
var validateMe=function(newDoc, oldDoc, userCtx, secObj) {
	if (newDoc._deleted!=true) {
		if (!newDoc.type || newDoc.type.length <=0)  {
			throw {"forbidden": "Type must have a value"};
		}
		
	}
}
designDoc[0]={};
designDoc[0]['http://stever:wtfaid72@localhost:5984/textedit'] =  {
	  _id: '_design/texteditdocument',
	  validate_doc_update : validateMe.toString(),
	  views: {
		'all' : {
			map: function(doc) {
				if (doc.type=='texteditdocument') emit(doc._id);
			}.toString()
		},
		'byname' : {
			map: function(doc) {
				if (doc.type=='texteditdocument') emit(doc.name);
			}.toString()
		},
	  }
}
designDoc[1]={};
designDoc[1]['http://stever:wtfaid72@localhost:5984/textedit'] =  {
	  _id: '_design/texteditdocumentfragment',
	  validate_doc_update : validateMe.toString(),
	  views: {
		'all' : {
			map: function(doc) {
				if (doc.type=='texteditdocumentfragment') emit(doc._id);
			}.toString()
		},
		'bydocument' : {
			map: function(doc) {
				if (doc.type=='texteditdocumentfragment' && doc.documentid) emit(doc.documentid);
				//else if (doc.type=='svg') emit([doc._id,'svg']);
			}.toString()
		},
	  }
}
