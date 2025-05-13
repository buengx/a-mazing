// Maze generation and rendering
const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');
const rows = 20;
const cols = 20;
const cellSize = canvas.width / cols;

class Cell {
  constructor(row, col) {
    this.row = row;
    this.col = col;
    this.walls = { top: true, right: true, bottom: true, left: true };
    this.visited = false;
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
  // Reset all cells
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      grid[r][c].visited = false;
      grid[r][c].walls = { top: true, right: true, bottom: true, left: true };
    }
  }
  // Recursive Backtracker (iterative)
  const stack = [];
  let current = grid[0][0];
  current.visited = true;
  let visitedCount = 1;
  const totalCells = rows * cols;
  while (visitedCount < totalCells) {
    const neighbors = [];
    if (current.row > 0 && !grid[current.row - 1][current.col].visited) neighbors.push(grid[current.row - 1][current.col]);
    if (current.col < cols - 1 && !grid[current.row][current.col + 1].visited) neighbors.push(grid[current.row][current.col + 1]);
    if (current.row < rows - 1 && !grid[current.row + 1][current.col].visited) neighbors.push(grid[current.row + 1][current.col]);
    if (current.col > 0 && !grid[current.row][current.col - 1].visited) neighbors.push(grid[current.row][current.col - 1]);
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

function getUnvisitedNeighbors(cell) {
  const { row, col } = cell;
  const neighbors = [];
  if (row > 0 && !grid[row - 1][col].visited) neighbors.push(grid[row - 1][col]);
  if (col < cols - 1 && !grid[row][col + 1].visited) neighbors.push(grid[row][col + 1]);
  if (row < rows - 1 && !grid[row + 1][col].visited) neighbors.push(grid[row + 1][col]);
  if (col > 0 && !grid[row][col - 1].visited) neighbors.push(grid[row][col - 1]);
  return neighbors;
}

function removeWalls(a, b) {
  const dx = b.col - a.col;
  const dy = b.row - a.row;
  if (dx === 1) { a.walls.right = false; b.walls.left = false; }
  else if (dx === -1) { a.walls.left = false; b.walls.right = false; }
  if (dy === 1) { a.walls.bottom = false; b.walls.top = false; }
  else if (dy === -1) { a.walls.top = false; b.walls.bottom = false; }
}

function bfsFurthestPoints() {
  // BFS from (0,0) to find furthest point
  const queue = [[0, 0, 0]]; // [row, col, dist]
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  visited[0][0] = true;
  let furthest = [0, 0, 0];
  while (queue.length) {
    const [r, c, d] = queue.shift();
    if (d > furthest[2]) furthest = [r, c, d];
    const cell = grid[r][c];
    // Up
    if (!cell.walls.top && r > 0 && !visited[r - 1][c]) {
      visited[r - 1][c] = true;
      queue.push([r - 1, c, d + 1]);
    }
    // Right
    if (!cell.walls.right && c < cols - 1 && !visited[r][c + 1]) {
      visited[r][c + 1] = true;
      queue.push([r, c + 1, d + 1]);
    }
    // Down
    if (!cell.walls.bottom && r < rows - 1 && !visited[r + 1][c]) {
      visited[r + 1][c] = true;
      queue.push([r + 1, c, d + 1]);
    }
    // Left
    if (!cell.walls.left && c > 0 && !visited[r][c - 1]) {
      visited[r][c - 1] = true;
      queue.push([r, c - 1, d + 1]);
    }
  }
  // Now BFS from furthest to find the other furthest
  const [startR, startC] = furthest;
  const queue2 = [[startR, startC, 0]];
  const visited2 = Array.from({ length: rows }, () => Array(cols).fill(false));
  visited2[startR][startC] = true;
  let furthest2 = [startR, startC, 0];
  while (queue2.length) {
    const [r, c, d] = queue2.shift();
    if (d > furthest2[2]) furthest2 = [r, c, d];
    const cell = grid[r][c];
    if (!cell.walls.top && r > 0 && !visited2[r - 1][c]) {
      visited2[r - 1][c] = true;
      queue2.push([r - 1, c, d + 1]);
    }
    if (!cell.walls.right && c < cols - 1 && !visited2[r][c + 1]) {
      visited2[r][c + 1] = true;
      queue2.push([r, c + 1, d + 1]);
    }
    if (!cell.walls.bottom && r < rows - 1 && !visited2[r + 1][c]) {
      visited2[r + 1][c] = true;
      queue2.push([r + 1, c, d + 1]);
    }
    if (!cell.walls.left && c > 0 && !visited2[r][c - 1]) {
      visited2[r][c - 1] = true;
      queue2.push([r, c - 1, d + 1]);
    }
  }
  return [furthest, furthest2];
}

let player = { row: 0, col: 0 };

// Prevent arrow keys from scrolling the page
window.addEventListener('keydown', function(e) {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].includes(e.key)) {
    e.preventDefault();
  }
}, { passive: false });

