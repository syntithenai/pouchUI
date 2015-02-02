var designDoc = {};
var validateMe=function(newDoc, oldDoc, userCtx, secObj) {
	if (newDoc._deleted!=true) {
		if (!newDoc.type || newDoc.type.length <=0)  {
			throw {"forbidden": "Type must have a value"};
		}
		if (!newDoc.name || newDoc.name.length <=0)  {
			throw {"forbidden": "Name must have a value"};
		}
	}
}
designDoc[0]={};
designDoc[0]['http://stever:wtfaid72@localhost:5984/files'] =  {
  _id: '_design/files',
  validate_doc_update : validateMe.toString(),
  views: {
	'all' : {
		map: function(doc) {
			emit(doc._id);
		}.toString()
	},
	'byname' : {
		map: function(doc) {
			emit(doc.name);
		}.toString()
	},
  }
}
