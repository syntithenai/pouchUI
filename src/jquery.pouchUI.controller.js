$.fn.pouchUI.api.controller = {
	test: function(name) {
		var plugin=this;
		//console.log('TEST',name);
	},
	auth: function (pouch) {
		var plugin=this;
	// load session and then user
	// where there is no user (couchdb server admin), create a new user record
		var dfr=$.Deferred();	
		pouch.getSession(function (err, session) {
			//console.log('ses',session,err);
			if (session && session.ok && session.userCtx && session.userCtx.name && session.userCtx.name.length>0)  {
				pouch.getUser(session.userCtx.name, function (err, user) {
					//console.log('user',user,err);
					if (user && user._id) {
						dfr.resolve(user);
					} else {
						// we have a site admin with no user record, create a fake user
						var adminUser={_id:'org.couchdb.user:'+session.userCtx.name,name:session.userCtx.name,roles:['admin'],type:'user',metadata:{serveradmin:'1',name:session.userCtx.name}};
						pouch.post(adminUser).then(function(res) {
							plugin.api.view.flashMessage('#login_createdadminuser');
							pouch.getUser(session.userCtx.name, function (err, loadedUser) {
								//console.log('ca', loadedUser);
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
	actionFileSelected : function (e) {
		var plugin=this;
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
			//!plugin.api.model.isCouch(db) &&   - LATEST VERSION OF POUCH CRASHES MEMORY FOR SAVING ATTACHMENTS GREATER THAN 26M. OLDER VERSIONS WERE TESTED FINE UP TO 1G
			if (file.size > plugin.api.model.maxFileSize()) {
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
						plugin.api.controller.actionSave(targetList,targetItem);			
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
	actionSearch : function (triggerElement) {
		var plugin=this;
		var dfr=$.Deferred();
		console.log('search ',triggerElement);
		var criteriaDOM;
		var start,end;
		var searchForm;
		var triggerSearchButton;
		if (triggerElement.hasClass('pouch-search')) {
			console.log('on the button');
			searchForm=triggerElement;
			triggerSearchButton=triggerElement.find('[data-pouch-action="search"]').first();
		} else {
			console.log('look for parents as search form');
			searchForm=triggerElement.parents('form.pouch-search').first();
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
		//console.log('criteria',start,end);
		
		// FIND TARGETS
		var targetLists=[];
		// TARGET ON TRIGGER
		var href=triggerSearchButton.attr('href');
		var hrefParts;
		if (href && href.length>0) hrefParts=href.split('#');
		var hash;
		if (hrefParts && hrefParts.length==2) {
			hash=hrefParts[1];
		}
		if (hash && hash.length>0) {
			if ($('#'+hash).hasClass('pouch-list')) {
				targetLists.push($('#'+hash));
			} else {
				targetLists=$('.pouch-list:not(.pouch-list .pouch-list)',$('#'+hash));
			}
		}
		//console.log('DDDD',href,hash);
		// OK
		if (targetLists.length>0) {
			//console.log('FOUND SEARCH TARGET LIST',targetLists)
		// OTHER WISE LOOK FOR CONTAINING LIST
		} else if (searchForm.parents('.pouch-list').length>0) {
			targetLists=searchForm.parents('.pouch-list').first();
			//console.log('FOUND TARGET LISTS as parent of search form',targetLists);
		} else {
			console.log('FAILED TO FIND SEARCH TARGET LIST',triggerElement);
		}
		if (targetLists.length>0) {
			$.each(targetLists,function(splk,splv) {
				// set params
				$(splv).attr('data-pouch-skip',"0");
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
				plugin.api.view.reloadList($(splv));
			});
		} 
		return dfr;
	},
	actionDelete : function(db,id,listItem,target,e) {
		var plugin=this;
		if (confirm('Really Delete?')) {
			plugin.api.view.startWaiting();
			var pouch=plugin.api.model.getDB(db);
			pouch.get(id,function(err,res) {
				//console.log('get',res);
				if (err) {
					console.log('ERR DELETE get',err);
					plugin.api.view.stopWaiting();
				} else {
					try {
						// TODO - RESTORE VALIDATION ON REMOVE - pouch.validatingRemove - removed because
						// TypeError: Cannot assign to read only property '_deleted' of joe {stack: "TypeError: Cannot assign to read only property '_d…   at http://localhost/pouchUI/pouchdb.js:7936:21", message: "Cannot assign to read only property '_deleted' of joe"}
						pouch.remove(res._id,res._rev).then(function(err,dres) {
							//console.log('DEL OK',err,dres);
							if (listItem) listItem.remove();
							plugin.api.view.stopWaiting();
						}).catch(function(err) {
							console.log('ERR DELETE',err);
							plugin.api.view.stopWaiting();
							//$('.validationerror',listItem).remove();
							//var errMsg=$('<div class="validationerror" >'+err.message+'</div>');
							//$('input,select,textarea',listItem).first().before(errMsg);
						});
					} catch (e) {
						console.log('ERR DELETE exc',e);
						plugin.api.view.stopWaiting();
					}
				}
			});
		}
	},
	actionSave : function (list,currentListItem,closeAfter) {
		var plugin=this;
		var dfr=$.Deferred();
		//console.log('save ',currentListItem);
		var d=$.extend({include_docs:true},plugin.settings,$(list).data());
		var pouch=plugin.api.model.getDB(d.pouchDb);
		var changed=false;
		var finalDoc={};
		
		function doSaveAttachments(finalDoc,attachments,currentListItem,closeAfter) {
			var adfr=$.Deferred();
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
				adfr.resolve();
			}
			return adfr;
		}
		
		function collateAttachments(foundAttachments,updatedAttachments) {
			var plugin=this;
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
		
		function doSave(changed,finalDoc,currentListItem,closeAfter,attachmentsChanged,foundAttachments,updatedAttachments,e) {
			var plugin=this;
			//console.log('DO SAVE',changed,finalDoc,currentListItem,closeAfter,attachmentsChanged,foundAttachments,updatedAttachments);
			if (changed) {
				pouch.validatingPost(finalDoc).then(function(rs) {
					//console.log('DONE SAVE',rs);
					currentListItem.attr('data-pouch-id',rs.id);
					currentListItem.attr('data-pouch-rev',rs.rev);
					finalDoc._id=rs.id;
					finalDoc._rev=rs.rev;
					if (attachmentsChanged) {
						doSaveAttachments(finalDoc,collateAttachments(foundAttachments,updatedAttachments),currentListItem,closeAfter).then(function() {
							dfr.resolve();
						}).fail(function() {
							dfr.reject('Failed to save attachments');
						});
					} else {
						if (closeAfter) currentListItem.remove();
						dfr.resolve();
					}
					$('.validationerror',currentListItem).remove();
				}).catch(function(err) {
					$('.validationerror',currentListItem).remove();
					var errMsg=$('<div class="validationerror" >'+err.message+'</div>');
					$('.pouch-list-input',currentListItem).first().before(errMsg);
					dfr.reject('Failed to save record');
					//console.log(err,$('.pouch-list-input',currentListItem).first());
				});
			} else {
				if (attachmentsChanged) {
					doSaveAttachments(finalDoc,collateAttachments(foundAttachments,updatedAttachments),currentListItem,closeAfter).then(function() {
						dfr.resolve();
					}).fail(function() {
						dfr.reject('Failed to save attachments');
					});;
				} else {
					console.log('RECORD AND ATTACHMENTS UNCHANGED');
					dfr.resolve();
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
		return dfr;
	},	
	actionLoadAndClickLink : function (docId,attachmentId,button,db) {
		var plugin=this;
		//console.log('load and click',docId,attachmentId,button,db);
		//return;
		if (docId && attachmentId && button && db) {
			var pouch=plugin.api.model.getDB(db);
			if (plugin.api.model.isCouch(db)) {
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
	onPouchClick : function(e) {
		var returnVal=true;
		var plugin=this;
		//return true;
		// chrome
		var theElement=e.target;
		// firefox
		//if (!theElement && e && e.originalEvent) theElement=e.originalEvent.originalTarget;
		// return false on failure of command to prevent link default action
		if (theElement) {
			var button=$(theElement);
			var cmd=button.data('pouchAction');
			console.log('have action button',cmd,button);
			if (cmd && cmd.length>0)  {
				var target=button.attr('href');
				var targetParts=[];
				if (target && target.length>0) targetParts=target.split('#');
				var hash=targetParts[1];
				var targetList;
				if (hash) targetList=$('#'+hash);
				var parentList;
				var parentListItem;
				var id;
				// some buttons take action on their containing item or list
				// buttons that have moved to the header take action on the first item or list they can find at the top of the active page
				if (button.parents('.pouch-list').length>0) {
					var parentList=button.parents('.pouch-list').first();
					var parentListItem=button.parents('.pouch-list-item').first();
				} else {
					// specified in href?
					if (targetList && targetList.length>0) {
						if (targetList && targetList.hasClass('pouch-list')) {
							parentList=targetList;
						} else {
							parentList=$('.pouch-list',targetList).first();
						}
						parentListItem=$('.pouch-list-item',parentList).first();
					// first list in page
					} else {
						var base=button.parents('[data-role="page"]');
						// allow for buttons that have been pulled up into the header
						parentList=$('.pouch-list',base).first();
						parentListItem=$('.pouch-list-item',parentList).first();
						console.log('headrer but click ',parentList);
					}
				}
				var id;
				if (parentListItem) id=parentListItem.data('pouchId');
				console.log('pouchclick',id,'CMMD',cmd,target); //,parentListItem,parentList,,targetList,e,e.target
				
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
						plugin.api.controller.actionSave(parentList,parentListItem,false);
					}
				} else if (button.parents('.file').length>0 && (theElement.nodeName=='A' || theElement.nodeName=="IMG" && button.parents('a').length>0)) {
					e.preventDefault();
					e.stopImmediatePropagation();
					var attachmentId=button.parents('.file').first().data('attachmentId');
					var theLink;
					if (theElement.nodeName=="A") theLink=button;
					else theLink=button.parents('a').first();
					//console.log('clicked file link',id,attachmentId,theLink,parentList.data('pouchDb'));
					plugin.api.controller.actionLoadAndClickLink(id,attachmentId,theLink,parentList.data('pouchDb'));
				// FORM BUTTONS
				} else if ((cmd=='edit'||cmd=='view') ) {
					console.log('edit');
					/*if (targetList.hasClass('pouch-list')) {
						console.log('edit',id,targetList);
						plugin.api.view.renderSingle(id,targetList)
					} else {
						$('.pouch-list',targetList).each(function() {
							console.log('editi',id,targetList);
							plugin.api.view.renderSingle(id,targetList)
						});
					}*/
				} else if (cmd=='delete') {
					plugin.api.controller.actionDelete(parentList.data('pouchDb'),id,parentListItem,target,e);
				} else if (cmd=='save') {
					returnVal=false;
					//e.preventDefault();
					plugin.api.controller.actionSave(parentList,parentListItem,false);
				} else if (cmd=='saveandclose') {
					plugin.api.controller.actionSave(parentList,parentListItem,true).then(function() {
						
					}).fail(function() {
						returnVal=false;
					});;
				} else if (cmd=='cancel'||cmd=='close') {
					console.log('close');
					//history.back(-1);
					//returnVal=false;
					//e.preventDefault();
					//parentListItem.remove();
				// LIST BUTTONS
				} else if (cmd=='search') {
					plugin.api.controller.actionSearch(button);
				} else if (cmd=='paginate-first' || cmd=='paginate-last' || cmd=='paginate-next' || cmd=='paginate-previous') {
					if (!button.hasClass('disabled')) {
						// discover last
						if (cmd=="paginate-last")  {
							
							var currentVal=parentList.data('descending');
							//console.log('paglast',currentVal);
							//if (currentVal=="true") {
							//	parentList.data('descending',"false");
							//	parentList.data('skip',"0");
							//} else {
								parentList.data('descending',"true");
								parentList.data('skip',"0");
							//}
						}
						console.log('paginate',button.attr('data-pouch-skip-to'))
						parentList.attr('data-pouch-skip',button.attr('data-pouch-skip-to'));
						plugin.api.view.reloadList(parentList);
					}
				} else if (cmd=='new' && target  && targetList && targetList.length && targetList.length>0) {
					console.log('CREATE NEW',targetList);
					
					if (targetList.hasClass('pouch-list')) {
						plugin.api.view.showNew(targetList);
					} else {
						$('.pouch-list',targetList).each(function() {
							plugin.api.view.showNew(this);
						});
					}
					//console.log('aa',$('.pouch-list',targetList),$('input',targetList));
					
				} else if (cmd=='newchild' && target  && targetList && targetList.length && targetList.length>0) {
					console.log('CREATE NEW child',targetList);
					returnVal=false;
					e.preventDefault();
					/*
					if (targetList.hasClass('pouch-list')) {
						plugin.api.view.showNew(targetList);
					} else {
						$('.pouch-list',targetList).each(function() {
							plugin.api.view.showNew(this);
						});
					}*/
					//console.log('aa',$('.pouch-list',targetList),$('input',targetList));
					
				} 
			} else {
				console.log('Button has no action');
			}
		} else {
			console.log('Missing event toElement on click');
		}
		console.log('click return',returnVal);
		return returnVal;
	},
	onPouchInputChange : function (e) {
		var plugin=this;
		var target;
		var value;
		console.log('INPUT CHANGE',e);
		//console.log('::e');
		//console.log($(e));
		//return;
		
		if (false && e.originalEvent) {
			target=e.originalEvent.target;
			value=$(e.originalEvent.target).val();
		} else {
			target=e.target;
			value=$(e.target).val();
		}
		//console.log('EE',target,value);
		if (target && $(target).attr('href')) {
			var parentSearch=$(target).parents('.pouch-search');
			var href=$(target).attr('href');
			var hrefParts=[];
			var targetList;
			if (href) hrefParts=href.split('#'); 
			if (hrefParts.length==2) targetList=$('#'+hrefParts[1]);   //parents('.pouch-list').first();
			
			// CHANGE LIMIT
			if ($(target).attr('type')=='file') {
				plugin.api.controller.actionFileSelected(e.originalEvent);
			} else if ($(target).hasClass('pouch-limit')) {
				console.log('change limit',targetList,value);
				plugin.api.view.reloadList($(targetList));
			}
		} else {
			console.log('ignored change event',e);
		}
	},
	onPouchInputKeyup: function (e) {
		var plugin=this;
		var target;
		var value;
		console.log('INPUT KEYUP',e);
		//console.log('::e');
		//console.log($(e));
		//return;
		
		if (false && e.originalEvent) {
			target=e.originalEvent.target;
			value=$(e.originalEvent.target).val();
		} else {
			target=e.target;
			value=$(e.target).val();
		}
		//console.log('EE',target,value);
		if (target) {
			var parentSearch=$(target).parents('.pouch-search');
			var targetList=$(target).parents('.pouch-list').first();
			// LIVE SEARCH
			if (parentSearch.length>0) {
				//console.log('keyup SEARCH',targetList,value);
				plugin.api.controller.actionSearch($(target));
			// LIVE SAVE
			} else if (targetList.length>0 && targetList.attr('data-pouch-autosave')=='true') {
				//console.log('TL',targetList);
				var targetItem=$(target).parents('.pouch-list-item').first();
				// NO AUTOSAVE ON ID FIELD
				if (targetItem.data('pouchField')!=='_id') {
				//console.log('keyup SAVE',targetList,targetItem,value);
					plugin.api.controller.actionSave(targetList,targetItem,false);
				}
			}
		} else {
			console.log('ignored keyup event',e);
		}
	}
	,	
	init: function(name) {
		var plugin=this;
		var databasesToListen={};
		//console.log('INIT CONTROLE',name);
		//console.log('INIT CONTROLE',plugin.settings,plugin.api);
		//console.log('PLUGIN TEMPLATE');
	
		// BIND CLICK AND KEYUP EVENTS ON SEARCH FORMS THAT ARE NOT INSIDE OF POUCH-LISTS
		//$(plugin).addClass('data-pouch-root');
		plugin.api.view.bindEventsTo($(plugin));	
		
		//console.log('OPUCHLISTS',plugin.pouchLists);	
		//$(document).on("pageshow.pouchui",  function() {
		//console.log('PAGE SHOW');
		//console.log(window.location,window);
		//$('a').off('click');
		var doRouting=function() {
			console.log('Route',plugin);
			var template;
			if ($(plugin).hasClass('pouch-list')) {
				template=$(plugin);
			} else {
				template=$('.pouch-list',plugin).first();
			}
			console.log('temdat',template);
			//console.log('temdat',template.data(),plugin.pluginTemplate);
			var key='';
			var keyParts=[];
			if (window.location.search) key=window.location.search.substring(1);
			if (key) keyParts=key.split('&');
			console.log('KEYPARTS',keyParts);
			function routeList() {
				console.log('ROUTE LIST');
				$(plugin).off('pageshow.pouchUI');
				$(plugin).on('pageshow.pouchUI',doRouting);
				plugin.api.init.initialiseDesignDocuments(plugin.settings.design).then(function() {
					$.each(plugin.pouchLists,function(lk,lv) {
						var searchers=plugin.api.view.findSearchDOM(lv);
						$(lv).attr('data-pouch-limit',$('select.pouch-limit',searchers).val());
						//console.log('ini/load/render',lv,$(lv).data())
						plugin.api.init.initialiseList(lv).then(function() {
							console.log('page show ini',lv);
							plugin.api.view.reloadList(lv);
						});
					});
				});
			}
			if (keyParts.length>0) { 
				$.each(keyParts,function(k,v) {
					var valueParts=v.split('=');
					if ($.trim(valueParts[0])=='id') {
						console.log(valueParts);
						if (valueParts[1] && $.trim(valueParts[1]).length>0) {
							console.log(valueParts);
							console.log('ROUTE EDIT');
						// have value for id parameter - EDIT
							template.attr('data-key',valueParts[1]);
							plugin.api.view.renderSingle(valueParts[1],template);
						} else {
							console.log('ROUTE NEW',template);
						// id param but blank - CREATE NEW
							plugin.api.view.showNew(template);
						}
					} else {
						routeList();
					}
				});
			} else {
				routeList();
			}
					
			/*
			if (template.data('pouchIdFromHash')==true) {
				console.log('inisingle');
				if (window.location.hash && window.location.hash.length>0) {
					var key=window.location.hash.substring(1);
					//console.log('et',template,key,template.data())
					template.attr('data-key',key);
					//console.log('OPT');
					plugin.api.view.renderSingle(key,template);
				 
				} else {
					// blank form
					console.log('SHOW NEW');
					//template.attr('data-key','-1');
					plugin.api.view.showNew(template);
				}
			} else {
				console.log('inilist NADA');
				// support pagination
				
				// done on pagecreate
			}*/
		}
		doRouting();
		// LISTEN TO CHANGES ON LOCAL DB AND UPDATE CONTENT
		setTimeout(function() {
			console.log('bind change listeners',plugin.databasesToListen);
			$.each(plugin.databasesToListen,function(dk,dv) {
				var pouch=plugin.api.model.getDB(dk);
				// CREATE
				var changes = pouch.changes({ live: true,include_docs:true,since:'now'}).on('create', function(change) { 
					console.log('changes create','.pouch-list-item[data-pouch-id="'+change.doc._id+'"]',$('.pouch-list-item[data-pouch-id="'+change.doc._id+'"]'));
					$.each(dv,function(pk,pv) {
						plugin.api.model.loadList(pv).then(function(results) {
							//plugin.api.view.updatePagination(pv,results,'update');
							if (results && results.rows && results.rows.length>0) {
								$.each(results.rows,function(k,row) {
									//console.log('check',row,pv);
									if (row.id==change.doc._id) {
										plugin.api.view.renderList(results,pv).then(function(rres) {
											plugin.api.view.reloadList(pv);
										});
									}
								});
							}
						});
					});
				});
				// UPDATE
				var changes = pouch.changes({ live: true,include_docs:true,since:'now'}).on('update', function(change) { 
					console.log('changes UPDATE','.pouch-list-item[data-pouch-id="'+change.doc._id+'"]',$('.pouch-list-item[data-pouch-id="'+change.doc._id+'"]'));
					var item=$('.pouch-list .pouch-list-item[data-pouch-id="'+change.doc._id+'"]');
					var list=item.parents('.pouch-list').first();
					plugin.api.view.updateListItem(change,item,list);
				});
				// DELETE
				var changes = pouch.changes({ live: true,include_docs:true,since:'now'}).on('delete', function(change) { 
					console.log('changes DEL','.pouch-list-item[data-pouch-id="'+change.doc._id+'"]',$('.pouch-list-item[data-pouch-id="'+change.doc._id+'"]'));
					$('.pouch-list .pouch-list-item[data-pouch-id="'+change.doc._id+'"]').remove();
				});
			});
		},5000);
		
		
	}
}

