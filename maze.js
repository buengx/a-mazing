// Maze generation and rendering
const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');
const rows = 20;
const cols = 20;
const cellSize = canvas.width / cols;

let player = {
  row: 0,
  col: 0
};

let autoMoveDelay = 200; // Delay for automove in milliseconds
let easingDuration = 500; // Duration for sliding motion in milliseconds

class Cell {
  constructor(row, col) {
    this.row = row;
    this.col = col;
    this.walls = { top: true, right: true, bottom: true, left: true };
    this.visited = false;
    this.solutionPath = false; // For solution visualization
  }
}

// Maze grid
const grid = [];
for (let r = 0; r < rows; r++) {
  const row = [];
  for (let c = 0; c < cols; c++) {
    row.push(new Cell(r, c));
  }
  grid.push(row);
}

// Maze generation using Recursive Backtracker
function generateMaze() {
  player.row = 0;
  player.col = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      grid[r][c].visited = false;
      grid[r][c].walls = { top: true, right: true, bottom: true, left: true };
    }
  }
  const stack = [];
  let current = grid[0][0];
  current.visited = true;
  let visitedCount = 1;
  const totalCells = rows * cols;
  while (visitedCount < totalCells) {
    const neighbors = getUnvisitedNeighbors(current);
    if (neighbors.length > 0) {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      stack.push(current);
      removeWalls(current, next);
      current = next;
      current.visited = true;
      visitedCount++;
    } else if (stack.length > 0) {
      current = stack.pop();
    }
  }
}

// Function to show the solution path
function showSolution() {
  // Clear previous solution
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      grid[r][c].solutionPath = false;
    }
  }

  const path = findPath(grid[0][0], grid[rows - 1][cols - 1]);
  if (path.length > 0) {
    for (const cell of path) {
      cell.solutionPath = true;
    }
  }

  drawMaze(); // Redraw the maze with the solution path
}

function getUnvisitedNeighbors(cell) {
  const { row, col } = cell;
  const neighbors = [];
  if (row > 0 && !grid[row - 1][col].visited) neighbors.push(grid[row - 1][col]);
  if (col < cols - 1 && !grid[row][col + 1].visited) neighbors.push(grid[row][col + 1]);
  if (row < rows - 1 && !grid[row + 1][col].visited) neighbors.push(grid[row + 1][col]);
  if (col > 0 && !grid[row][col - 1].visited) neighbors.push(grid[row][col - 1]);
  return neighbors;
}

function getAccessibleNeighbors(cell) {
  const { row, col } = cell;
  const neighbors = [];
  if (row > 0 && !grid[row - 1][col].walls.bottom) neighbors.push(grid[row - 1][col]);
  if (col < cols - 1 && !grid[row][col + 1].walls.left) neighbors.push(grid[row][col + 1]);
  if (row < rows - 1 && !grid[row + 1][col].walls.top) neighbors.push(grid[row + 1][col]);
  if (col > 0 && !grid[row][col - 1].walls.right) neighbors.push(grid[row][col - 1]);
  return neighbors;
}

// Pathfinding using Breadth-First Search (BFS)
function findPath(startCell, endCell) {
  const queue = [startCell];
  const visited = new Set([startCell]);
  const parentMap = new Map();

  while (queue.length > 0) {
    const currentCell = queue.shift();

    if (currentCell === endCell) {
      // Path found, reconstruct it
      const path = [];
      let current = endCell;
      while (current) {
        path.unshift(current);
        current = parentMap.get(current);
      }
      return path;
    }

    const neighbors = getAccessibleNeighbors(currentCell);
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parentMap.set(neighbor, currentCell);
        queue.push(neighbor);
      }
    }
  }

  return []; // No path found
}

function removeWalls(a, b) {
  const dx = b.col - a.col;
  const dy = b.row - a.row;
  if (dx === 1) { a.walls.right = false; b.walls.left = false; }
  else if (dx === -1) { a.walls.left = false; b.walls.right = false; }
  else if (dy === 1) { a.walls.bottom = false; b.walls.top = false; }
  else if (dy === -1) { a.walls.top = false; b.walls.bottom = false; }
}

