var pouchUI={
	couchHost: 'http://localhost:5984/',
}

// load site wide header and footer 
//$(document).off( "pageinit");
$(document).on("pageshow.pouchui",  function() {
	// reset .ui-content top margin
	$('.ui-header,.ui-footer').toolbar();
});
$(document).on("pageshow.pouchui",  function() {
	//return;
	//if ($('[data-role="header"] > .injected').length==0) {
		$.get('../../res/fixedcontent.html',function(res) {
			var tmpl=$('<div>'+res+'</div>');
			//console.log('loaded',tmpl[0].outerHTML);
			var baseHeader=$('[data-role="header"]',tmpl) 
			baseHeader.children().addClass('injected');
			var baseFooter=$('[data-role="footer"]',tmpl) 
			baseFooter.children().addClass('injected');;
			//console.log('LOADED NAVBARS',baseHeader,baseFooter,tmpl)
			if ($('[data-role="header"]').length>0) {
				//console.log('prepend to existing header',$('[data-role="header"]'));
				 $('.injected',$('[data-role="header"]')).remove();
				 $('[data-role="header"]',$('body')).prepend(baseHeader.html());
			} else {
				//console.log('append to body');
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
			$(document).off('pageload.pouchui');
		});
	//}
});
