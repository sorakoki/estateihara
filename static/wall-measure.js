const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let img = new Image();
let mainPolygon = [];
let holePolygons = [];
let currentHole = [];
let mode = "main";
let scalePoints = [];

let undoStack = [];
let redoStack = [];

let pixelsPerCm = 1;

const WALLPAPER_WIDTH_CM = 92;
const WALLPAPER_LENGTH_CM = 1000;
const LOSS_RATE = 0.12;

let lastNetAreaM2 = 0; // 塗料計算用に保持

function saveState() {
  undoStack.push({
    scalePoints: [...scalePoints],
    mainPolygon: [...mainPolygon],
    holePolygons: holePolygons.map(h => [...h]),
    currentHole: [...currentHole],
    mode
  });
  redoStack = []; // 操作したらRedoは消える
}

function restoreState(state) {
  if (!state) return;
  scalePoints = [...state.scalePoints];
  mainPolygon = [...state.mainPolygon];
  holePolygons = state.holePolygons.map(h => [...h]);
  currentHole = [...state.currentHole];
  mode = state.mode;
  draw();
}

document.getElementById("imageInput").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const allowedTypes = ["image/jpeg", "image/png"];
  if (!allowedTypes.includes(file.type)) {
    alert("JPEGまたはPNG形式の画像のみ対応です。\nこの形式の画像をお選びください。");
    return;
  }

  const url = URL.createObjectURL(file);
  img = new Image();
  img.onerror = function() {
    alert("画像の読み込みに失敗しました。\nファイルが壊れている、または非対応形式の可能性があります。");
    URL.revokeObjectURL(url);
  };
  img.onload = () => {
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    scalePoints = [];
    mainPolygon = [];
    holePolygons = [];
    currentHole = [];
    undoStack = [];
    redoStack = [];
    draw();
    document.getElementById("result").innerHTML = '';
    document.getElementById("advice").innerHTML = '';
    document.getElementById("paintResult").innerHTML = '';
    URL.revokeObjectURL(url);
  };
  img.src = url;
});

canvas.addEventListener("click", function (e) {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);

  saveState();

  if (scalePoints.length < 2) {
    scalePoints.push({ x, y });
  } else if (mode === "main") {
    mainPolygon.push({ x, y });
  } else {
    currentHole.push({ x, y });
  }
  draw();
});

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (img && img.complete) {
    ctx.drawImage(img, 0, 0);
  }

  if (scalePoints.length === 2) {
    ctx.strokeStyle = "green";
    ctx.beginPath();
    ctx.moveTo(scalePoints[0].x, scalePoints[0].y);
    ctx.lineTo(scalePoints[1].x, scalePoints[1].y);
    ctx.stroke();
  }

  if (mainPolygon.length) drawPolygon(mainPolygon, "rgba(0, 128, 255, 0.2)", "blue");
  holePolygons.forEach(h => drawPolygon(h, "rgba(255,0,0,0.3)", "red"));
  if (currentHole.length) drawPolygon(currentHole, "rgba(255,0,0,0.3)", "red");
}

