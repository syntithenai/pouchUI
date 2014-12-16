/*********************************************************
 * jQuery plugin to wrap the Garbo Chess AI and UI
 *********************************************************/


var methods = {
	init : function(options) {
		var settings=$.extend(true,{},$.fn.garboChess.defaultOptions);
		// init parameters
		if(options) {
			$.extend(true,settings, options);
		}
		// inject css
		$(this).before($('<style>'+settings.styles+'</style>'));
		var dfr=$.Deferred();
		$.get("js/garbochess.js").done(function(data) {
			dfr.resolve(data);
		}).fail(function() {
			throw 'could not load worker script';
		});	
				//$.when(dfr).then(function() {	
					//console.log('loaded',data);
		
		return this.each(function() {
			var plugin = this;
			if (!plugin.initialised) {
				plugin.initialised=true;
				plugin.g_backgroundEngineValid = true;
				plugin.g_backgroundEngine;
				plugin.g_startOffset = null;
				plugin.g_selectedPiece = null;
				plugin.moveNumber = 1;

				plugin.g_allMoves = [];
				plugin.g_playerWhite = true;
				plugin.g_autoPlayerWhite=false;
				plugin.g_autoPlayerBlack=false;
				plugin.g_changingFen = false;
				plugin.g_analyzing = false;

				plugin.g_uiBoard;
				plugin.g_cellSize = 45;
				plugin.autoPlayTimeout;

				// include DOM data attributes in settings
				plugin.settings = $.extend({},settings,$(plugin).data());
				
				//console.log('use template',$.trim($(plugin).html()).length,settings.template);
				if ($.trim($(plugin).html()).length==0)  {
					$(plugin).html($(settings.template));
				}
				
				var pluginMethods=[];
				//console.log('API',$.fn.garboChessAPI);
				if ($.fn.garboChessAPI) {
					//console.log('bind plaugin to api',plugin);
					$.each($.extend(true,{},$.fn.garboChessAPI),function(key,value) {
							//console.log('bind plaugin to api',key);
						if ($.isFunction(value)) { 	
							pluginMethods[key]=value.bind(plugin);
						} else {
							pluginMethods[key]={};
							$.each(value,function(ikey,ivalue) {
								if ($.isFunction(ivalue)) { 	
									pluginMethods[key][ikey]=ivalue.bind(plugin);
								}
							});
						}
					});
				}
				// access to api for functions defined in other scopes
				plugin.api = pluginMethods;
				plugin.garboChess=new GarboChess();
				$('.NewGame',plugin).on('click',function() { if (confirm('Really reset game?')) {plugin.api.UINewGame()}});
				$('.TimePerMove',plugin).on('change',plugin.api.UIChangeTimePerMove);
				$('.UndoMove',plugin).on('click',plugin.api.UIUndoMove);
				$('.ChangeBoardOrientation',plugin).on('change',plugin.api.UIChangeBoardOrientation);
				$('.FenTextBox',plugin).on('change',plugin.api.UIChangeFEN);
				$('.AnalysisToggle',plugin).on('click',function() {plugin.api.UIAnalyzeToggle(); return false;});
				$('.Suggest',plugin).on('click',function() {plugin.api.SearchAndRedraw(true); return false;});
				$('.AutoMoves',plugin).on('change',function() { plugin.api.UIChangeAuto($(this).data('color'),$(this).prop('checked')); });
				$.when(dfr).then(function(data) {
					plugin.workerScript=data;
					plugin.api.UIInitialise();
				});
				console.log('init showUI',plugin.settings.showUI)
				//$(plugin.settings.showUI,plugin).css('visibility','visible');
				$(plugin.settings.showUI,plugin).show();
				//$('.FenTextBox',plugin).val($(plugin).data('value'));
				//plugin.api.UIChangeFEN();
				//$('.FenTextBox',plugin).click();
			}
		});	
		
	}
};
/**********************************************************************************
 * Initialise content 
 * @input this - DOM provided to jquery plugin. All this DOM is bound for events. Some of this DOM is rerendered using pouch data.
 * @param method - can take multiple forms
	- method parameter empty or as object calls the init method and passes the parameter object eg $('body').pouchUI({db:'pets',maxSize:898798})
	- method parameter as string matching existing methods defined in the top level of the methods object above calls the method. eg $('body').pouchUI('doit');
 * @return initialised plugin instance with properties .settings and .api for programmatic access to pouchUI methods.
 **********************************************************************************/