// Add a reset button to shuffle the maze
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.createElement('button');
  btn.textContent = 'Reset / Shuffle Maze';
  btn.style.margin = '10px';
  btn.onclick = resetMaze;
  document.body.insertBefore(btn, canvas);

  // Add a fog of war checkbox
  const fogLabel = document.createElement('label');
  fogLabel.style.margin = '10px';
  fogLabel.style.fontSize = '1.1em';
  const fogCheckbox = document.createElement('input');
  fogCheckbox.type = 'checkbox';
  fogCheckbox.id = 'fogOfWar';
  fogCheckbox.style.marginRight = '6px';
  fogLabel.appendChild(fogCheckbox);
  fogLabel.appendChild(document.createTextNode('Fog of War (only show walls of visited cells)'));
  document.body.insertBefore(fogLabel, canvas);
  fogCheckbox.addEventListener('change', () => {
    fogOfWar = fogCheckbox.checked;
    drawMaze();
  });
});

function cellKey(row, col) {
  return row + ',' + col;
}

let backtrackedSet = new Set();

function autoMove() {
  if (!autoMoving) return;
  const { row, col } = player;
  const [f1, f2] = bfsFurthestPoints();
  // Only reset if at end cell (red)
  if (row === f1[0] && col === f1[1]) {
    setTimeout(resetMaze, 500);
    return;
  }
  // Only consider unvisited and not backtracked directions
  let dirs = getAvailableDirections(row, col).filter(d => !visitedPath[row + d.dr][col + d.dc] && !backtrackedSet.has(cellKey(row + d.dr, col + d.dc)));
  if (dirs.length === 1) {
    // Only one way to go (unvisited and not backtracked)
    const d = dirs[0];
    player.row += d.dr;
    player.col += d.dc;
    path.push({ row: player.row, col: player.col });
    visitedPath[player.row][player.col] = true;
    drawMaze();
    setTimeout(autoMove, 80);
    return;
  }
  // If no such direction, fall back to previous logic
  dirs = getAvailableDirections(row, col).filter(d => !visitedPath[row + d.dr][col + d.dc]);
  let nonBacktrackedDirs = dirs.filter(d => !backtrackedSet.has(cellKey(row + d.dr, col + d.dc)));
  if (dirs.length === 1) {
    // Only one way to go
    const d = dirs[0];
    if (!backtrackedSet.has(cellKey(row + d.dr, col + d.dc))) {
      // Move forward
      player.row += d.dr;
      player.col += d.dc;
      path.push({ row: player.row, col: player.col });
      visitedPath[player.row][player.col] = true;
      drawMaze();
      setTimeout(autoMove, 80);
      return;
    } else {
      // Only option is a backtracked cell, so mark current as backtracked and backtrack
      const last = path.pop();
      backtrackSquares.push(last);
      backtrackedSet.add(cellKey(last.row, last.col));
      visitedPath[last.row][last.col] = false;
      const prev = path[path.length - 1];
      player.row = prev.row;
      player.col = prev.col;
      drawMaze();
      setTimeout(autoMove, 80);
      return;
    }
  }
  if (dirs.length === 0 || (dirs.length > 1 && nonBacktrackedDirs.length === 0)) {
    // Dead end, or all options are backtracked cells
    if (path.length > 1) {
      const last = path.pop();
      backtrackSquares.push(last);
      backtrackedSet.add(cellKey(last.row, last.col));
      visitedPath[last.row][last.col] = false;
      const prev = path[path.length - 1];
      player.row = prev.row;
      player.col = prev.col;
      drawMaze();
      setTimeout(autoMove, 80);
    }
    return;
  }
  // At an intersection (more than one way to go), wait for user input
  autoMoving = false;
}

function resetMaze() {
  generateMaze();
  // Start at the blue start cell (f2)
  const [f1, f2] = bfsFurthestPoints();
  player = { row: f2[0], col: f2[1] };
  path = [{ row: player.row, col: player.col }];
  visitedPath = Array.from({ length: rows }, () => Array(cols).fill(false));
  visitedPath[player.row][player.col] = true;
  backtrackSquares = [];
  backtrackedSet = new Set();
  autoMoving = true;
  drawMaze();
  setTimeout(autoMove, 200);
}

// Pathfinding and auto-move logic
let autoMoving = true;
let path = [{ row: 0, col: 0 }];
let visitedPath = Array.from({ length: rows }, () => Array(cols).fill(false));
visitedPath[0][0] = true;
let backtrackSquares = [];
let fogOfWar = false;

function getAvailableDirections(row, col) {
  const cell = grid[row][col];
  const dirs = [];
  if (!cell.walls.top) dirs.push({ dr: -1, dc: 0, key: 'up' });
  if (!cell.walls.right) dirs.push({ dr: 0, dc: 1, key: 'right' });
  if (!cell.walls.bottom) dirs.push({ dr: 1, dc: 0, key: 'down' });
  if (!cell.walls.left) dirs.push({ dr: 0, dc: -1, key: 'left' });
  return dirs;
}

