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
	/**********************************************
	 * Determine the full path of an element
	 * @param raw DOM element to find path for
	 * @return a string containing the path as a CSS selector
	 **********************************************/
	function getDomPath(el,slice) {
	  var stack = [];
	  while ( el.parentNode != null ) {
		//console.log(el.nodeName);
		var sibCount = 0;
		var sibIndex = 0;
		for ( var i = 0; i < el.parentNode.childNodes.length; i++ ) {
		  var sib = el.parentNode.childNodes[i];
		  if ( sib.nodeName == el.nodeName ) {
			if ( sib === el ) {
			  sibIndex = sibCount;
			}
			sibCount++;
		  }
		}
		if ( el.hasAttribute('id') && el.id != '' ) {
		  stack.unshift(el.nodeName.toLowerCase() + '#' + el.id);
		} else if ( sibCount > 1 ) {
		  stack.unshift(el.nodeName.toLowerCase() + ':eq(' + sibIndex + ')');
		} else {
		  stack.unshift(el.nodeName.toLowerCase());
		}
		el = el.parentNode;
	  }
	  var finalVal='';
	if (slice && slice >0) {
		//console.log('SLICE',slice,stack.slice(slice));
		finalVal=stack.slice(slice).join(' > ');
	} else {
		finalVal=stack.join(' > ');
	}
	return finalVal;
	}

/* 
 CONVERT FILENAME TO MIME TYPE
 */
var MimeConverter={};
MimeConverter.extensionMapping={
'epub':'application/epub+zip',
'jar':'application/java-archive',
'json':'application/json',
'doc dot':'application/msword',
'ai eps ps':'application/postscript',
'rdf':'application/rdf+xml',
'rtf':'application/rtf',
'kml':'application/vnd.google-earth.kml+xml',
'kmz':'application/vnd.google-earth.kmz',
'xls xlm xla xlc xlt xlw':'application/vnd.ms-excel',
'ppt pps pot':'application/vnd.ms-powerpoint',
'pptx':'application/vnd.openxmlformats-officedocument.presentationml.presentation',
'sldx':'application/vnd.openxmlformats-officedocument.presentationml.slide',
'ppsx':'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
'potx':'application/vnd.openxmlformats-officedocument.presentationml.template',
'xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
'xltx':'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
'docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
'dotx':'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
'dmg':'application/x-apple-diskimage',
'torrent':'application/x-bittorrent',
'bz':'application/x-bzip',
'bz2 boz':'application/x-bzip2',
'tar':'application/x-tar',
'xml xsl':'application/xml',
'dtd':'application/xml-dtd',
'zip':'application/zip',
'tgz .gz':'application/gzip',
'au snd':'audio/basic',
'mid midi kar rmi':'audio/midi',
'mp4a':'audio/mp4',
'mpga mp2 mp2a mp3 m2a m3a':'audio/mpeg',
'oga ogg spx':'audio/ogg',
's3m':'audio/s3m',
'sil':'audio/silk',
'aac':'audio/x-aac',
'aif aiff aifc':'audio/x-aiff',
'flac':'audio/x-flac',
'mka':'audio/x-matroska',
'm3u':'audio/x-mpegurl',
'wax':'audio/x-ms-wax',
'wma':'audio/x-ms-wma',
'wav':'audio/x-wav',
'bmp':'image/bmp',
'gif':'image/gif',
'jpeg jpg jpe':'image/jpeg',
'png':'image/png',
'svg svgz':'image/svg+xml',
'tiff tif':'image/tiff',
'psd':'image/vnd.adobe.photoshop',
'ics ifb':'text/calendar',
'css':'text/css',
'sheet':'text/sheet',
'csv':'text/csv',
'html htm':'text/html',
'txt text':'text/plain',
'sql':'text/x-sql',
'js':'text/javascript',
'vcard':'text/vcard',
'mp4 mp4v mpg4':'video/mp4',
'mpeg mpg mpe m1v m2v':'video/mpeg',
'ogv':'video/ogg',
'qt mov':'video/quicktime',
'mxu m4u':'video/vnd.mpegurl',
'webm':'video/webm',
'f4v':'video/x-f4v',
'fli':'video/x-fli',
'flv':'video/x-flv',
'm4v':'video/x-m4v',
'mkv mk3d mks':'video/x-matroska',
'vob':'video/x-ms-vob',
'wm':'video/x-ms-wm',
'wmv':'video/x-ms-wmv',
'wmx':'video/x-ms-wmx',
'wvx':'video/x-ms-wvx',
'avi':'video/x-msvideo',
'pdf':'application/pdf',
};
MimeConverter.lookupMime = function(fileName) {
	var ret='';
	if (fileName) {
		var lookup={};
		$.each(MimeConverter.extensionMapping,function(fileExtensions,mimeType) {
			var parts=fileExtensions.split(' ');
			$.each(parts,function(k,fileExtension) {
				lookup[fileExtension]=mimeType;
			});
		});
		var fileParts=fileName.split(".");
		var extension=fileParts[fileParts.length-1];
		if (lookup[extension] && lookup[extension].length>0) {
			ret=lookup[extension];
		} else {
			// treat as binary
			ret='application/unknown';
		}
		//console.log('LOOKUP MIME',fileName,ret);
	}
	return ret;
}


/*********************************************************
 * jQuery plugin to render pouch query results into a DOM template
 * DOM elements provided to plugin are searched for .pouch-list elements which are initialised
 * All elements that are to be used as lists and as link targets must be initialised before use
 * attributes of the pouch-list define the query
 *		 data-pouch-db='testdb' - primary database source
 *		 data-pouch-index='people/byage' - index to query
 * 		 data-pouch-startkey=''  data-pouch-endkey='' - criteria
 *		 data-pouch-dbSource='https://syntithenai.iriscouch.com/people' - sync data from this source
 for rendering
 *		class='pouch-list'||class='pouch-list-item'||class='pouch-list-value' - identify list subtemplates 
 
 * 
 
 *********************************************************/
