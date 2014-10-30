/* GLOBAL FUNCTION CALLED BY GOOGLE SCRIPT 
 - PLACES GOOGLE JSON RESULTS IN GLOBAL VARIABLE googleSheetResult
 */
var pouchUI_googleSheetResult;
function pouchUI_captureGoogleSheet(val) {
	var records=[];
	$.each(val.feed.entry,function(key,sheetRow) {
		var record={};
		var recordText=sheetRow.content.$t;
		var recordTextParts=recordText.split(',');
		$.each(recordTextParts,function(rtk,rtv) {
			var recordFieldParts=rtv.split(":");
			record[$.trim(recordFieldParts[0])]=$.trim(recordFieldParts[1]);
			record['_id']=$.trim(sheetRow.title.$t);
		});
		records.push(record);
	});	
	pouchUI_googleSheetResult=records;
	//console.log('captured google sheet',records);
}