$.fn.garboChess = function(method) {
	if( $.isFunction(methods[method])) {
		return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
	} 
	else if(typeof method === 'object' || !method) {
		return methods.init.apply(this, arguments);
	} 
	else {
		$.error("Method " +  method + " does not exist on jQuery.garboChess");
	}    
};
$.fn.garboChessAPI={
	UIInitialise : function() {
		var plugin=this;
		var fen = $(".FenTextBox",plugin).val();
		console.log('init fen',fen);
		if (fen && fen.length>0) {
			plugin.api.UIUpdateFEN(fen);
		} else {
			plugin.api.UINewGame();
		}
	},
	UIUpdateFEN : function(fen) {
		var plugin=this;
		plugin.api.UINewGame();
		$(".FenTextBox",plugin).val(fen);
		if (fen && fen.length>0) {
			$(".FenTextBox",plugin).trigger('change');
		}
	},
	UINewGame : function() {
		var plugin=this;
		plugin.moveNumber = 1;
		var pgnTextBox = $(".PgnTextBox",plugin).get(0);
		pgnTextBox.value = "";

		plugin.api.EnsureAnalysisStopped();
		if (plugin.api.InitializeBackgroundEngine()) {
			//console.log('init worker done');
			plugin.g_backgroundEngine.postMessage("go");
		}
		
		plugin.garboChess.ResetGame();
		plugin.g_allMoves = [];
		plugin.g_playerWhite=true;
		// AUTO OFF TO START
		plugin.g_autoPlayerWhite=false;
		plugin.g_autoPlayerBlack=false;
		//if (!plugin.g_playerWhite) {
		//	plugin.api.SearchAndRedraw();
		//}
		plugin.api.RedrawBoard();
		
		
	},
	InitializeBackgroundEngine : function() {
		var plugin=this;
		if (!plugin.g_backgroundEngineValid) {
			return false;
		}

		if (plugin.g_backgroundEngine == null) {
			plugin.g_backgroundEngineValid = true;
			try {
				//console.log('createworker',plugin.workerScript.length);
				try {
					var blob = new Blob([plugin.workerScript],{type:'text/javascript'});
				} catch (e) {console.log('no blob :(',e);}
				plugin.g_backgroundEngine = new Worker(window.URL.createObjectURL(blob));
				plugin.g_backgroundEngine.onmessage = function (e) {
					console.log('Worker Message',e.data);
					if (e.data.match("^pv") == "pv") {
						plugin.api.UpdatePVDisplay(e.data.substr(3, e.data.length - 3));
					} else if (e.data.match("^message") == "message") {
						plugin.api.EnsureAnalysisStopped();
						plugin.api.UpdatePVDisplay(e.data.substr(8, e.data.length - 8));
					} else if (e.data.match("^fen") == "fen") {
						$(".FenTextBox",plugin).val(e.data.substr(4));
					} else  if (e.data.match("^log") == "log") {
						console.log(e.data);
					} else {
						plugin.api.UIPlayMove(plugin.garboChess.GetMoveFromString(e.data), null);
					}
				}
				plugin.g_backgroundEngine.error = function (e) {
					alert("Error from background worker:" + e.message);
				}
				plugin.g_backgroundEngine.postMessage("position " + plugin.garboChess.GetFen()); 
			
			} catch (error) {
				plugin.g_backgroundEngineValid = false;
			}
		}

		return plugin.g_backgroundEngineValid;
	},

	UpdateFromMove : function(move) {
		var plugin=this;
		var fromX = (move & 0xF) - 4;
		var fromY = ((move >> 4) & 0xF) - 2;
		var toX = ((move >> 8) & 0xF) - 4;
		var toY = ((move >> 12) & 0xF) - 2;

		if (!plugin.g_playerWhite) {
			fromY = 7 - fromY;
			toY = 7 - toY;
			fromX = 7 - fromX;
			toX = 7 - toX;
		}

		if ((move & plugin.garboChess.moveflagCastleKing) ||
			(move & plugin.garboChess.moveflagCastleQueen) ||
			(move & plugin.garboChess.moveflagEPC) ||
			(move & plugin.garboChess.moveflagPromotion)) {
			plugin.api.RedrawPieces();
		} else {
			var fromSquare = plugin.g_uiBoard[fromY * 8 + fromX];
			$(plugin.g_uiBoard[toY * 8 + toX])
				.empty()
				.append($(fromSquare).children());
		}
		//plugin.garboChess.WhiteToMove(plugin.g_playerWhite);
		$(plugin).trigger('garbochess.Moved');
	},
	RedrawPieces : function() {
		var plugin=this;
		for (y = 0; y < 8; ++y) {
			for (x = 0; x < 8; ++x) {
				var td = plugin.g_uiBoard[y * 8 + x];
				var pieceY = plugin.g_playerWhite ? y : 7 - y;
				var piece = plugin.garboChess.g_board[((pieceY + 2) * 0x10) + (plugin.g_playerWhite ? x : 7 - x) + 4];
				var pieceName = null;
				switch (piece & 0x7) {
					case plugin.garboChess.piecePawn: pieceName = "pawn"; break;
					case plugin.garboChess.pieceKnight: pieceName = "knight"; break;
					case plugin.garboChess.pieceBishop: pieceName = "bishop"; break;
					case plugin.garboChess.pieceRook: pieceName = "rook"; break;
					case plugin.garboChess.pieceQueen: pieceName = "queen"; break;
					case plugin.garboChess.pieceKing: pieceName = "king"; break;
				}
				if (pieceName != null) {
					pieceName += "_";
					pieceName += (piece & 0x8) ? "white" : "black";
				}

				if (pieceName != null) {
					var img = document.createElement("div");
					$(img).addClass('sprite-' + pieceName);
					img.style.backgroundImage = "url('img/sprites.png')";
					img.width = plugin.g_cellSize;
					img.height = plugin.g_cellSize;
					var divimg = document.createElement("div");
					divimg.appendChild(img);

					$(divimg).draggable({ start: function (e, ui) {
						if (plugin.g_selectedPiece === null) {
							plugin.g_selectedPiece = this;
							var offset = $(this).closest('table').offset();
							plugin.g_startOffset = {
								left: e.pageX - offset.left,
								top: e.pageY - offset.top
							};
						} else {
							return plugin.g_selectedPiece == this;
						}
					}});

					$(divimg).mousedown(function(e) {
						if (plugin.g_selectedPiece === null) {
							var offset = $(this).closest('table').offset();
							plugin.g_startOffset = {
								left: e.pageX - offset.left,
								top: e.pageY - offset.top
							};
							e.stopPropagation();
							plugin.g_selectedPiece = this;
							plugin.g_selectedPiece.style.backgroundImage = "url('img/transpBlue50.png')";
						} else if (plugin.g_selectedPiece === this) {
							plugin.g_selectedPiece.style.backgroundImage = null;
							plugin.g_selectedPiece = null;
						}
					});

					$(td).empty().append(divimg);
				} else {
					$(td).empty();
				}
			}
		}
		//plugin.garboChess.WhiteToMove(plugin.g_playerWhite);
	},

	EnsureAnalysisStopped : function () {
		var plugin=this;
		if (plugin.g_analyzing && plugin.g_backgroundEngine != null) {
			//console.log('terminate');
			plugin.g_backgroundEngine.terminate();
			console.log('terminate');
			plugin.g_backgroundEngine = null;
		}
	},

	UIAnalyzeToggle : function()  {
		var plugin=this;
		//plugin.api.EnsureAnalysisStopped();
		//return;
		if (plugin.api.InitializeBackgroundEngine()) {
			if (!plugin.g_analyzing) {
				plugin.g_backgroundEngine.postMessage("analyze");
			} else {
				plugin.api.EnsureAnalysisStopped();
			}
			plugin.g_analyzing = !plugin.g_analyzing;
			$(".AnalysisToggle",plugin).get(0).innerText = plugin.g_analyzing ? "Analysis: On" : "Analysis: Off";
		} else {
			alert("Your browser must support web workers for analysis - (chrome4, ff4, safari)");
		}
	},
	UIChangeAuto : function(color,value) {
		var plugin=this;
		console.log('UIChangeAuto',color,value);
		if (color=='top') {
			if (plugin.g_playerWhite) {
				plugin.g_autoPlayerBlack=value;
			} else {
				plugin.g_autoPlayerWhite=value;
			}
		} else if (color=='bottom') {
			if (plugin.g_playerWhite) {
				plugin.g_autoPlayerWhite=value;
			} else {
				plugin.g_autoPlayerBlack=value;
			}
		}
	},
	UIChangeFEN : function() {
		var plugin=this;
		if (!plugin.g_changingFen) {
			var fenTextBox = $(".FenTextBox",plugin).get(0);
			var result = plugin.garboChess.InitializeFromFen(fenTextBox.value);
			if (result.length != 0) {
				plugin.api.UpdatePVDisplay(result);
				return;
			} else {
				plugin.api.UpdatePVDisplay('');
			}
			plugin.g_allMoves = [];

			plugin.api.EnsureAnalysisStopped();
			plugin.api.InitializeBackgroundEngine();
			console.log('UIChangeFEN',plugin.garboChess.g_toMove);
			//console.log('whose',plugin.garboChess.WhoseMove());
			// AUTO TODO - whose turn, who is auto
			//plugin.g_playerWhite = !!plugin.garboChess.g_toMove;
			plugin.g_backgroundEngine.postMessage("position " + plugin.garboChess.GetFen());

			plugin.api.RedrawBoard();
		}
	},

	UIChangeBoardOrientation : function() {
		var plugin=this;
		plugin.g_playerWhite = !plugin.g_playerWhite;
		plugin.api.RedrawBoard();
	},

	UpdatePgnTextBox : function(move) {
		var plugin=this;
		//var pgnTextBox = document.getElementById("PgnTextBox");
		var pgnTextBox = $(".PgnTextBox",plugin).get(0);
		if (plugin.garboChess.g_toMove != 0) {
			pgnTextBox.value += plugin.moveNumber + ". ";
			plugin.moveNumber++;
		}
		pgnTextBox.value += plugin.garboChess.GetMoveSAN(move) + " ";
	},

	UIChangeTimePerMove : function() {
		var plugin=this;
		var timePerMove = $(".TimePerMove",plugin);
		plugin.garboChess.g_timeout = parseInt(timePerMove.value, 10);
	},
	
	FinishMove : function(bestMove, value, timeTaken, ply) {
		var plugin=this;
		if (bestMove != null) {
			plugin.api.UIPlayMove(bestMove, plugin.garboChess.BuildPVMessage(bestMove, value, timeTaken, ply));
		} else {
			alert("Checkmate!");
		}
	},

	UIPlayMove : function(move, pv) {
		var plugin=this;
		plugin.api.UpdatePgnTextBox(move);

		plugin.g_allMoves[plugin.g_allMoves.length] = move;
		plugin.garboChess.MakeMove(move);

		plugin.api.UpdatePVDisplay(pv);

		plugin.api.UpdateFromMove(move);
		setTimeout(plugin.api.SearchAndRedraw, plugin.settings.autoPlayDelay);
		
	},

	UIUndoMove : function() {
	  var plugin=this;
	  if (plugin.g_allMoves.length == 0) {
		return;
	  }
	  var movesToUndo=1;
	// Where the opposition has autosearch, undo two.
	  if (plugin.garboChess.WhiteToMove(plugin.g_playerWhite)) {
		  if (plugin.g_autoPlayerBlack) movesToUndo=2;
	  } else {
		  if (plugin.g_autoPlayerWhite) movesToUndo=2;
	  }
	console.log('undo',movesToUndo);
	  if (plugin.g_backgroundEngine != null) {
		plugin.g_backgroundEngine.terminate();
		plugin.g_backgroundEngine = null;
	  }
	  for (var i=0; i<movesToUndo; i++) {
		  if (plugin.g_allMoves.length != 0)  {
			plugin.garboChess.UnmakeMove(plugin.g_allMoves[plugin.g_allMoves.length - 1]);
			plugin.g_allMoves.pop();
		  }
	  }
	  
	  plugin.api.RedrawBoard();
	},

	UpdatePVDisplay : function(pv) {
		var plugin=this;
		if (pv != null) {
			var outputDiv = $(".output",plugin).get(0);
			if (outputDiv.firstChild != null) {
				outputDiv.removeChild(outputDiv.firstChild);
			}
			outputDiv.appendChild(document.createTextNode(pv));
		}
	},

	SearchAndRedraw : function(force) {
		var plugin=this;
		//console.log('SearchAndRedraw');
		var whiteToMove=plugin.garboChess.WhiteToMove(plugin.g_playerWhite);
		if (force || (whiteToMove && plugin.g_autoPlayerWhite) || (!whiteToMove && plugin.g_autoPlayerBlack)) {
			if (plugin.g_analyzing) {
				plugin.api.EnsureAnalysisStopped();
				plugin.api.InitializeBackgroundEngine();
				plugin.g_backgroundEngine.postMessage("position " + plugin.garboChess.GetFen());
				plugin.g_backgroundEngine.postMessage("analyze");
				return;
			}

			if (plugin.api.InitializeBackgroundEngine()) {
				plugin.g_backgroundEngine.postMessage("search " + plugin.garboChess.g_timeout);
			} else {
				plugin.garboChess.Search(plugin.api.FinishMove, 99, null);
			}
		}
	},

	RedrawBoard : function() {
		var plugin=this;
		var div = $(".board",plugin).get(0);

		var table = document.createElement("table");
		table.cellPadding = "0px";
		table.cellSpacing = "0px";
		$(table).addClass('no-highlight');

		var tbody = document.createElement("tbody");

		plugin.g_uiBoard = [];

 		var dropPiece = function (e, ui) {
			var endX = e.pageX - $(table).offset().left;
			var endY = e.pageY - $(table).offset().top;

			endX = Math.floor(endX / plugin.g_cellSize);
			endY = Math.floor(endY / plugin.g_cellSize);

			var startX = Math.floor(plugin.g_startOffset.left / plugin.g_cellSize);
			var startY = Math.floor(plugin.g_startOffset.top / plugin.g_cellSize);

			if (!plugin.g_playerWhite) {
				startY = 7 - startY;
				endY = 7 - endY;
				startX = 7 - startX;
				endX = 7 - endX;
			}

			var moves = plugin.garboChess.GenerateValidMoves();
			var move = null;
			for (var i = 0; i < moves.length; i++) {
				if ((moves[i] & 0xFF) == plugin.garboChess.MakeSquare(startY, startX) &&
					((moves[i] >> 8) & 0xFF) == plugin.garboChess.MakeSquare(endY, endX)) {
					move = moves[i];
				}
			}

			if (!plugin.g_playerWhite) {
				startY = 7 - startY;
				endY = 7 - endY;
				startX = 7 - startX;
				endX = 7 - endX;
			}

			plugin.g_selectedPiece.style.left = 0;
			plugin.g_selectedPiece.style.top = 0;

			if (!(startX == endX && startY == endY) && move != null) {
				plugin.api.UpdatePgnTextBox(move);

				if (plugin.api.InitializeBackgroundEngine()) {
					plugin.g_backgroundEngine.postMessage(plugin.garboChess.FormatMove(move));
				}

				plugin.g_allMoves[plugin.g_allMoves.length] = move;
				plugin.garboChess.MakeMove(move);

				plugin.api.UpdateFromMove(move);

				plugin.g_selectedPiece.style.backgroundImage = null;
				plugin.g_selectedPiece = null;

				var fen = plugin.garboChess.GetFen();
				$(".FenTextBox",plugin).val(fen);

				setTimeout(plugin.api.SearchAndRedraw, 0);
			} else {
				plugin.g_selectedPiece.style.backgroundImage = null;
				plugin.g_selectedPiece = null;
			}
		};

		for (y = 0; y < 8; ++y) {
			var tr = document.createElement("tr");

			for (x = 0; x < 8; ++x) {
				var td = document.createElement("td");
				td.style.width = plugin.g_cellSize + "px";
				td.style.height = plugin.g_cellSize + "px";
				td.style.backgroundColor = ((y ^ x) & 1) ? "#D18947" : "#FFCE9E";
				tr.appendChild(td);
				plugin.g_uiBoard[y * 8 + x] = td;
			}

			tbody.appendChild(tr);
		}

		table.appendChild(tbody);

		$(plugin).droppable({ drop: dropPiece });
		$(table).mousedown(function(e) {
			if (plugin.g_selectedPiece !== null) {
				dropPiece(e);
			}
		});

		plugin.api.RedrawPieces();

		$(div).empty();
		div.appendChild(table);
		$(plugin).trigger('garbochess.RedrawBoard')
		plugin.g_changingFen = true;
		plugin.garboChess.GetFen();
		plugin.g_changingFen = false;
		//console.log('RedrawBoard');
		//plugin.garboChess.WhoseMove(); //);
	}
}



