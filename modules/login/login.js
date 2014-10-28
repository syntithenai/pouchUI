// DECIDE WHAT PARTS OF THE PAGE SHOULD BE VISIBLE
	
$(document).on( "pagebeforeshow", '#login_default,#login_edit', function() {
	var pouch=new PouchDB(pouchUI.couchHost+'_users');
	// DETERMINE WHERE TO GO
	if (window.location.hash=='') {
		pouchUI.auth(pouch).then(function(user) {
			if (user) {
				// redirect to profile editing
				$.mobile.changePage('#login_edit');
			} else {
				// redirect to login
				$.mobile.changePage('#login_login');
			}
		})
		.fail(function(err) {
			pouchUI.flashMessage(err[0],err[1]);
		})
	// IF WE ARE EDITING, PREP EDIT FORM
	} else if (window.location.hash=="#login_edit") {
		pouchUI.auth(pouch).then(function(user) {
			if (user) {
				$('#login_edit input[name="username"]').val(user.name).hide();
				if ($('#login_edit_username_label').length==0) $('#login_edit input[name="username"]').after('<span id="login_edit_username_label" >'+user.name+'</span>');
				$('#login_edit input[name="password"]').val('');
				$('#login_edit input[name="repeatpassword"]').val('');
				if (user.metadata) { 
					if (user.metadata.name) $('#login_edit input[name="name"]').val(user.metadata.name);
					else $('#login_edit input[name="name"]').val('');
					if (user.metadata.email) $('#login_edit input[name="email"]').val(user.metadata.email);
					else $('#login_edit input[name="email"]').val('');
					//$('#login_edit input[name="image"]').val(user.metadata.image);
					if (user.metadata.serveradmin=='1')  {
						$('#login_edit input[name="password"]').parents('label').first().hide();
						$('#login_edit input[name="repeatpassword"]').parents('label').first().hide();
					}
				}
			} else {
				// redirect to login
				$.mobile.changePage('#login_login');
			}
		}).fail(function(err) {
			pouchUI.flashMessage(err[0],err[1]);
		})
	}
});

$(document).on( "pageinit", '#login_edit,#login_login', function() {
	var pouch=new PouchDB(pouchUI.couchHost+'_users');

	// BIND LOGIN BUTTON
	$('#login_login button[data-action="login"]').bind('click',function() {
		var username=$('#login_login input[name="user"]').val();
		var password=$('#login_login input[name="password"]').val();
		if (username && username.length>0 && password && password.length>0) {
			pouch.login(username, password, function (err, response) {
				if (err) {
					if (err.name === 'unauthorized') {
					  pouchUI.flashMessage('#login_login_invalid');
					}
				} else {
					$.mobile.changePage('#login_edit');
				}
			});
		} else {
			$('#login_login_moredata').popup('open');
			pouchUI.flashMessage('#login_login_moredata');
		}
	});
	// BIND LOGOUT BUTTON
	$('button[data-action="logout"]').bind('click',function() {
		pouch.logout(function (err, response) {
			if (err) {
				pouchUI.flashMessage('#login_login_generalerror');
			} else {
				$.mobile.changePage('#login_login');
			}
		})
	});
	// BIND SAVE BUTTON
	$('#login_edit button[data-action="saveuser"]').bind('click',function() {
		pouchUI.auth(pouch).then(function(user) {
			if (user) {
				pouch.get(user._id).then(function(loadedUser) {
					if ($.type(loadedUser.metadata)!='object') loadedUser.metadata={}; 
					loadedUser.metadata.name=$('#login_edit input[name="name"]').val();
					loadedUser.metadata.email=$('#login_edit input[name="email"]').val();
					//loadedUser.metadata.file=$('#login_edit input[name="image"]').val(response.metadata.image);
					var pwOK=true;
					if ($('#login_edit input[name="password"]').val() && $('#login_edit input[name="password"]').val().length>0) {
						if ($('#login_edit input[name="repeatpassword"]').val() && $('#login_edit input[name="repeatpassword"]').val().length>0 &&$('#login_edit input[name="password"]').val()==$('#login_edit input[name="repeatpassword"]').val()) {
							loadedUser.password=$('#login_edit input[name="password"]').val();
							delete loadedUser.password_scheme;
							delete loadedUser.salt;
						} else {
							pwOK=false;
							pouchUI.flashMessage('#login_edit_passwordsdontmatch');
						}
					}
					if (pwOK) {
						console.log('save user',loadedUser);
						pouch.post(loadedUser).then(function(res) {
							pouchUI.flashMessage('#login_edit_saved');
						}).catch(function(err) {
							console.log(err,err.message);
							pouchUI.flashMessage('#login_edit_nosave',err.message);
						});
					}
				}).catch(function(err) {
					pouchUI.flashMessage('#login_edit_nosave',err.message);
				});
			} else {
				// redirect to login
				$.mobile.changePage('#login_login');
			}
		}).fail(function(err) {
			pouchUI.flashMessage(err[0],err[1]);
		});
	});
});