function isIntersection(row, col) {
  // Count available directions not visited
  const dirs = getAvailableDirections(row, col);
  let count = 0;
  for (const d of dirs) {
    const nr = row + d.dr, nc = col + d.dc;
    if (!visitedPath[nr][nc]) count++;
  }
  return count > 1;
}

// Listen for direction at intersection
function handlePlayerInput(e) {
  if (autoMoving) return;
  const keyMap = {
    ArrowUp: { dr: -1, dc: 0 }, w: { dr: -1, dc: 0 },
    ArrowDown: { dr: 1, dc: 0 }, s: { dr: 1, dc: 0 },
    ArrowLeft: { dr: 0, dc: -1 }, a: { dr: 0, dc: -1 },
    ArrowRight: { dr: 0, dc: 1 }, d: { dr: 0, dc: 1 }
  };
  const move = keyMap[e.key];
  if (!move) return;
  const { row, col } = player;
  const cell = grid[row][col];
  let canMove = false;
  if (move.dr === -1 && !cell.walls.top) canMove = true;
  if (move.dr === 1 && !cell.walls.bottom) canMove = true;
  if (move.dc === -1 && !cell.walls.left) canMove = true;
  if (move.dc === 1 && !cell.walls.right) canMove = true;
  if (canMove && !visitedPath[row + move.dr][col + move.dc]) {
    player.row += move.dr;
    player.col += move.dc;
    path.push({ row: player.row, col: player.col });
    visitedPath[player.row][player.col] = true;
    autoMoving = true;
    drawMaze();
    setTimeout(autoMove, 80);
  }
}
document.addEventListener('keydown', handlePlayerInput);

function drawMaze() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Draw green path (full square)
  for (let i = 0; i < path.length; i++) {
    const { row, col } = path[i];
    ctx.fillStyle = 'rgba(0,200,0,0.7)';
    ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
  }
  // Draw red backtrack squares
  for (const sq of backtrackSquares) {
    ctx.fillStyle = 'rgba(220,0,0,0.7)';
    ctx.fillRect(sq.col * cellSize, sq.row * cellSize, cellSize, cellSize);
  }
  // Draw white border between red and green
  for (const sq of backtrackSquares) {
    const { row, col } = sq;
    const neighbors = [
      { dr: -1, dc: 0 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 }
    ];
    for (const n of neighbors) {
      const nr = row + n.dr, nc = col + n.dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && visitedPath[nr][nc]) {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 4;
        ctx.beginPath();
        if (n.dr === -1) {
          ctx.moveTo(col * cellSize, row * cellSize);
          ctx.lineTo((col + 1) * cellSize, row * cellSize);
        } else if (n.dr === 1) {
          ctx.moveTo(col * cellSize, (row + 1) * cellSize);
          ctx.lineTo((col + 1) * cellSize, (row + 1) * cellSize);
        } else if (n.dc === -1) {
          ctx.moveTo(col * cellSize, row * cellSize);
          ctx.lineTo(col * cellSize, (row + 1) * cellSize);
        } else if (n.dc === 1) {
          ctx.moveTo((col + 1) * cellSize, row * cellSize);
          ctx.lineTo((col + 1) * cellSize, (row + 1) * cellSize);
        }
        ctx.stroke();
      }
    }
  }
  // Draw maze walls last so they're always visible
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // FOG OF WAR: Only draw walls for visited cells if enabled
      if (!fogOfWar || visitedPath[r][c]) {
        const cell = grid[r][c];
        const x = c * cellSize;
        const y = r * cellSize;
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
          ctx.moveTo(x + cellSize, y + cellSize);
          ctx.lineTo(x, y + cellSize);
          ctx.stroke();
        }
        if (cell.walls.left) {
          ctx.beginPath();
          ctx.moveTo(x, y + cellSize);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
      }
    }
  }
  // Mark the two furthest points
  const [f1, f2] = bfsFurthestPoints();
  ctx.fillStyle = 'red';
  ctx.beginPath();
  ctx.arc(f1[1] * cellSize + cellSize / 2, f1[0] * cellSize + cellSize / 2, cellSize / 4, 0, 2 * Math.PI);
  ctx.fill();
  ctx.fillStyle = 'blue';
  ctx.beginPath();
  ctx.arc(f2[1] * cellSize + cellSize / 2, f2[0] * cellSize + cellSize / 2, cellSize / 4, 0, 2 * Math.PI);
  ctx.fill();
  // Draw player
  ctx.fillStyle = 'lime';
  ctx.beginPath();
  ctx.arc(player.col * cellSize + cellSize / 2, player.row * cellSize + cellSize / 2, cellSize / 3, 0, 2 * Math.PI);
  ctx.fill();
}

generateMaze();
// Initial start at blue cell
const [f1, f2] = bfsFurthestPoints();
player = { row: f2[0], col: f2[1] };
path = [{ row: player.row, col: player.col }];
visitedPath = Array.from({ length: rows }, () => Array(cols).fill(false));
visitedPath[player.row][player.col] = true;
backtrackSquares = [];
backtrackedSet = new Set();
autoMoving = true;
drawMaze();
setTimeout(autoMove, 200);
