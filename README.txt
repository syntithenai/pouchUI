! pouchUI
Author: Steve Ryan <stever@syntithenai.com>

pouchUI is a jquery plugin for generating dynamic HTML interfaces using localstorage or a couchDB database.
pouchUI is relies on the pouchdb.js wrapper for local storage and couchDB.
The plugin looks for $('.pouch-list') and populates records into these elements based on configuration.
The plugin binds a number of events and provides a number of actions to support search and editing.
The plugin binds to the changes feed of the data source so can be used to creative collaborative editing interfaces.
Examples of live collaborative user interfaces include text editing, SVG image editing, contacts database and chess.

Usage $('.dom-selector').pouchUI();


! BASIC EXAMPLE
eg
<!-- LIBS - SEE EXAMPLES FOR EXTRAS USED SOMETIMES -->
<script src="../../lib/jquery/js/jquery.js"  ></script>
<script src='../../lib/pouchdb.js' ></script>
<script src='../../src/jquery.pouchUI.js' ></script>

<div id='contactlist' class='pouch-list' data-pouch-db='contacts'  >
	<div class='pouch-list-item' >
		<label>Name <span class='data-pouch-value' data-pouch-field='name' ></span></label>
	</div>
</div>

<script>
$('#contactlist').pouchUI();
</script>
-------------------------------------------------
If there are two contacts in the database the contactlist element HTML is used as a template and appended twice (once for each list item).
ie
<div id='contactlist' class='pouch-list' data-pouch-db='contacts'  >
	<div class='pouch-list-item' >
		<label>Name <span class='data-pouch-value' data-pouch-field='name' >Fred Spanner</span></label>
	</div>
	<div class='pouch-list-item' >
		<label>Name <span class='data-pouch-value' data-pouch-field='name' >Joe Bloggs</span></label>
	</div>
</div>


! VALIDATION
- plugin config designDocs - validateFunction


! BOUND EVENTS
- CLICK
	

- KEYUP/CHANGE
	- data-pouch-autosave

- CHANGES
	- PER DATABASE
		- update or reload list or delete
















! SUMMARY OF FEATURES
- replace HTML list templates with multiple records from storage
	- HTML templating using data attributes
	- .pouch-list, .pouch-list-item, .pouch-list-value||.pouch-list-input
	- .data-pouch-id, data-pouch-rev added to list items on rendering.
	- set/get value of first input for all input types inside .pouch-list-input
	- event binding to plugin with event routing based on
		- click with .data-pouch-action attribute on links and buttons.
		- keyup on search and form inputs
		- change on form inputs
















---------------------------------------
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