$.fn.pouchUI = function(options) {	
	function valueFromObjectPath(obj,path,def) {
		var v=valueFromObjectPath2(obj,path,def);
		//console.log('VFOPret',v);
		return v;
	}
	function valueFromObjectPath2(obj, path, def){
		//console.log('VFOP',obj,path,def);
		for(var i = 0,path = path.split('.'),len = path.length; i < len; i++){
			if(!obj || typeof obj !== 'object') return def;
			obj = obj[path[i]];
		}
		if(obj === undefined) return def;
		return obj;
	}
	function getDB(db) {
		var dbOptions={};
		if (options && options['dbOptions'] && options['dbOptions'][db]) dbOptions=options['dbOptions'][db];
		//console.log('CONNECT DB',db,options['dbOptions'][db],options['dbOptions'],options,dbOptions);
		return new PouchDB(db,dbOptions);
	}
	function isCouch(db) {
		var p=db.substr(0,7);
		if (p=='http://' || p=='https:/') {
			// have config but connect string not http://
			return true;
		} else {
			return false;
		}
	}
	
	function maxFileSize() {
		if (options.maxFileSize) return options.maxFileSize 
		else return 20*1024*1024;
	}
	
	function startWaiting() {
		if ($('#loading').length==0) $('body').prepend('<div id="loading"><img src="loading.gif" /></div>');
		$('#loading').show();
	}
	
	function stopWaiting() {
		$('#loading').hide();
	}
	
	/**************************************************************
	 * START INIT FUNCTIONS
	 **************************************************************/
	function bindEventsTo(el) {
		el.bind('click.pouch',onPouchClick);
		var timer;
		$(el).bind('keyup',function(e) {
			 if (timer) {
				window.clearTimeout(timer);
			}
			timer = window.setTimeout( function() {
				timer = null;
				onPouchInputChange(e);
			}, 500 );
			
		})
		$(el).bind('change',function(e) {
			 if (timer) {
				window.clearTimeout(timer);
			}
			timer = window.setTimeout( function() {
				timer = null;
				onPouchInputChange(e);
			}, 500 );
			
		})
	}
	
	/* INIT EVENTS, SYNC and PRELOAD SHEET DATA IF AVAILABLE*/
	function initialiseList(list) {
		list.hide();
		var dfr=$.Deferred();
		var d=$.extend({include_docs:true},options,list.data());
		var pouch=getDB(d.pouchDb);
		//console.log('initialise conf',d);
		// BIND LIST EVENTS
		bindEventsTo(list);
		function startSync() {
			//$('input,select,textarea',list).bind('change.pouch',onPouchInputChange);
			// REMOTE SYNC ? - no need to wait because listening on local changes
			if (d.pouchDb && d.pouchDbsource) {
				console.log('START REMOTE SYNC DBSOURCE',d);
				// SILENT REMOTE SYNC
				pouch.sync(d.pouchDbsource,{live:true})
				.on('change', function (info) {
					console.log('sync change',info)
					//updateList(list,options);
				})
				.on('complete', function (info) {
					console.log('sync complete',info);
						//updateList(list,options);
				}); 
			}	
		}
		// SHEET SOURCE ?
		if (d.pouchSheetsource) {
			//console.log("updatING from sheet");
			importGoogleSheet(d.pouchDb,d.pouchSheetsource).then(function() {
				//console.log('updated from sheet now refresh list');
				startSync();
				dfr.resolve();
			});
		} else {
			startSync();
			dfr.resolve();
		}
		return dfr;
	}
	
	function importGoogleSheet(db,url) {
		var adfr=$.Deferred();
		var a=url+'?alt=json-in-script&callback=pouchUI_captureGoogleSheet';
		console.log('IGS',a);
		$.getScript(a,function(res) {
			//console.log('ajaxcomplete',res,this);
			//console.log('ajaxcomplete DATA',pouchUI_googleSheetResult);
			var records=[];
			// FOR EACH SHEET ROW REPRESENTING A RECORDS
			var dfrs=[];
			var pouch=getDB(db);
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
					// NO SAVE IF RECORD ALREADY EXISTS
					//console.log('loaded');
					//var rev=current._rev;
					// override with google latest values
					//$.extend(current,sheetRow);
					//console.log('got design doc',current);
					// but keep the revision
					//current._rev=rev;
					// save import row
					//pouch.validatingPost(current).then(function (info) {
						//console.log('google sheet row saved');
					//	dfr.resolve();
					//}).catch(function (err) {
					  //console.log('failed to save google sheet row',err);
					//  dfr.resolve();
					//});
					dfr.resolve();
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
			//pouchUI_googleSheetResult=null;				
			});
		});
		
		return adfr;
	}
	
	
	function initialiseDesignDocuments(designDoc) {
		var dfr=$.Deferred();
		console.log('got design ',designDoc);
		// load existing design doc and update it
		var promises=[];
		// first delete databases if reset flag
		$.each(designDoc,function(dkey,dval) {
			promises.push(destroyDB(dkey));
		});
		console.log('dbs destroyed');
		$.when.apply($,promises).then(function() {
			//console.log('dbs destroyed forreal');
			//console.log('DD',designDoc);
			$.each(designDoc,function(dkey,dval) {
				//console.log('now create designs ',dkey,dval);
				var pouch=getDB(dkey);
				console.log('now pouched',dval._id,pouch);
				pouch.get(dval._id).then(function(current) {
					console.log('got design doc',current);
					dval._rev=current._rev;
					pouch.post(dval).then(function (info) {
						console.log('design doc saved',info);
						dfr.resolve();
					}).catch(function (err) {
					   console.log('design doc err',err);
					   dfr.resolve();
					});
				// failing that create a new one
				}).catch(function(err) {
					//console.log('create new');
					pouch.post(dval).then(function (info) {
						console.log('design doc created info',info);
						dfr.resolve();
					});
				});
			});
			
		});
		return dfr;
	}
	function destroyDB(db) {
		return;
		var dfr=$.Deferred();
		// SWITCH ON URL PARAMETER ?reset=yes
		if ($.trim(location.search.split('reset=')[1])!='yes') {
			dfr.resolve();
		} else {
			console.log('RESET'); //?',$.trim(location.search.split('reset=')[1]).length,location.search,location.search.split('reset=')[1]);
			var pouch=getDB(db);
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
	
	
	/**************************************************************
	 * END INIT FUNCTIONS
	 **************************************************************/
	
	
	/**************************************************************
	 * START EVENT ACTIONS
	 **************************************************************/
	
	function actionFileSelected(e) {
		var cloneFile=$($(e.target)[0].outerHTML);
		//console.log(e.target,cloneFile);
		$(e.target).after(cloneFile);
		$(e.target).hide();
		$(e.target).addClass('pending');
		// TODO RESTORE CODE THAT WAS HERE BUT DON'T PUT FILE CONTENT IN HREF AND LEAVE/HIDE FILE INPUT
		// PLUS HOOKS TO REMOVE FILE INPUT IF PENDING LIST ITEM IS REMOVED
		var attachmentsDOM=$(e.target).siblings('.attachments');
		if (attachmentsDOM.length==0) {
			var lastInput=$(e.target);
			if (lastInput.siblings('input[type="file"]').length>0) lastInput=lastInput.siblings('input[type="file"]').last();
			attachmentsDOM=$('<div class="attachments"></div>');
			//lastInput.after(attachmentsDOM);
		}
		var folder='';
		if ($(e.target).parents('.pouch-list-input').data('pouchFolder') && $(e.target).parents('.pouch-list-input').data('pouchFolder').length>0) folder=$(e.target).parents('.pouch-list-input').data('pouchFolder');
		if (folder.substr(folder.length-1)=='/') folder=folder.substr(0,folder.length-1);
		if (folder.length>0) folder=folder+"/"; 			
		//console.log('input change',e.target,attachmentsDOM);
		// DND
		//if (e && e.dataTransfer && e.dataTransfer.files) {
		//	entries = e.dataTransfer.files;
		// FILESELECTION
		//} else 
		var entries=[];
		if (e && e.target && e.target.files) {
			entries = e.target.files;
		}
		var targetList=$(e.target).parents('.pouch-list').first();
		var db=targetList.data('pouchDb');		
		//console.log('Entries',entries); 
		$.each(entries,function(key,file) {
			//!isCouch(db) &&   - LATEST VERSION OF POUCH CRASHES MEMORY FOR SAVING ATTACHMENTS GREATER THAN 26M. OLDER VERSIONS WERE TESTED FINE UP TO 1G
			if (file.size > maxFileSize()) {
				console.log('Ignoring file '+file.name+' because it is too large.');
				alert('File '+file.name+' is too large');
			} else {
				var parts;
				if (file.webkitRelativePath) parts=file.webkitRelativePath.split("/");
				else parts=[];
				//console.log('PATH PARTS',parts);
				if (parts[parts.length-1] !='.' ) {
					//console.log('PATH PARTS P',parts);
					var path=parts.slice(0,parts.length-1).join("/");
					if (path.length>0) path=path+'/';
					var fileDOM=$('<div class="file pending"><span class="ui-button" data-pouch-action="deletefile" >X</span><a target="_new" >'+path+file.name+'</a></div>');
					console.log(file)
					fileDOM.attr('data-docid',folder+path+file.name);
					fileDOM.attr('data-mime',file.type);
					// remove files of same name
					$('.file[data-docid="'+folder+path+file.name+'"]',attachmentsDOM).remove();
					attachmentsDOM.prepend(fileDOM);
					var targetItem=$(e.target).parents('.pouch-list-item').first();
					if (targetList.length>0 && targetList.attr('data-pouch-autosave')=='true') {
						actionSave(targetList,targetItem);			
					}
				}
			}
		});
		
		
	}
	
	function actionReloadList(iList) {
		loadList(iList).then(function(res2) {
			if (res2 && res2.rows && res2.rows.length>0)  {
				renderList(res2,iList).then(function (items) {
					var firstItem=$('.pouch-list-item',iList).first();
					// start with list items that are immediate children
					var allItems=$(iList).children('.pouch-list-item');
					// for all children, look at their immediate children for list items
					var secondLevel=$(iList).children();
					$.each(secondLevel,function(sk,sv) {
						allItems=allItems.add($(sv).children('.pouch-list-item'));
					});
					 //.add(secondChildren);
					console.log('reloadlist',allItems);
					
					if ($(iList).data('pouchWrapstart')) firstItem.before($(iList).data('pouchWrapstart'));
					var count=0;
					$.each(items,function(rlk,rlv) {
						if (count>0) firstItem.before($(iList).data('pouchSeperator'));
						firstItem.before(rlv);
						count++;
					});
					if ($(iList).data('pouchWrapend')) firstItem.before($(iList).data('pouchWrapend'));
					allItems.remove();
					$('.pouch-list-noresults',iList).remove();
				});
			} else {
				showNoResults(iList);
			}
		});	
	}
	
	/*
	SEARCH can be triggered by search button or change event in search form
	search can take effect on a number of pouch-lists the identity of which are determined by
	- data-search-target attribute set on the trigger element
	- data-search-target attribute set on a sibling search button of the trigger element
	- data-search-target attribute set on the search form

	*/
	function actionSearch(triggerElement) {
		var dfr=$.Deferred();
		//console.log('search ',triggerElement);
		var criteriaDOM;
		var start,end;
		var searchForm;
		var triggerSearchButton;
		if (triggerElement.hasClass('pouch-search')) {
			searchForm=triggerElement;
			triggerSearchButton=triggerElement.find('[data-pouch-action="search"]').first();
		} else {
			searchForm=triggerElement.parents('.pouch-search').first();
			triggerSearchButton=triggerElement.siblings('[data-pouch-action="search"]').first();
		}
					
		// FIND CRITERIA
		if (searchForm.length>0) {
			criteriaDOM=$('input,select',searchForm);
			//console.log('critdom',criteriaDOM);
			//$.each(criteriaDOM,function(splk,splv) {
			// TODO UPDATE FOR MANY DIMENSIONAL KEYS
				if ($(criteriaDOM[0]).val() && $(criteriaDOM[0]).val().length>0) {
					start=$(criteriaDOM[0]).val() 	;
					//$(splv).data('pouchEndkey',start);
				}	
				if (criteriaDOM.length>1) { 
					if ($(criteriaDOM[1]).val() && $(criteriaDOM[1]).val().length>0) {
						end=$(criteriaDOM[0]).val()+'\uffff';
					}
				// SINGLE SEARCH INPUT IS USED AS START AND END VALUE
				} else {
					end=start+'\uffff';
				}
		} else {
			console.log('CANNOT FIND SEARCH FORM');
		}
		//console.log('criteria',start,end);
		
		// FIND TARGETS
		var targetLists={};
		// TARGET ON TRIGGER
		if (triggerElement.data('searchTarget') && triggerElement.data('searchTarget').length>0 && $('.pouch-list',$(triggerElement.data('searchTarget'))).length>0) {
			targetLists=$('.pouch-list',$(triggerElement.data('searchTarget')));
			//console.log('FOUND TARGET LISTS from trigger',targetLists);
		// TARGET ON SIBLING SEARCH BUTTON
		} else if (triggerSearchButton.length>0 && triggerSearchButton.data('searchTarget') && triggerSearchButton.data('searchTarget').length>0 && $('.pouch-list',$(triggerSearchButton.data('searchTarget'))).length>0) {
			targetLists=$('.pouch-list',$(triggerSearchButton.data('searchTarget')));
			//console.log('FOUND TARGET LISTS from search button',targetLists);
		// TARGET ON SEARCH FORM
		} else if (searchForm.length>0 && searchForm.data('searchTarget') && searchForm.data('searchTarget').length>0 && $('.pouch-list',$(searchForm.data('searchTarget'))).length>0) {
			targetLists=$('.pouch-list',$(searchForm.data('searchTarget')));
			//console.log('FOUND TARGET LISTS from sesarch form',targetLists);
		// CONTAINING LIST
		} else if (searchForm.parents('.pouch-list').length>0) {
			targetLists=searchForm.parents('.pouch-list');
			//console.log('FOUND TARGET LISTS as parent of search form',targetLists);
		} else {
			console.log('FAILED TO FIND SEARCH TARGET LIST',triggerElement);
		}
		if (targetLists.length>0) {
			$.each(targetLists,function(splk,splv) {
				// set params
				$(splv).data('startkey',start);
				$(splv).data('endkey',end);
				//console.log('set search criteria in selected lists',$(splv).data());
				// do search
				actionReloadList($(splv));
			});
		} 
		return dfr;
	}

	
	// render
	function actionRenderSingle(id,targetLists) {
		var dfr=$.Deferred();
		//console.log('rendersingle',id,targetLists);
		$.each(targetLists,function(tk,tv) {
			if ($(tv).hasClass('pouch-list')) {
				var d=$.extend({include_docs:true},options,$(tv).data())
				$(tv).data('key',id);
				loadList(tv).then(function(results) {
					renderList(results,tv,$(tv));
				});
				dfr.resolve();
			} else {
				//console.log('look for child lists',tv	);
				$('.pouch-list',tv).each(function(tvk,tvv) {
					//console.log('look for child lists FOUND tvv');
					var d=$.extend({include_docs:true},options,$(tvv).data())
					$(tvv).data('key',id);
					//console.log('look for child lists set key',id,d);
					actionReloadList($(tvv));
					dfr.resolve();
				});
			}
		});
		return dfr;
	}
	function actionDelete(db,id,listItem,target,e) {
		if (confirm('Really Delete?')) {
			startWaiting();
			var pouch=getDB(db);
			pouch.get(id,function(err,res) {
				//console.log('get',res);
				if (err) {
					console.log('ERR DELETE get',err);
					stopWaiting();
				} else {
					try {
						// TODO - RESTORE VALIDATION ON REMOVE - pouch.validatingRemove - removed because
						// TypeError: Cannot assign to read only property '_deleted' of joe {stack: "TypeError: Cannot assign to read only property '_d…   at http://localhost/pouchUI/pouchdb.js:7936:21", message: "Cannot assign to read only property '_deleted' of joe"}
						pouch.remove(res._id,res._rev).then(function(err,dres) {
							//console.log('DEL OK',err,dres);
							stopWaiting();
						}).catch(function(err) {
							console.log('ERR DELETE',err);
							stopWaiting();
							//$('.validationerror',listItem).remove();
							//var errMsg=$('<div class="validationerror" >'+err.message+'</div>');
							//$('input,select,textarea',listItem).first().before(errMsg);
						});
					} catch (e) {
						console.log('ERR DELETE exc',e);
						stopWaiting();
					}
				}
			});
		}
	}
	
	
	function actionSave(list,currentListItem,closeAfter) {
		//console.log('save ',currentListItem);
		var d=$.extend({include_docs:true},options,$(list).data());
		var pouch=getDB(d.pouchDb);
		var changed=false;
		var finalDoc={};
		
		function doSaveAttachments(finalDoc,attachments,currentListItem,closeAfter) {
			var first={}
			var theRest={};
			var count=0;
			$.each(attachments,function(ak,av) {
				if (count==0) first=ak;
				else theRest[ak]=av;
				count++;
			});
			if (count>0)  {
				if (attachments[first]) {
					//console.log('do save att',first);
					// find file for saving, file inputs are appended so the last file found in the following iteration will be the last file selected (where multiple files of the same name are selected before save)
					var theFile;
					$.each($('.pouch-list-input',currentListItem),function(ivk,ivv) {
						$.each($('input.pending[type="file"]',ivv),function(ik,iv) {
							var folder='';
							if ($(ivv).data('pouchFolder') && $(ivv).data('pouchFolder').length>0) folder=$(ivv).data('pouchFolder');			
							if ($(iv).data('pouchFolder') && $(iv).data('pouchFolder').length>0) folder=$(iv).data('pouchFolder');			
							// ensure single trailing slash
							if (folder.substr(folder.length-1)=='/') folder=folder.substr(0,folder.length-1);
							if (folder.length>0) folder=folder+"/"; 
							var entries=[];
							if (iv && iv.files) {
								entries = iv.files;
							}
							//console.log('Entries',entries); 
							$.each(entries,function(key,file) {
								var parts;
								if (file.webkitRelativePath) parts=file.webkitRelativePath.split("/");
								else parts=[];
								//console.log('PATH PARTS',parts);
								var path='';
								if (parts[parts.length-1] !='.' ) {
									//console.log('PATH PARTS P',parts);
									var path=parts.slice(0,parts.length-1).join("/");
									if (path.length>0) path=path+'/';
									var docId=folder+path+file.name;
									if (docId==first) {
										var mime=file.type;
										var b=new Blob([file],{type : mime});
										theFile={id:docId,mime:mime,data:b};
									}
								}
							});
						});
					});
					if (theFile) {
						//console.log('found file',theFile);
						pouch.putAttachment(finalDoc._id, theFile.id, finalDoc._rev, theFile.data, theFile.mime).then(function(res) {
							finalDoc._rev=res.rev;
							doSaveAttachments(finalDoc,theRest,closeAfter);
						}).catch(function(err) {
							console.log('ERROR SAVING ATTACHMENT',err);
							doSaveAttachments(finalDoc,theRest,currentListItem,closeAfter);
						});
					}
					
				} else {
					//console.log('do del att',first);
					pouch.removeAttachment(finalDoc._id,first,finalDoc._rev).then(function(res) {
						finalDoc._rev=res.rev;
						doSaveAttachments(finalDoc,theRest,currentListItem,closeAfter);
					}).catch(function(err) {
						console.log('ERROR REMOVING ATTACHMENT',err);
						// keep going with other attachments on fail
						doSaveAttachments(finalDoc,theRest,currentListItem,closeAfter);
					})
				}
			} else {
				//console.log('FINISHED SAVING ATTACHMENTS');
				$('.file.pending',currentListItem).remove();
				if (closeAfter) {
					//console.log('REMOVE LIST ITEM AFTER SAVING ATTA');
					currentListItem.remove();
				}
			}
			
		}
		
		function collateAttachments(foundAttachments,updatedAttachments) {
			var attachments={};
			$.each(foundAttachments,function(ak,av) {
				if (!av) {
					attachments[ak]=false;
				} else if (updatedAttachments[ak]) {
					attachments[ak]=true;
				}
			});
			return attachments;
		}
		
		function doSave(changed,finalDoc,currentListItem,closeAfter,attachmentsChanged,foundAttachments,updatedAttachments) {
			//console.log('DO SAVE',changed,finalDoc,currentListItem,closeAfter,attachmentsChanged,foundAttachments,updatedAttachments);
			if (changed) {
				pouch.validatingPost(finalDoc).then(function(rs) {
					//console.log('DONE SAVE',rs);
					currentListItem.attr('data-pouch-id',rs.id);
					currentListItem.attr('data-pouch-rev',rs.rev);
					finalDoc._id=rs.id;
					finalDoc._rev=rs.rev;
					if (attachmentsChanged) {
						doSaveAttachments(finalDoc,collateAttachments(foundAttachments,updatedAttachments),currentListItem,closeAfter);
					} else {
						if (closeAfter) currentListItem.remove();
					}
					$('.validationerror',currentListItem).remove();
				}).catch(function(err) {
					$('.validationerror',currentListItem).remove();
					var errMsg=$('<div class="validationerror" >'+err.message+'</div>');
					$('.pouch-list-input',currentListItem).first().before(errMsg);
					console.log(err,$('.pouch-list-input',currentListItem).first());
				});
			} else {
				if (attachmentsChanged) {
					doSaveAttachments(finalDoc,collateAttachments(foundAttachments,updatedAttachments),currentListItem,closeAfter);
				} else {
					console.log('RECORD AND ATTACHMENTS UNCHANGED');
				}
			}
		}
		
		// UPDATE SAVE
		if (currentListItem.data('pouchId') && currentListItem.data('pouchId').length>0) {
			//console.log('have id',currentListItem.data('pouchId'));
			pouch.get(currentListItem.data('pouchId')).then(function(res) {
				//console.log('loaded to save',res);
				var foundAttachments={};
				var updatedAttachments={};
				if (res._attachments) {
					$.each(res._attachments,function (ak,av) {
						foundAttachments[ak]=false;
					});
				}
				finalDoc=res;
				//console.log('setup found atts');
				var validFolders={};
				var allFoldersValid=false;
				$.each($('.pouch-list-input',currentListItem),function(ivk,ivv) {
					if ($('input[type="file"]',ivv).length>0) {
						//console.log('FILE FIELD')
						// COLLATE ATTACHMENTS
						$.each($('.attachments .file',ivv),function(iv,ik) {
							var folder='';
							if ($(ivv).data('pouchFolder') && $(ivv).data('pouchFolder').length>0) folder=$(ivv).data('pouchFolder');			
							if ($(iv).data('pouchFolder') && $(iv).data('pouchFolder').length>0) folder=$(iv).data('pouchFolder');			
							// ensure single trailing slash
							if (folder.substr(folder.length-1)=='/') folder=folder.substr(0,folder.length-1);
							if (folder.length>0) folder=folder+"/"; 
							if (folder.length==0) {
								allFoldersValid=true;
							} else {
								validFolders[folder]=true;
							}
							//console.log(ik);
							if ($(ik).data('docid')) foundAttachments[$(ik).data('docid')]=true;
							if ($(ik).hasClass('pending')) updatedAttachments[$(ik).data('docid')]=true;
						});
						
						//console.log('foundatt',foundAttachments);
					} else {
						var fn=$(ivv).data('pouchField');
						var getDataFrom=$('select,input,textarea',ivv).first();
						$.each(getDataFrom,function (rik,riv) {
						//console.log('getdata from',riv);
							if (finalDoc[fn]!=$(riv).val()) {
								//console.log('change value');
								changed=true;
								finalDoc[fn]=$(riv).val();
							}
						});
					}
				});
				// collate found status and remove attachments not matching any of the validFolders
				var finalFoundAttachments={};
				//console.log('now review for folders',validFolders,allFoldersValid);
				$.each(foundAttachments,function(fk,fv) {
					//console.log('check att',fk);
					if (allFoldersValid) {
						//console.log('all folders valid');
						finalFoundAttachments[fk]=fv;
					} else {
						//console.log('check folders');
						var inValidFolder=false;
						$.each(validFolders,function(vfk,vfv) {
							//console.log('check',vfk,'against',fk);
							if (fk.indexOf(vfk)==0) {
								//console.log('in valid');
								inValidFolder=true;
							}
							//console.log('done check');
						});
						if (inValidFolder) finalFoundAttachments[fk]=fv;
					}
				});
				//console.log('attachmetns after filter by folder',finalFoundAttachments);
				var foundAllAttachments=true;
				$.each(finalFoundAttachments,function(fk,fv) {
					foundAllAttachments=foundAllAttachments && fv;
				});
				var attachmentsChanged=!(foundAllAttachments&&(updatedAttachments.length==0));
				//console.log('final doc',finalDoc);
				doSave(changed,finalDoc,currentListItem,closeAfter,attachmentsChanged,finalFoundAttachments,updatedAttachments);
			});
		// SAVE NEW
		} else {
			changed=true;
			var foundAttachments={};
			var updatedAttachments={};
			var attachmentsChanged=false;
			// ID from form data
			if (finalDoc['_id'] && finalDoc['_id'].length>0) {
				//console.log('id from post');
			// TODO - COMPLETE THESE CASES
			// ID from idFunction
			} else if (false)  {
				console.log('id fn');
			// let the database assign an id
			} else {
				console.log('id db');
			}
			// CAPTURE FIELDS
			$.each($('.pouch-list-input',currentListItem),function(ivk,ivv) {
				if ($('input[type="file"]',ivv).length>0) {
					$.each($('.attachments .file',ivv),function(iv,ik) {
						//console.log(ik);
						if ($(ik).data('docid')) {
							foundAttachments[$(ik).data('docid')]=true;
							updatedAttachments.push[$(ik).data('docid')]=true;
							attachmentsChanged=true;
						}
					});
				} else {
					var fn=$(ivv).data('pouchField');
					var getDataFrom=$('select,input,textarea',ivv).first();
					$.each(getDataFrom,function (rik,riv) {
						finalDoc[fn]=$(riv).val();
					});
				}
			});
			doSave(changed,finalDoc,currentListItem,closeAfter,attachmentsChanged,foundAttachments,updatedAttachments);
		}	
	}	

	function actionLoadAndClickLink(docId,attachmentId,button,db) {
		//console.log('load and click',docId,attachmentId,button,db);
		//return;
		if (docId && attachmentId && button && db) {
			var pouch=getDB(db);
			if (isCouch(db)) {
				var urlParts=[];
				urlParts.push(db);
				urlParts.push(docId);
				urlParts.push(encodeURI(attachmentId));
				button.attr('href',urlParts.join("/"));
				button[0].click();
			} else {				
				pouch.getAttachment(docId,attachmentId).then(function(ires) {
					var url=URL.createObjectURL(ires);
					button.attr('href',url);
					var attachmentParts=attachmentId.split("/");
					button.attr("download",attachmentParts[attachmentParts.length-1]);
					button[0].click();
					setTimeout(function(url) {
						URL.revokeObjectURL(url);
						console.log('revoke url');
					},5000);				
				}); 
			}
		} else {
			console.log('ASYNC LOAD IMAGE MISSING META DATAS',image,image.data());
		}
	}
	
	function onPouchClick(e) {
		//console.log('pouchclick',e,e.target);
		// chrome
		var theElement=e.target;
		// firefox
		//if (!theElement && e && e.originalEvent) theElement=e.originalEvent.originalTarget;
		// return false on failure of command to prevent link default action
		if (theElement) {
			var button=$(theElement);
			var cmd=button.data('pouchAction');
			var target=button.attr('href');
			var parentList=button.parents('.pouch-list').first();
			var parentListItem=button.parents('.pouch-list-item').first();
			var id=parentListItem.data('pouchId');
			var targetList=$(target);
			
			// target to update is 
			//	- the element identified by the href attribute of the button clicked that has class .pouch-list
			//  - OR any children of this element that has class .pouch-list
			//  - OR the parent .pouch-list containing the clicked button
			//if (!targetList.hasClass('.pouch-list')) {
			//	targetList=parentList;
			//}
			//console.log('click',cmd,target,button,targetList);
			//console.log('click',button.parents('.file').length,theElement.nodeName);
			// FILE BUTTONS
			if (cmd=='deletefile') {
				button.parents('.file').first().remove();
				if (parentList.length>0 && parentList.attr('data-pouch-autosave')=='true') {
					actionSave(parentList,parentListItem,false);
				}
			} else if (button.parents('.file').length>0 && (theElement.nodeName=='A' || theElement.nodeName=="IMG" && button.parents('a').length>0)) {
				e.preventDefault();
				e.stopImmediatePropagation();
				var attachmentId=button.parents('.file').first().data('attachmentId');
				var theLink;
				if (theElement.nodeName=="A") theLink=button;
				else theLink=button.parents('a').first();
				//console.log('clicked file link',id,attachmentId,theLink,parentList.data('pouchDb'));
				actionLoadAndClickLink(id,attachmentId,theLink,parentList.data('pouchDb'));
			// FORM BUTTONS
			} else if ((cmd=='edit'||cmd=='view') && targetList && targetList.length>0) {
				actionRenderSingle(id,targetList)
			} else if (cmd=='delete') {
				actionDelete(parentList.data('pouchDb'),id,parentListItem,target,e);
			} else if (cmd=='save') {
				actionSave(parentList,parentListItem,false);
			} else if (cmd=='saveandclose') {
				actionSave(parentList,parentListItem,true);
			} else if (cmd=='cancel'||cmd=='close') {
				//history.back(-1);
				parentListItem.remove();
			// LIST BUTTONS
			} else if (cmd=='search') {
				actionSearch(button);
			} else if (cmd=='paginate-first' || cmd=='paginate-last' || cmd=='paginate-next' || cmd=='paginate-previous') {
				if (!button.hasClass('disabled')) {
					parentList.data('pouchSkip',button.data('pouchSkipTo'));
					actionReloadList(parentList);
				}
			} else if (cmd=='new' && target && targetList.length>0) {
				function showList(list) {
					//console.log('showlist',list);
					var listTmpl=$($(list).data('listTemplate'));
					//console.log('tmpl',listTmpl);
					$(list).html(listTmpl.html());
					//console.log('injected');
					$(list).show();
					//console.log('show');
					$('input,textarea,select',list).first().focus();
					//console.log('focus');
				}
				if (targetList.hasClass('pouch-list')) {
					showList(targetList);
				} else {
					$('.pouch-list',targetList).each(function() {
						showList(this);
					});
				}
				//console.log('aa',$('.pouch-list',targetList),$('input',targetList));
				
			} 
		} else {
			console.log('Missing event toElement on click');
		}
		return true;
	}
	
	function onPouchInputChange(e) {
		var target=e.originalEvent.target;
		var value=$(e.originalEvent.target).val();
		var parentSearch=$(target).parents('.pouch-search');
		var targetList=$(target).parents('.pouch-list').first();
		// CHANGE LIMIT
		if ($(target).attr('type')=='file') {
			actionFileSelected(e.originalEvent);
		} else if ($(target).hasClass('pouch-limit')) {
			//console.log('change limit',targetList,value);
			actionReloadList($(targetList));
		// LIVE SEARCH
		} else if (parentSearch.length>0) {
			//console.log('keyup SEARCH',targetList,value);
			actionSearch($(target));
		// LIVE SAVE
		} else if (targetList.length>0 && targetList.attr('data-pouch-autosave')=='true') {
			//console.log('TL',targetList);
			var targetItem=$(target).parents('.pouch-list-item').first();
			// NO AUTOSAVE ON ID FIELD
			if (targetItem.data('pouchField')!=='_id') {
			//console.log('keyup SAVE',targetList,targetItem,value);
				actionSave(targetList,targetItem,false);
			}
		}
		
	}
	
	
	
	
	/**************************************************************
	 * END CLICK ACTIONS
	 **************************************************************/

	function getTemplate(path,recurse) {
		//console.log('gettemplate',path)
		//console.log(pluginTemplate[0].outerHTML);
		var v=$(path,$(pluginTemplate));
		//console.log('v',v.length)
		return v;
	}
	
	function showNoResults(iList) {
		//console.log('NORES',$(iList).data('templatepath'),getTemplate($(iList).data('templatepath'),2));
		var firstItem=$('.pouch-list-item',iList).first();
		var noRes=$('.pouch-list-noresults',getTemplate($(iList).data('templatepath'),2)).last();	
		//noRes='<b>No Res</b>';
		firstItem.after(noRes);
		$('label',iList).remove();
		firstItem.remove();
	}
	

	function renderList(res,list) {
		var dfr=$.Deferred();
		//var result=$('<div/>');
		var items=[];
		if (list) {
			if (!list.jquery) list=$(list);
			var listTmpl=getTemplate(list.data('templatepath'));
			var itemTmplBackup=listTmpl.find('.pouch-list-item').first().clone(true);
			if (res.rows && res.rows.length>0) {
				$.each(res.rows,function(reskey,resvalue) {
					if (resvalue.doc) {
						var itemTmpl=itemTmplBackup.clone(true);
						// SET ROW METADATA
						itemTmpl.attr('data-pouch-id',resvalue.doc._id);
						itemTmpl.attr('data-pouch-rev',resvalue.doc._rev);
						$.each($(itemTmpl).children('.pouch-list-value'),function(key,value) { 
							if (resvalue.doc[$(value).data('pouchField')]) {
								var label='';
								if ($('label',value).length>0) label=$('label',value)[0].outerHTML;
								$(value).html(label+valueFromObjectPath(resvalue.doc,$(value).data('pouchField')));
								$('label',value).show();
							} else {
								var label='';
								if ($('label',value).length>0) label=$('label',value)[0].outerHTML;
								$(value).html(label);
								$('label',value).hide();
							}
						});
						$.each(itemTmpl.children('.pouch-list'),function(key,iList) {
							var field=$(iList).data('pouchField');
							if (field && field.length>0 && resvalue.doc[field]) {
								if ($(iList).data('pouchMmseperator') && $(iList).data('pouchMmseperator').length && $(iList).data('pouchMmseperator').length>0) {
									$(iList).attr('data-keys',resvalue.doc[field]);
								} else {
									$(iList).attr('data-key',resvalue.doc[field]);
								}
								//$(iList).attr('data-endkey',resvalue.doc[field]);
								loadList(iList).then(function(res2) {
									if (res2 && res2.rows && res2.rows.length>0)  {
										renderList(res2,iList).then(function (items) {
											var firstItem=$('.pouch-list-item',iList).first();
											if ($(iList).data('pouchWrapstart')) firstItem.before($(iList).data('pouchWrapstart'));
											var count=0;
											$.each(items,function(rlk,rlv) {
												if (count>0) firstItem.before($(iList).data('pouchSeperator'));
												firstItem.before(rlv);
												count++;
											});
											if ($(iList).data('pouchWrapend')) firstItem.before($(iList).data('pouchWrapend'));
											firstItem.remove();
											$('.pouch-list-noresults',iList).remove();
										});
									} else {
										showNoResults(iList);
									}
								});
							}  else {
								showNoResults(iList);
							}
						});
						items.push(itemTmpl);
						
					}
				});
			}
		}
		var skip=$(list).data('pouchSkip');
		if (skip===undefined || skip===NaN) skip=0;
		var limit=parseInt($(list).data('pouchLimit'));
		var maxRecords=parseInt(res.total_rows);
		var next=skip+limit;
		var previous=skip-limit;
		if (previous<0) previous=0;
		var last=maxRecords;
		if (limit>0) last=Math.floor(maxRecords/limit)*limit;
		
		$('[data-pouch-action="paginate-first"]',list).data('pouchSkipTo',0);
		$('[data-pouch-action="paginate-previous"]',list).data('pouchSkipTo',previous);
		$('[data-pouch-action="paginate-next"]',list).data('pouchSkipTo',next);
		$('[data-pouch-action="paginate-last"]',list).data('pouchSkipTo',last);
		
		//console.log(skip<limit,'SKIP',skip,'limit',limit,'max',maxRecords,'next',next,'prev',previous,'laset',last);
		
		if (skip == 0) { 
			$('[data-pouch-action="paginate-first"]',list).addClass('disabled');
		}
		if (skip < limit) {
			//console.log('skip<limit');
			$('[data-pouch-action="paginate-previous"]',list).addClass('disabled');
		}
		if (next > last) {
			$('[data-pouch-action="paginate-next"]',list).addClass('disabled');
			$('[data-pouch-action="paginate-last"]',list).addClass('disabled');
		}
		
		// set limit DOM value in list
		$('.pouch-limit',list).val(limit)
		$.each($('img[data-pouch-loadme="yes"]',$(list)),function() {
			asyncLoadImage($(this));
		});
		$(list).show();
		//console.log('NORES',$('.pouch-list-noresults',list));
		return dfr.resolve(items);
	}
	
	// CALLED ON INIT AND ON CHANGES TO GET RECENT DATA AND CALL UPDATE LIST
	function loadList(list,recurse) {
		//$(list).html('<b>eek</b>')
		var dfr=$.Deferred();
		var limit=0;
		var skip=0;
		var attachments=false;
		// PAGINATION
		// override from dom selector
		if ($('.pouch-limit',list).length>0 && $('.pouch-limit',list).val()>0) {
			limit=$('.pouch-limit',list).val();
			$(list).data('pouchLimit',parseInt(limit))
			//console.log('limit from DOM value',limit);
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
			console.log("PREP KEYS",d.keys);
			d.keys=d.keys.split($(list).data('pouchMmseperator'));
			console.log("PREPPED KEYS",d.keys);
		}
		
		if (limit>0) d.limit=parseInt(limit);
		if (skip>0) d.skip=parseInt(skip);
		console.log('now query local and rerender',d);
		// NOW LOAD RESULTS
		var pouch=getDB(d.pouchDb);
		if (d.pouchIndex) {
			//if (recurse>0) console.log('DBDBDB now queryindex',recurse,d.pouchIndex);
			pouch.query(d.pouchIndex,d).then(function(res) {
				console.log('DBDBDB query res',recurse,res)
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
			
	function asyncLoadImage(image) {
		if (image.data('pouchDb') && image.data('pouchId') && image.data('pouchAttachmentid')) {
			var pouch=getDB(image.data('pouchDb'));
			var docId=image.data('pouchId');
			var attachmentId=image.data('pouchAttachmentid');
			pouch.getAttachment(docId,attachmentId).then(function(ires) {
				//console.log('async loaded ',ires);
				 var reader = new window.FileReader();
				 reader.onloadend = function() {
					//console.log('IMAGE LOADED ASYNC',image,reader.result);
					image.attr('src',reader.result);
				 };
				 reader.readAsDataURL(ires); 
			}); 
		} else {
			console.log('ASYNC LOAD IMAGE MISSING META DATAS',image,image.data());
		}
	}

		
	// START PLUGIN - ONCE OFF INITIALISATION ON PAGE LOAD
	var pluginElements=this;
	var pouchLists=[];
	var databasesToListen={};
	var databaseConfigs={};
	// mash all elements handed to jquery into a single template and 
	// - set a path on all pouch-lists
	// - extract configuration per database
	var pluginTemplate='';
	$(this).each(function(tk,tv) {
		pluginTemplate=pluginTemplate+tv.outerHTML;
	});
	//console.log("PTEMP",pluginTemplate);
	pluginTemplate=$('<div id="root">'+pluginTemplate+'</div>');
	// set path for every list regardless of nesting depth
	$('.pouch-list',pluginTemplate).each(function(k,v) {
		$(v).attr('data-templatepath',getDomPath(v,1));
		if ($(v).data('pouchDb')) {
			if ($.type(databaseConfigs[$(v).data('pouchDb')])!='object') databaseConfigs[$(v).data('pouchDb')]={};
			if ($(v).data('pouchSheetsource')) databaseConfigs[$(v).data('pouchDb')]['pouchSheetsource']=$(v).data('pouchSheetsource');
			if ($(v).data('pouchDbsource')) databaseConfigs[$(v).data('pouchDb')]['pouchDbsource']=$(v).data('pouchDbsource');	
		}
	});
	console.log('PLUGIN TEMPLATE');
	// gather top level lists for listening to changes
	this.each(function() {
		if ($(this).hasClass('pouch-list')) {
			pouchLists.push($(this));
			$(this).attr('data-templatepath',getDomPath(this,2));
		}
		else $('.pouch-list:not(.pouch-list .pouch-list)',$(this)).each(function() {
			pouchLists.push($(this));
			$(this).attr('data-templatepath',getDomPath(this,2));
			//console.log('TT',typeof databasesToListen[$(this).data('pouchDb')]);
			if (typeof databasesToListen[$(this).data('pouchDb')] === 'undefined' ) databasesToListen[$(this).data('pouchDb')]=[]; 
			databasesToListen[$(this).data('pouchDb')].push($(this));
		});
		// BIND CLICK AND KEYUP EVENTS ON SEARCH FORMS THAT ARE NOT INSIDE OF POUCH-LISTS
		bindEventsTo($('.pouch-search:not(.pouch-list .pouch-search)',$(this)));	
	});
		
	// init and activate lists
	initialiseDesignDocuments(options.design).then(function() {
		$.each(pouchLists,function(lk,lv) {
			//console.log('ini/load/render',lv,$(lv).data())
			initialiseList(lv).then(function() {
				//console.log('ini');
				actionReloadList(lv);
			});
		});
	});	
	// LISTEN TO CHANGES ON LOCAL DB AND UPDATE CONTENT
	setTimeout(function() {
		$.each(databasesToListen,function(dk,dv) {
			var pouch=getDB(dk);
			// CREATE
			var changes = pouch.changes({ live: true,include_docs:true,since:'now'}).on('create', function(change) { 
				//console.log('changes','.pouch-list-item[data-pouch-id="'+change.doc._id+'"]',$('.pouch-list-item[data-pouch-id="'+change.doc._id+'"]'));
				$.each(dv,function (lk,currentList) {
					loadList(currentList).then(function(results) {
						//console.log('change new',results);
						$(results).each(function(rk,rv) {
							if (rv._id==change.doc_id)  {
								//renderList(results,currentList).then(function(renRes) {
								//	currentList.html(renRes);
								//});;
							}
						});
					});
				});
			});
			// UPDATE
			var changes = pouch.changes({ live: true,include_docs:true,since:'now'}).on('update', function(change) { 
				//console.log('changes UPDATE','.pouch-list-item[data-pouch-id="'+change.doc._id+'"]',$('.pouch-list-item[data-pouch-id="'+change.doc._id+'"]'));
				$.each(dv,function (lk,currentList) {
					$('.pouch-list-item[data-pouch-id="'+change.doc._id+'"]',currentList).each(function(m,mm) {
						//console.log('DO update item',m,mm);
						//var send={rows:[{doc:change.doc}]};
						//loadAttachments(pouch,send).then(function(res) {
							//console.log('loaded with att',res);
							//substituteRecordValues($(mm),change); //res.rows[0]);
							$.each($('img[data-pouch-loadme="yes"]',mm),function() {
								asyncLoadImage($(this));
							});
						//});
					});
				});
			});
			// DELETE
			var changes = pouch.changes({ live: true,include_docs:true,since:'now'}).on('delete', function(change) { 
				console.log('changes DEL','.pouch-list-item[data-pouch-id="'+change.doc._id+'"]',$('.pouch-list-item[data-pouch-id="'+change.doc._id+'"]'));
				$.each(dv,function (lk,currentList) {
					$('.pouch-list-item[data-pouch-id="'+change.doc._id+'"]',currentList).each(function(m,mm) {
						//console.log('DO delete item',m,mm,this);
						$(mm).remove();
					});
				});
			});
		});
	},5000);
	return this;
	
};
