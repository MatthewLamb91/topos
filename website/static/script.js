let gridSize = 4; // default 4×4
let heights = [];
let curPattern = null;
let cellColors = [];
const twoPatterns = {
    Flat:      [50, 50, 50, 50],
    Ramp:      [0, 25, 50, 75],
    Peak:      [25, 100, 75, 50]
};
const fourPatterns = {
    Flat:      [50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50],
    Wave:      [20,40,60,80,40,60,80,60,60,80,60,40,80,60,40,20],
    Peak:      [20,40,40,20,40,70,70,40,40,70,70,40,20,40,40,20],
    Valley:    [80,60,60,80,60,30,30,60,60,30,30,60,80,60,60,80],
    Ramp:      [10,25,40,55,25,40,55,70,40,55,70,85,55,70,85,100],
    'Custom 1':[65,30,75,45,20,85,50,60,90,35,55,25,70,40,80,15]
 };
const sixPatterns = {
  
};
let selected = new Set();

function initArrays(n) {
  gridSize = n;
  const total = n * n;

  heights = Array.from({length: total}, () => 50);
  cellColors = Array.from({length: total}, () => null);
  selected = new Set(Array.from({length: total}, (_, i) => i));
}

function changeGridSize(n) {
  n = parseInt(n);
  initArrays(n);

  // Update grid template
  const grid = document.getElementById("main-grid");
  grid.style.gridTemplateColumns = `repeat(${n}, 1fr)`;

  // Adjust cell height so 6×6 fits
  const cellHeight = n === 2 ? 120 : n === 4 ? 80 : 55;

  // Rebuild row labels
  const rowLabels = document.querySelector(".row-labels");
  rowLabels.innerHTML = "";
  for (let r = 1; r <= n; r++) {
    const div = document.createElement("div");
    div.className = "row-label";
    div.style.height = cellHeight + "px";
    div.textContent = "R" + r;
    rowLabels.appendChild(div);
  }

  // Rebuild column labels
  const colLabels = document.querySelector(".grid-label-row");
  colLabels.innerHTML = "";
  colLabels.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
  for (let c = 0; c < n; c++) {
    const div = document.createElement("div");
    div.className = "col-label";
    div.textContent = "Col " + String.fromCharCode(65 + c);
    colLabels.appendChild(div);
  }

  // Rebuild grid cells
  buildGrid(cellHeight);
}

let activeTab = 'color';
let paintColor = '#E6F1FB';
let eraseMode = false;

function buildGrid(cellHeightOverride = 80) {
  const grid = document.getElementById('main-grid');
  grid.innerHTML = '';

  heights.forEach((h, i) => {
    const cell = document.createElement('div');
    cell.className = 'cell selected';
    cell.id = 'cell-' + i;
    cell.style.height = cellHeightOverride + "px";

    cell.innerHTML = `
      <div class="cell-fill" id="fill-${i}" style="height:${h}%"></div>
      <span class="cell-val" id="val-${i}">${h}%</span>
    `;

    cell.onclick = () => cellClick(i);
    grid.appendChild(cell);
  });

  updateSelCount();
}

function cellClick(i) {
  if (activeTab === 'color') {
    if (eraseMode) {
      cellColors[i] = null;
    } else {
      cellColors[i] = paintColor;
    }
    applyFillStyle(i);
  } else {
    const cell = document.getElementById('cell-' + i);
    if (selected.has(i)) { selected.delete(i); cell.classList.remove('selected'); }
    else { selected.add(i); cell.classList.add('selected'); }
    applyFillStyle(i);
    updateSelCount();
  }
}

function applyFillStyle(i) {
  const fill = document.getElementById('fill-' + i);
  const cell = document.getElementById('cell-' + i);
  if (cellColors[i]) {
    fill.style.background = cellColors[i];
    fill.style.opacity = '0.75';
    cell.style.borderColor = cellColors[i];
  } else {
    fill.style.background = cell.classList.contains('selected') ? '#B5D4F4' : '#E6F1FB';
    fill.style.opacity = '1';
    cell.style.borderColor = '';
  }
}

function pickSwatch(el, color) {
  eraseMode = false;
  document.getElementById('erase-btn').classList.remove('active');
  document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  paintColor = color;
  document.getElementById('custom-color').value = color;
  updatePaintIndicator();
}

function pickCustom(color) {
  eraseMode = false;
  document.getElementById('erase-btn').classList.remove('active');
  document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
  paintColor = color;
  updatePaintIndicator();
}

function toggleErase() {
  eraseMode = !eraseMode;
  document.getElementById('erase-btn').classList.toggle('active', eraseMode);
  if (eraseMode) document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
  updatePaintIndicator();
}

function updatePaintIndicator() {
  const preview = document.getElementById('paint-preview');
  const hex = document.getElementById('paint-hex');
  preview.style.background = eraseMode ? 'transparent' : paintColor;
  preview.style.border = eraseMode ? '0.5px dashed #bbb' : '0.5px solid #e0e0e0';
  hex.textContent = eraseMode ? 'Eraser' : paintColor;
}

function clearAllColors() {
  for (let i = 0; i < heights.length; i++) {
    cellColors[i] = null;
    applyFillStyle(i);
  }
}

function updateAll(val) {
  document.getElementById('height-val').textContent = val + '%';
  selected.forEach(i => {
    heights[i] = parseInt(val);
    document.getElementById('fill-' + i).style.height = val + '%';
    document.getElementById('val-' + i).textContent = val + '%';
  });
}

function updateSpeed(val) {
  document.getElementById('speed-val').textContent = val;
}

function selectAll() {
  for (let i = 0; i < heights.length; i++) {
    selected.add(i);
    document.getElementById('cell-' + i).classList.add('selected');
    applyFillStyle(i);
  }
  updateSelCount();
}

function clearSel() {
  selected.clear();
  for (let i = 0; i < heights.length; i++) {
    document.getElementById('cell-' + i).classList.remove('selected');
    applyFillStyle(i);
  }
  updateSelCount();
}

function updateSelCount() {
  document.getElementById('sel-count').textContent =
    selected.size + ' cell' + (selected.size !== 1 ? 's' : '') + ' selected';
}

function switchTab(btn, tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  activeTab = tab;
  ['color', 'height', 'speed', 'special'].forEach(t => {
    document.getElementById(t + '-controls').style.display = t === tab ? 'flex' : 'none';
  });
  document.getElementById('paint-indicator').style.display = tab === 'color' ? 'flex' : 'none';
}

function selectPreset(btn, name) {
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('active-preset-name').textContent = name;
  const p = fourpatterns[name] || fourpatterns['Flat'];
  p.forEach((h, i) => {
    heights[i] = h;
    document.getElementById('fill-' + i).style.height = h + '%';
    document.getElementById('val-' + i).textContent = h + '%';
  });
}

function connect() {
    ws = new WebSocket("ws://localhost:8000/ws/live");


    ws.onopen = () => {
        console.log("WebSocket connected");
    };

    ws.onclose = () => {
        console.log("WebSocket closed");
        setTimeout(connect, 1000);
    };

    ws.onmessage = (event) => {
        console.log("Received:", event.data);
        const data = JSON.parse(event.data);
    };
}

connect();
buildGrid();
changeGridSize(gridSize);
updatePaintIndicator();