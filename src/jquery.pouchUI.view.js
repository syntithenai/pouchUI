pouchUILib.view = {
	valueFromObjectPath: function(obj, path, def){
		for(var i = 0,path = path.split('.'),len = path.length; i < len; i++){
			if(!obj || typeof obj !== 'object') return def;
			obj = obj[path[i]];
		}
		if(obj === undefined) return def;
		return obj;
	},
	startWaiting : function() {
		if ($('#loading').length==0) $('body').prepend('<div id="loading"><img src="loading.gif" /></div>');
		$('#loading').show();
	},
	stopWaiting : function() {
		$('#loading').hide();
	},
	/**********************************************
	* Determine the full path of an element
	* @param raw DOM element to find path for
	* @return a string containing the path as a CSS selector
	**********************************************/
	getDomPath : function (el,slice) {
	  var stack = [];
	  while ( el.parentNode != null ) {
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
			finalVal=stack.slice(slice).join(' > ');
		} else {
			finalVal=stack.join(' > ');
		}
		return finalVal;
	},
	bindEventsTo : function(el) {
		el.bind('click.pouch',pouchUILib.controller.onPouchClick);
		var timer;
		$(el).bind('keyup',function(e) {
			 if (timer) {
				window.clearTimeout(timer);
			}
			timer = window.setTimeout( function() {
				timer = null;
				pouchUILib.controller.onPouchInputChange(e);
			}, 500 );
			
		})
		$(el).bind('change',function(e) {
			 if (timer) {
				window.clearTimeout(timer);
			}
			timer = window.setTimeout( function() {
				timer = null;
				pouchUILib.controller.onPouchInputChange(e);
			}, 500 );
			
		})
	},
	getTemplate : function(path) {
		//console.log('gettemplate',path)
		//console.log(pluginTemplate[0].outerHTML);
		var v=$(path,$(pluginTemplate));
		//console.log('v',v.length)
		return v;
	},
	updateListItem : function(resvalue,itemTmpl,list) {
		//console.log('updateListItem',resvalue,itemTmpl);
		if (resvalue.doc) {
			$.each($(itemTmpl).children('.pouch-list-value'),function(key,value) { 
				pouchUILib.view.updateListItemValues(value,resvalue,list);
			});
			$.each($('img[data-pouch-loadme="yes"]',$(list)),function() {
				pouchUILib.view.asyncLoadImage($(this));
			});
		}
	},
	showNoResults : function(iList) {
		var firstItem=$('.pouch-list-item',iList).first();
		if (firstItem.length>0) {
			//console.log('NORES',firstItem,$(iList).data('templatepath'),pouchUILib.view.getTemplate($(iList).data('templatepath'),2));
			var allItems=$(iList).children('.pouch-list-item');
			// for all children, look at their immediate children for list items
			var secondLevel=$(iList).children();
			$.each(secondLevel,function(sk,sv) {
				allItems=allItems.add($(sv).children('.pouch-list-item'));
			});
			var noRes=$('.pouch-list-noresults',pouchUILib.view.getTemplate($(iList).data('templatepath'),2)).last();	
			//noRes='<b>No Res</b>';
			firstItem.after(noRes);
			$('label',iList).remove();
			firstItem.remove();
			allItems.remove();
		}
	},
	findSearchDOM : function (list) {
		var buttonDOM=$(list);
		// if search buttons aren't in list then look in whole page
		if ($('[data-pouch-action="paginate-first"],[data-pouch-action="paginate-previous"],[data-pouch-action="paginate-next"],[data-pouch-action="paginate-last"]',list).length==0) {
			buttonDOM=$(list).parents('[data-role="page"]').find('.pouch-search');
			//console.log('UPDATE PAGINATION FROM WHOLE PAGE',buttonDOM);
			
		}
		return buttonDOM;
	},
	updatePagination : function(list,res,from) {
		var buttonDOM=pouchUILib.view.findSearchDOM(list);
		var skip=$(list).data('pouchSkip');
		if (skip===undefined || parseInt(skip)==='NaN') skip=0;
		var limit=$('.pouch-limit',buttonDOM).val();  //$(list).data('pouchLimit'));
		if (limit===undefined || parseInt(limit)==='NaN') skip=10;
		var maxRecords=parseInt(res.total_rows);
		var next=skip+limit;
		var previous=skip-limit;
		if (previous<0) previous=0;
		var last=maxRecords;
		if (limit>0) last=Math.floor(maxRecords/limit)*limit;
		
		$('[data-pouch-action="paginate-first"]',buttonDOM).attr('data-pouch-skip-to',0);
		$('[data-pouch-action="paginate-previous"]',buttonDOM).attr('data-pouch-skip-to',previous);
		$('[data-pouch-action="paginate-next"]',buttonDOM).attr('data-pouch-skip-to',next);
		$('[data-pouch-action="paginate-last"]',buttonDOM).attr('data-pouch-skip-to',last);
		
		console.log(skip<limit,'SKIP',skip,'limit',limit,'max',maxRecords,'next',next,'prev',previous,'laset',last);
		
		if (skip == 0) { 
			$('[data-pouch-action="paginate-first"]',buttonDOM).addClass('disabled');
		} else {
			$('[data-pouch-action="paginate-first"]',buttonDOM).removeClass('disabled');
		}
		if (skip < limit) {
			//console.log('skip<limit');
			$('[data-pouch-action="paginate-previous"]',buttonDOM).addClass('disabled');
		} else {
			$('[data-pouch-action="paginate-previous"]',buttonDOM).removeClass('disabled');
		}
		if (next >= maxRecords) {
			$('[data-pouch-action="paginate-next"]',buttonDOM).addClass('disabled');
			$('[data-pouch-action="paginate-last"]',buttonDOM).addClass('disabled');
		} else {
			$('[data-pouch-action="paginate-next"]',buttonDOM).removeClass('disabled');
			$('[data-pouch-action="paginate-last"]',buttonDOM).removeClass('disabled');
		}
		if ($('[data-pouch-action="paginate-first"]',buttonDOM).length>0) console.log('updatePagination',skip,next,previous,last,maxRecords,limit,from);
		
		// set limit DOM value in list
		$('.pouch-limit',buttonDOM).val(limit)
	},
	updateListItemValues : function(value,resvalue,list) {
		if ($(value).data('pouchField')=='_attachments') {
			var attTmpl;
			var saveTmpl=false;
			// are we refreshing the list in which case we have already stashed the template
			if ($('.filetemplate',value).length>0) {
				attTmpl=$($('.filetemplate',value).html());
				console.log('REFRESH',attTmpl);
			// or are we getting the list template for the first time
			} else {
				attTmpl=$('<ul class="file">'+$(value).html()+'</div>');
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
				var attList=$('<div class="attachments"  />');
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
					$('label',attTmplCopy).remove();
					//console.log('COPIED',attTmpl[0].outerHTML);
					var rvk=rvva.key;
					var rvv=rvva.content;
					var renderableImage=false;
					if (rvv.content_type && (rvv.content_type=='image/jpeg' || rvv.content_type=='image/jpg' || rvv.content_type=='image/gif' || rvv.content_type=='image/png' || rvv.content_type=='image/svg+xml' || rvv.content_type=='image/bmp')) {
						renderableImage=true;
					}
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
					var classNames='file';
					if (imageRendered) classNames='file image';
					attList.append('<div class="'+classNames+'" data-attachment-id="'+rvk+'" >'+attTmplCopy.html()+'</div>');
					//console.log('ATTMPL',attTmplCopy);
				});
				//console.log('RENATTC',attList)
				var label='';
				if ($('label',value).length>0) label=$('label',value)[0].outerHTML;
				$(value).html(label+attList[0].outerHTML);
				$('label',value).show();
			} else {
				var label='';
				if ($('label',value).length>0) label=$('label',value)[0].outerHTML;
				$(value).html(label);
				$('label',value).hide();
			}
			if (saveTemplate) $(value).prepend(saveTemplate); 
		} else if (resvalue.doc[$(value).data('pouchField')]) {
			var label='';
			if ($('label',value).length>0) label=$('label',value)[0].outerHTML;
			$(value).html(label+pouchUILib.view.valueFromObjectPath(resvalue.doc,$(value).data('pouchField')));
			$('label',value).show();
		} else {
			var label='';
			if ($('label',value).length>0) label=$('label',value)[0].outerHTML;
			$(value).html(label);
			$('label',value).hide();
		}
	},
	renderList : function (res,list,options) {
		var dfr=$.Deferred();
		//var result=$('<div/>');
		var items=[];
		if (list) {
			if (!list.jquery) list=$(list);
			var listTmpl=pouchUILib.view.getTemplate(list.data('templatepath'));
			var itemTmplBackup=listTmpl.find('.pouch-list-item').first().clone(true);
			//console.log('RENDER LIST',res,itemTmplBackup,listTmpl)
			if (res.rows && res.rows.length>0) {
				$.each(res.rows,function(reskey,resvalue) {
					if (resvalue.doc) {
						var itemTmpl=itemTmplBackup.clone(true);
						// SET ROW METADATA
						itemTmpl.attr('data-pouch-id',resvalue.doc._id);
						itemTmpl.attr('data-pouch-rev',resvalue.doc._rev);
						// REPLACE LIST VALUES
						$.each($(itemTmpl).children('.pouch-list-value').add($(itemTmpl).find('> * >.pouch-list-value')),function(key,value) { 
							pouchUILib.view.updateListItemValues(value,resvalue,list);
						});
						// REPLACE ITEM ATTRIBUTES
						function replaceAttributes(itemTmpl,resvalue) {
							$.each($(itemTmpl).data(),function(fk,fv) {
								if (resvalue && resvalue.doc && resvalue.doc[fv]) {
									console.log('REPLACE ATTR',fk,fv,resvalue.doc[fv]);
									$(itemTmpl).attr(fk,$(itemTmpl).attr(fk)+resvalue.doc[fv]);
									$(itemTmpl).removeAttr('data-'+fk);
								}
							});						
						}
						$.each($(itemTmpl).add($(itemTmpl).find('.pouch-updateattributes')).filter('.pouch-updateattributes'),function() {
							replaceAttributes(this,resvalue);
							console.log('UPDATETHIE',$(this).data(),resvalue.doc);
						});
						console.log('ATTRIB')
						// REPLACE INPUT VALUES
						//console.log('REPALCE INPUTS ',itemTmpl);
						$.each($(itemTmpl).children('.pouch-list-input').add($(itemTmpl).find('> *:not(.pouch-list) .pouch-list-input')).add($(itemTmpl).find('> *:not(.pouch-list) > *:not(.pouch-list) .pouch-list-input')),function(key,value) {
						//console.log('REPALCE INPUT ',value);
							$.each($('input,textarea,select',value).first(),function(ik,formInput) {
								//console.log('HAVE input',formInput);
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
										attachmentsDOM=$('<div class="attachments" data-role="listview" ></div>');
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
													attachmentsToSort.push({key:atk,content:'<div class="file" data-docid="'+atk+'" data-mime="'+atv.content_type+'" ><span class="ui-btn ui-btn-inline ui-btn-mini" data-pouch-action="deletefile" >X</span><a target="_new" >'+remaining+'</a></div>'});
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
										$(formInput).html(pouchUILib.view.valueFromObjectPath(resvalue.doc,$(value).data('pouchField')))
									} else {
										$(formInput).attr('value',pouchUILib.view.valueFromObjectPath(resvalue.doc,$(value).data('pouchField')));
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
						//console.log('RENDERed set vals');
						// REPLACE LISTS
						$.each($(itemTmpl).children('.pouch-list').add($(itemTmpl).find('> * >.pouch-list')),function(key,iList) {
							var field=$(iList).data('pouchField');
							if (field && field.length>0 && resvalue.doc[field]) {
								if ($(iList).data('pouchMmseperator') && $(iList).data('pouchMmseperator').length && $(iList).data('pouchMmseperator').length>0) {
									$(iList).attr('data-keys',resvalue.doc[field]);
								} else {
									$(iList).attr('data-key',resvalue.doc[field]);
								}
								//$(iList).attr('data-endkey',resvalue.doc[field]);
								pouchUILib.model.loadList(iList,options).then(function(res2) {
									if (res2 && res2.rows && res2.rows.length>0)  {
										pouchUILib.view.renderList(res2,iList,options).then(function (items) {
											var firstItem=$('.pouch-list-item',iList).first();
											//console.log('RENDER CHILD	 LIST APPEND TO ',firstItem)
					
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
										pouchUILib.view.showNoResults(iList);
									}
								});
							}  else {
								pouchUILib.view.showNoResults(iList);
							}
						});
						items.push(itemTmpl);
						
					}
				});
			}
		}

		$(list).show();
		//console.log('listed',$('.pouch-list-noresults',list));
		return dfr.resolve(items);
	},
	asyncLoadImage : function (image,options) {
		//console.log('ASUNC LOAD IMAGE',image);
		if (image.data('pouchDb') && image.data('pouchId') && image.data('pouchAttachmentid')) {
			var pouch=pouchUILib.model.getDB(image.data('pouchDb'),options);
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
	},
	flashMessage: function(popupId,message,duration) {
		//console.log('popup',popupId,message);
		var messageDOM=$('<span/>');
		if (!duration || parseInt(duration)<=0)  duration=2500;
		if (message && message.length && message.length>0) {
			var messageDOM=$('<span>'+message+'</span>');
			//console.log(messageDOM)
			$(popupId).append(messageDOM);
		}
		$(popupId).popup('open');
		setTimeout(function() {
			$(popupId).popup('close');
			messageDOM.remove();
		},duration);
	}
	
}
