function loadScript(urls, callback)
{
    // Adding the script tag to the head as suggested before
    var head = document.head;
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = urls[0];

    var short = urls.slice(1, urls.length);
    var next = () => loadScript(short, callback);
    if (short.length === 0) {
      next = callback;
    }

    // Then bind the event to the callback function.
    // There are several events for cross browser compatibility.
    script.onreadystatechange = next;
    script.onload = next;

    // Fire the loading
    head.appendChild(script);
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

var state = null;
var canvas = null;
var ctx = null;
var width = 100;
var height = 100;
var activeTimers = {};
var inputState = {
  mousePos: {x: 0, y: 0},
  mouseBoardPos: {x: 0, y: 0},
};

function mouseMove(evt) {
  var rect = canvas.getBoundingClientRect(), // abs. size of element
    scaleX = canvas.width / rect.width,    // relationship bitmap vs. element for x
    scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for y

  inputState.mousePos = {
    x: (evt.clientX - rect.left) * scaleX,   // scale mouse coordinates after they have
    y: (evt.clientY - rect.top) * scaleY     // been adjusted to be relative to element
  }

  var inverseAffine = matInverse(mainAffineTransform);
  const mouseBoardCoords = getAffineCoords(inputState.mousePos.x - offsetX, inputState.mousePos.y - offsetY, inverseAffine);



  inputState.mouseBoardPos = {
    /*
    x: Math.min(Math.max(Math.round(mouseBoardCoords[0]), 0), state.board.length),
    y: Math.min(Math.max(Math.round(mouseBoardCoords[1]), 0), state.board[0].length)
    */
    x: Math.round(mouseBoardCoords[0]),
    y: Math.round(mouseBoardCoords[1])
  }

  inputState.mouseBoardPos.coords = [inputState.mouseBoardPos.x, inputState.mouseBoardPos.y]; 
}

function mouseClick() {

  var coords = inputState.mouseBoardPos.coords;

  if (state.phase === setupPhase) {
    if (containsCoords(startZoneCoordinates[state.turn], coords) && getPieceAtCoords(coords) === null) {
      setPieceAtCoords(coords, new Piece(state.turn, state.typeToPlace));
      state.piecesToPlace[state.turn][state.typeToPlace] -= 1;
      if (state.piecesToPlace[state.turn][state.typeToPlace] <= 0) {
        if (typeToPlaceOrder.indexOf(state.typeToPlace) + 1 === typeToPlaceOrder.length) {
          if (state.turn === green) {
            state.turn = blue;
            state.typeToPlace = typeToPlaceOrder[0];
          } else if (state.turn === blue) {
            state.turn = green;
            state.phase = playPhase;
          }
        } else {
          state.typeToPlace = typeToPlaceOrder[typeToPlaceOrder.indexOf(state.typeToPlace) + 1];
        }
      } 
    }
  }

  if (state.phase === removePhase) {
    var piece = getPieceAtCoords(coords);
    if (piece.color === state.turn) {
      setPieceAtCoords(coords, null);
      state.phase = swapPhase;
      updateTurn();
    }
  }

  if (state.phase === swapPhase) {
    var piece = getPieceAtCoords(coords);
    if (piece !== null && piece.color === state.turn) {
      if (coords !== state.lastMove) {
        var lastPiece = getPieceAtCoords(state.lastMove);
        setPieceAtCoords(coords, lastPiece);
        setPieceAtCoords(state.lastMove, piece);
      }
      state.phase = playPhase;
      updateTurn();
      clearLastMove();
    }
  }

  if (state.phase === playPhase) {
    if (inBounds(20, 650-30, 110, 60, inputState.mousePos.x, inputState.mousePos.y)) {
      takeYouJestAction();
    }

    try {
      selectOrUnselectPiece(coords);
    } catch (exception1) {
      if (exception1 === "No piece at coords") {
        try {
          moveSelectedPiece(coords);
        } catch (exception2) {
          if (exception2 === "No available move") {
            clearSelectedPiece();
          } else {
            throw exception2;
          }
        }
      } else if (exception1 === "Piece at coords is wrong color") {
        // do nothing
      } else {
        throw exception1;
      }
    }
  }

  newStateUpdate(state);

}

function stopSyncTimer(id) {
  activeTimers[id] = 0;
}

function startSyncTimer(id, callback, delay) {
  activeTimers[id] = delay;
  (function loop(){
    setTimeout(function() {
      if (activeTimers[id] > 0) {
        callback();
        loop();
      }
    }, activeTimers[id]);
  })();
}

function print() {
  printState();
}

function init() {
  // initialize game state
  startNewGame();
}

function main() {
  init();
  startSyncTimer('draw', draw, 30);
  // startSyncTimer('print', print, 3000);
}

var onLoad = function() {

  // wait for window to load
  window.onload = (event) => {
    // setup canvas
    canvas = document.getElementById("myCanvas");
    ctx = canvas.getContext("2d");
    main();
  }
};

var requirements = [
  "static/js/mat_inv.js",
  "static/js/state.js",
  "static/js/logic.js",
  "static/js/draw.js",
  "static/js/chat.js",
];

loadScript(requirements, onLoad);



