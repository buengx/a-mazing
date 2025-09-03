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

// New variables for the enhanced functionality
let hideUnvisitedWalls = false;
let autoMovementEnabled = false;
let playerVisited = new Set(); // Track visited cells
let startCell = null;
let endCell = null;
let autoMovementInterval = null;

class Cell {
  constructor(row, col) {
    this.row = row;
    this.col = col;
    this.walls = { top: true, right: true, bottom: true, left: true };
    this.visited = false;
    this.solutionPath = false; // For solution visualization
    this.isDeadEnd = false;
    this.searchState = 'unvisited'; // for BFS visualization
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
  // Reset everything
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      cell.visited = false;
      cell.walls = { top: true, right: true, bottom: true, left: true };
      cell.solutionPath = false;
      cell.isDeadEnd = false;
      cell.searchState = 'unvisited';
    }
  }
  playerVisited.clear();
  
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
  
  // Reset visited for gameplay and find furthest points
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      grid[r][c].visited = false;
    }
  }
  
  // Find the two furthest points in the maze
  const furthestPoints = findFurthestPoints();
  startCell = furthestPoints.start;
  endCell = furthestPoints.end;
  
  // Set player to start position
  player.row = startCell.row;
  player.col = startCell.col;
  playerVisited.add(`${startCell.row},${startCell.col}`);
}

// Visualize BFS and then animate the final path
async function showSolution() {
    // Reset states
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            grid[r][c].solutionPath = false;
            grid[r][c].searchState = 'unvisited';
        }
    }
    drawMaze();

    const path = await visualizeBFS();

    if (path.length > 0) {
        // Mark the final path
        for (const cell of path) {
            cell.solutionPath = true;
        }
        drawMaze();

        // Animate player along the final path
        await animatePathMovement(path);
    }
}

async function visualizeBFS() {
    const queue = [[grid[0][0]]]; // Queue of paths
    const visited = new Set([grid[0][0]]);
    grid[0][0].searchState = 'visiting';

    while (queue.length > 0) {
        const currentPath = queue.shift();
        const currentCell = currentPath[currentPath.length - 1];

        if (currentCell.row === rows - 1 && currentCell.col === cols - 1) {
            return currentPath; // Solution found
        }

        const neighbors = getAccessibleNeighbors(currentCell);
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                neighbor.searchState = 'visiting';

                const newPath = [...currentPath, neighbor];
                queue.push(newPath);

                if (getAccessibleNeighbors(neighbor).length > 2) {
                    neighbor.searchState = 'intersection';
                }
            }
        }

        currentCell.searchState = 'visited';

        await new Promise(resolve => setTimeout(() => {
            drawMaze();
            resolve();
        }, 50));
    }

    return []; // No path found
}

// Find the two furthest points in the maze using BFS
function findFurthestPoints() {
  let maxDistance = 0;
  let furthestPair = { start: grid[0][0], end: grid[rows-1][cols-1] };
  
  // Try each cell as a starting point
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const startCell = grid[r][c];
      const distances = bfsDistances(startCell);
      
      // Find the furthest cell from this starting point
      for (let r2 = 0; r2 < rows; r2++) {
        for (let c2 = 0; c2 < cols; c2++) {
          const distance = distances[r2][c2];
          if (distance > maxDistance) {
            maxDistance = distance;
            furthestPair = { start: startCell, end: grid[r2][c2] };
          }
        }
      }
    }
  }
  
  return furthestPair;
}

