
/* 
 CONVERT FILENAME TO MIME TYPE
 */
var MimeConverter={};
MimeConverter.extensionMapping={
'epub':'application/epub+zip',
'jar':'application/java-archive',
'json':'application/json',
'doc dot':'application/msword',
'ai eps ps':'application/postscript',
'rdf':'application/rdf+xml',
'rtf':'application/rtf',
'kml':'application/vnd.google-earth.kml+xml',
'kmz':'application/vnd.google-earth.kmz',
'xls xlm xla xlc xlt xlw':'application/vnd.ms-excel',
'ppt pps pot':'application/vnd.ms-powerpoint',
'pptx':'application/vnd.openxmlformats-officedocument.presentationml.presentation',
'sldx':'application/vnd.openxmlformats-officedocument.presentationml.slide',
'ppsx':'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
'potx':'application/vnd.openxmlformats-officedocument.presentationml.template',
'xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
'xltx':'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
'docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
'dotx':'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
'dmg':'application/x-apple-diskimage',
'torrent':'application/x-bittorrent',
'bz':'application/x-bzip',
'bz2 boz':'application/x-bzip2',
'tar':'application/x-tar',
'xml xsl':'application/xml',
'dtd':'application/xml-dtd',
'zip':'application/zip',
'tgz .gz':'application/gzip',
'au snd':'audio/basic',
'mid midi kar rmi':'audio/midi',
'mp4a':'audio/mp4',
'mpga mp2 mp2a mp3 m2a m3a':'audio/mpeg',
'oga ogg spx':'audio/ogg',
's3m':'audio/s3m',
'sil':'audio/silk',
'aac':'audio/x-aac',
'aif aiff aifc':'audio/x-aiff',
'flac':'audio/x-flac',
'mka':'audio/x-matroska',
'm3u':'audio/x-mpegurl',
'wax':'audio/x-ms-wax',
'wma':'audio/x-ms-wma',
'wav':'audio/x-wav',
'bmp':'image/bmp',
'gif':'image/gif',
'jpeg jpg jpe':'image/jpeg',
'png':'image/png',
'svg svgz':'image/svg+xml',
'tiff tif':'image/tiff',
'psd':'image/vnd.adobe.photoshop',
'ics ifb':'text/calendar',
'css':'text/css',
'sheet':'text/sheet',
'csv':'text/csv',
'html htm':'text/html',
'txt text':'text/plain',
'sql':'text/x-sql',
'js':'text/javascript',
'vcard':'text/vcard',
'mp4 mp4v mpg4':'video/mp4',
'mpeg mpg mpe m1v m2v':'video/mpeg',
'ogv':'video/ogg',
'qt mov':'video/quicktime',
'mxu m4u':'video/vnd.mpegurl',
'webm':'video/webm',
'f4v':'video/x-f4v',
'fli':'video/x-fli',
'flv':'video/x-flv',
'm4v':'video/x-m4v',
'mkv mk3d mks':'video/x-matroska',
'vob':'video/x-ms-vob',
'wm':'video/x-ms-wm',
'wmv':'video/x-ms-wmv',
'wmx':'video/x-ms-wmx',
'wvx':'video/x-ms-wvx',
'avi':'video/x-msvideo',
'pdf':'application/pdf',
};
MimeConverter.lookupMime = function(fileName) {
	var ret='';
	if (fileName) {
		var lookup={};
		$.each(MimeConverter.extensionMapping,function(fileExtensions,mimeType) {
			var parts=fileExtensions.split(' ');
			$.each(parts,function(k,fileExtension) {
				lookup[fileExtension]=mimeType;
			});
		});
		var fileParts=fileName.split(".");
		var extension=fileParts[fileParts.length-1];
		if (lookup[extension] && lookup[extension].length>0) {
			ret=lookup[extension];
		} else {
			// treat as binary
			ret='application/unknown';
		}
		//console.log('LOOKUP MIME',fileName,ret);
	}
	return ret;
}
