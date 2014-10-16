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
		console.log('LOOKUP MIME',fileName,ret);
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
		if (!$(list).data('listTemplate')) {
			$(list).data('listTemplate',$(list)[0].outerHTML);
			//console.log('newlisttemplateok',$(list).data('listTemplate'));
		}
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
						console.log('google sheet entry created',info);
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
		//console.log('got design ',designDoc);
		// load existing design doc and update it
		var promises=[];
		// first delete databases if reset flag
		$.each(designDoc,function(dkey,dval) {
			promises.push(destroyDB(dkey));
		});
		//console.log('dbs destroyed');
		$.when.apply($,promises).then(function() {
			//console.log('dbs destroyed forreal');
			//console.log('DD',designDoc);
			$.each(designDoc,function(dkey,dval) {
				//console.log('now create designs ',dkey,dval);
				var pouch=getDB(dkey);
				pouch.get(dval._id).then(function(current) {
					//console.log('got design doc',current);
					dval._rev=current._rev;
					pouch.post(dval).then(function (info) {
						//console.log('design doc saved');
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
	}
	function destroyDB(db) {
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
		var attachmentsDOM=$(e.target).siblings('.attachments');
		var folder='';
		if ($(e.target).parents('.pouch-list-input').data('pouchFolder') && $(e.target).parents('.pouch-list-input').data('pouchFolder').length>0) folder=$(e.target).parents('.pouch-list-input').data('pouchFolder');			if ($(e.target).data('pouchFolder') && $(e.target).data('pouchFolder').length>0) folder=$(e.target).data('pouchFolder');
		if (folder.substr(folder.length-1)=='/') folder=folder.substr(0,folder.length-1);
					
		console.log('input change',e.target,attachmentsDOM);
		// DND
		if (e && e.dataTransfer && e.dataTransfer.files) {
			entries = e.dataTransfer.files;
		// FILESELECTION
		} else if (e && e.target && e.target.files) {
			entries = e.target.files;
		}
		console.log('Entries',entries); 
		$.each(entries,function(key,file) {
			var parts;
			if (file.webkitRelativePath) parts=file.webkitRelativePath.split("/");
			else parts=[];
			if (parts[parts.length-1] !='.' ) {
				var path=parts.slice(0,parts.length-1).join("/");
				var reader = new FileReader();
				reader.onload = (function(fileRef) {
				return function(e) {
					var mime=MimeConverter.lookupMime(fileRef.name);
					var b=new Blob([e.target.result],{type : mime});
					var fileDOM=$('<div class="file pending"><span class="ui-button" data-pouch-action="deletefile" >X</span><a target="_new" >'+fileRef.name+'</a></div>');
					$('.file[data-docid="'+folder+"/"+fileRef.name+'"]',attachmentsDOM).remove();
					attachmentsDOM.prepend(fileDOM);
					fileDOM.attr('data-docid',folder+"/"+fileRef.name);
					fileDOM.attr('data-size',fileRef.size);
					fileDOM.attr('data-mime',mime);
					var reader = new FileReader();
					reader.onload = function(e) {
						// save selected file content in link as base64
						$('a',fileDOM).attr('href',reader.result);
						var targetList=fileDOM.parents('.pouch-list').first();
						var targetItem=$(fileDOM).parents('.pouch-list-item').first();
						console.log('AUTOSAVE ON FILE??? ',targetList,targetItem);
						if (targetList.length>0 && targetList.attr('data-pouch-autosave')=='true') {
							console.log('AUTOSAVE ON FILE',targetList);
							// NO AUTOSAVE ON ID FIELD
							actionSave(targetList,targetItem);
						}
					}
					reader.readAsDataURL(b);
				};
				})(file);
				reader.readAsArrayBuffer(file);
			}
		});
	}
	
	function actionReloadList(list) {
		//console.log('reload list')
		loadList(list).then(function(res) {
			renderList(res,list);
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
				loadList($(splv)).then(function(res) {
					renderList(res,$(splv));
				});
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
					renderList(results,tv);
				});
				dfr.resolve();
			} else {
				//console.log('look for child lists',tv	);
				$('.pouch-list',tv).each(function(tvk,tvv) {
					//console.log('look for child lists FOUND tvv');
					var d=$.extend({include_docs:true},options,$(tvv).data())
					$(tvv).data('key',id);
					//console.log('look for child lists set key',id,d);
					loadList(tvv).then(function(results) {
						//console.log('loaded child list');
						renderList(results,tvv);
						//console.log('rendered child list');
					});
					dfr.resolve();
				});
			}
		});
		return dfr;
	}
	function actionDelete(db,id,listItem,target,e) {
		if (confirm('Really Delete?')) {
			var pouch=getDB(db);
			pouch.get(id,function(err,res) {
				//console.log('get',res);
				if (err) {
					console.log('ERR DELETE get',err);
				} else {
					try {
						pouch.validatingRemove(res._id,res._rev).then(function(err,dres) {
							//console.log('DEL OK',err,dres);
						}).catch(function(err) {
							console.log('ERR DELETE',err);
							//$('.validationerror',listItem).remove();
							//var errMsg=$('<div class="validationerror" >'+err.message+'</div>');
							//$('input,select,textarea',listItem).first().before(errMsg);
						});
					} catch (e) {
					console.log('ERR DELETE exc',e);
					}
				}
			});
		}
	}
	function actionSave(list,currentListItem) {
		//console.log('save ');
		//console.log('save ',list,currentListItem);
		// update target with recent values
		// load db
		var d=$.extend({include_docs:true},options,$(list).data());
		//console.log('sd',d);
		var pouch=getDB(d.pouchDb);
		// UPDATE EXISTING
		if (currentListItem.data('pouchId') && currentListItem.data('pouchId').length>0) {
			pouch.get(currentListItem.data('pouchId')).then(function(res) {
				console.log('get',currentListItem.data('pouchId'),res);
				// override incoming values
				var initialAttachments={};
				$.each(res['_attachments'],function(rak,rav) {
					initialAttachments[rak]=false;
				});
				var changed=false;
				$.each($('.pouch-list-input',currentListItem),function(ivk,ivv) {
					//console.log('getting',ivk,ivv);
					var fn=$(ivv).data('pouchField');
					//console.log('getting',fn);
					$.each($('select,input,textarea',ivv),function (rik,riv) {
						// CAPTURE CHANGES TO ATTACHMENTS
						if ($(riv).attr('type')=='file')  {
							var saveAttachments={};
							$.each($(riv).siblings('.attachments').find('.file'),function(ak,av) {
								var content=$('a',av).attr('href');
								var docId=$(av).data('docid');
								var saveAttachment;
								if ($(av).hasClass('pending')) {
									saveAttachment={content_type:"text\/plain",data:'VGhpcyBpcyBhIGJhc2U2NCBlbmNvZGVkIHRleHQ='}; //$(av).data('mime')
									changed=true;
									$(av).removeClass('pending');
									console.log('have changed files');
								} else {
									console.log('ADS',res['_attachments'][docId]);
									saveAttachment=res['_attachments'][docId]; //{content_type:"text\/plain",stub:true};  //$(av).data('mime')
								}
								initialAttachments[docId]=true;
								saveAttachments[docId]=saveAttachment;
							});	
							console.log('ATT',res._attachments,saveAttachments);
							res['_attachments']= saveAttachments; //{'set1.txt':{"content_type":"text\/plain","data": "VGhpcyBpcyBhIGJhc2U2NCBlbmNvZGVkIHRleHQ="},'set2.txt':{"content_type":"text\/plain","data": "VGhpcyBpcyBhIGJhc2U2NCBlbmNvZGVkIHRleHQ="}};
							var foundAll=true;
							$.each(initialAttachments,function(iak,iav) {
								foundAll=foundAll&&iav;
							});
							if (!foundAll) changed=true;
							//changed=true;
							//saveAttachments;
						} else if ($(riv).val()!=res[fn]) {
							changed=true;
							res[fn]=$(riv).val();
						}
					});
					//console.log('done loop inputs etc',res);
				});
				console.log('REALLY have changed files',changed);
				//$.each(
				if (changed) {
					var recs={rows:[{doc:res}	]}
					pouch.validatingPost(res).then(function(err,rs) {
						console.log('SAVE OK',err,rs,recs);
						//$('.validationerror',currentListItem).remove();
						//if (currentListItem && currentListItem.length) currentListItem.remove();
					}).catch(function(err) {
						console.log('SAVE ERROR',err);
						$('.validationerror',currentListItem).remove();
						var errMsg=$('<div class="validationerror" >'+err.message+'</div>');
						$('input,select,textarea',currentListItem).first().before(errMsg);
						
					});
					return true;
				} else {
					console.log('SAVE BUT NO CHANGES');
					//if (target && target.length) currentListItem.remove();
					//$('.validationerror',currentListItem).remove();
					//return true;
				}
			}).catch(function(err) {
				console.log('SAVE ERROR preloading record',err);
			});
			return true;
		// SAVE NEW
		} else {
			var res={};
			$.each($('.pouch-list-input',currentListItem),function(ivk,ivv) {
				//console.log('getting',ivk,ivv);
				var fn=$(ivv).data('pouchField');
				//console.log('getting',fn);
				$.each($('select,input,textarea',ivv),function (rik,riv) {
					res[fn]=$(riv).val();
				});
				//console.log('done loop inputs etc',res);
			});
			// ID from form data
			if (res['_id'] && res['_id'].length>0) {
				pouch.validtingPost(res,function(err,rs) {
					console.log('saved new with ID',rs);
					currentListItem.attr('data-pouch-id',rs._id);
					currentListItem.attr('data-pouch-rev',rs._rev);
				});
			// ID from idFunction
			} else if (false)  {
				console.log('id fn');
			// let the database assign an id
			} else {
				console.log('id db');
			}
			return true;
		}
	}		
	function onPouchClick(e) {
		// return false on failure of command to prevent link default action
		if (e && e.toElement) {
			var button=$(e.toElement);
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
			console.log('click',cmd,target,button,targetList);
			if (cmd=='deletefile') {
				button.parents('.file').first().remove();
				if (parentList.length>0 && parentList.attr('data-pouch-autosave')=='true') {
					actionSave(parentList,parentListItem);
				}
			} else if ((cmd=='edit'||cmd=='view') && targetList && targetList.length>0) {
				actionRenderSingle(id,targetList)
			} else if (cmd=='delete') {
				actionDelete(parentList.data('pouchDb'),id,parentListItem,target,e);
			} else if (cmd=='save') {
				actionSave(parentList,parentListItem,target);
			} else if (cmd=='cancel'||cmd=='close') {
				//history.back(-1);
				parentListItem.remove();
			} else if (cmd=='search') {
				actionSearch(button);
			} else if (cmd=='paginate-first' || cmd=='paginate-last' || cmd=='paginate-next' || cmd=='paginate-previous') {
				if (!button.hasClass('disabled')) {
					parentList.data('pouchSkip',button.data('pouchSkipTo'));
					actionReloadList(parentList);
				}
			} else if (cmd=='new' && target && targetList.length>0) {
				function showList(list) {
					console.log('showlist',list);
					var listTmpl=$($(list).data('listTemplate'));
					console.log('tmpl',listTmpl);
					$(list).html(listTmpl.html());
					console.log('injected');
					$(list).show();
					console.log('show');
					$('input,textarea,select',list).first().focus();
					console.log('focus');
				}
				if (targetList.hasClass('pouch-list')) {
					showList(targetList);
				} else {
					$('.pouch-list',targetList).each(function() {
						showList(this);
					});
				}
				console.log('aa',$('.pouch-list',targetList),$('input',targetList));
				
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
				actionSave(targetList,targetItem);
			}
		}
		
	}
	
	
	
	
	/**************************************************************
	 * END CLICK ACTIONS
	 **************************************************************/
	function substituteRecordValues(itemTmpl,resvalue,collation) {
		// REPLACE ROW/FIELD VALUES
		//console.log(resvalue,itemTmpl[0].outerHTML)
		$.each($('.pouch-list-value',itemTmpl).not('.pouch-list .pouch-list .pouch-list-value'),function(key,value) {  //:not(.pouch-list .pouch-list .pouch-list-value)
			// REPLACE DOM ELEMENT HTML WITH FIELD VALUE
			// special case for attachments
			if ($(value).data('pouchField')=='_attachments') {
				console.log('render attach',resvalue);
				if (resvalue.doc['_attachments'])  {
					console.log('have attach for this record');
					var folder=$(value).data('pouchFolder');
					var attList=$('<div class="attachments" />');
					var attachmentsToSort=[];
					$.each(resvalue.doc['_attachments'],function(rvk,rvv) {
						attachmentsToSort.push({key:rvk,content:rvv});
					});
					attachmentsToSort.sort(function(a,b) {if (a.key.toLowerCase()<b.key.toLowerCase()) return -1; else return 1;});
					$.each(attachmentsToSort,function(rvka,rvva) {
						var rvk=rvva.key;
						var rvv=rvva.content;
						console.log('render attach no ',rvk,rvv);
						if (rvv.content) { 
							console.log('render attach has content');
							var attTmpl=$($(value)[0].outerHTML);
							var imgTmpl=$('img',attTmpl);
							var aTmpl=$('a',attTmpl);
							var renderableImage=false;
							if (rvv.content_type && (rvv.content_type=='image/jpeg' || rvv.content_type=='image/jpg' || rvv.content_type=='image/gif' || rvv.content_type=='image/png' || rvv.content_type=='image/svg+xml' || rvv.content_type=='image/bmp')) renderableImage=true;
							if (renderableImage && imgTmpl.length>0) imgTmpl.attr('src',rvv.content);
							if (aTmpl) aTmpl.attr('href',rvv.content); 
							attList.append(attTmpl);
						} else {
							console.log('render attach has no content');
							attList.append('<div class="file">'+rvk+'</div>');
						}
					});
					$(value).html(attList[0].outerHTML);
				} else {
					$(value).html('');
				}
			} else if (resvalue.doc[$(value).data('pouchField')]) $(value).html(valueFromObjectPath(resvalue.doc,$(value).data('pouchField')));
			else $(value).html('');
		});
		// REPLACE INPUT VALUES
		$.each($('.pouch-list-input:not(.pouch-list .pouch-list .pouch-list-input)',itemTmpl),function(key,value) {
			$.each($('input,textarea,select',value).first(),function(ik,formInput) {
				console.log('HAVE input');
				// REPLACE DOM ELEMENT HTML input WITH FIELD VALUE
				// FILE
				if ($(formInput).attr('type')=='file') {
					console.log('filetypeinput');
					var attachmentsDOM;
					// ALLOW FOR VALUE UPDATE
					if ($(formInput).siblings('.attachments').length>0) {
						attachmentsDOM=$(formInput).siblings('.attachments').first();
						$('.file:not(.file.pending)',attachmentsDOM).remove();
					// OTHERWISE CREATE DOM FOR ATTACHMENT LIST
					} else {
						attachmentsDOM=$('<div class="attachments"></div>');
						$(formInput).after(attachmentsDOM);
					}
					// FILTER BY FOLDER ?  using data-pouch-folder attr - from pouch-list-input tag override by input type=file tag
					var folder='';
					if ($(value).data('pouchFolder') && $(value).data('pouchFolder').length>0) folder=$(value).data('pouchFolder');
					if ($(formInput).data('pouchFolder') && $(formInput).data('pouchFolder').length>0) folder=$(formInput).data('pouchFolder');
					var recursive=false;
					if (folder.length>0 && folder.substr(folder.length-1,1)=="/") recursive=true;
					var attachments={};
					var attachmentsToSort=[];
					//console.log('ARAW',resvalue.doc['_attachments']);
					if (resvalue.doc['_attachments'])  {
						//console.log('ARAWOK',resvalue.doc['_attachments']);
						$.each(resvalue.doc['_attachments'],function(atk,atv) {
							//console.log('test',atk)
							if (atk.substr(0,folder.length)==folder) {
								var remaining=atk.substr(folder.length)
								var parts=remaining.split('/');
								//console.log('match on start folder',remaining,parts);
								if (recursive || parts.length==1) { 
									//console.log('OK this one');
									attachmentsToSort.push({key:atk,content:'<div class="file" data-docid="'+atk+'" data-mime="'+atv.content_type+'" ><span class="ui-button" data-pouch-action="deletefile" >X</span><a target="_new" >'+remaining+'</a></div>'});
								}
								
							}
						});
						attachmentsToSort.sort(function(a,b) {if (a.key.toLowerCase()<b.key.toLowerCase()) return -1; else return 1;});
						$.each(attachmentsToSort,function(k,v) {
							$(attachmentsDOM).append(v.content);
						});
					}
				// HAVE VALUE FOR FIELD	
				} else if (resvalue.doc[$(value).data('pouchField')]) {
					if (formInput.type=='textarea') {
						$(formInput).html(valueFromObjectPath(resvalue.doc,$(value).data('pouchField')))
					} else {
						$(formInput).attr('value',valueFromObjectPath(resvalue.doc,$(value).data('pouchField')));
					}
				// NO VALUE FOR FIELD
				} else {
					if (formInput.type=='textarea') {
						$(formInput).html('');
					} else {
						$(formInput).val('');
					}
				}	
			});
		});
		// REPLACE LISTS
		if (itemTmpl && itemTmpl.length>0) { 
			$.each($('.pouch-list:not(.pouch-list .pouch-list .pouch-list)',itemTmpl),function(key,value) {
				//console.log('REPLACE list',value);
				//$(value).html('<p>what</p>');
				//return;
				var bak=value;
				var ivalue=$($(value)[0].outerHTML);
				var iresult='';
				$(ivalue).uniqueId();
				var field=$(ivalue).data('pouchField');
				if (field && field.length>0) {
					$(ivalue).attr('data-startkey',resvalue.doc[field]);
					$(ivalue).attr('data-endkey',resvalue.doc[field]);
					//console.log('set key',field,resvalue.doc[field],$(value).data('startkey'));
					//console.log('load child list',value)
					function setVal(val) {
						//console.log('setval',val)
						loadList(ivalue).then(function(res) {
							//console.log('LIST TEMPL',value);
							//console.log('load child list have data',res)
							//return;
							//$(value).html('<p>bull</p>');
							renderList(res,ivalue).then(function(rl) {
								//$(value).html('<p>crap</p>');
								$(value).html($(rl[0].outerHTML));
								//setVal(rl.html());
								
								//console.log('load child list rendered',rl[0].outerHTML,value)
								
							});
						});
					}
					setVal(value);
					//setVal('<b>aaaffff</b>');
					
				}
			})
		}			
		// REPLACE COLLATIONS			
		$.each($('.pouch-list-collation .pouch-list-collation-item',itemTmpl),function(pkey,collationTemplate) {
			var collationBackupTemplate=$(collationTemplate)[0].outerHTML;
			var collationWorkingTemplate=$(collationBackupTemplate);
			//console.log('cooolB&W',collationBackupTemplate) //s,collationWorkingTemplate);
			var cResult=$('<div/>'); // combined list for related collated records
			// only render list if there are records in cvalue matching pouchCollationkey in meta data
			var colE=$(this).parents('.pouch-list-collation').data('pouchCollationkey');
			//console.log('cooolB&W1 collationkey',colE);
			var colD=cvalue[colE];
			//console.log('cooolB&W2',cvalue);
			if (colD && colD.length>0) {
				//var innerTemplate=$($(pvalue)[0].outerHTML);
				//console.log('colE',colE,colD[0].doc);
				// for each related record
				$.each(colD,function(ck,relatedRecord) {
					collationWorkingTemplate=$(collationBackupTemplate);
					//console.log('assign working template',collationWorkingTemplate[0].outerHTML);
					//console.log('coffleB&W',collationWorkingTemplate,$('.pouch-list-collation-value',collationWorkingTemplate)); //,collationWorkingTemplate);
					//console.log('for reln field '+colE,'data',ck,relatedRecord,$('.pouch-list-collation-value',collationTemplate));
					// replace field values
					$.each($('.pouch-list-collation-value',collationWorkingTemplate),function(pckey,pcval) {
						//console.log('PC',$(pcval).data('pouchField'),pckey,pcval,'DATA',relatedRecord);
						if (relatedRecord.doc[$(pcval).data('pouchField')]) {
							$(pcval).html(relatedRecord.doc[$(pcval).data('pouchField')]);
							//console.log('PChaveval',relatedRecord.doc[$(pcval).data('pouchField')]);
						} else {
							$(pcval).html('');
						}
						//console.log('PC',pckey,pcval);
						// if i have a value stored in collations for my collationKey
						// 
						//if (cvalue)	
						//if ($(this).data('pouchField')) {
						//	$(pvalue).html(cv[0].doc[$(this).data('pouchField')]);
						//}
					});
					//console.log('colB&WDONE');
					// append row to result
					$(collationWorkingTemplate).attr('data-pouch-id',relatedRecord.doc._id);
					$(collationWorkingTemplate).attr('data-pouch-rev',relatedRecord.doc._rev);
		
					cResult.append($(collationWorkingTemplate));
					//console.log('aPC add',collationWorkingTemplate,'collationTemplate');
				});	
				$(collationTemplate).replaceWith(cResult.html());
			//$(this).parents('.pouch-list-collation').html(cResult.html());
			//$(pvalue).html('coll result');
			//console.log('CRESULT',pvalue,cResult);
			} else {
				$(collationTemplate).parents('.pouch-list-collation').html('');
				//console.log('no related values');
			}
		});
	}
	

	
	function renderPlainList(res,list,itemTmpl) {
		var result=$('<div/>');
		//console.log('render plain list',res,list,itemTmpl);
		$.each(res.rows,function(reskey,resvalue) {
			if (resvalue.doc) {
				//console.log('REN ROW',resvalue)
				// SET ROW METADATA
				itemTmpl.attr('data-pouch-id',resvalue.doc._id);
				itemTmpl.attr('data-pouch-rev',resvalue.doc._rev);
				//console.log('set meta');
				// SET RECORD DATA
				substituteRecordValues(itemTmpl,resvalue);
				//console.log('subbed vals');
				// AND APPEND TO THE FINAL LIST
				result.append(itemTmpl.clone()); 
				//console.log('added to list');
			}
		});
		//console.log('DONE ROWS',result[0].outerHTML,$('.pouch-list-item',list));
		return result;
	}


	function renderCollatedList(res,list,itemTmpl) {
		//console.log('collation',typeof res.rows[0].key);
		var result=$('<div/>');
		var collation={};
		// first collate all list results
		$.each(res.rows,function(reskey,resvalue) {
			if (resvalue.doc) {
				var key=resvalue.key[0];
				if (typeof key=='object')  {
					var newKey='';
					$.each(key,function(kf,kv) {
						newKey+=kv;
					});
					key=newKey;
				}
				//console.log('COLLATE',reskey,resvalue,key); //new String(resvalue.key[0]),resvalue.key[0],resvalue.key,resvalue.key[1]);
				if (typeof collation[key] =='undefined') collation[key]={};
				if (typeof collation[key][resvalue.key[1]] =='undefined') collation[key][resvalue.key[1]]=[];
				collation[key][resvalue.key[1]].push(resvalue);
			}	
		});
		//console.log('collation',collation);
		// RENDER EACH GROUP OF RECORDS COLLATED BY A KEY
		$.each(collation,function(ckey,cvalue) {
			// CLONE
			itemTmpl2=$(itemTmpl[0].outerHTML);
			var lastRecord=null;
			var lastKey=null;
			// FIND THE LAST RECORD FOR PRIMARY RENDER
			$.each(cvalue,function(collationKey,collationSet) {
				//console.log('render',collationKey,collationSet);
				lastRecord=collationSet;
			});
			// SET ROW METADATA
			$(itemTmpl2).attr('data-pouch-id',lastRecord[0].doc._id);
			$(itemTmpl2).attr('data-pouch-rev',lastRecord[0].doc._rev);
			substituteRecordValues(itemTmpl2,lastRecord[0],collation);
			// AND APPEND TO THE FINAL LIST
			result.append(itemTmpl2); 
			//console.log('RESULT',result[0].outerHTML);
		});	
		return result;
	}
				

	// GIVEN A CHUNK OF DOM AND A POUCH RESULT SET, UPDATE THE pouch-list-item HTML
	// TO A RENDERING OF THE RESULT SET 
	function renderList(res,list) {
		var dfr=$.Deferred();
		var listTmpl=$($(list).data('listTemplate'));
		if (!listTmpl || listTmpl.length==0) {
			listTmpl=$($(list)[0].outerHTML);
			$(list).data('listTemplate',listTmpl);
		} 
		//console.log('PL',$(list).data('listTemplate')); //,res);//.generateList();
		// create new dom from listTemplate
		var itemTmpl=$('.pouch-list-item:not(.pouch-list-item .pouch-list-item)',listTmpl);
		// IF WE HAVE MULTI DIMENSIONAL KEYS, WE ARE COLLATING
		//console.log('RL',itemTmpl.length,listTmpl[0].outerHTML)
		if (res.rows && res.rows.length>0) {
			var result;
			if (res.rows && res.rows[0] && res.rows[0].key && res.rows[0].key.length>1 && typeof res.rows[0].key!="string") {
				result=renderCollatedList(res,listTmpl,itemTmpl);
			} else {
				result=renderPlainList(res,listTmpl,itemTmpl);
			}
			$('.pouch-list-item:not(.pouch-list-item .pouch-list-item)',listTmpl).replaceWith($(result).html());
			$('.pouch-list-noresults:not(.pouch-list-item .pouch-list-noresults)',listTmpl).hide();
		} else {
			$('.pouch-list-item:not(.pouch-list-item .pouch-list-item)',listTmpl).replaceWith('');
			$('.pouch-list-noresults:not(.pouch-list-item .pouch-list-noresults)',listTmpl).show();
		}
		//console.log('liste limit', $(list).data('pouchLimit'),$('.pouch-limit',list));
		//console.log('liste limit', $(list).data('pouchLimit'),$('.pouch-limit',list));
		$(list).html(listTmpl.html());
		console.log('liste rendered',list) ;//,listTmpl.html());
		// update paginate buttons
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
		$(list).show();
		//console.log('rendered list',res,$(list).data(),$(list)[0].outerHTML);
		dfr.resolve(list);
		return dfr;
	}
	
	
	// CALLED ON INIT AND ON CHANGES TO GET RECENT DATA AND CALL UPDATE LIST
	function loadList(list) {
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
		if (limit>0) d.limit=parseInt(limit);
		if (skip>0) d.skip=parseInt(skip);
		// convert to boolean  DOESN'T WORK BUG - https://github.com/pouchdb/pouchdb/issues/2771
		// if (d.pouchAttachments=='true') d.attachments=true;
		console.log('now query local and rerender',d);
		// NOW LOAD RESULTS
		var pouch=getDB(d.pouchDb);
		if (d.pouchIndex) {
			//console.log('now queryindex',d.pouchIndex);
			pouch.query(d.pouchIndex,d).then(function(res) {
				// HACK AROUND BUG - https://github.com/pouchdb/pouchdb/issues/2771
				if (d.pouchAttachments) {
					$.each(res,function(rk,rv) {
						if (rv.doc && rv.doc._attachments) $.each(rv.doc._attachments,function(rak,rav) {
						
						});
					});
				}
				//console.log('RESULTS done');
				console.log('RESULTS query',res);	
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
		
	// START PLUGIN
	var pluginElements=this;
	var pouchLists=[];
	var databasesToListen={};
	// gather lists
	this.each(function() {
		if ($(this).hasClass('pouch-list')) pouchLists.push($(this));
		else $('.pouch-list:not(.pouch-list .pouch-list)',$(this)).each(function() {
			pouchLists.push($(this));
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
				loadList(lv).then(function(results) {
					//console.log('load',results);
					renderList(results,lv).then(function(rl) {
						//console.log('rendered',rl);
					});
				});
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
								renderList(results,currentList);
							}
						});
					});
				});
			});
			// UPDATE
			var changes = pouch.changes({ live: true,include_docs:true,since:'now'}).on('update', function(change) { 
				//console.log('changes','.pouch-list-item[data-pouch-id="'+change.doc._id+'"]',$('.pouch-list-item[data-pouch-id="'+change.doc._id+'"]'));
				$.each(dv,function (lk,currentList) {
					$('.pouch-list-item[data-pouch-id="'+change.doc._id+'"]',currentList).each(function(m,mm) {
						//console.log('DO update item',m,mm,this);
						substituteRecordValues(this,change);
					});
				});
			});
			// DELETE
			var changes = pouch.changes({ live: true,include_docs:true,since:'now'}).on('delete', function(change) { 
				//console.log('changes','.pouch-list-item[data-pouch-id="'+change.doc._id+'"]',$('.pouch-list-item[data-pouch-id="'+change.doc._id+'"]'));
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