$.fn.garboChess.defaultOptions={};
$.fn.garboChess.defaultOptions.autoPlayDelay=1000;
$.fn.garboChess.defaultOptions.styles='.garbochess .GameTitle,.garbochess .output,.garbochess .board,.garbochess .PgnTextBox,.garbochess .FenTextBox,.garbochess .NewGame,.garbochess .TimePerMoveLabel,.garbochess .UndoMove,.garbochess .ChangeBoardOrientation,.garbochess .AnalysisToggle,.garbochess .Suggest,.garbochess .AutomovesLabel  {display: none;} \n\
.no-highlight { -webkit-tap-highlight-color: rgba(0,0,0,0);}\n\
.sprite-bishop_black{ background-position: 0 0; width: 45px; height: 45px; } \n\
.sprite-bishop_white{ background-position: 0 -95px; width: 45px; height: 45px; } \n\
.sprite-king_black{ background-position: 0 -190px; width: 45px; height: 45px; } \n\
.sprite-king_white{ background-position: 0 -285px; width: 45px; height: 45px; } \n\
.sprite-knight_black{ background-position: 0 -380px; width: 45px; height: 45px; } \n\
.sprite-knight_white{ background-position: 0 -475px; width: 45px; height: 45px; } \n\
.sprite-pawn_black{ background-position: 0 -570px; width: 45px; height: 45px; } \n\
.sprite-pawn_white{ background-position: 0 -665px; width: 45px; height: 45px; } \n\
.sprite-queen_black{ background-position: 0 -760px; width: 45px; height: 45px; } \n\
.sprite-queen_white{ background-position: 0 -855px; width: 45px; height: 45px; } \n\
.sprite-rook_black{ background-position: 0 -950px; width: 45px; height: 45px; } \n\
.sprite-rook_white{ background-position: 0 -1045px; width: 45px; height: 45px; }';

