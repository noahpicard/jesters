var offsetX = 200;
var offsetY = 100;

function drawDot(x, y, pointSize, color) {
  ctx.fillStyle = color; // Set color
  ctx.beginPath(); //Start path
  ctx.arc(x, y, pointSize, 0, Math.PI * 2, true); // Draw a point using the arc function of the canvas with a point structure.
  ctx.fill(); // Close the path and fill.
}

function drawCircle(x, y, pointSize, color) {
  ctx.strokeStyle = color; // Set color
  ctx.beginPath(); //Start path
  ctx.arc(x, y, pointSize, 0, Math.PI * 2, true); // Draw a point using the arc function of the canvas with a point structure.
  ctx.stroke(); // Close the path
}

function drawText(x, y, font, color, text) {
  ctx.font = font || "48px serif";
  ctx.textAligh = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function inBounds(x, y, w, h, clickX, clickY) {
  return !(
    clickX < x ||
    clickX >= x + w ||
    clickY < y ||
    clickY >= y + h);
}

var spacingWidth = 30;
var spacingHeight = 30;

var mainAffineTransform = [
  [20, -20],
  [30, 30],
];

var inverseAffineTransform = matInverse(mainAffineTransform);

var sqAffineTransform = [
  [30, 0],
  [0, 30],
];

function getAffineCoords(x, y, affineTransform) {
  return [
    (affineTransform[0][0] * x) + (affineTransform[0][1] * y),
    (affineTransform[1][0] * x) + (affineTransform[1][1] * y)
  ];
}

function draw() {
  var rectCoords = getAffineCoords(width, height, sqAffineTransform);
  ctx.clearRect(0, 0, rectCoords[0], rectCoords[1]);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, rectCoords[0], rectCoords[1]);
  state["board"].map(function(column, xIndex) {
    column.map(function(piece, yIndex) {
      var affineCoords = getAffineCoords(xIndex, yIndex, mainAffineTransform);

      if (state.phase === setupPhase) {
        if (containsCoords(startZoneCoordinates[state.turn], [xIndex, yIndex])) {
          drawDot(offsetX + affineCoords[0], offsetY + affineCoords[1], 4, 'white');
        } else {
          drawDot(offsetX + affineCoords[0], offsetY + affineCoords[1], 3, 'grey');
        }
      } else {
        drawDot(offsetX + affineCoords[0], offsetY + affineCoords[1], 3, 'white');
      }
      if (piece !== null) {
        if (piece.color === 'green') {
          drawDot(offsetX + affineCoords[0], offsetY + affineCoords[1], 10, 'green');
        }
        if (piece.color === 'blue') {
          drawDot(offsetX + affineCoords[0], offsetY + affineCoords[1], 10, 'blue');
        }
      }
    });
  })
  state.moves.map(function(move) {
    var coords = move[0];
    var piece = state.board[state.selected[0]][state.selected[1]];
    if (piece === null) return;
    var affineCoords = getAffineCoords(coords[0], coords[1], mainAffineTransform);
    var drawColor = 'yellow';
    if (piece.type === move[1]) drawColor = 'limegreen';
    drawCircle(offsetX + affineCoords[0], offsetY + affineCoords[1], 10, drawColor);
  });

  var selectAffineCoords = getAffineCoords(inputState.mouseBoardPos.x, inputState.mouseBoardPos.y, mainAffineTransform);
  drawCircle(offsetX + selectAffineCoords[0], offsetY + selectAffineCoords[1], 12, 'grey');
  var mouseOverPiece = getPieceAtCoords(inputState.mouseBoardPos.coords);
  if (mouseOverPiece !== null && mouseOverPiece.color === state.turn) {
    drawText(offsetX + selectAffineCoords[0] - 16, offsetY + selectAffineCoords[1], "16px serif", "white", mouseOverPiece.type);
  }

  drawText(20, 540, "24px serif", state.turn, state.turn + "'s turn");
  drawText(20, 570, "24px serif", "white", state.phase + " phase");

  if (state.phase === setupPhase) {
    drawText(20, 600, "24px serif", "white", "click to place: " + state.typeToPlace);
    drawText(20, 630, "24px serif", "white", type3 + " remaining: " + state.piecesToPlace[state.turn][type3]);
    drawText(20, 660, "24px serif", "white", type2 + " remaining: " + state.piecesToPlace[state.turn][type2]);
    drawText(20, 690, "24px serif", "white", type1 + " remaining: " + state.piecesToPlace[state.turn][type1]);
  }

  if (state.phase === removePhase) {
    drawText(20, 600, "24px serif", "white", "click to remove 1 piece");
  }

  if (state.phase === swapPhase) {
    drawText(20, 600, "24px serif", "white", "click a piece to swap with last moved piece");
    var lastMoveAffineCoords = getAffineCoords(state.lastMove[0], state.lastMove[1], mainAffineTransform);
    drawCircle(offsetX + lastMoveAffineCoords[0], offsetY + lastMoveAffineCoords[1], 12, 'yellow');
  }

  if (state.phase === playPhase) {
    if (state.lastMove !== null) {
      ctx.fillStyle = "purple";
      ctx.fillRect(20, 650-30, 110, 60);
      drawText(30, 650, "24px serif", "white", "You jest!");  
    }
  }
}