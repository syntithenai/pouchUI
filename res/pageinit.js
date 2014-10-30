var pouchUI={
	couchHost: 'http://localhost:5984/',
}

// load site wide header and footer 
//$(document).off( "pageinit");
$(document).on("pageshow.pouchui",  function() {
	// reset .ui-content top margin
	$('.ui-header,.ui-footer').toolbar();
});
$(document).on("pageinit.pouchui",  function() {
	//return;
	$.get('../../res/fixedcontent.html',function(res) {
		var tmpl=$('<div>'+res+'</div>');
		//console.log('loaded',tmpl[0].outerHTML);
		var baseHeader=$('[data-role="header"]',tmpl);
		var baseFooter=$('[data-role="footer"]',tmpl);
		//console.log('LOADED NAVBARS',baseHeader,baseFooter,tmpl)
		if ($('[data-role="header"]','body').length>0) {
			//console.log('prepend to existing header');
			$('[data-role="header"]','body').prepend(baseHeader.html());
		} else {
			//console.log('append to body');
			$('body').append(baseHeader);
		}
		if ($('[data-role="footer"]','body').length>0) {
			$('[data-role="footer"]','body').prepend(baseFooter.html());
		} else {
			$('body').append(baseFooter);
		}
		$('[data-role="header"],[data-role="footer"]').toolbar();
		$('[data-role="navbar"]').navbar();
		$('[data-role="panel"]').panel();
		$('[data-role="popup"]').popup();
		// only load the header once
		$(document).off('pageinit.pouchui');
	});
});
