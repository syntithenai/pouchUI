
console.log('routing',window.location)

function doRouting(to) {
	function goto(url) {
		console.log('goto',url);
		var link=$('<a style="didsplay:none" data-ajax="false"  href="'+url+'" >ddddd</a>');
		//$('[data-role="page"]').append(link);
		link.trigger('click');
	}
	var pouch=new PouchDB(pouchUI.couchHost+'_users');
	// DETERMINE WHERE TO GO
	if (to=='users_default') {
		console.log('connected to ',pouch)
		 pouch.getSession(function (err, response) {
		  if (err) {
			pouchUILib.view.flashMessage('#users_login_generalerror');
		  } else if (!response.userCtx.name) {
			console.log('goto login');
			$.mobile.changePage('index.html#users_login');
		  } else{
		  console.log('goto profile');
			$.mobile.changePage('#users_edit');
		  }
		});
	// IF WE ARE EDITING, PREP EDIT FORM
	} else if (to=="users_edit") {
		pouch.getSession(function (err, session) {
		console.log(session);
		  if (err) {
			pouchUILib.view.flashMessage('#users_login_generalerror');
		  } else if (!session.userCtx.name) {
			$.mobile.changePage('#users_login');
		  } else{
			pouch.getUser(session.userCtx.name, function (err, response) {
			  if (err) {
				pouchUILib.view.flashMessage('#users_login_generalerror');
			  } else {
				console.log(response);
				$('#users_edit input[name="username"]').val(response.name).hide();
				if ($('#users_edit_username_label').length==0) $('#users_edit input[name="username"]').after('<span id="users_edit_username_label" >'+response.name+'</span>');
				$('#users_edit input[name="password"]').val('');
				if (response.metadata) { 
					if (response.metadata.name) $('#users_edit input[name="name"]').val(response.metadata.name);
					else $('#users_edit input[name="name"]').val('');
					if (response.metadata.email) $('#users_edit input[name="email"]').val(response.metadata.email);
					else $('#users_edit input[name="email"]').val('');
					//$('#users_edit input[name="image"]').val(response.metadata.image);
				}
				
			  }
			});
		  }
		});
	}
}

$(document).on( "pageshow", '#users_default,#users_edit,#users_login', function(e) {
	console.log('route to ',$(e.target).attr('id'),e);
	doRouting($(e.target).attr('id'));
});

$(document).on( "pagebeforeload", '#users_default,#users_edit,#users_login', function(e) {
	console.log('pagebeforeload',e);
});	
$(document).on( "pageload", '#users_default,#users_edit,#users_login', function(e) {
	console.log('pageload',e);
});	
$(document).on( "pageloadfailed", '#users_default,#users_edit,#users_login', function(e) {
	console.log('pageloadfailed',e);
});	

$(document).on( "pagebeforechange", '#users_default,#users_edit,#users_login', function(e) {
	console.log('pagebeforechange',e);
});	
$(document).on( "pagechange", '#users_default,#users_edit,#users_login', function(e) {
	console.log('pagechange',e);
});	
$(document).on( "pagechangefailed", '#users_default,#users_edit,#users_login', function(e) {
	console.log('pagechangefailed',e);
});	

$(document).on( "pagebeforeshow", '#users_default,#users_edit,#users_login', function(e) {
	console.log('pagebeforeshow',e);
});	
$(document).on( "pagebeforehide", '#users_default,#users_edit,#users_login', function(e) {
	console.log('pagebeforehide',e);
});	
$(document).on( "pageshow", '#users_default,#users_edit,#users_login', function(e) {
	console.log('pageshow',e);
});	
$(document).on( "pagehide", '#users_default,#users_edit,#users_login', function(e) {
	console.log('pagehide',e);
});	

$(document).on( "pagebeforecreate", '#users_default,#users_edit,#users_login', function(e) {
	console.log('pagebeforecreate',e);
});
$(document).on( "pagecreate", '#users_default,#users_edit,#users_login', function(e) {
	console.log('pagecreate',e);
});
$(document).on( "pageinit", '#users_default,#users_edit,#users_login', function(e) {
	console.log('pageinit',e);
});
$(document).on( "pageremove", '#users_default,#users_edit,#users_login', function(e) {
	console.log('pageremove',e);
});