$.fn.garboChess.defaultOptions.template="<div>\n\
	<div class='GameTitle' ><input type='text' value='Speedy' ></div>\n\
	<a href='#'  class='ui-btn NewGame ui-btn-left' >Reset</a>\n\
	<select  class='ChangeBoardOrientation ui-btn-left' >\n\
		<option value='white'>White</option>\n\
		<option value='black'>Black</option>\n\
	</select>\n\
	<label  class='ui-btn-left  TimePerMoveLabel' >Time per move: <input class='TimePerMove' value='3000'  /></label>\n\
	<label class='ui-btn ui-btn-right AutoMovesLabel' >Auto <input type='checkbox' class='AutoMoves' data-color='top' value='1'  /></label>\n\
	<a href='#' class='ui-btn  ui-btn-right Suggest' >Suggest</a>\n\
	<a href='#' class='ui-btn ui-btn-right UndoMove' >Undo</a>\n\
</div>\n\
<div style='margin-top:5px;'>\n\
	<div class='board'></div> \n\
	<a href='#' class='ui-btn ui-btn-left DeleteGame' >Delete</a>\n\
	<label class='ui-btn ui-btn-right AutoMovesLabel' >Auto <input type='checkbox' class='AutoMoves' data-color='bottom' value='1'  /></label>\n\
	<a href='#' class='ui-btn ui-btn-right Suggest' >Suggest</a>\n\
	<a href='#' class='ui-btn ui-btn-right UndoMove' >Undo</a>\n\
	<span  class='output'></span><br/> \n\
	<textarea   cols='50' rows='3' class='PgnTextBox'></textarea><br/>\n\
	<div >\n\
		<a class='AnalysisToggle' href='#'  >Analysis: Off</a>\n\
	</div>\n\
	<input  class='FenTextBox' value='' v='2rqkb1r/1p1n1pp1/p2pbn2/4p2p/P3P3/1NN1BP2/1PPQ2PP/R3KB1R w KQk -',/>\n\
</div>";

//$.fn.garboChess.defaultOptions.showUI='.GameTitle,.output,.board,.PgnTextBox,.FenTextBox,.ui-btn.NewGame,.TimePerMoveLabel,.UndoMove,.ChangeBoardOrientation,.AnalysisToggle,.Suggest,.AutoMovesLabel';
$.fn.garboChess.defaultOptions.showUI='.GameTitle,.board,.PgnTextBox,.NewGame,.UndoMove,.Suggest,.AutoMovesLabel';
