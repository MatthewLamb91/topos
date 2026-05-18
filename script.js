// ── Constants ──────────────────────────────────────────────────────
const TOTAL   = 16;
const CLASSES = ['m','s1','s2','s3'];
const BOARDS  = ['Master','Slave1','Slave2','Slave3'];
const HCLASS  = ['h0','h1','h2'];
const ECOL    = ['#333344','#ff3c00','#0050ff','#00b428','#ffdc00','#50c8ff'];
const ESHADOW = [
  'none',
  '0 0 5px #ff3c0099',
  '0 0 5px #0050ff99',
  '0 0 5px #00b42899',
  '0 0 5px #ffdc0099',
  '0 0 5px #50c8ff99'
];

// ── State ──────────────────────────────────────────────────────────
let selH = new Array(TOTAL).fill(false);
let curH = new Array(TOTAL).fill(0);
let curE = new Array(TOTAL).fill(0);

// Wave state (client-side simulation for CodePen demo)
let waveRunning   = false;
let waveStart     = 0;
let waveEnd       = 15;
let waveHeightVal = 2;
let waveStepMs    = 150;
let waveCurrent   = 0;
let waveDirection = 1;
let waveDropping  = false;
let waveInterval  = null;

// ── Terrain presets ────────────────────────────────────────────────
const PRESETS = {
  ashenveil:  {
    h: [2,0,1,2, 1,2,0,1, 0,1,2,0, 2,1,0,1],
    e: [1,3,0,2, 0,1,3,5, 2,0,1,3, 5,2,3,0]
  },
  stormpeaks: {
    h: [0,2,0,2, 2,1,2,0, 0,2,1,2, 2,0,2,1],
    e: [4,0,4,2, 0,4,0,3, 2,1,4,0, 0,4,2,4]
  },
  frostveil:  {
    h: [2,2,0,0, 1,2,2,1, 0,0,2,2, 1,0,1,2],
    e: [5,5,0,2, 0,5,5,0, 2,3,5,5, 0,2,0,5]
  },
};

// ── Build board ────────────────────────────────────────────────────
const boardEl = document.getElementById('board');
for (let i = 0; i < TOTAL; i++) {
  const b     = Math.floor(i / 4);
  const c     = CLASSES[b];
  const bname = b === 0 ? 'master' : 'slave' + b;
  boardEl.innerHTML += `
    <div class="tc b-${bname}" id="tc${i}" onclick="toggleSel(${i})">
      <div class="tc-num ${c}">${BOARDS[b][0]}${(i % 4) + 1}</div>
      <div class="tc-vis">
        <div class="tc-fill h0" id="fill${i}"></div>
        <div class="tc-led"     id="led${i}"></div>
        <div class="tc-wav"     id="wav${i}"></div>
      </div>
      <div class="h-btns">
        <button class="hb active" id="hb${i}-0" onclick="event.stopPropagation();setH(${i},0)">Flat</button>
        <button class="hb"        id="hb${i}-1" onclick="event.stopPropagation();setH(${i},1)">Mid</button>
        <button class="hb"        id="hb${i}-2" onclick="event.stopPropagation();setH(${i},2)">Max</button>
      </div>
      <div class="e-btns">
        <button class="eb active" data-e="0" onclick="event.stopPropagation();setE(${i},0)">—</button>
        <button class="eb"        data-e="1" onclick="event.stopPropagation();setE(${i},1)">🔥</button>
        <button class="eb"        data-e="2" onclick="event.stopPropagation();setE(${i},2)">💧</button>
        <button class="eb"        data-e="3" onclick="event.stopPropagation();setE(${i},3)">🌿</button>
        <button class="eb"        data-e="4" onclick="event.stopPropagation();setE(${i},4)">⚡</button>
        <button class="eb"        data-e="5" onclick="event.stopPropagation();setE(${i},5)">❄️</button>
      </div>
    </div>`;
}

// ── Build preset mini-grids ────────────────────────────────────────
function buildPresetGrid(id, preset) {
  const grid    = document.getElementById('pg-' + id);
  const heights = ['12%', '55%', '90%'];
  const bgFill  = ['#2a3040', '#1D9E75', '#25c491'];
  for (let i = 0; i < 16; i++) {
    const h    = preset.h[i];
    const e    = preset.e[i];
    const cell = document.createElement('div');
    cell.className      = 'pcell';
    cell.style.background = '#111418';
    cell.innerHTML = `
      <div class="pcell-fill"
           style="height:${heights[h]};background:${bgFill[h]};"></div>
      <div class="pcell-dot"
           style="background:${ECOL[e]};
                  box-shadow:${e > 0 ? '0 0 3px ' + ECOL[e] : 'none'};"></div>`;
    grid.appendChild(cell);
  }
}
buildPresetGrid('ashenveil',  PRESETS.ashenveil);
buildPresetGrid('stormpeaks', PRESETS.stormpeaks);
buildPresetGrid('frostveil',  PRESETS.frostveil);

// ── UI update helpers ──────────────────────────────────────────────
function updateHUI(i, h) {
  curH[i] = h;
  document.getElementById('fill' + i).className = 'tc-fill ' + HCLASS[h];
  for (let x = 0; x < 3; x++)
    document.getElementById('hb' + i + '-' + x).classList.toggle('active', x === h);
}

