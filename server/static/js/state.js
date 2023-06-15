var green = 'green';
var blue = 'blue';
var type1 = 'jacques';
var type2 = 'mini';
var type3 = 'carl';
var setupPhase = 'setup';
var playPhase = 'play';
var removePhase = 'remove';
var swapPhase = 'swap';

var typeToPlaceOrder = [type3, type2, type1];

function getEmptyArray(width) {
  var final = [];
  for (let i=0; i < width; i++) {
    final.push(null);
  }
  return final
}

function getEmptyGrid(width, height) {
  var final = [];
  for (let i=0; i < width; i++) {
    final.push(getEmptyArray(height));
  }
  return final;
}

class Piece {
  color = '';
  type = '';

  constructor(color, type) {
    this.color = color;
    this.type = type;
  }

  print() {
    console.log(this.color, this.type);
  }
}

class State {
  board = getEmptyGrid(8, 8);
  turn = green;
  phase = setupPhase;

  // setup state
  piecesToPlace = {
    [green]: {[type1]: 4, [type2]: 3, [type3]: 1},
    [blue]: {[type1]: 4, [type2]: 3, [type3]: 1},
  };
  typeToPlace = type3;

  
  // play state
  selected = null;
  moves = [];

  winner = null;

  lastMove = null;
  lastMoveType = null;

  print() {
    console.log(this.board, this.turn, this.selectedCoords, this.candidateMoves);
  }
}