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
designDoc[0]['http://stever:wtfaid72@localhost:5984/chess'] =  {
		  _id: '_design/games',
		  validate_doc_update : validateMe.toString(),
		  views: {
			'all' : {
				map: function(doc) {
					if (doc.type=='game') emit(doc.name);
				}.toString()
			},
  
		  }
}
designDoc[1]={};
designDoc[1]['http://stever:wtfaid72@localhost:5984/chess'] =  {
		  _id: '_design/openings',
		  validate_doc_update : validateMe.toString(),
		  views: {
			'all' : {
				map: function(doc) {
					if (doc.type=='chessopening') emit(doc.name);
				}.toString()
			},'bypgn' : {
				map: function(doc) {
					if (doc.type=='chessopening') {
						var dp=doc.pgn;
						if (typeof dp==="string" ) {
							dp=dp.trim();
							dp=dp.replace('.','. ');
						}
						emit(dp);
					}
				}.toString()
			}
		  }
}
