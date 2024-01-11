const bodyParser = require('body-parser');
const express = require('express');
const fs = require('fs');

const app = express();
const port = 3001;

app.use(bodyParser.json());

const HISTORY_FILE_PATH = './history/evaluations.json';

// Check if the history file exists, if not create it
if (!fs.existsSync(HISTORY_FILE_PATH)) {
    fs.writeFileSync(HISTORY_FILE_PATH, '[]', 'utf-8');
}

// Read history from file
let history = JSON.parse(fs.readFileSync(HISTORY_FILE_PATH, 'utf-8'));


// Define API endpoint for grid evaluation
app.post('/evaluateGrid', (req, res) => {
    const grid = req.body.grid;
    const result = evaluateConductivity(grid);
    const path = findConductivePath(grid);

    // Save to history
    const evaluation = { grid, result, path };
    history.push(evaluation);
    saveHistoryToFile();

    // Respond with evaluation result and path
    res.json(evaluation);
});

function saveHistoryToFile() {
    fs.writeFileSync(HISTORY_FILE_PATH, JSON.stringify(history), 'utf-8');
}

function evaluateConductivity(grid) {
    // Split the grid into rows
    const rows = grid.split('\n').map(row => row.trim());

    // Check for a conductive path from top to bottom
    for (let col = 0; col < rows[0].length; col++) {
        if (rows[0][col] === '1') {
            if (deepFirstSearch(rows, 0, col)) {
                return 'Yes';
            }
        }
    }

    return 'No';
}

function deepFirstSearch(rows, row, col) {
    // Check if the current cell is out of bounds or not a part of the conductive path
    if (row < 0 || row >= rows.length || col < 0 || col >= rows[0].length || rows[row][col] !== '1') {
        return false;
    }

    // Mark the current cell as visited
    rows[row] = rows[row].substring(0, col) + '0' + rows[row].substring(col + 1);

    console.info(`rows: ${rows} - row: ${row} - col: ${col}`);

    // If reached the bottom row, return true
    if (row === rows.length - 1) {
        return true;
    } 
    // Recur in all directions forward directions
    return (
        deepFirstSearch(rows, row - 1, col) ||
        deepFirstSearch(rows, row + 1, col) ||
        deepFirstSearch(rows, row, col - 1) ||
        deepFirstSearch(rows, row, col + 1)
    );
}

function findConductivePath(grid) {
    const rows = grid.split('\n').map(row => row.trim());

    // Find the conductive path from top to bottom
    for (let col = 0; col < rows[0].length; col++) {
        if (rows[0][col] === '1' && deepFirstSearch(rows, 0, col)) {
            return reconstructPath(rows, 0, col);
        }
    }

    return [];
}

function reconstructPath(rows, row, col) {
    if (row < 0 || row >= rows.length || col < 0 || col >= rows[0].length || rows[row][col] !== '0') {
        return [];
    }

    rows[row] = rows[row].substring(0, col) + '0' + rows[row].substring(col + 1);

    const path = [[row, col]];

    if (row === rows.length - 1) {
        return path;
    }

    // Recur in all four directions and check if any of them returns a non-empty path
    const upPath = reconstructPath(rows, row - 1, col);
    if (upPath.length > 0) return path.concat(upPath);

    const downPath = reconstructPath(rows, row + 1, col);
    if (downPath.length > 0) return path.concat(downPath);

    const leftPath = reconstructPath(rows, row, col - 1);
    if (leftPath.length > 0) return path.concat(leftPath);

    const rightPath = reconstructPath(rows, row, col + 1);
    if (rightPath.length > 0) return path.concat(rightPath);
}


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

