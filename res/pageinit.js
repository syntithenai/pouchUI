var pouchUI={
	couchHost: 'http://localhost:5984/',
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
	},
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
							pouchUI.flashMessage('#login_createdadminuser');
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
	}
}

// load site wide header and footer 
//$(document).off( "pageinit");
$(document).on( "pageinit",  function() {
	$.get('../../res/fixedcontent.html',function(res) {
		$('body').append(res);
		$('[data-role="header"],[data-role="footer"]').toolbar();
		$('[data-role="panel"]').panel();
		$('[data-role="popup"]').popup();
	});
});