// Animate movement along a path
async function animatePathMovement(path) {
  for (let i = 0; i < path.length - 1; i++) {
    await new Promise(resolve => {
      animateTransition(path[i], path[i+1], "blue", easingDuration, resolve);
    });
  }
}

// Automatic automove with easing
function autoMove() {
  const path = findPath(grid[0][0], grid[rows - 1][cols - 1]);
  if (path.length > 0) {
    animatePathMovement(path);
  }
}

// Animate smooth movement between cells
function animateTransition(current, next, color, duration, onComplete) {
  const startX = current.col * cellSize;
  const startY = current.row * cellSize;
  const endX = next.col * cellSize;
  const endY = next.row * cellSize;

  let startTime = null;

  function drawFrame(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const t = Math.min(elapsed / duration, 1);
    const easedT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    const currentX = startX + easedT * (endX - startX);
    const currentY = startY + easedT * (endY - startY);

    // Redrawing the whole maze is inefficient, but ensures correctness without complex state management.
    drawMaze();

    ctx.fillStyle = color;
    ctx.fillRect(currentX, currentY, cellSize, cellSize);

    if (t < 1) {
      requestAnimationFrame(drawFrame);
    } else {
      if (onComplete) onComplete();
    }
  }

  requestAnimationFrame(drawFrame);
}

// Draw maze and solution path
function drawMaze() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      drawCell(cell, cell.solutionPath ? 'green' : 'white');
      drawWalls(cell);
    }
  }
  drawPlayer();
}

function drawPlayer() {
  const x = player.col * cellSize + cellSize / 2;
  const y = player.row * cellSize + cellSize / 2;
  const radius = cellSize / 3;

  ctx.fillStyle = 'red';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

async function handleKeyPress(e) {
    let { row, col } = player;
    const currentCell = grid[row][col];
    let nextCell = null;

    switch (e.key) {
        case 'ArrowUp':
            if (!currentCell.walls.top) nextCell = grid[row - 1][col];
            break;
        case 'ArrowDown':
            if (!currentCell.walls.bottom) nextCell = grid[row + 1][col];
            break;
        case 'ArrowLeft':
            if (!currentCell.walls.left) nextCell = grid[row][col - 1];
            break;
        case 'ArrowRight':
            if (!currentCell.walls.right) nextCell = grid[row][col + 1];
            break;
    }

    if (nextCell) {
        await new Promise(resolve => {
            animateTransition(currentCell, nextCell, 'red', 100, () => {
                player.row = nextCell.row;
                player.col = nextCell.col;
                drawMaze();
                if (player.row === rows - 1 && player.col === cols - 1) {
                    setTimeout(() => alert('You won!'), 10);
                }
                resolve();
            });
        });
    }
}

function drawCell(cell, color) {
  ctx.fillStyle = color;
  ctx.fillRect(cell.col * cellSize, cell.row * cellSize, cellSize, cellSize);
}

function drawWalls(cell) {
  const x = cell.col * cellSize;
  const y = cell.row * cellSize;
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  if (cell.walls.top) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + cellSize, y);
    ctx.stroke();
  }
  if (cell.walls.right) {
    ctx.beginPath();
    ctx.moveTo(x + cellSize, y);
    ctx.lineTo(x + cellSize, y + cellSize);
    ctx.stroke();
  }
  if (cell.walls.bottom) {
    ctx.beginPath();
    ctx.moveTo(x, y + cellSize);
    ctx.lineTo(x + cellSize, y + cellSize);
    ctx.stroke();
  }
  if (cell.walls.left) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + cellSize);
    ctx.stroke();
  }
}

// Generate and draw the initial maze
generateMaze();
drawMaze();
// Event Listeners
window.addEventListener('keydown', handleKeyPress);

