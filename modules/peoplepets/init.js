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
designDoc[0]['http://stever:wtfaid72@localhost:5984/people'] =  {
		  _id: '_design/pets',
		  validate_doc_update : validateMe.toString(),
		  views: {
			'all' : {
				map: function(doc) {
					if (doc.type=='pet' && doc.owner) emit(doc._id);
				}.toString()
			},
  
		  }
}
designDoc[1]={};
designDoc[1]['http://stever:wtfaid72@localhost:5984/people'] =  {
		  _id: '_design/people',
		  validate_doc_update : validateMe.toString(),
		  views: {
			'all': {
			  map: function(doc) {
				emit(doc._id);
			  }.toString()
			},
			'byowner': {
			  map: function(doc) {
				// view collation - multiple rows emitted for single 'person' record
				if (doc.type=='pet' && doc.owner) emit([doc.owner,'a_pet']);
				else if (doc.type=='person') emit([doc._id,'b_person']);
			  }.toString()
			},
			'byage': {
			  map: function(doc) {
				emit(doc.age);
			  }.toString()
			},
			'byname' : {
				map: function(doc) {
					emit(doc.name);
				}.toString()
			},
			'petsbyowner' : {
				map: function(doc) {
					if (doc.type=='pet' && doc.owner) emit(doc.owner);
				}.toString()
			},
			'pets' : {
				map: function(doc) {
					if (doc.type=='pet' && doc.owner) emit(doc._id);
				}.toString()
			},
			'persons' : {
				map: function(doc) {
					if (doc.type=='person') emit(doc._id);
				}.toString()
			},
			'foods' : {
				map: function(doc) {
					if (doc.type=='food') emit(doc._id);
				}.toString()
			},
			'ingredients' : {
				map: function(doc) {
					if (doc.type=='ingredient') emit(doc._id);
				}.toString()
			}
		  }
		};
