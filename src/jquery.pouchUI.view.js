$.fn.pouchUI.api.view = {
	// RETURN A AN OBJECT VALUE ALLOWING FOR NESTED OBJECT PATH EG user.contacts.phone.number
	valueFromObjectPath: function(obj, path, def){
		var plugin=this;
		if (true || path && path.length>0) {
			for(var i = 0,path = path.split('.'),len = path.length; i < len; i++){
				if(!obj || typeof obj !== 'object') return def;
				obj = obj[path[i]];
			}
			if(obj === undefined) return def;
		}
		return obj;
	},
	/**********************************************
	* Determine the full path of an element
	* @param raw DOM element to find path for
	* @param slice - remove this many elements from start of path
	* @return a string containing the path as a CSS selector
	**********************************************/
	getDomPath : function (el,slice) {
	 //console.log('get dom path',el);
	 var plugin=this;
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
	  //console.log(stack);
	  var finalVal='';
		if (slice && slice >0) {
			finalVal=stack.slice(slice).join(' > ');
		} else {
			finalVal=stack.join(' > ');
		}
		//console.log(finalVal);
		return finalVal;
	},
	hashFromUrl : function(href) {
		var hrefParts;
		if (href && href.length>0) hrefParts=href.split('#');
		var hrefSubParts;
		if (hrefParts  && hrefParts.length==2 && hrefParts[1]&& hrefParts[1].length>0) {
			hrefSubParts=hrefParts[1].split('?'); 
		}	
		var hash='';
		if (hrefParts && hrefParts.length==2) {
			hash=hrefSubParts[1];
		}
		return hash;
	},
	findSearchTargetList : function (searchForm,triggerSearchButton,suggestedTargetList) {
		var plugin=this;
		// target list must already be loaded into DOM and is identified by 
		//- href attribute set on the trigger element
		//- action attribute set on the search form
		//- parent list to search form
		//- first list in page (allowing for jqmobile) 
		
		// FIND TARGET
		var targetList;
		// TARGET ON TRIGGER
		var buttonHash;
		if (triggerSearchButton) buttonHash=plugin.api.view.hashFromUrl($(triggerSearchButton).attr('href'));
		var formHash=plugin.api.view.hashFromUrl(searchForm.attr('action'));
		// FROM BUTTON HREF
		if (buttonHash && buttonHash.length>0) {
			if ($('#'+buttonHash).hasClass('pouch-list')) {
				targetList=$('#'+hash);
			} else {
				targetList=$('.pouch-list:not(.pouch-list .pouch-list)',$('#'+buttonHash)).first();
			}
		// FROM FORM ACTION
		} else if (formHash && formHash.length>0) {
			if ($('#'+formHash).hasClass('pouch-list')) {
				targetList=$('#'+hash);
			} else {
				targetList=$('.pouch-list:not(.pouch-list .pouch-list)',$('#'+formHash)).first();
			}
		// TARGET OPTION FROM CONTROLLER
		} else if (suggestedTargetList && $(suggestedTargetList).length>0) {
			targetList=suggestedTargetList;
		// PARENTS OF TRIGGER
		} else if ($(triggerSearchButton).parents('.pouch-list').length>0) {
			// list is parent of button 
			targetList=$(triggerSearchButton).parents('.pouch-list').first();
		} else {
			// fallback to first list in page/body
			var page=$('body');
			if ($.jqmData) { 
				page=$(triggerSearchButton).parents('[data-role="page"]').first();
			}
			targetList=$('.pouch-list',page).first();
		} 
		return targetList;
			
	},
	// BIND CLICK,DELAYED KEYUP AND DELAYED CHANGE EVENTS TO ELEMENT
	bindEventsTo : function(el) {
		var plugin=this;
			//console.log('bind events to FOR REAL',el);
			//$.each($('[data-pouch-action]',el),function() {
			//	console.log('bind click to action',this);
			//	$(this).off('click.pouchUI');
			//	$(this).on('click.pouchUI',plugin.api.controller.onPouchClick);
			//});
			$(el).off('click.pouchUI');
			$(el).on('click.pouchUI',plugin.api.controller.onPouchClick);
			var timer;
			$(el).off('keyup.pouchUI');
			$(el).on('keyup.pouchUI',function(e) {
				 if (timer) {
					window.clearTimeout(timer);
				}
				timer = window.setTimeout( function() {
					timer = null;
					plugin.api.controller.onPouchInputKeyup(e);
				}, 500 );
				
			})
			$(el).off('change.pouchUI');
			$(el).bind('change.pouchUI',function(e) {
				 if (timer) {
					window.clearTimeout(timer);
				}
				timer = window.setTimeout( function() {
					timer = null;
					plugin.api.controller.onPouchInputChange(e);
				}, 500 );
				
			})
		
	},
	// GET A TEMPLATE SECTION AS A NEW OBJECT
	// @param path eg #edititemplate div:(3)
	// @return new jquery object containing the html from the plugin that matches the requested path
	getTemplate : function(path) {
		var plugin=this;
		//console.log('gettemplate',path); //,plugin.pluginTemplate.html())
		//console.log('gettemplate',pluginTemplate[0].outerHTML);
		var v=$($(path,$(plugin.pluginTemplate))[0].outerHTML);
		//console.log('v',v.length); //,v.html())
		return v;
	},
	// UPDATE THE VALUES OF A LIST ITEM 
	// TODO - does NOT update list item inputs or attributes or sub lists
	/*updateListItem : function(resvalue,itemTmpl,list) {
		var plugin=this;
		//console.log('updateListItem',resvalue,itemTmpl);
		if (resvalue.doc) {
			$.each($(itemTmpl).children('.pouch-list-value'),function(key,value) { 
				console.log('PLV',value);
				plugin.api.view.updateListItemValues(value,resvalue,list);
			});
			$.each($('img[data-pouch-loadme="yes"]',$(list)),function() {
				plugin.api.view.asyncLoadImage($(this));
			});
		}
	},*/
	updateListItemAll : function(resvalue,itemTmpl,list) {
		var plugin=this;
		var mdfr=$.Deferred();
		//	console.log('UPDATELISTITEMALL',resvalue,itemTmpl,list);
		// SET ROW METADATA
		$(itemTmpl).attr('data-pouch-id',resvalue.doc._id);
		$(itemTmpl).attr('data-pouch-rev',resvalue.doc._rev);
		// REPLACE LIST VALUES
		/*$.each($(itemTmpl).children('.pouch-list-value').add($(itemTmpl).find('> * >.pouch-list-value')),function(key,value) { 
			plugin.api.view.updateListItemValues(value,resvalue,list);
		});*/
		//var valueFields=plugin.api.view.collectChildrenButNotLists(itemTmpl);
		var valueFields= $(itemTmpl).children('.pouch-list-value').add($(itemTmpl).find('> * >.pouch-list-value'));
		var disableInputGeneration=false;
		//console.log('IT',$(itemTmpl)[0].classList,$(itemTmpl[0]),resvalue);
		//console.log($.inArray('pouch-list-value',$(itemTmpl)[0].classList));
		
		// when list also has attributes data-pouch-list-value and data-pouch-field skip values iteration
		if ($.inArray('pouch-list-value',$(itemTmpl)[0].classList)) {
			if ($(itemTmpl).data('pouchField') && $(itemTmpl).data('pouchField').length>0) {
				//console.log('also list value',$(itemTmpl).data('pouchField'),resvalue.doc[$(itemTmpl).data('pouchField')]);		
				itemTmpl.html(resvalue.doc[$(itemTmpl).data('pouchField')]);
				disableInputGeneration=true;
			} else {
				$.each(valueFields,function(key,value) { 
					plugin.api.view.updateListItemValues(value,resvalue,list);
				});
			}
		}
		// REPLACE ITEM ATTRIBUTES
		function replaceAttributes(itemTmpl,resvalue) {
			$.each($(itemTmpl).data(),function(fk,fv) {
				//console.log('tryattr',fk,fv);
				if (fk && fk.length>14 && fk.substr(0,14)=="pouchAttribute") {// && fk.startsWith('pouchAttribute')) { 
					fk=fk.substr(14);
					//console.log(fk);
					if (fk) fk=fk.toLowerCase();
					if (resvalue && resvalue.doc && resvalue.doc[fv]) {
						//console.log('REPLACE ATTR',fk,fv,resvalue.doc[fv],itemTmpl);
						//if (typeof $(itemTmpl).attr(fk)==="undefined") $(itemTmpl).attr(fk)='';
						var initVal='';
						if (typeof $(itemTmpl).attr(fk)!=="undefined") initVal=$(itemTmpl).attr(fk);
						$(itemTmpl).attr(fk,initVal+resvalue.doc[fv]);
						//$(itemTmpl).removeAttr('data-'+fk);
					}
				}
			});						
		}
		console.log('UPDATE ATTRIBUTES???',$(itemTmpl).find('.pouch-updateattributes').filter('.pouch-updateattributes')); //
		//$(itemTmpl).add($(itemTmpl).children('.pouch-updateattributes'))); //);
		// item and children where .pouch-updateattributes
		$.each($(itemTmpl).add($(itemTmpl).find('.pouch-updateattributes')).filter('.pouch-updateattributes'),function() {
			replaceAttributes(this,resvalue);
			//console.log('UPDATETHIE',$(this).data(),resvalue.doc);
		});
		//console.log('ATTRIB')
		// REPLACE INPUT VALUES
		//console.log('REPALCE INPUTS ',plugin.api.view.collectChildrenButNotLists($(itemTmpl)),itemTmpl);
		var inputs={};
		$.each(plugin.api.view.collectChildrenButNotLists($(itemTmpl),'.pouch-list-input'),function(key,value) {
			//console.log('REPALCE INPUT ',key,value,resvalue);
			if ($(value).data('pouchDefault') && !resvalue.doc.id && !resvalue.doc[$(value).data('pouchField')]) {
				resvalue.doc[$(value).data('pouch-field')]=$(value).data('pouch-default');
				//console.log('DEFAULT',resvalue);
				plugin.api.view.replaceInputs(value,resvalue);
			} else { 
				//console.log('SEt',value,resvalue);
				//HERE NO //
				plugin.api.view.replaceInputs(value,resvalue);
			}
			inputs[$(value).data('pouch-field')]=1;
			//plugin.api.view.replaceInputs(value,resvalue);
		});
		//console.log('updated inputs',inputs);
		/*if ($.inArray('_rev',inputs)==-1) {
			console.log('ADD REV FIELD');
			itemTmpl.append('<span style="display: none" class="pouch-list-value" data-pouch-field="_rev" ><input type="hidden" value="'+resvalue._rev+'" />');
		} */
		if (!disableInputGeneration && inputs['type']!=1) {
			// if type is blank ensure that type is set, either from parent list or undefined
			var typeValue;
			if (list.data('pouchIndex')) {
				typeValue=list.data('pouchIndex').split("/")[0];
			}
			if (!typeValue) typeValue='undefined'; 
			//console.log('ADD TYPE FIELD');
			itemTmpl.append('<span style="display: none" class="pouch-list-value" data-pouch-field="type" ><input type="hidden" value="'+typeValue+'" /></span>');
		} 
			
		//console.log('RENDERed set vals NOW LISTS',$(itemTmpl),$(itemTmpl).find('> *:not(.pouch-list) > .pouch-list').length);
		
		//> *:not(.pouch-list) > 
		var promises=[];
		$.each($(itemTmpl).children('.pouch-list').add($(itemTmpl).find('.pouch-list')),function(key,iList) {
			// REPLACE LISTS
			var field=$(iList).data('pouchField');
			console.log('REPLACE LISTS',field,resvalue.doc[field],iList);
			if (field && field.length>0 && resvalue.doc[field]) {
				if ($(iList).data('pouchMmseperator') && $(iList).data('pouchMmseperator').length && $(iList).data('pouchMmseperator').length>0) {
					$(iList).attr('data-keys',resvalue.doc[field]);
				} else {
					//console.log('REPLACE LIST SET STARTENDKEY',resvalue.doc[field]);
					//$(iList).attr('data-key',resvalue.doc[field]);
					$(iList).attr('data-startkey',$.trim(resvalue.doc[field]));
					$(iList).attr('data-endkey',$.trim(resvalue.doc[field]+"\ufff0"));
				}
				//$(iList).attr('data-endkey',resvalue.doc[field]);
				var dfr=$.Deferred();
				promises.push(dfr);
				plugin.api.model.loadList(iList).then(function(res2) {
					if (res2 && res2.rows && res2.rows.length>0)  {
						plugin.api.view.renderList(res2,iList).then(function (items) {
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
							dfr.resolve();
						});
					} else {
						plugin.api.view.showNoResults(iList);
						dfr.resolve();
					}
				});
			}  else {
				plugin.api.view.showNoResults(iList);
			}
		});
		$.when.apply($,promises).then(function() {
			//console.log('UPDATELISTITEMALL TRIGGER',itemTmpl);
			$(itemTmpl).trigger('pouchui.updatelistitem',[itemTmpl]);				
			mdfr.resolve();
		});
		return mdfr;
	},
	// SHOW THE NO RESULTS BLOCK 
	// removes all pouch-list-items and inserts the pouch-list-noresults section of the template relevant to the current list
	showNoResults : function(iList) {
		var plugin=this;
		/*var firstItem=$('.pouch-list-item',iList).first();
		if (firstItem.length>0) {
			//console.log('NORES',firstItem,$(iList).data('templatepath'),plugin.api.view.getTemplate($(iList).data('templatepath'),2));
			var allItems=$(iList).children('.pouch-list-item');
			// for all children, look at their immediate children for list items
			var secondLevel=$(iList).children();
			$.each(secondLevel,function(sk,sv) {
				allItems=allItems.add($(sv).children('.pouch-list-item'));
			});
			var noRes=$('.pouch-list-noresults',plugin.api.view.getTemplate($(iList).data('templatepath'))).last();	
			//noRes='<b>No Res</b>';
			firstItem.after(noRes);
			$('label',iList).remove();
			firstItem.remove();
			allItems.remove();
		}*/
		var tmpl=$(plugin.api.view.getTemplate($(iList).data('templatepath'))).last();	
		//console.log('GOT TEMPLATE FOR NO RES',tmpl);
		$(iList).html(tmpl.html());
		$('.pouch-list-item',iList).remove();
		$('.pouch-list-noresults',iList).show();
	},
	// FIND SEARCH FROM FOR LIST
	// look for class pouch-search inside list
	// OR look for class pouch-search inside containing page
	findSearchDOM : function (list) {
		var plugin=this;
		var searchForm;
		// did we get passed the form ?
		if ($(list).hasClass('pouch-search')) {
			//console.log('on the button');
			searchForm=list;
		} else if ($('.pouch-search',list).length>0) {
		// is the form inside	
			searchForm=$('.pouch-search',list);
		// if search buttons aren't in list then look in whole page
		} else  {
			var page=$('body');
			if ($.jqmData) page=$(list).parents('[data-role="page"]')
			searchForm=page.find('.pouch-search');
			//console.log('UPDATE PAGINATION FROM WHOLE PAGE',buttonDOM);
		}
		return searchForm;
	},
	// UPDATE PAGINATION BUTTONS TO update data-skip-to for current list results
	// depends on meta data in list - pouchSkip, pouchLimit, pouch
	// sets button meta data pouchSkipTo
	// doesn't update paginate-last button which is handled specially
	updatePagination : function(list,res) {
		var plugin=this;
		var buttonDOM=plugin.api.view.findSearchDOM(list);
		var skip=$(list).attr('data-pouch-skip');
		console.log('startfromlist',skip);
		if (parseInt(skip)>0) skip=parseInt(skip);
		else skip=0; 
		//if (skip===undefined || parseInt(skip)=='NaN') skip=0;
		//	else skip=parseInt(skip);
		var limit=$('select.pouch-limit',buttonDOM).val();  //$(list).data('pouchLimit'));
		//console.log('LImITTI',limit)
		if (limit===undefined || parseInt(limit)==='NaN') limit=10;
		else limit=parseInt(limit);
		var maxRecords;
		if (res.rows) maxRecords=parseInt(res.total_rows); //res.rows.length;
		var next=skip;
		if (skip+limit < maxRecords) next=skip+limit;
		var previous=0;
		if (skip-limit>=0) previous=skip-limit;
		if (previous<0) previous=0;
		var last=maxRecords-limit;
		if (last<0) last=0;
		//if (limit>0) last=Math.floor(maxRecords/limit)*limit;
		console.log('UPDATE PAGINATION',previous,next,maxRecords,limit,skip)
		$('[data-pouch-action="paginate-first"]',buttonDOM).attr('data-pouch-skip-to',0);
		$('[data-pouch-action="paginate-previous"]',buttonDOM).attr('data-pouch-skip-to',previous);
		$('[data-pouch-action="paginate-next"]',buttonDOM).attr('data-pouch-skip-to',next);
		$('[data-pouch-action="paginate-last"]',buttonDOM).attr('data-pouch-skip-to',last);
		
		//console.log('UPD PAG',res,buttonDOM,skip<limit,'SKIP',skip,'limit',limit,'max',maxRecords,'next',next,'prev',previous,'laset',last);
		/*
		// DISABLE PAGINATION BUTTONS AS APPROPRIATE
		if (skip == 0 || ! $(list).data('descending')) {
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
		*/
		//if ($('[data-pouch-action="paginate-first"]',buttonDOM).length>0) console.log('updatePagination',skip,next,previous,last,maxRecords,limit,from);
		
		// set limit DOM value in list
		$('.pouch-limit',buttonDOM).val(limit)
	},
	// UPDATE A FIELD VALUE OF A LIST ITEM 
	// ALLOW FOR REAPPLICATION TO RENDERED LIST ITEM
	updateListItemValues : function(value,resvalue,list) {
		var plugin=this;
		if ($(value).data('pouchField')=='_attachments') {
			plugin.api.view.updateListItemFileValues(value,resvalue,list);
		} else {
			if ($(value).data('pouch-default') && !resvalue.doc.id && !resvalue.doc[$(value).data('pouchField')]) {
				plugin.api.view.rerenderValueWithLabel($(value).data('pouch-default'),value);
			} else { 	
				//console.log('ULI',resvalue.doc,$(value).data('pouchField'));
				plugin.api.view.rerenderValueWithLabel(plugin.api.view.valueFromObjectPath(resvalue.doc,$(value).data('pouchField')),value);
			}
		}
	},
	// UPDATE FIELD VALUE FOR A FILE INPUT LIST ITEM
	// ALLOW FOR REAPPLICATION TO RENDERED LIST ITEM
	updateListItemFileValues : function(value,resvalue,list) {
		var plugin=this;
		var attTmpl;
		var saveTmpl=false;
		// are we refreshing the list in which case we have already stashed the template
		if ($('.filetemplate',value).length>0) {
			attTmpl=$($('.filetemplate',value).html());
			//console.log('REFRESH',attTmpl);
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
			console.log('RENATTC',attList)
			plugin.api.view.rerenderValueWithLabel('',value)
		} else {
			plugin.api.view.rerenderValueWithLabel(attList[0].outerHTML,value)
		}
		if (saveTemplate) $(value).prepend(saveTemplate); 
	},
	
	// HIDE OR SHOW LABEL IF THERE IS A VALUE IN THE DISPLAY FIELD
	// @ param - value of the field to be rendered
	rerenderValueWithLabel : function(fieldValue,value) {
		var plugin=this;
		if (fieldValue && fieldValue.length && fieldValue.length>0) {
			var label='';
			if ($('label',value).length>0) label=$('label',value)[0].outerHTML;
			$(value).html(label+fieldValue);
			$('label',value).show();
		} else {
			var label='';
			if ($('label',value).length>0) label=$('label',value)[0].outerHTML;
			$(value).html(label);
			$('label',value).hide();
		}
	},
	// FIND INNER NODES MATCHING nodeTypeSelector THAT ARE NOT INSIDE .pouch-list elements and return collation
	// SUPPORTS FOUR LEVELS OF DEPTH
	collectChildrenButNotLists : function(itemTmpl,nodeTypeSelector) {
		var plugin=this;
		return $(itemTmpl).children(nodeTypeSelector).add($(itemTmpl).find('> *:not(.pouch-list) '+nodeTypeSelector)).add($(itemTmpl).find('> *:not(.pouch-list) > *:not(.pouch-list) '+nodeTypeSelector)).add($(itemTmpl).find('> *:not(.pouch-list) > *:not(.pouch-list) > *:not(.pouch-list) '+nodeTypeSelector));
	},	
	replaceFileInput : function(formInput,value,resvalue) {
		var plugin=this;
		var attachmentsAfter=$(formInput);
		if ($(formInput).parents('.pouch-list-input').length>0) attachmentsAfter=$(formInput).parents('.pouch-list-input');
		//console.log('filetypeinput');
		var attachmentsDOM;
		// ALLOW FOR VALUE UPDATE
		if ($(formInput).parents('.pouch-list-input').find('.attachments').length>0) {
			attachmentsDOM=$(formInput).parents('.pouch-list-input').find('.attachments').first();
			$('.file:not(.file.pending)',attachmentsDOM).remove();
		// OTHERWISE CREATE DOM FOR ATTACHMENT LIST
		} else {
			console.log('INS ATT AT',attachmentsAfter);
			attachmentsDOM=$('<div class="attachments" data-role="listview" ></div>');
			$(attachmentsAfter).append(attachmentsDOM);
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
	},
	// SET VALUES ON CONTAINED INPUT/TEXTAREA/SELECT INPUTS
	replaceInputs : function(value,resvalue) {
		var plugin=this;
		$.each($('input,textarea,select',value).first(),function(ik,formInput) {
			//console.log('HAVE input',formInput);
			// REPLACE DOM ELEMENT HTML input WITH FIELD VALUE
			// FILE
			if ($(formInput).attr('type')=='file') {
				plugin.api.view.replaceFileInput(formInput,value,resvalue);
			// HAVE VALUE FOR FIELD	
			} else if (resvalue.doc[$(value).data('pouchField')]) {
				if (formInput.type=='rte') {
					//console.log('rte',resvalue.doc,$(value).data('pouchField'));
					$(formInput).val(plugin.api.view.valueFromObjectPath(resvalue.doc,$(value).data('pouchField')))
				} else if (formInput.type=='textarea') {
					//console.log('textarea',formInput); //plugin.api.view.valueFromObjectPath(resvalue.doc,$(value).data('pouchField')),resvalue.doc,$(value).data('pouchField'));
					$(formInput).val(plugin.api.view.valueFromObjectPath(resvalue.doc,$(value).data('pouchField')));
					//$(formInput).html('<b>eek</b>');
				} else {
					//console.log('NOT textarea',resvalue.doc,$(value).data('pouchField'));
					$(formInput).val(plugin.api.view.valueFromObjectPath(resvalue.doc,$(value).data('pouchField')));
					//$(formInput).val(plugin.api.view.valueFromObjectPath(resvalue.doc,$(value).data('pouchField')));
					//console.log('done set value',$(formInput).attr('value'));
					//console.log('done set value',$(formInput).val());
					//$(formInput).toggle();
				}
			// NO VALUE FOR FIELD
			} else {
				//console.log('empty input',formInput);
				if (formInput.type=='textarea') {
					$(formInput).text('');
				} else {
					$(formInput).val('');
				}
			}	
		});
	},
	// RENDER FIELD VALUES, FIELD INPUTS, ATTRIBUTES AND NESTED LISTS
	renderList : function (res,list) {
		var plugin=this;
		var dfr=$.Deferred();
		var promises=[];
		//return dfr.resolve([]);
		//var result=$('<div/>');
		//console.log(list);
		var items=[];
		if (list) {
			if (!list.jquery) list=$(list);
			var listTmpl=plugin.api.view.getTemplate(list.data('templatepath'));
			var itemTmplBackup=listTmpl.find('.pouch-list-item').first().clone(true);
			//console.log('RENDER LIST',res,list.data(),itemTmplBackup,listTmpl)
			if (res.rows && res.rows.length>0) {
				$.each(res.rows,function(reskey,resvalue) {
					if (resvalue.doc) {
						var itemTmpl=itemTmplBackup.clone(true);
						promises.push(plugin.api.view.updateListItemAll(resvalue,itemTmpl,list));
						items.push(itemTmpl);
					}
				});
			}
		}
		$.when.apply($,promises).then(function() {
			$(list).show();
			//console.log('listed',$('.pouch-list-noresults',list));
			dfr.resolve(items);
		});
		return dfr;
	},
	// render
	renderSingle : function(id,targetLists) {
		var plugin=this;
		var dfr=$.Deferred();
		console.log('rendersingle',id,targetLists);
		$.each(targetLists,function(tk,tv) {
			if ($(tv).hasClass('pouch-list')) {
				var d=$.extend({include_docs:true},plugin.settings,$(tv).data())
				//console.log('setkey',id,tv)
				$(tv).attr('data-key',id);
				plugin.api.view.reloadList($(tv));
				dfr.resolve();
			} else {
				//console.log('look for child lists',tv);
				$('.pouch-list',tv).each(function(tvk,tvv) {
					//console.log('look for child lists FOUND tvv');
					var d=$.extend({include_docs:true},plugin.settings,$(tvv).data())
					//console.log('setkey',id,tv)
					$(tvv).attr('data-key',id);
				
					//$(tvv).data('key',id);
					//console.log('look for child lists set key',id,d);
					plugin.api.view.reloadList($(tvv));
					dfr.resolve();
				});
			}
		});
		return dfr;
	},
	reloadList : function (iList) {
		var plugin=this;
		var dfr=$.Deferred();
		//console.log('RELOAD LIST now',iList,iList.data());
		plugin.api.model.loadList(iList).then(function(res2) {
			//console.log('RELOAD LIST',res2);
			plugin.api.view.updatePagination(iList,res2,'update');
			if (res2 && res2.rows && res2.rows.length>0)  {
				plugin.api.view.renderList(res2,iList).then(function (items) {
					//console.log('RELOAD LIST rendered',items);
					//return;
			
					var firstItem=$('.pouch-list-item',iList).first();
					if (firstItem.length==0) {
						firstItem=$('.pouch-list-noresults',iList).first().show();
					}
					if (firstItem.length==0) {
						firstItem=$('<div class="pouch-injection-marker">');
						$(iList).prepend(firstItem);
					}
					//console.log('RELOAD LIST APPEND TO ',firstItem)
					// start with list items that are immediate children
					var allItems=$(iList).children('.pouch-list-item');
					// for all children, look at their immediate children for list items
					var secondLevel=$(iList).children();
					$.each(secondLevel,function(sk,sv) {
						allItems=allItems.add($(sv).children('.pouch-list-item'));
					});
					 //.add(secondChildren);
					//console.log('reloadlist',items);
					
					if ($(iList).data('pouchWrapstart')) firstItem.before($(iList).data('pouchWrapstart'));
					var count=0;
					$.each(items,function(rlk,rlv) {
						//onsole.log('renderite',rlv,firstItem);
						if (count>0) firstItem.before($(iList).data('pouchSeperator'));
						firstItem.before(rlv);
						count++;
					});
					if ($(iList).data('pouchWrapend')) firstItem.before($(iList).data('pouchWrapend'));
					allItems.remove();
					$('.pouch-list-noresults',iList).hide();
					$.each($('img[data-pouch-loadme="yes"]',$(iList)),function() {
						plugin.api.view.asyncLoadImage($(this));
					});
					dfr.resolve();
				});
			} else {
				plugin.api.view.showNoResults(iList);
				dfr.resolve();
			}
		});	
		$.when(dfr).then(function() {
			$(iList).trigger('pouchui.reloadlist');
		});
	},
	showNew : function(targetList) {
		var plugin=this;
		console.log('shownew',targetList);
		var listTmpl=plugin.api.view.getTemplate($(targetList).data('templatepath'));
		//console.log('tmpl',listTmpl);
		var tmpl=$(listTmpl.html());
		$('script',tmpl).remove();
		//$(targetList).html(tmpl);
		var resvalue={doc:{}};
		var itemTemplate=$('.pouch-list-item',targetList).first();
		plugin.api.view.updateListItemAll(resvalue,itemTemplate,targetList).then(function() {
			//console.log('ASNew injected');
			$(targetList).show();
			//console.log('show');
			$('input,textarea,select',targetList).first().focus();
			//console.log('focus');
		});
	},
	// LOAD AN IMAGE FROM DB AND INJECT INTO IMAGE TAG
	asyncLoadImage : function (image) {
		var plugin=this;
		//console.log('ASUNC LOAD IMAGE',image);
		if (image.data('pouchDb') && image.data('pouchId') && image.data('pouchAttachmentid')) {
			var pouch=plugin.api.model.getDB(image.data('pouchDb'));
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
	// SHOW AND AUTOMATICALLY HIDE A POPUP MESSAGE
	// @param - id attribute of popup available in template
	// @param - extra text for message
	// @param - message display duration in ms
	flashMessage: function(popupId,message,duration) {
		var plugin=this;
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
	},
	// SHOW WAITING ANIMATION
	startWaiting : function() {
		var plugin=this;
		if ($('#loading').length==0) $('body').prepend('<div id="loading"><img src="loading.gif" /></div>');
		$('#loading').show();
	},
	// HIDE WAITING ANIMATION
	stopWaiting : function() {
		var plugin=this;
		$('#loading').hide();
	},
	
	
}
