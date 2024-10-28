var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _LinesGame_instances, _LinesGame_gameField, _LinesGame_animationInProgress, _LinesGame_nextCircles, _LinesGame_score, _LinesGame_high, _LinesGame_getEmptyPlace, _LinesGame_onClickCell, _LinesGame_onRightClickCell, _LinesGame_moveSelectedTo, _LinesGame_removeLines, _LinesGame_removingLines, _LinesGame_showPath;
const Rows = 9;
const Colors = 5;
const getNextRnd = (max) => Math.floor(Math.random() * max);
const generateColor = () => getNextRnd(Colors);
function* getNeighbors(cur) {
    if (cur.row > 0)
        yield { row: cur.row - 1, col: cur.col };
    if (cur.row < Rows - 1)
        yield { row: cur.row + 1, col: cur.col };
    if (cur.col > 0)
        yield { row: cur.row, col: cur.col - 1 };
    if (cur.col < Rows - 1)
        yield { row: cur.row, col: cur.col + 1 };
}
function* whereAvailable(distances, poses) {
    for (let pos of poses) {
        if (distances[pos.row][pos.col] != null)
            yield pos;
    }
}
function findMin(distances, positions) {
    let resPos = null;
    let resDist = null;
    for (let pos of positions) {
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
function* generateLines() {
    // horisontal
    for (let row = 0; row < Rows; ++row) {
        for (let col = 0; col < Rows; ++col)
            yield { row, col };
        yield null;
    }
    // vertical
    for (let col = 0; col < Rows; ++col) {
        for (let row = 0; row < Rows; ++row)
            yield { row, col };
        yield null;
    }
    // Enumerate primary diagonals (from top-left to bottom-right)
    for (let diff = -(Rows - 1); diff <= Rows - 1; diff++) {
        for (let row = 0; row < Rows; row++) {
            let col = row - diff;
            if (col >= 0 && col < Rows)
                yield { row, col };
        }
        yield null;
    }
    // Enumerate secondary diagonals 
    for (let sum = 0; sum <= 2 * (Rows - 1); sum++) {
        for (let row = 0; row < Rows; row++) {
            let col = sum - row;
            if (col >= 0 && col < Rows) {
                yield { row, col };
            }
        }
    }
}
function* scanLines(gameField, lines, minLine = 5) {
    let color = null;
    let line = [];
    for (let pos of lines) {
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
function findItemsToRemove(gameField, minLine = 5) {
    const result = [];
    for (let line of scanLines(gameField, generateLines(), minLine))
        result.push(...line);
    return result;
}
function createField(gameField, source) {
    return Array.from({ length: Rows }, (_, row) => Array.from({ length: Rows }, (_, col) => {
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
            const min = findMin(distances, whereAvailable(distances, getNeighbors({ row, col })));
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
    const min = findMin(distances, whereAvailable(distances, getNeighbors(curPos)));
    if (min === null)
        throw "alghoritm error: no near neighbor";
    if (min.distance === 0)
        return [min.pos];
    var next = this.tracePath(distances, min.pos);
    return [...next, min.pos];
}
function getPath(gameField, source, target) {
    const field = createField(gameField, source);
    while (this.fillDistances(field))
        ;
    return this.tracePath(field, target);
}
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
        this._color = generateColor();
        this._node.classList.add(`color${this._color}`);
    }
    get color() {
        return this._color;
    }
}
class LinesGame {
    constructor() {
        _LinesGame_instances.add(this);
        _LinesGame_gameField.set(this, []);
        _LinesGame_animationInProgress.set(this, false);
        _LinesGame_nextCircles.set(this, []);
        _LinesGame_score.set(this, 0);
        _LinesGame_high.set(this, 0);
        this.reset = () => {
            for (let c of __classPrivateFieldGet(this, _LinesGame_gameField, "f")) {
                if (c.color != null)
                    c.removeColor();
                c.deselect();
            }
            __classPrivateFieldSet(this, _LinesGame_score, 0, "f");
            this.highlightScore();
            this.highlightHigh();
            this.nextTurn();
        };
        this.getCell = (r, c) => __classPrivateFieldGet(this, _LinesGame_gameField, "f")[r * Rows + c];
        _LinesGame_onClickCell.set(this, (cell) => {
            if (cell.color !== null)
                this.selectCell(cell);
            else {
                if (!__classPrivateFieldGet(this, _LinesGame_animationInProgress, "f"))
                    __classPrivateFieldGet(this, _LinesGame_instances, "m", _LinesGame_moveSelectedTo).call(this, cell);
            }
        });
        _LinesGame_onRightClickCell.set(this, (cell) => {
            if (cell.color === null) {
                const color = generateColor();
                cell.setColor(color);
            }
        });
        const resetButton = document.getElementById("restart");
        if (resetButton === null)
            throw "restart element not found";
        resetButton.onclick = this.reset;
        const gameFieldDiv = document.getElementById("gameField");
        if (gameFieldDiv === null)
            throw "gameField element not found";
        for (let r = 0; r < Rows; ++r) {
            const rowNode = document.createElement("div");
            rowNode.classList.add("row");
            rowNode.id = `row${r}`;
            gameFieldDiv.appendChild(rowNode);
            for (let c = 0; c < Rows; ++c) {
                const cell = new GameCell(rowNode, { row: r, col: c });
                cell.onClick = __classPrivateFieldGet(this, _LinesGame_onClickCell, "f");
                cell.onRightClick = __classPrivateFieldGet(this, _LinesGame_onRightClickCell, "f");
                __classPrivateFieldGet(this, _LinesGame_gameField, "f")[r * Rows + c] = cell;
            }
        }
        for (let i = 0; i < 3; ++i) {
            const node = document.getElementById(`nextCircle${i}`);
            if (node === null)
                throw "nextCircle element not found";
            if (!(node instanceof HTMLDivElement))
                throw "element of nextCircle is not HTMLDivElement";
            __classPrivateFieldGet(this, _LinesGame_nextCircles, "f")[i] = new NextCircle(node);
        }
        this.highlightScore();
        this.highlightHigh();
        this.nextTurn();
    }
    nextTurn() {
        if (__classPrivateFieldGet(this, _LinesGame_instances, "m", _LinesGame_removeLines).call(this))
            return;
        for (let nextCircle of __classPrivateFieldGet(this, _LinesGame_nextCircles, "f")) {
            let newPlace = __classPrivateFieldGet(this, _LinesGame_instances, "m", _LinesGame_getEmptyPlace).call(this);
            if (newPlace === null) {
                if (__classPrivateFieldGet(this, _LinesGame_instances, "m", _LinesGame_removeLines).call(this))
                    newPlace = __classPrivateFieldGet(this, _LinesGame_instances, "m", _LinesGame_getEmptyPlace).call(this);
                if (newPlace === null)
                    break;
            }
            newPlace.setColor(nextCircle.color);
            nextCircle.setRandomColor();
        }
        if (!__classPrivateFieldGet(this, _LinesGame_instances, "m", _LinesGame_removeLines).call(this) && __classPrivateFieldGet(this, _LinesGame_instances, "m", _LinesGame_getEmptyPlace).call(this) == null)
            this.endGame();
    }
    endGame() {
        if (__classPrivateFieldGet(this, _LinesGame_score, "f") > __classPrivateFieldGet(this, _LinesGame_high, "f")) {
            __classPrivateFieldSet(this, _LinesGame_high, __classPrivateFieldGet(this, _LinesGame_score, "f"), "f");
            this.highlightHigh();
        }
    }
    highlightHigh() {
        const div = document.getElementById("high");
        if (div === null)
            throw "high element not found";
        div.textContent = __classPrivateFieldGet(this, _LinesGame_high, "f").toString();
    }
    highlightScore() {
        const div = document.getElementById("score");
        if (div === null)
            throw "score element not found";
        div.textContent = __classPrivateFieldGet(this, _LinesGame_score, "f").toString();
    }
    increaseScore(removedCount) {
        if (removedCount < 5)
            throw "unexpected removed count";
        __classPrivateFieldSet(this, _LinesGame_score, __classPrivateFieldGet(this, _LinesGame_score, "f") + 5, "f"); // first 5 balls 
        if (removedCount > 5)
            __classPrivateFieldSet(this, _LinesGame_score, __classPrivateFieldGet(this, _LinesGame_score, "f") + (removedCount - 5) * 2, "f"); // x2 bonus for next
        this.highlightScore();
    }
    selectCell(cell) {
        __classPrivateFieldGet(this, _LinesGame_gameField, "f").filter(c => c !== cell).forEach(c => c.deselect());
        cell.select();
    }
}
_LinesGame_gameField = new WeakMap(), _LinesGame_animationInProgress = new WeakMap(), _LinesGame_nextCircles = new WeakMap(), _LinesGame_score = new WeakMap(), _LinesGame_high = new WeakMap(), _LinesGame_onClickCell = new WeakMap(), _LinesGame_onRightClickCell = new WeakMap(), _LinesGame_instances = new WeakSet(), _LinesGame_getEmptyPlace = function _LinesGame_getEmptyPlace() {
    const emptyCount = __classPrivateFieldGet(this, _LinesGame_gameField, "f").reduce((total, cell) => (cell.color === null ? total + 1 : total), 0);
    console.log("empty cells:", emptyCount);
    if (emptyCount === 0)
        return null;
    const cnt = getNextRnd(emptyCount);
    let pos = 0;
    for (let cell of __classPrivateFieldGet(this, _LinesGame_gameField, "f")) {
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
}, _LinesGame_moveSelectedTo = function _LinesGame_moveSelectedTo(cell) {
    const sel = __classPrivateFieldGet(this, _LinesGame_gameField, "f").find(c => c.selected);
    if (!sel)
        return;
    const path = getPath(this, sel, cell.pos);
    if (path.length === 0)
        return;
    //console.log(path);
    sel.deselect();
    const color = sel.color;
    if (color === null)
        throw "null color of selected item";
    sel.removeColor();
    __classPrivateFieldGet(this, _LinesGame_instances, "m", _LinesGame_showPath).call(this, 0, path, color, () => {
        cell.setColor(color);
        this.nextTurn();
    });
}, _LinesGame_removeLines = function _LinesGame_removeLines() {
    const itemsToRemove = findItemsToRemove(this);
    if (itemsToRemove.length == 0)
        return false;
    this.increaseScore(itemsToRemove.length);
    __classPrivateFieldGet(this, _LinesGame_instances, "m", _LinesGame_removingLines).call(this, itemsToRemove);
    return true;
}, _LinesGame_removingLines = function _LinesGame_removingLines(itemsToRemove) {
    __classPrivateFieldSet(this, _LinesGame_animationInProgress, true, "f");
    for (let cell of itemsToRemove)
        cell.showRemoving();
    setTimeout(() => {
        for (let cell of itemsToRemove) {
            cell.hideRemoving();
            cell.removeColor();
        }
        __classPrivateFieldSet(this, _LinesGame_animationInProgress, false, "f");
    }, 300);
}, _LinesGame_showPath = function _LinesGame_showPath(current, path, color, lastStep) {
    if (color === null)
        throw "can't show path for empty color";
    if (current == path.length) {
        path.forEach(p => this.getCell(p.row, p.col).hidePath(color));
        lastStep();
        __classPrivateFieldSet(this, _LinesGame_animationInProgress, false, "f");
    }
    else {
        __classPrivateFieldSet(this, _LinesGame_animationInProgress, true, "f");
        const cell = this.getCell(path[current].row, path[current].col);
        cell.showPath(color);
        setTimeout(() => __classPrivateFieldGet(this, _LinesGame_instances, "m", _LinesGame_showPath).call(this, current + 1, path, color, lastStep), 30);
    }
};
LinesGame.rows = 9;
LinesGame.selectedAttr = "selected";
//# sourceMappingURL=scripts.js.map