pouchUILib.controller = {
	auth: function (pouch) {
	// load session and then user
	// where there is no user (couchdb server admin), create a new user record
		var dfr=$.Deferred();	
		pouch.getSession(function (err, session) {
			console.log('ses',session,err);
			if (session && session.ok && session.userCtx && session.userCtx.name && session.userCtx.name.length>0)  {
				pouch.getUser(session.userCtx.name, function (err, user) {
					console.log('user',user,err);
					if (user && user._id) {
						dfr.resolve(user);
					} else {
						// we have a site admin with no user record, create a fake user
						var adminUser={_id:'org.couchdb.user:'+session.userCtx.name,name:session.userCtx.name,roles:['admin'],type:'user',metadata:{serveradmin:'1',name:session.userCtx.name}};
						pouch.post(adminUser).then(function(res) {
							pouchUILib.view.flashMessage('#login_createdadminuser');
							pouch.getUser(session.userCtx.name, function (err, loadedUser) {
								console.log('ca', loadedUser);
								dfr.resolve(loadedUser);
							});
						}).catch(function(err) {
							dfr.reject([err.message,'#login_failedtocreateadminuser']);
						});
					}
				});
			} else if (err && err.message) {
				dfr.reject([err.message,'#login_failsession']);
			} else {
				dfr.resolve();
			}
		});
		return dfr;
	},
	actionFileSelected : function (e,options) {
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
			//!pouchUILib.model.isCouch(db) &&   - LATEST VERSION OF POUCH CRASHES MEMORY FOR SAVING ATTACHMENTS GREATER THAN 26M. OLDER VERSIONS WERE TESTED FINE UP TO 1G
			if (file.size > pouchUILib.model.maxFileSize(options)) {
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
					var fileDOM=$('<div class="file pending"><span class="ui-btn ui-btn-inline ui-btn-mini" data-pouch-action="deletefile" >X</span><a target="_new" >'+path+file.name+'</a></div>');
					//console.log(file)
					fileDOM.attr('data-docid',folder+path+file.name);
					fileDOM.attr('data-mime',file.type);
					// remove files of same name
					$('.file[data-docid="'+folder+path+file.name+'"]',attachmentsDOM).remove();
					attachmentsDOM.prepend(fileDOM);
					var targetItem=$(e.target).parents('.pouch-list-item').first();
					if (targetList.length>0 && targetList.attr('data-pouch-autosave')=='true') {
						pouchUILib.controller.actionSave(targetList,targetItem);			
					}
				}
			}
		});
		
		
	},
	/*
	SEARCH can be triggered by search button or change event in search form
	search can take effect on a number of pouch-lists the identity of which are determined by
	- data-search-target attribute set on the trigger element
	- data-search-target attribute set on a sibling search button of the trigger element
	- data-search-target attribute set on the search form
	*/
	actionSearch : function (triggerElement,options) {
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
			triggerSearchButton=$('[data-pouch-action="search"]',searchForm).first();
		}
		console.log('SEARCH BUTTON',searchForm,'BUTTON',triggerSearchButton.data());
		
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
		console.log('criteria',start,end);
		
		// FIND TARGETS
		var targetLists={};
		// TARGET ON TRIGGER
		if (triggerElement.data('searchTarget') && triggerElement.data('searchTarget').length>0 && $('.pouch-list',$(triggerElement.data('searchTarget'))).length>0) {
			targetLists=$('.pouch-list:not(.pouch-list .pouch-list)',$(triggerElement.data('searchTarget')));
			console.log('FOUND TARGET LISTS from trigger',targetLists);
		// TARGET ON SIBLING SEARCH BUTTON
		} else if (triggerSearchButton.length>0 && triggerSearchButton.data('searchTarget') && triggerSearchButton.data('searchTarget').length>0 && $('.pouch-list',$(triggerSearchButton.data('searchTarget'))).length>0) {
			targetLists=$('.pouch-list:not(.pouch-list .pouch-list)',$(triggerSearchButton.data('searchTarget')));
			console.log('FOUND TARGET LISTS from search button',targetLists);
		// TARGET ON SEARCH FORM
		} else if (searchForm.length>0 && searchForm.data('searchTarget') && searchForm.data('searchTarget').length>0 && $('.pouch-list',$(searchForm.data('searchTarget'))).length>0) {
			targetLists=$('.pouch-list:not(.pouch-list .pouch-list)',$(searchForm.data('searchTarget')));
			console.log('FOUND TARGET LISTS from sesarch form',targetLists);
		// CONTAINING LIST
		} else if (searchForm.parents('.pouch-list').length>0) {
			targetLists=searchForm.parents('.pouch-list').first();
			//console.log('FOUND TARGET LISTS as parent of search form',targetLists);
		} else {
			console.log('FAILED TO FIND SEARCH TARGET LIST',triggerElement);
		}
		if (targetLists.length>0) {
			$.each(targetLists,function(splk,splv) {
				// set params
				if (start) {
					$(splv).data('startkey',start);
				} else {
					$(splv).removeData('startkey');
				}
				if (end) {
					$(splv).data('endkey',end);
				} else {
					$(splv).removeData('endkey');
				}
				//console.log('set search criteria in selected lists',$(splv).data());
				// do search
				pouchUILib.controller.actionReloadList($(splv),options);
			});
		} 
		return dfr;
	},
	actionDelete : function(db,id,listItem,target,e,options) {
		if (confirm('Really Delete?')) {
			pouchUILib.view.startWaiting();
			var pouch=pouchUILib.model.getDB(db,options);
			pouch.get(id,function(err,res) {
				//console.log('get',res);
				if (err) {
					console.log('ERR DELETE get',err);
					pouchUILib.view.stopWaiting();
				} else {
					try {
						// TODO - RESTORE VALIDATION ON REMOVE - pouch.validatingRemove - removed because
						// TypeError: Cannot assign to read only property '_deleted' of joe {stack: "TypeError: Cannot assign to read only property '_d…   at http://localhost/pouchUI/pouchdb.js:7936:21", message: "Cannot assign to read only property '_deleted' of joe"}
						pouch.remove(res._id,res._rev).then(function(err,dres) {
							//console.log('DEL OK',err,dres);
							pouchUILib.view.stopWaiting();
						}).catch(function(err) {
							console.log('ERR DELETE',err);
							pouchUILib.view.stopWaiting();
							//$('.validationerror',listItem).remove();
							//var errMsg=$('<div class="validationerror" >'+err.message+'</div>');
							//$('input,select,textarea',listItem).first().before(errMsg);
						});
					} catch (e) {
						console.log('ERR DELETE exc',e);
						pouchUILib.view.stopWaiting();
					}
				}
			});
		}
	},
	actionSave : function (list,currentListItem,closeAfter,options) {
		//console.log('save ',currentListItem);
		var d=$.extend({include_docs:true},options,$(list).data());
		var pouch=pouchUILib.model.getDB(d.pouchDb,options);
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
					//console.log(err,$('.pouch-list-input',currentListItem).first());
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
	},	
	actionLoadAndClickLink : function (docId,attachmentId,button,db,options) {
		//console.log('load and click',docId,attachmentId,button,db);
		//return;
		if (docId && attachmentId && button && db) {
			var pouch=pouchUILib.model.getDB(db,options);
			if (pouchUILib.model.isCouch(db)) {
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
						//console.log('revoke url');
					},5000);				
				}); 
			}
		} else {
			console.log('ASYNC LOAD IMAGE MISSING META DATAS',docId);	
		}
	},
	// render
	actionRenderSingle : function(id,targetLists,options) {
		var dfr=$.Deferred();
		console.log('rendersingle',id,targetLists);
		$.each(targetLists,function(tk,tv) {
			
			if ($(tv).hasClass('pouch-list')) {
				var d=$.extend({include_docs:true},options,$(tv).data())
				console.log('setkey',id,tv)
				$(tv).attr('data-key',id);
				pouchUILib.controller.actionReloadList($(tv),options);
				dfr.resolve();
			} else {
				console.log('look for child lists',tv);
				$('.pouch-list',tv).each(function(tvk,tvv) {
					//console.log('look for child lists FOUND tvv');
					var d=$.extend({include_docs:true},options,$(tvv).data())
					console.log('setkey',id,tv)
					$(tvv).attr('data-key',id);
				
					//$(tvv).data('key',id);
					//console.log('look for child lists set key',id,d);
					pouchUILib.controller.actionReloadList($(tvv),options);
					dfr.resolve();
				});
			}
		});
		return dfr;
	},
	actionReloadList : function (iList,options) {
		pouchUILib.model.loadList(iList).then(function(res2) {
		console.log('RELOAD LIST',res2);
			pouchUILib.view.updatePagination(iList,res2,'update');
			if (res2 && res2.rows && res2.rows.length>0)  {
				pouchUILib.view.renderList(res2,iList,options).then(function (items) {
					console.log('RELOAD LIST rendered',items);
					var firstItem=$('.pouch-list-item',iList).first();
					if (firstItem.length==0) {
						firstItem=$('.pouch-list-noresults',iList).first().show();
						//
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
						pouchUILib.view.asyncLoadImage($(this),options);
					});
				});
			} else {
				pouchUILib.view.showNoResults(iList);
			}
		});	
	},
	actionShowNew : function(targetList) {
		console.log('showlist',targetList);
		var listTmpl=pouchUILib.view.getTemplate($(targetList).data('templatepath'));
		console.log('tmpl',listTmpl);
		$(targetList).html(listTmpl.html());
		//console.log('injected');
		$(targetList).show();
		//console.log('show');
		$('input,textarea,select',targetList).first().focus();
		//console.log('focus');
	},
	onPouchClick : function(e) {
		//return true;
		// chrome
		var theElement=e.target;
		// firefox
		//if (!theElement && e && e.originalEvent) theElement=e.originalEvent.originalTarget;
		// return false on failure of command to prevent link default action
		if (theElement) {
			var pouchRoot=$(theElement).parents('.pouch-root').last();
			options=pouchRoot.data('options');
			console.log('OPTIONSFROMDOM onclick',options);
		
			var button=$(theElement);
			var cmd=button.data('pouchAction');
			var target=button.attr('href');
			var targetList;
			var	targetList=$(target);
			var parentList;
			var parentListItem;
			var id;
			// some buttons take action on their containing item or list
			// buttons that have moved to the header take action on the first item or list they can find at the top of the active page
			if (button.parents('.pouch-list').length>0) {
				var parentList=button.parents('.pouch-list').first();
				var parentListItem=button.parents('.pouch-list-item').first();
			} else {
				
				var base=button.parents('[data-role="page"]');
				console.log('headrer but click ',base);
				// allow for buttons that have been pulled up into the header
				var parentList=$('.pouch-list',base).first();
				var parentListItem=$('.pouch-list-item',parentList).first();
			}
			var id=parentListItem.data('pouchId');
			console.log('pouchclick',id,parentListItem,parentList,'CMMD',cmd,target,targetList,e,e.target);
			
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
					pouchUILib.controller.actionSave(parentList,parentListItem,false);
				}
			} else if (button.parents('.file').length>0 && (theElement.nodeName=='A' || theElement.nodeName=="IMG" && button.parents('a').length>0)) {
				e.preventDefault();
				e.stopImmediatePropagation();
				var attachmentId=button.parents('.file').first().data('attachmentId');
				var theLink;
				if (theElement.nodeName=="A") theLink=button;
				else theLink=button.parents('a').first();
				//console.log('clicked file link',id,attachmentId,theLink,parentList.data('pouchDb'));
				pouchUILib.controller.actionLoadAndClickLink(id,attachmentId,theLink,parentList.data('pouchDb'),options);
			// FORM BUTTONS
			} else if ((cmd=='edit'||cmd=='view') && targetList && targetList.length>0) {
				pouchUILib.controller.actionRenderSingle(id,targetList,options)
			} else if (cmd=='delete') {
				pouchUILib.controller.actionDelete(parentList.data('pouchDb'),id,parentListItem,target,e,options);
			} else if (cmd=='save') {
				pouchUILib.controller.actionSave(parentList,parentListItem,false);
			} else if (cmd=='saveandclose') {
				pouchUILib.controller.actionSave(parentList,parentListItem,true);
			} else if (cmd=='cancel'||cmd=='close') {
				//history.back(-1);
				parentListItem.remove();
			// LIST BUTTONS
			} else if (cmd=='search') {
				pouchUILib.controller.actionSearch(button);
			} else if (cmd=='paginate-first' || cmd=='paginate-last' || cmd=='paginate-next' || cmd=='paginate-previous') {
				if (!button.hasClass('disabled')) {
					console.log('paginate',button.data('pouchSkipTo'))
					parentList.data('pouchSkip',button.data('pouchSkipTo'));
					pouchUILib.controller.actionReloadList(parentList,options);
				}
			} else if (cmd=='new' && target && targetList.length>0) {
				console.log('CREATE NEW',targetList);
				
				if (targetList.hasClass('pouch-list')) {
					pouchUILib.controller.actionShowNew(targetList);
				} else {
					$('.pouch-list',targetList).each(function() {
						pouchUILib.controller.actionShowNew(this);
					});
				}
				//console.log('aa',$('.pouch-list',targetList),$('input',targetList));
				
			} 
		} else {
			console.log('Missing event toElement on click');
		}
		return true;
	},
	onPouchInputChange : function (e) {
		var target=e.originalEvent.target;
		var value=$(e.originalEvent.target).val();
		var parentSearch=$(target).parents('.pouch-search');
		var targetList=$(target).parents('.pouch-list').first();
		var pouchRoot=$(target).parents('.pouch-root').last();
		options=pouchRoot.data('options');
		console.log('OPTIONSFROMDOM change',options);
		
		// CHANGE LIMIT
		if ($(target).attr('type')=='file') {
			pouchUILib.controller.actionFileSelected(e.originalEvent,options);
		} else if ($(target).hasClass('pouch-limit')) {
			//console.log('change limit',targetList,value);
			pouchUILib.controller.actionReloadList($(targetList),options);
		// LIVE SEARCH
		} else if (parentSearch.length>0) {
			//console.log('keyup SEARCH',targetList,value);
			pouchUILib.controller.actionSearch($(target));
		// LIVE SAVE
		} else if (targetList.length>0 && targetList.attr('data-pouch-autosave')=='true') {
			//console.log('TL',targetList);
			var targetItem=$(target).parents('.pouch-list-item').first();
			// NO AUTOSAVE ON ID FIELD
			if (targetItem.data('pouchField')!=='_id') {
			//console.log('keyup SAVE',targetList,targetItem,value);
				pouchUILib.controller.actionSave(targetList,targetItem,false);
			}
		}
	}
}

