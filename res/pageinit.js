var pouchUI={
	couchHost: 'http://localhost:5984/',
}

// load site wide header and footer 
$(document).on("pageinit.pouchui",  function() {
	//console.log('POAGE INIT');
	// reset .ui-content top margin
	$('.ui-header,.ui-footer').toolbar();
	$.get('../../res/fixedcontent.html',function(res) {
		var tmpl=$('<div>'+res+'</div>');
		var baseHeader=$('[data-role="header"]',tmpl) 
		baseHeader.children().addClass('injected');
		var baseFooter=$('[data-role="footer"]',tmpl) 
		baseFooter.children().addClass('injected');;
		if ($('[data-role="header"]').length>0) {
			 $('.injected',$('[data-role="header"]')).remove();
			 $('[data-role="header"]',$('body')).prepend(baseHeader.html());
		} else {
			$('body').append(baseHeader);
		}
		if ($('[data-role="footer"]','body').length>0) {
			$('.injected',$('[data-role="footer"]')).remove();
			$('[data-role="footer"]','body').prepend(baseFooter.html());
		} else {
			$('body').append(baseFooter);
		}
		$('[data-role="header"],[data-role="footer"]').toolbar();
		$('[data-role="navbar"]').navbar();
		$('[data-role="panel"]').panel();
		$('[data-role="popup"]').popup();
		// only load the header once
		//$(document).off('pageinit.pouchui');
	});
});