function drawPolygon(points, fillStyle, strokeStyle) {
  if (points.length < 2) return;
  ctx.fillStyle = fillStyle;
  ctx.strokeStyle = strokeStyle;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

document.getElementById("mainModeBtn").addEventListener("click", () => {
  if (currentHole.length >= 3) {
    saveState();
    holePolygons.push(currentHole);
    currentHole = [];
  }
  mode = "main";
});

document.getElementById("holeModeBtn").addEventListener("click", () => {
  if (mainPolygon.length >= 3) {
    mode = "hole";
  } else {
    alert("先に壁（メイン）ポリゴンを描いてください");
  }
});

document.getElementById("undoBtn").addEventListener("click", () => {
  if (undoStack.length > 0) {
    const prev = undoStack.pop();
    redoStack.push({
      scalePoints: [...scalePoints],
      mainPolygon: [...mainPolygon],
      holePolygons: holePolygons.map(h => [...h]),
      currentHole: [...currentHole],
      mode
    });
    restoreState(prev);
  }
});

document.getElementById("redoBtn").addEventListener("click", () => {
  if (redoStack.length > 0) {
    const next = redoStack.pop();
    saveState();
    restoreState(next);
  }
});

document.getElementById("resetBtn").addEventListener("click", () => {
  scalePoints = [];
  mainPolygon = [];
  holePolygons = [];
  currentHole = [];
  undoStack = [];
  redoStack = [];
  draw();
  document.getElementById("result").innerHTML = '';
  document.getElementById("advice").innerHTML = '';
  document.getElementById("paintResult").innerHTML = '';
  lastNetAreaM2 = 0;
});

document.getElementById("calculateBtn").addEventListener("click", () => {
  if (scalePoints.length !== 2 || mainPolygon.length < 3) {
    alert("基準点と壁面（3点以上）を入力してください。");
    return;
  }

  const dx = scalePoints[1].x - scalePoints[0].x;
  const dy = scalePoints[1].y - scalePoints[0].y;
  const refCm = parseFloat(document.getElementById("refCm").value);
  const pixelDist = Math.sqrt(dx * dx + dy * dy);
  pixelsPerCm = pixelDist / refCm;

  const baseArea = calcPolygonArea(mainPolygon);
  const holeArea = holePolygons.reduce((sum, hole) => sum + calcPolygonArea(hole), 0);
  const currentHoleArea = calcPolygonArea(currentHole);

  const netAreaCm2 = (baseArea - holeArea - currentHoleArea) / (pixelsPerCm ** 2);
  const netAreaM2 = netAreaCm2 / 10000;
  lastNetAreaM2 = netAreaM2 > 0 ? netAreaM2 : 0; // 後で塗料計算用

  const rollArea = WALLPAPER_WIDTH_CM * WALLPAPER_LENGTH_CM;
  let rolls = netAreaCm2 / rollArea;
  rolls *= (1 + LOSS_RATE);
  rolls = Math.ceil(rolls);

  document.getElementById("result").innerHTML = `
    <p>壁全体面積：${(baseArea / pixelsPerCm ** 2).toFixed(1)} cm²</p>
    <p>開口部控除面積：${((holeArea + currentHoleArea) / pixelsPerCm ** 2).toFixed(1)} cm²</p>
    <p>施工対象面積：<strong>${netAreaCm2.toFixed(1)} cm²</strong>（${netAreaM2.toFixed(2)} m²）</p>
    <p>必要壁紙：<strong>${rolls} ロール</strong>（ロス率込み）</p>
  `;
  document.getElementById("advice").innerHTML = '';
  document.getElementById("paintResult").innerHTML = '';
});

// 塗料量計算
document.getElementById("paintCalcBtn").addEventListener("click", () => {
  if (lastNetAreaM2 === 0) {
    alert("先に面積を計算してください。");
    return;
  }
  const paintPerM2 = parseFloat(document.getElementById('paintPerM2').value);
  const coatTimes = parseInt(document.getElementById('coatTimes').value, 10);
  const lossPercent = parseFloat(document.getElementById('lossPercent').value);
  const canSize = parseFloat(document.getElementById('canSize').value);

  const totalArea = lastNetAreaM2 * coatTimes;
  let requiredPaint = totalArea * paintPerM2 * (1 + lossPercent / 100);
  requiredPaint = Math.round(requiredPaint * 100) / 100;
  const cans = Math.ceil(requiredPaint / canSize);

  document.getElementById('paintResult').innerHTML =
    `<b>施工面積（${coatTimes}回塗り）：</b>${totalArea.toFixed(2)} m²<br>
     <b>必要塗料量：</b>${requiredPaint} kg<br>
     <b>必要缶数：</b>${cans} 缶（1缶 ${canSize} kg）`;
});

function calcPolygonArea(pts) {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    area += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
  }
  return Math.abs(area) / 2;
}