var blueWinZoneCoordinates = [[0, 0], [1, 0], [0, 1]];
var greenWinZoneCoordinates = [[7, 7], [6, 7], [7, 6]];

var winZoneCoordinates = {
  [green]: greenWinZoneCoordinates,
  [blue]: blueWinZoneCoordinates,
};

var blueStartZoneCoordinates = [
  [2, 0], [1, 1], [0, 2],
  [3, 0], [2, 1], [1, 2], [0, 3],
  [2, 2]
];

var greenStartZoneCoordinates = [
  [7, 5], [6, 6], [5, 7],
  [7, 4], [6, 5], [5, 6], [4, 7],
  [5, 5]
];

var startZoneCoordinates = {
  [green]: greenStartZoneCoordinates,
  [blue]: blueStartZoneCoordinates,
};



var state = new State();

var relative1MovesWithBlocks = [
  [[0, 1], []],
  [[1, 0], []],
  [[0, -1], []],
  [[-1, 0], []],
  [[-1, 1], []],
  [[1, -1], []],
];

var relative2MovesWithBlocks = [
  [[0, 2], [[0, 1]]],
  [[0, -2], [[0, -1]]],
  [[2, 0], [[1, 0]]],
  [[-2, 0], [[-1, 0]]],
];

var relative3MovesWithBlocks = [
  [[0, 3], [[0, 1], [0, 2]]],
  [[1, 2], [[0, 1], [0, 2]]],
  [[-1, 2], [[0, 1], [0, 2]]],
  
  [[0, -3], [[0, -1], [0, -2]]],
  [[1, -2], [[0, -1], [0, -2]]],
  [[-1, -2], [[0, -1], [0, -2]]],
  
  [[3, 0], [[1, 0], [2, 0]]],
  [[2, 1], [[1, 0], [2, 0]]],
  [[2, -1], [[1, 0], [2, 0]]],

  [[-3, 0], [[-1, 0], [-2, 0]]],
  [[-2, 1], [[-1, 0], [-2, 0]]],
  [[-2, -1], [[-1, 0], [-2, 0]]],
];

function inGrid(coords) {
  return coords !== null && coords !== undefined && !(
    coords[0] < 0 || 
    coords[0] >= state.board.length ||
    coords[1] < 0 || 
    coords[1] >= state.board[0].length
  );
}

function arrayEquals(a, b) {
  return Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every(function (val, index) { return val === b[index]; });
}

function copyArray(array) {
  return array.map(function (x) { return x; });
}

function containsCoords(coordList, coords) {
  for (var i = 0; i < coordList.length; i++) {
      if (arrayEquals(coordList[i], coords)) return true;
  }
  return false;
}

function getPieceAtCoords(coords) {
  if (!inGrid(coords, state)) return null;
  return state.board[coords[0]][coords[1]];
}

function setPieceAtCoords(coords, piece) {
  if (!inGrid(coords, state)) return null;
  state.board[coords[0]][coords[1]] = piece;
}

function getPiecesAtCoords(coordList) {
  var final = [];
  for (var i = 0; i < coordList.length; i++) {
    final.push(getPieceAtCoords(coordList[i])); 
  }
  return final;
}

function getAbsoluteCoords(absolutePosition, relativeCoords) {
  return [absolutePosition[0] + relativeCoords[0], absolutePosition[1] + relativeCoords[1]];
}

function getAbsoluteCoordList(absolutePosition, relativeCoordList) {
  return relativeCoordList.map(function(relativeCoords) {
    return getAbsoluteCoords(absolutePosition, relativeCoords)
  });
}

function movePiece(fromCoords, toCoords) {
  if (getPieceAtCoords(fromCoords) === null) throw "There's no piece in the starting position";
  if (getPieceAtCoords(toCoords) !== null) throw "There's already a piece in the finishing position";

  var piece = getPieceAtCoords(fromCoords);

  if (piece.color === green && containsCoords(greenWinZoneCoordinates, toCoords)) throw "Green can't move into their own win zone";
  if (piece.color === blue && containsCoords(blueWinZoneCoordinates, toCoords)) throw "Blue can't move into their own win zone";

  setPieceAtCoords(fromCoords, null);
  setPieceAtCoords(toCoords, piece);

  // Update winner
  state.winner = checkWin();
  if (state.winner !== null) {
    console.log(state.winner, "wins!")
  }

  // If piece was selected, update selected 
  
  clearSelectedPiece();
}

function checkWin() {
  var piecesInGreenWinZone = getPiecesAtCoords(greenWinZoneCoordinates);
  if (piecesInGreenWinZone.every(function (piece) { return piece !== null && piece.color === blue })) return blue;
  var piecesInBlueWinZone = getPiecesAtCoords(blueWinZoneCoordinates); 
  if (piecesInBlueWinZone.every(function (piece) { return piece !== null && piece.color === green })) return green;
  return null;
}

function checkRelativeMoveWithBlocks(fromCoords, moveWithBlocks) {
  if (getPieceAtCoords(fromCoords) === null) throw "There's no piece in the starting position";
  
  var checkList = copyArray(moveWithBlocks[1])
  checkList.push(moveWithBlocks[0]); 
  var absolutePosition = fromCoords;
  for (var i = 0; i < checkList.length; i++) {
    var absoluteCoords = getAbsoluteCoords(absolutePosition, checkList[i]);
    if (!inGrid(absoluteCoords, state)) return false;
    if (getPieceAtCoords(absoluteCoords) !== null) return false; 
  }
  // Check that the move doesn't end in their win zone
  var piece = getPieceAtCoords(fromCoords);
  if (piece.color === green) {
    if (containsCoords(greenWinZoneCoordinates, getAbsoluteCoords(absolutePosition, moveWithBlocks[0]))) return false;
  }
  if (piece.color === blue) {
    if (containsCoords(blueWinZoneCoordinates, getAbsoluteCoords(absolutePosition, moveWithBlocks[0]))) return false;
  }

  return true;
}

