! pouchUI

pouchUI is a jquery plugin for generating dynamic HTML interfaces using a pouchDB database.
The plugin looks for $('.pouch-list') and populates these lists based on meta data in data attributes.
Usage $('.dom-selector').pouchUI();

The default usage will
	- check all $('.pouch-list',DOMSELECTOR) for metadata, sync and load comment from pouch/couch databases for the list and load records from metadata selected index
	- where an index has multiple dimension keys, manage view collation
	- render [collated] rows	
	- bind list events to filter/handle ->
		- show - navigate to show#id preloaded with content from linked record
		- edit - manipulate target nav to populate .pouch-form
		- delete - ajax delete, remove parent content
		- pagination_XXX, backnav
		- livesearch on inputs
		- submit form/save button - remain on error, navigate to link on save preloaded with content from saved record (could do preview/summary)
		- autosave on delayed change
		- cancel button - navigation back
		- search button - navigate to  parent (list) target, optionally set metadata and update list based on metadata
	

A list can have attribute to manage the item wrapping 
	- data-pouch-seperator='<span>,</span>' 
	- data-pouch-wrapstart='<span>{</span>' 
	- data-pouch-wrapend='<span>}</span>'	
	
Within a pouch list the following DOM elements will be modified
- attributes of the pouch list named data-XXX where XXX corresponds to a field in the incoming list row will be replaced by attributes XXX=<incoming value>
- $('.pouch-list-value') element contents will be replaced by field value defined by attribute data-pouch-field
- $('.pouch-list-input') element contents will be have the value of the first input field inside replaced by the field value defined by attribute data-pouch-field
- $('.pouch-list') element contents will be replaced by recursive list rendering. Infinite depth of lists can be nested to support relationships
	- The inner pouch list will have a key value set for filtering based on attribute data-pouch-field.
	- Attribute data-pouch-mmseperator=';'  on inner lists will allow for MM relationships based on parent list fields containing multiple seperated values
TODO - $('.pouch-list-collation') operate similarly to lists but offer collation of list results to allow for more efficient relationship queries
	

More than one content page is required to support templates beyond edit/search/submit buttons.
The plugin works with a single HTML page containing multiple content pages identified by id and data-role="page" . 
Edit links will use the #id for href so linking to show/focus content is native.
Frameworks like jquery mobile provide page transitioning based on this style of linking. 


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