function updateEUI(i, e) {
  curE[i] = e;
  const led = document.getElementById('led' + i);
  led.style.background = ECOL[e];
  led.style.boxShadow  = ESHADOW[e];
  document.getElementById('tc' + i).style.borderColor = e === 0 ? '' : ECOL[e];
  document.querySelectorAll('#tc' + i + ' .eb')
    .forEach(b => b.classList.toggle('active', parseInt(b.dataset.e) === e));
}

// ── Tile setters ───────────────────────────────────────────────────
// In CodePen these update the UI only.
// On the ESP32 these would also call fetch('/set?...').
function setH(tile, h) {
  updateHUI(tile, h);
  // fetch('/set?tile='+tile+'&height='+h).catch(()=>{});
}
function setE(tile, e) {
  updateEUI(tile, e);
  // fetch('/elem?tile='+tile+'&elem='+e).catch(()=>{});
}

// ── Bulk helpers ───────────────────────────────────────────────────
function setAllH(h)           { for (let i = 0; i < TOTAL; i++) setH(i, h); }
function setAllE(e)           { for (let i = 0; i < TOTAL; i++) setE(i, e); }
function setHPattern(arr)     { arr.forEach((h, i) => setH(i, h)); }
function clearAll()           { setAllH(0); setAllE(0); }

// ── Preset loaders ─────────────────────────────────────────────────
function loadPreset(name) {
  const p = PRESETS[name];
  if (!p) return;
  for (let i = 0; i < 16; i++) {
    updateHUI(i, p.h[i]);
    updateEUI(i, p.e[i]);
  }
}

function loadRandom() {
  for (let i = 0; i < 16; i++) {
    setH(i, Math.floor(Math.random() * 3));
    setE(i, Math.floor(Math.random() * 6));
  }
}

// ── Wave animation (client-side, non-blocking via setInterval) ─────
function startWave() {
  if (waveRunning) stopWave();

  waveStart     = parseInt(document.getElementById('wv-start').value);
  waveEnd       = parseInt(document.getElementById('wv-end').value);
  waveHeightVal = parseInt(document.getElementById('wv-h').value);
  waveStepMs    = parseInt(document.getElementById('wv-step').value);
  waveDirection = waveEnd >= waveStart ? 1 : -1;
  waveCurrent   = waveStart;
  waveDropping  = false;
  waveRunning   = true;

  document.getElementById('wave-status').textContent =
    'Wave running: tile ' + waveStart + ' → ' + waveEnd + '...';

  waveInterval = setInterval(() => {
    // Clear all wave indicators
    for (let i = 0; i < TOTAL; i++)
      document.getElementById('wav' + i).classList.remove('active');

    if (waveDropping) {
      setH(waveEnd, 0);
      stopWave();
      document.getElementById('wave-status').textContent = 'Wave complete.';
      return;
    }

    // Drop previous tile
    const prev = waveCurrent - waveDirection;
    const lo   = Math.min(waveStart, waveEnd);
    const hi   = Math.max(waveStart, waveEnd);
    if (prev >= lo && prev <= hi) setH(prev, 0);

    // Raise current tile and highlight it
    setH(waveCurrent, waveHeightVal);
    document.getElementById('wav' + waveCurrent).classList.add('active');
    document.getElementById('wave-status').textContent =
      'Wave running — tile ' + waveCurrent;

    if (waveCurrent === waveEnd) {
      waveDropping = true;
      return;
    }
    waveCurrent += waveDirection;
  }, waveStepMs);
}

function stopWave() {
  if (waveInterval) { clearInterval(waveInterval); waveInterval = null; }
  waveRunning  = false;
  waveDropping = false;
  for (let i = 0; i < TOTAL; i++)
    document.getElementById('wav' + i).classList.remove('active');
}

// ── Selection ──────────────────────────────────────────────────────
function toggleSel(i) {
  selH[i] = !selH[i];
  document.getElementById('tc' + i).classList.toggle('selected', selH[i]);
  updateSelCount();
}
function clearSel() {
  for (let i = 0; i < TOTAL; i++) {
    selH[i] = false;
    document.getElementById('tc' + i).classList.remove('selected');
  }
  updateSelCount();
}
function selectAll() {
  for (let i = 0; i < TOTAL; i++) {
    selH[i] = true;
    document.getElementById('tc' + i).classList.add('selected');
  }
  updateSelCount();
}
function selRow(r) {
  clearSel();
  for (let c = 0; c < 4; c++) {
    const t = r * 4 + c;
    selH[t] = true;
    document.getElementById('tc' + t).classList.add('selected');
  }
  updateSelCount();
}
function selCol(col) {
  clearSel();
  for (let r = 0; r < 4; r++) {
    const t = r * 4 + col;
    selH[t] = true;
    document.getElementById('tc' + t).classList.add('selected');
  }
  updateSelCount();
}
function updateSelCount() {
  const n = selH.filter(Boolean).length;
  document.getElementById('sel-count').textContent =
    '(' + n + ' tile' + (n !== 1 ? 's' : '') + ')';
}
function applyHeightToSelected(h) {
  document.getElementById('sel-hv').textContent = h;
  for (let i = 0; i < TOTAL; i++) if (selH[i]) setH(i, h);
}

// ── Slave status simulation for CodePen ───────────────────────────
// On the real ESP32 this polls /status every 300ms.
// In CodePen we just show connected placeholders.
['sl0','sl1','sl2'].forEach((id, i) => {
  const el = document.getElementById(id);
  el.textContent  = 'Slave ' + (i + 1) + ': demo';
  el.style.color  = '#25c491';
});
document.getElementById('adc-vals').textContent = 'Demo mode';