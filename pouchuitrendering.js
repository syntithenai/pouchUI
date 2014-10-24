	function substituteRecordValues(itemTmpl,resvalue,collation) {
		// REPLACE ROW/FIELD VALUES
		//console.log('SUB',resvalue) //,itemTmpl[0].outerHTML)
		var list=itemTmpl.parents('.pouch-list').first();
		$(itemTmpl).attr('data-pouch-rev',resvalue._rev);
		$.each(itemTmpl.data(),function(fk,fv) {
			if (resvalue[fv]) {
				itemTmpl.attr(fv,resvalue[fv]);
				itemTmpl.removeAttr('data-'+fv);
			}
		});
		$.each($(itemTmpl).children('.pouch-list-value'),function(key,value) {  //:not(.pouch-list .pouch-list .pouch-list-value)
			// REPLACE DOM ELEMENT HTML WITH FIELD VALUE
			// special case for attachments
			if ($(value).data('pouchField')=='_attachments') {
				var attTmpl;
				var saveTmpl=false;
				// are we refreshing the list in which case we have already stashed the template
				if ($('.filetemplate',value).length>0) {
					attTmpl=$($('.filetemplate',value).html());
					//console.log('REFRESH',attTmpl);
				// or are we getting the list template for the first time
				} else {
					attTmpl=$('<div class="file">'+$(value).html()+'</div>');
					//console.log('FRIST TIME',attTmpl);
					saveTemplate=$('<div class="filetemplate" style="display:none" >'+attTmpl[0].outerHTML+'</div>');
				}
				//console.log('att tmpl',attTmpl);
				//console.log('render attach',resvalue);
				if (resvalue.doc['_attachments'])  {
					//console.log('have attach for this record');
					// FILTER ATTACHMENTS BY FOLDER AND SORT
					// if folder has trailing slash then include all files inside this path. If no trailing slash, only include files directly inside this folder.
					var folder=$(value).data('pouchFolder');
					if (!folder) folder=''; 
					var folderTrailingSlash=false;
					if (folder.substr(folder.length-1)=="/") folderTrailingSlash=true;
					var folderNoTrailingSlash=folder;
					if (folderTrailingSlash) folderNoTrailingSlash=folder.substr(0,folder.length-1);
					else folderNoTrailingSlash='';
					var folderPathDepth=folderNoTrailingSlash.split("/").length;
					var attList=$('<div class="attachments" />');
					var attachmentsToSort=[];
					//console.log('folder',folder,'hasSlash',folderTrailingSlash,folderNoTrailingSlash,folderPathDepth);
					$.each(resvalue.doc['_attachments'],function(rvk,rvv) {
						//console.log('ATTRC',rvk,rvv);
						var filePathDepth=rvk.split("/").length;
						//console.log('ATTRC2',rvk,rvv);
						//console.log('filepathdetph',filePathDepth);
						if (folder.length==0 || (rvk.indexOf(folder)==0 && (!folderTrailingSlash || (folderTrailingSlash && folderPathDepth==filePathDepth)))) {
							//console.log('include this file');
							rvv.name=rvk;
							attachmentsToSort.push({key:rvk,content:rvv});
						}
					});
					attachmentsToSort.sort(function(a,b) {if (a.key.toLowerCase()<b.key.toLowerCase()) return -1; else return 1;});
					//console.log('SORTED',attachmentsToSort);
					// RENDER
					$.each(attachmentsToSort,function(rvka,rvva) {
						var attTmplCopy=$(attTmpl[0].outerHTML);
						//console.log('COPIED',attTmpl[0].outerHTML);
						var rvk=rvva.key;
						var rvv=rvva.content;
						var renderableImage=false;
						if (rvv.content_type && (rvv.content_type=='image/jpeg' || rvv.content_type=='image/jpg' || rvv.content_type=='image/gif' || rvv.content_type=='image/png' || rvv.content_type=='image/svg+xml' || rvv.content_type=='image/bmp')) renderableImage=true;
						var imageRendered=false;
						var linkRendered=false;
						if (renderableImage && $('img',attTmplCopy).length>0) {
							$('img',attTmplCopy).attr('alt',rvv.name);
							$('img',attTmplCopy).attr('title',rvv.name);
							// async load image
							$('img',attTmplCopy).attr('data-pouch-db',list.data('pouchDb'));
							$('img',attTmplCopy).attr('data-pouch-id',resvalue.id);
							$('img',attTmplCopy).attr('data-pouch-attachmentid',rvk);		
							$('img',attTmplCopy).attr('data-pouch-loadme','yes');
							imageRendered=true;
						} else {
							$('img',attTmplCopy).remove();
						}
						//console.log('RENDERED IMAGE',attTmplCopy)
						if ($('a',attTmplCopy).length>0) {
							// only render link text if no image
							if (!imageRendered) { 
								$('a',attTmplCopy).append(rvv.name);	
							}
							$('a',attTmplCopy).attr('href','#');
							linkRendered=true;
						}
						if (!imageRendered && !linkRendered) {
							//console.log('DEFAULT LINK RENDER');
							attTmplCopy.append('<a href="#" >'+rvk+'</a>');
						}
						attList.append('<div class="file" data-attachment-id="'+rvk+'" >'+attTmplCopy.html()+'</div>');
						//console.log('ATTMPL',attTmplCopy);
					});
					//console.log('RENATTC',attList)
					$(value).html(attList[0].outerHTML);
				} else {
					$(value).html('');
				}
				if (saveTemplate) $(value).prepend(saveTemplate); 
			} else if (resvalue.doc[$(value).data('pouchField')]) {
				var label='';
				if ($('label',value).length>0) label=$('label',value)[0].outerHTML;
				$(value).html(label+valueFromObjectPath(resvalue.doc,$(value).data('pouchField')));
				$('label',value).show();
			}
			else {
				var label='';
				if ($('label',value).length>0) label=$('label',value)[0].outerHTML;
				$(value).html(label);
				$('label',value).hide();
			}
		});
		// REPLACE INPUT VALUES
		$.each($(itemTmpl).children('.pouch-list-input'),function(key,value) {
			$.each($('input,textarea,select',value).first(),function(ik,formInput) {
				//console.log('HAVE input');
				// REPLACE DOM ELEMENT HTML input WITH FIELD VALUE
				// FILE
				if ($(formInput).attr('type')=='file') {
					var attachmentsAfter=$(formInput);
					if ($(formInput).siblings('input[type="file"]').length>0) attachmentsAfter=$(formInput).siblings('input[type="file"]').last();
					//console.log('filetypeinput');
					var attachmentsDOM;
					// ALLOW FOR VALUE UPDATE
					if ($(formInput).siblings('.attachments').length>0) {
						attachmentsDOM=$(formInput).siblings('.attachments').first();
						$('.file:not(.file.pending)',attachmentsDOM).remove();
					// OTHERWISE CREATE DOM FOR ATTACHMENT LIST
					} else {
						attachmentsDOM=$('<div class="attachments"></div>');
						$(attachmentsAfter).after(attachmentsDOM);
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
			$.each($(itemTmpl).children('.pouch-list'),function(key,valueFrom) {
				var value=valueFrom;
				if ($(valueFrom).data('listTemplate')) {
					value=$(valueFrom).data('listTemplate');
				} else {
					$(valueFrom).data('listTemplate',$(value).get(0).outerHTML)
				}
				var bak=value;
				var ivalue=$($(value)[0].outerHTML);
				var iresult='';
				$(ivalue).uniqueId();
				var field=$(ivalue).data('pouchField');
				if (field && field.length>0) {
					$(ivalue).attr('data-startkey',resvalue.doc[field]);
					$(ivalue).attr('data-endkey',resvalue.doc[field]);
					function setVal(val) {
						loadList(ivalue).then(function(res) {
							renderList(res,ivalue).then(function(rl) {
								$(valueFrom).html(rl.html());
							});
						});
					}
					setVal(value);
				}
			})
		}			
		// REPLACE COLLATIONS			
		$.each($(itemTmpl).children('.pouch-list-collation'),function(pkey,collationTemplate) {
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
		console.log('PL',$(list).data('listTemplate')); //,res);//.generateList();
		// create new dom from listTemplate
		var itemTmpl=$('.pouch-list-item:not(.pouch-list-item .pouch-list-item)',listTmpl);
		// IF WE HAVE MULTI DIMENSIONAL KEYS, WE ARE COLLATING
		//console.log('RL',itemTmpl.length,listTmpl[0].outerHTML)
		//var resCache={};
		//$.each(res.rows,function(rk,rv) {
		//	resCache[rv.id]=rv;
		//});
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
		//console.log('repvals',resCache);
		//$('.pouch-list-item:not(.pouch-list-item .pouch-list-item)',list).each(function(m,mm) {
		//$(list).children('.pouch-list-item').each(function(m,mm) {
		//	var itemId=$(mm).data('pouchId');
		//	substituteRecordValues($(mm),resCache[itemId]); //res.rows[0]);
		//	console.log('substituteRecordValues',$(mm),resCache[itemId]);
		//});
		//console.log('liste rendered',list) ;//,listTmpl.html());
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
		$.each($('img[data-pouch-loadme="yes"]',$(list)),function() {
			asyncLoadImage($(this));
		});
		$(list).show();
		//console.log('rendered list',res,$(list).data()); //,$(list)[0].outerHTML);
		dfr.resolve(list);
		return dfr;
	}