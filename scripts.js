var constants;
(function (constants) {
    constants.Rows = 9;
    constants.Colors = 5;
})(constants || (constants = {}));
var logic;
(function (logic) {
    logic.getNextRnd = (max) => Math.floor(Math.random() * max);
    logic.generateColor = () => logic.getNextRnd(constants.Colors);
    function getPath(gameField, source, target) {
        const field = createField(gameField, source);
        while (fillDistances(field))
            ;
        return tracePath(field, target);
    }
    logic.getPath = getPath;
    function findItemsToRemove(gameField, minLine = 5) {
        const result = [];
        for (let line of scanForCompletedLinesLines(gameField, minLine))
            result.push(...line);
        return result;
    }
    logic.findItemsToRemove = findItemsToRemove;
    function* getNeighbors(cur) {
        if (cur.row > 0)
            yield { row: cur.row - 1, col: cur.col };
        if (cur.row < constants.Rows - 1)
            yield { row: cur.row + 1, col: cur.col };
        if (cur.col > 0)
            yield { row: cur.row, col: cur.col - 1 };
        if (cur.col < constants.Rows - 1)
            yield { row: cur.row, col: cur.col + 1 };
    }
    function* getAvailableNeighbors(distances, curPos) {
        for (let pos of getNeighbors(curPos)) {
            if (distances[pos.row][pos.col] != null)
                yield pos;
        }
    }
    function findMinDistance(distances, pos) {
        let resPos = null;
        let resDist = null;
        const available = getAvailableNeighbors(distances, pos);
        for (let pos of available) {
            const curDist = distances[pos.row][pos.col];
            if (curDist === null)
                continue;
            if (resDist === null || curDist < resDist) {
                resPos = pos;
                resDist = curDist;
            }
        }
        if (resPos === null)
            return null;
        return { pos: resPos, distance: resDist };
    }
    function* generateDirections() {
        // horisontal
        for (let row = 0; row < constants.Rows; ++row) {
            for (let col = 0; col < constants.Rows; ++col)
                yield { row, col };
            yield null;
        }
        // vertical
        for (let col = 0; col < constants.Rows; ++col) {
            for (let row = 0; row < constants.Rows; ++row)
                yield { row, col };
            yield null;
        }
        // Enumerate primary diagonals (from top-left to bottom-right)
        for (let diff = -(constants.Rows - 1); diff <= constants.Rows - 1; diff++) {
            for (let row = 0; row < constants.Rows; row++) {
                let col = row - diff;
                if (col >= 0 && col < constants.Rows)
                    yield { row, col };
            }
            yield null;
        }
        // Enumerate secondary diagonals 
        for (let sum = 0; sum <= 2 * (constants.Rows - 1); sum++) {
            for (let row = 0; row < constants.Rows; row++) {
                let col = sum - row;
                if (col >= 0 && col < constants.Rows) {
                    yield { row, col };
                }
            }
        }
    }
    function* scanForCompletedLinesLines(gameField, minLine = 5) {
        let color = null;
        let line = [];
        for (let pos of generateDirections()) {
            const cell = pos === null ? null : gameField.getCell(pos.row, pos.col);
            if (cell === null || color === null || cell.color !== color) {
                if (line.length >= minLine)
                    yield line;
                if (cell != null) {
                    line = [cell];
                    color = cell.color;
                }
                else {
                    line = [];
                    color = null;
                }
            }
            else {
                line.push(cell);
            }
        }
    }
    function createField(gameField, source) {
        return Array.from({ length: constants.Rows }, (_, row) => Array.from({ length: constants.Rows }, (_, col) => {
            const cell = gameField.getCell(row, col);
            return cell === source ? 0 // source
                : cell.color === null ? Infinity // possible target
                    : null; // occuped
        }));
    }
    function fillDistances(distances) {
        let found = 0;
        for (let row = 0; row < distances.length; ++row) {
            for (let col = 0; col < distances[row].length; ++col) {
                const curLen = distances[row][col];
                if (curLen === null) // occuped
                    continue;
                const min = findMinDistance(distances, { row, col });
                if (min === null) {
                    // no neighbors arround, exclude from next calculation
                    distances[row][col] = null;
                    continue;
                }
                if (min.distance === Infinity) {
                    // no already calculated neighbords arround, skip this step 
                    continue;
                }
                if (min.distance === null)
                    throw "invalid alghoritm: should be not null";
                const nextStep = min.distance + 1;
                if (curLen > nextStep) {
                    distances[row][col] = nextStep;
                    found++;
                }
            }
        }
        return found;
    }
    function tracePath(distances, curPos) {
        const min = findMinDistance(distances, curPos);
        if (min === null)
            throw "alghoritm error: no near neighbor";
        if (min.distance === 0)
            return [min.pos];
        var next = tracePath(distances, min.pos);
        return [...next, min.pos];
    }
    logic.tracePath = tracePath;
})(logic || (logic = {}));
class GameCell {
    constructor(parentDiv, pos) {
        this.pos = pos;
        const cellNode = document.createElement("div");
        cellNode.classList.add("cell");
        cellNode.id = `cell${pos.row}-${pos.col}`;
        const circleNode = document.createElement("div");
        circleNode.id = `circle${pos.row}-${pos.col}`;
        cellNode.appendChild(circleNode);
        parentDiv.appendChild(cellNode);
        this.node = cellNode;
        this.circle = circleNode;
        this._selected = false;
        this._color = null;
    }
    get color() {
        return this._color;
    }
    get selected() {
        return this._selected;
    }
    select() {
        this.circle.classList.add("selected");
        this._selected = true;
    }
    deselect() {
        this.circle.classList.remove("selected");
        this._selected = false;
    }
    removeColor() {
        this.circle.classList.remove("color" + this._color);
        this.circle.classList.remove("circle");
        this._color = null;
    }
    setColor(color) {
        if (this._color !== null)
            throw `set color ${color} but already set color ${this._color}`;
        this._color = color;
        this.circle.classList.add("color" + this._color);
        this.circle.classList.add("circle");
    }
    hidePath(color) {
        this.circle.classList.remove("path");
        this.circle.classList.remove("color" + color);
    }
    showPath(color) {
        this.circle.classList.add("path");
        this.circle.classList.add("color" + color);
    }
    showRemoving() {
        this.circle.classList.add("removing");
    }
    hideRemoving() {
        this.circle.classList.remove("removing");
    }
    set onClick(handler) {
        this.node.addEventListener("click", () => handler(this));
    }
    ;
    set onRightClick(handler) {
        this.node.addEventListener("contextmenu", (e) => {
            handler(this);
            e.preventDefault();
        });
    }
    ;
}
class NextCircle {
    constructor(node) {
        this._node = node;
        this.setRandomColor();
    }
    setRandomColor() {
        if (this._color !== null) {
            this._node.classList.remove(`color${this._color}`);
        }
        this._color = logic.generateColor();
        this._node.classList.add(`color${this._color}`);
    }
    get color() {
        return this._color;
    }
}
class LinesGame {
    constructor() {
        this.gameField = [];
        this.animationInProgress = false;
        this.nextCircles = [];
        this.score = 0;
        this.high = 0;
        this.reset = () => {
            for (let c of this.gameField) {
                if (c.color != null)
                    c.removeColor();
                c.deselect();
            }
            this.score = 0;
            this.highlightScore();
            this.highlightHigh();
            this.nextTurn();
        };
        this.getCell = (r, c) => this.gameField[r * constants.Rows + c];
        this.onClickCell = (cell) => {
            if (cell.color !== null)
                this.selectCell(cell);
            else {
                if (!this.animationInProgress)
                    this.moveSelectedTo(cell);
            }
        };
        this.onRightClickCell = (cell) => {
            if (cell.color === null) {
                const color = logic.generateColor();
                cell.setColor(color);
            }
        };
        const resetButton = document.getElementById("restart");
        if (resetButton === null)
            throw "restart element not found";
        resetButton.onclick = this.reset;
        const gameFieldDiv = document.getElementById("gameField");
        if (gameFieldDiv === null)
            throw "gameField element not found";
        for (let r = 0; r < constants.Rows; ++r) {
            const rowNode = document.createElement("div");
            rowNode.classList.add("row");
            rowNode.id = `row${r}`;
            gameFieldDiv.appendChild(rowNode);
            for (let c = 0; c < constants.Rows; ++c) {
                const cell = new GameCell(rowNode, { row: r, col: c });
                cell.onClick = this.onClickCell;
                cell.onRightClick = this.onRightClickCell;
                this.gameField[r * constants.Rows + c] = cell;
            }
        }
        for (let i = 0; i < 3; ++i) {
            const node = document.getElementById(`nextCircle${i}`);
            if (node === null)
                throw "nextCircle element not found";
            if (!(node instanceof HTMLDivElement))
                throw "element of nextCircle is not HTMLDivElement";
            this.nextCircles[i] = new NextCircle(node);
        }
        this.highlightScore();
        this.highlightHigh();
        this.nextTurn();
    }
    nextTurn() {
        if (this.removeLines())
            return;
        for (let nextCircle of this.nextCircles) {
            let newPlace = this.getEmptyPlace();
            if (newPlace === null) {
                if (this.removeLines())
                    newPlace = this.getEmptyPlace();
                if (newPlace === null)
                    break;
            }
            newPlace.setColor(nextCircle.color);
            nextCircle.setRandomColor();
        }
        if (!this.removeLines() && this.getEmptyPlace() == null)
            this.endGame();
    }
    endGame() {
        if (this.score > this.high) {
            this.high = this.score;
            this.highlightHigh();
        }
    }
    highlightHigh() {
        const div = document.getElementById("high");
        if (div === null)
            throw "high element not found";
        div.textContent = this.high.toString();
    }
    highlightScore() {
        const div = document.getElementById("score");
        if (div === null)
            throw "score element not found";
        div.textContent = this.score.toString();
    }
    increaseScore(removedCount) {
        if (removedCount < 5)
            throw "unexpected removed count";
        this.score += 5; // first 5 balls 
        if (removedCount > 5)
            this.score += (removedCount - 5) * 2; // x2 bonus for next
        this.highlightScore();
    }
    getEmptyPlace() {
        const emptyCount = this.gameField.reduce((total, cell) => (cell.color === null ? total + 1 : total), 0);
        console.log("empty cells:", emptyCount);
        if (emptyCount === 0)
            return null;
        const cnt = logic.getNextRnd(emptyCount);
        let pos = 0;
        for (let cell of this.gameField) {
            if (cell.color !== null)
                continue;
            if (pos === cnt) {
                if (cell.color !== null)
                    throw "wrong alghoritm";
                return cell;
            }
            ++pos;
        }
        throw "unexpected end of field";
    }
    moveSelectedTo(cell) {
        const sel = this.gameField.find(c => c.selected);
        if (!sel)
            return;
        const path = logic.getPath(this, sel, cell.pos);
        if (path.length === 0)
            return;
        //console.log(path);
        sel.deselect();
        const color = sel.color;
        if (color === null)
            throw "null color of selected item";
        sel.removeColor();
        this.showPath(0, path, color, () => {
            cell.setColor(color);
            this.nextTurn();
        });
    }
    removeLines() {
        const itemsToRemove = logic.findItemsToRemove(this);
        if (itemsToRemove.length == 0)
            return false;
        this.increaseScore(itemsToRemove.length);
        this.removingLines(itemsToRemove);
        return true;
    }
    removingLines(itemsToRemove) {
        this.animationInProgress = true;
        for (let cell of itemsToRemove)
            cell.showRemoving();
        setTimeout(() => {
            for (let cell of itemsToRemove) {
                cell.hideRemoving();
                cell.removeColor();
            }
            this.animationInProgress = false;
        }, 300);
    }
    showPath(current, path, color, lastStep) {
        if (color === null)
            throw "can't show path for empty color";
        if (current == path.length) {
            path.forEach(p => this.getCell(p.row, p.col).hidePath(color));
            lastStep();
            this.animationInProgress = false;
        }
        else {
            this.animationInProgress = true;
            const cell = this.getCell(path[current].row, path[current].col);
            cell.showPath(color);
            setTimeout(() => this.showPath(current + 1, path, color, lastStep), 30);
        }
    }
    selectCell(cell) {
        this.gameField.filter(c => c !== cell).forEach(c => c.deselect());
        cell.select();
    }
}
LinesGame.selectedAttr = "selected";
//# sourceMappingURL=scripts.js.map