// BFS to calculate distances from a starting cell
function bfsDistances(startCell) {
  const distances = Array(rows).fill(null).map(() => Array(cols).fill(-1));
  const queue = [startCell];
  distances[startCell.row][startCell.col] = 0;
  
  while (queue.length > 0) {
    const current = queue.shift();
    const currentDistance = distances[current.row][current.col];
    
    const neighbors = getAccessibleNeighbors(current);
    for (const neighbor of neighbors) {
      if (distances[neighbor.row][neighbor.col] === -1) {
        distances[neighbor.row][neighbor.col] = currentDistance + 1;
        queue.push(neighbor);
      }
    }
  }
  
  return distances;
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
      if (!visited.has(neighbor) && !neighbor.isDeadEnd) {
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

// Checkbox functionality
function toggleUnvisitedWalls() {
  hideUnvisitedWalls = document.getElementById('hideUnvisitedWalls').checked;
  drawMaze();
}

function toggleAutoMovement() {
  autoMovementEnabled = document.getElementById('autoMovement').checked;
  if (autoMovementEnabled) {
    startAutoMovement();
  } else {
    stopAutoMovement();
  }
}

function startAutoMovement() {
  if (autoMovementInterval) clearInterval(autoMovementInterval);
  autoMovementInterval = setInterval(performAutoMovement, 300);
}

function stopAutoMovement() {
  if (autoMovementInterval) {
    clearInterval(autoMovementInterval);
    autoMovementInterval = null;
  }
}

function performAutoMovement() {
  const currentCell = grid[player.row][player.col];
  const unvisitedNeighbors = getAccessibleNeighbors(currentCell).filter(neighbor => 
    !playerVisited.has(`${neighbor.row},${neighbor.col}`)
  );
  
  if (unvisitedNeighbors.length === 1) {
    // Move to the only unvisited neighbor
    movePlayerTo(unvisitedNeighbors[0]);
  } else if (unvisitedNeighbors.length === 0) {
    // Backtrack until we find a cell with unvisited neighbors
    backtrackToChoice();
  } else {
    // Multiple choices available, wait for user input
    stopAutoMovement();
  }
}

function backtrackToChoice() {
  // Find path back to a cell with multiple unvisited neighbors
  const visitedCells = Array.from(playerVisited).map(coord => {
    const [row, col] = coord.split(',').map(Number);
    return grid[row][col];
  });
  
  // Reverse order to backtrack
  for (let i = visitedCells.length - 1; i >= 0; i--) {
    const cell = visitedCells[i];
    const unvisitedNeighbors = getAccessibleNeighbors(cell).filter(neighbor => 
      !playerVisited.has(`${neighbor.row},${neighbor.col}`)
    );
    
    if (unvisitedNeighbors.length > 1) {
      movePlayerTo(cell);
      return;
    }
  }
  
  // No choices found, stop auto movement
  stopAutoMovement();
}

function movePlayerTo(targetCell) {
  player.row = targetCell.row;
  player.col = targetCell.col;
  playerVisited.add(`${targetCell.row},${targetCell.col}`);
  drawMaze();
  
  // Check if reached end
  if (targetCell === endCell) {
    stopAutoMovement();
    setTimeout(() => alert('You won!'), 100);
  }
}

// Animate movement along a path
async function animatePathMovement(path) {
  for (let i = 0; i < path.length - 1; i++) {
    await new Promise(resolve => {
      animateTransition(path[i], path[i+1], "blue", easingDuration, resolve);
    });
  }
}

// Dead-end filling algorithm for autoMove
async function autoMove() {
    // Phase 1: Identify and mark all dead-end paths
    const deadEnds = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cell = grid[r][c];
            const neighbors = getAccessibleNeighbors(cell);
            if (neighbors.length === 1 && !(cell.row === 0 && cell.col === 0)) {
                deadEnds.push(cell);
            }
        }
    }

    let visitedInFill = new Set();
    for (const startNode of deadEnds) {
        if (visitedInFill.has(startNode)) continue;

        let current = startNode;
        let path = [];
        while (true) {
            const neighbors = getAccessibleNeighbors(current).filter(n => !visitedInFill.has(n));
            const parentIntersection = getAccessibleNeighbors(current);

            if (parentIntersection.length > 2 || neighbors.length === 0) {
                break; // Stop at intersections or if path is fully traversed
            }

            path.push(current);
            visitedInFill.add(current);
            current = neighbors[0];
        }

        for (const cell of path) {
            cell.isDeadEnd = true;
            await new Promise(resolve => setTimeout(() => {
                drawMaze();
                resolve();
            }, 50));
        }
    }

    // Phase 2: Solve the remaining maze
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
      drawCell(cell);
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
                playerVisited.add(`${nextCell.row},${nextCell.col}`);
                drawMaze();
                if (endCell && player.row === endCell.row && player.col === endCell.col) {
                    setTimeout(() => alert('You won!'), 10);
                }
                resolve();
            });
        });
    }
}

function drawCell(cell) {
  let color = 'white';
  const isPlayerVisited = playerVisited.has(`${cell.row},${cell.col}`);
  const isStart = startCell && cell.row === startCell.row && cell.col === startCell.col;
  const isEnd = endCell && cell.row === endCell.row && cell.col === endCell.col;
  
  if (isStart) {
    color = 'lightblue';
  } else if (isEnd) {
    color = 'lightcoral';
  } else if (isPlayerVisited) {
    color = 'lightgray';
  } else if (cell.isDeadEnd) {
    color = '#444'; // Dark grey for dead ends
  } else if (cell.solutionPath) {
    color = 'lightgreen';
  } else {
    switch (cell.searchState) {
      case 'visiting':
        color = 'lightblue';
        break;
      case 'visited':
        color = '#FFFFE0'; // Light yellow
        break;
      case 'intersection':
        color = 'purple';
        break;
    }
  }

  ctx.fillStyle = color;
  ctx.fillRect(cell.col * cellSize, cell.row * cellSize, cellSize, cellSize);
}

function drawWalls(cell) {
  const x = cell.col * cellSize;
  const y = cell.row * cellSize;
  const isPlayerVisited = playerVisited.has(`${cell.row},${cell.col}`);
  
  // If hiding unvisited walls and this cell is unvisited, don't draw walls
  if (hideUnvisitedWalls && !isPlayerVisited) {
    return;
  }
  
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