// returns a list of coordinates and associated move 'type's
function getPossibleMoves(fromCoords) {
  if (getPieceAtCoords(fromCoords) === null) throw "There's no piece in the starting position";
  
  var candidateMoves = [];
  
  // add basic type1 moves
  candidateMoves = candidateMoves.concat(
    relative1MovesWithBlocks.map(
      function(moveWithBlocks) {
        return [moveWithBlocks[0], moveWithBlocks[1], type1];
      }
    )
  );

  // add basic type2 moves
  candidateMoves = candidateMoves.concat(
    relative2MovesWithBlocks.map(
      function(moveWithBlocks) {
        return [moveWithBlocks[0], moveWithBlocks[1], type2];
      }
    )
  );

  // add basic type3 moves
  candidateMoves = candidateMoves.concat(
    relative3MovesWithBlocks.map(
      function(moveWithBlocks) {
        return [moveWithBlocks[0], moveWithBlocks[1], type3];
      }
    )
  );

  var piece = getPieceAtCoords(fromCoords);
  var absolutePosition = fromCoords;

  // add type1 color squeezing
  if (piece.color === blue) {
    // can move diagonally backward
    candidateMoves.push([[-1, -1], [], type1]);
    var absoluteCoords = getAbsoluteCoordList(absolutePosition, [[0, 1], [1, 0]]);
    var squeezePieces = getPiecesAtCoords(absoluteCoords);
    if (squeezePieces.every(function (piece) { return piece !== null})) candidateMoves.push([[1, 1], [], type1]);
  }
  if (piece.color === green) {
    // can move diagonally backward
    candidateMoves.push([[1, 1], [], type1]);
    var absoluteCoords = getAbsoluteCoordList(absolutePosition, [[0, -1], [-1, 0]]);
    var squeezePieces = getPiecesAtCoords(absoluteCoords);
    if (squeezePieces.every(function (piece) { return piece !== null})) candidateMoves.push([[-1, -1], [], type1]);

  }

  // add type2 sideways jumping
  var right = getAbsoluteCoords(absolutePosition, [-1, 1]);
  if (getPieceAtCoords(right) !== null) candidateMoves.push([[-2, 2], [], type2]);

  var left = getAbsoluteCoords(absolutePosition, [1, -1]);
  if (getPieceAtCoords(left) !== null) candidateMoves.push([[2, -2], [], type2]);
  

  // filter candidate moves
  var validMoves = candidateMoves.filter(function (moveWithBlocks) { return checkRelativeMoveWithBlocks(fromCoords, moveWithBlocks); });
  var absoluteValidMoves = validMoves.map(function (moveWithBlocks) { return [getAbsoluteCoords(absolutePosition, moveWithBlocks[0]), moveWithBlocks[2]]; });

  return absoluteValidMoves;
}

function takeYouJestAction() {
  var piece = getPieceAtCoords(state.lastMove);
  if (state.lastMoveType !== piece.type) {
    console.log("YOU JEST GOOD SIR! REMOVE THAT PIECE!");
    setPieceAtCoords(state.lastMove, null);
    updateTurn();
    clearLastMove();
  } else {
    console.log("HE MOVETH TRUE! I RESCIND MY PIECE!");
    state.phase = removePhase;
  }
}

function selectOrUnselectPiece(coords) {
  var piece = getPieceAtCoords(coords);
  if (piece === null) throw "No piece at coords";
  if (state.turn !== piece.color) throw "Piece at coords is wrong color";
  if (arrayEquals(state.selected, coords)) {
    clearSelectedPiece();
  } else {
    setSelectedPiece(coords);
  }
}

function setSelectedPiece(coords) {
  state.selected = coords;
  updatePossibleMoves();
}

function clearSelectedPiece() {
  state.selected = [];
  updatePossibleMoves();
}

function updatePossibleMoves() {
  if (state.selected.length === 0) {
    state.moves = [];
  } else {
    state.moves = getPossibleMoves(state.selected);
  }
}

function updateTurn() {
  if (state.turn === green) {
    state.turn = blue;
  } else if (state.turn === blue) {
    state.turn = green;
  }
  clearSelectedPiece();
}

function moveSelectedPiece(coords) {
  var move = state.moves.find(function (move) { return arrayEquals(move[0], coords); });
  if (move === undefined) throw "No available move";
  const prev = state.selected.map(function(x) { return x; });
  movePiece(state.selected, move[0]);

  console.log("Moved", state.turn, move[1], "piece from", prev, "to", move[0]);

  // Update last move
  state.lastMove = move[0];
  state.lastMoveType = move[1];

  updateTurn();
}

function printState() {
  state.print();
}

function startNewGame() {
  state = new State();
  /* setPieceAtCoords([1, 1], new Piece('blue', 'type3'));
  setPieceAtCoords([2, 0], new Piece('blue', 'type1'));
  setPieceAtCoords([0, 2], new Piece('blue', 'type2'));
  setPieceAtCoords([6, 6], new Piece('green', 'type1'));
  setPieceAtCoords([5, 7], new Piece('green', 'type2'));
  setPieceAtCoords([7, 5], new Piece('green', 'type3')); */
}

function clearLastMove() {
  state.lastMove = null;
  state.lastMoveType = null;
}
