! pouchUI

pouchUI is a jquery plugin for generating dynamic HTML interfaces using a pouchDB database.
More than one content page is required to support templates beyond edit/search/submit buttons.
The plugin works with a single HTML page containing multiple content pages identified by id and data-role="page" . 
Edit links will use the #id for href so linking to show/focus content is native.
Frameworks like jquery mobile provide page transitioning based on this style of linking. 

The plugin looks for $('.pouch-list') and populates lists.
The plugin adds event handling for the list and forms(.pouch-form) and buttons(.pouch-button)

Usage $('.dom-selector').pouchUI();

The default usage will
	- check all $('.pouch-list') for metadata, sync and load comment from pouch/couch databases for the list and load records from metadata selected index
	- where an index has multiple dimension keys, manage view collation
	- render [collated] rows	
	- bind list, pouch buttons, pouch forms to filter/handle ->
		- show - navigate to show#id preloaded with content from linked record
		- edit - manipulate target nav to populate .pouch-form
		- delete - ajax delete, remove parent content
		- pagination_XXX, backnav
		- livesearch on inputs
		- submit form/save button - remain on error, navigate to link on save preloaded with content from saved record (could do preview/summary)
		- autosave on delayed change
		- cancel button - navigation back
		- search button - navigate to  parent (list) target, optionally set metadata and update list based on metadata
	

relationships
FOREIGN KEY IN CHILD POINTING TO PARENT- where there is a parent _id in a child record marking a relationship, the child records can be collated into the parent by using the parent _id as the first element of a a 2 dimensional array and the record type as the second
NESTED OBJECTS - stored in primary record, limits collaboration due to increased conflicts on nested objects

WOULD LIKE
FOREIGN KEY(S)
MM - 
FOREIGN KEY(S) IN PARENT - 

GOTCHAS
key mismatch between cross linked lists


DONE
//plugin restructure
//form elements
//update refresh from sheets
action buttons - edit/view/delete/submit/search/cancel(aka back)
	- actions - save record(s), delete record, load template
each list needs their own pouchdb connection - also child lists
no matching results
no save if unchanged
search
validation
pagination
smarter solutions for large files using server
file upload - don't put unsaved attachments in DOM. Put them in the database in a temporary record and provide links. 
	- Only images need to be loaded into DOM when they are displayed as images.
recursive list rendering/activation
MM CSV foreign keys

BUGS
pagination + search
NORES missing ?
	- last item wrong nores


TODO
jquery mobile integration
couchapp
authentication
click to edit
samples 
	- key types
	- recursive list rendering
documentation
plugin website	
form types - password, dep select
ensure error checking on all async operations
oauth google
send mail - gmail api
no update design docs every request - only if absent or URL flag

authentication - restrict read/write access to master database
- filter functions to sync to local pouch based on auth object and whatever DB schema

pagination optimisation based on startkey endkey
full text search https://github.com/nolanlawson/pouchdb-quick-search
form submit event capture - search and save

SAMPLE APP
content editing timeline
		- list render content with absolute layout
		- drag and drop save position
		- auto layout new content
		- layout by page 
			- page selector
		- publish to couch

	
voice recognition
bidirection sync with spreadsheets

