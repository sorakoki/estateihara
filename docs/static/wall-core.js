// madorin_canvas_fixed_script.js
// 機能そのまま、構造整理・Undo/Redo 安定版
// - 点ごとの Undo（scale は Undo 非対応）
// - Enter または最初の点に近づいたら自動で閉じる
// - 閉じたポリゴンの Undo は「未閉じ状態へ戻す」
// - 面積計算は従来のテキスト表示を維持

// --- 要素取得 ---
const imageInput = document.getElementById("imageInput");
const canvas = document.getElementById("canvas");
const scaleModeBtn = document.getElementById("scaleModeBtn");
const mainModeBtn = document.getElementById("mainModeBtn");
const holeModeBtn = document.getElementById("holeModeBtn");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const resetBtn = document.getElementById("resetBtn");
const calculateBtn = document.getElementById("calculateBtn");

// --- 状態変数 ---
let img = null;
let scalePoints = []; // 最大2点
let mainPolygon = []; // 閉じたときのみ入る（閉じた頂点は先頭と末尾が同じ）
let holePolygons = []; // 複数の閉じた開口部
let currentPolygon = []; // 今描いているポリゴン（main または hole 双方に利用）
let undoStack = [];
let redoStack = [];
let mode = "main"; // "scale" | "main" | "hole"
let mainClosed = false;

// --- 設定 ---
const AUTO_CLOSE_DIST = 12; // 自動閉じ判定（ピクセル）

// --- 基準線のピクセル換算 ---
function getPxPerCm() {
  if (scalePoints.length !== 2) return 1;
  const dx = scalePoints[1].x - scalePoints[0].x;
  const dy = scalePoints[1].y - scalePoints[0].y;
  const pxLength = Math.sqrt(dx * dx + dy * dy);
  const refCm = parseFloat(document.getElementById("refCm").value);
  if (!refCm || refCm <= 0) return 1;
  return pxLength / refCm;
}
window.getPxPerCm = getPxPerCm; // グローバル公開

// --- ポリゴン面積（px 単位） ---
(function () {
  window.polygonArea = window.polygonArea || function (polygon) {
    if (!Array.isArray(polygon) || polygon.length < 3) return 0;
    let area = 0;
    const n = polygon.length;
    for (let i = 0; i < n; i++) {
      const { x: x1, y: y1 } = polygon[i];
      const { x: x2, y: y2 } = polygon[(i + 1) % n];
      area += (x1 * y2 - x2 * y1);
    }
    return Math.abs(area / 2);
  };
})();

// --- ユーティリティ ---
function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function isPolygonClosed(polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) return false;
  const first = polygon[0];
  const last = polygon[polygon.length - 1];
  return first.x === last.x && first.y === last.y;
}

// --- 描画関数（単一） ---
function draw() {
  const ctx = canvas.getContext("2d");
  if (!ctx || !img) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  // スケール線
  if (scalePoints.length === 2) {
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(scalePoints[0].x, scalePoints[0].y);
    ctx.lineTo(scalePoints[1].x, scalePoints[1].y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "blue";
    ctx.font = "14px sans-serif";
    const midX = (scalePoints[0].x + scalePoints[1].x) / 2;
    const midY = (scalePoints[0].y + scalePoints[1].y) / 2;
    ctx.fillText("基準", midX + 5, midY - 5);
  }

  // メイン（閉じたポリゴン）
  if (mainClosed && mainPolygon.length > 2) {
    ctx.beginPath();
    ctx.moveTo(mainPolygon[0].x, mainPolygon[0].y);
    for (let i = 1; i < mainPolygon.length; i++) ctx.lineTo(mainPolygon[i].x, mainPolygon[i].y);
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 165, 0, 0.4)";
    ctx.fill();
    ctx.strokeStyle = "orange";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // 描画中のメイン（currentPolygon を主に描く）
  if (currentPolygon.length > 0 && mode === "main") {
    ctx.strokeStyle = "orange";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(currentPolygon[0].x, currentPolygon[0].y);
    for (let i = 1; i < currentPolygon.length; i++) ctx.lineTo(currentPolygon[i].x, currentPolygon[i].y);
    ctx.stroke();
    ctx.setLineDash([]);

    // 最初の点に近いときはマーカーを出す
    if (currentPolygon.length >= 3) {
      const first = currentPolygon[0];
      const last = currentPolygon[currentPolygon.length - 1];
      if (distance(first, last) <= AUTO_CLOSE_DIST) {
        ctx.beginPath();
        ctx.arc(first.x, first.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 165, 0, 0.7)";
        ctx.fill();
      }
    }
  }

  // 開口部（閉じたもの）
  holePolygons.forEach(poly => {
    if (poly.length > 2) {
      ctx.beginPath();
      ctx.moveTo(poly[0].x, poly[0].y);
      for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
      if (isPolygonClosed(poly)) {
        ctx.closePath();
        ctx.fillStyle = "rgba(0, 128, 0, 0.4)";
        ctx.fill();
      }
      ctx.strokeStyle = "green";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });
}

// --- 画像読み込み ---
imageInput.addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  img = new Image();
  img.onload = () => {
    // キャンバスを画像サイズに合わせる
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // 状態リセット
    scalePoints = [];
    mainPolygon = [];
    holePolygons = [];
    currentPolygon = [];
    undoStack = [];
    redoStack = [];
    mainClosed = false;
    draw();
    URL.revokeObjectURL(url);
  };
  img.src = url;
});

// --- モード切替 ---
scaleModeBtn.addEventListener("click", () => { mode = "scale"; currentPolygon = []; draw(); });
mainModeBtn.addEventListener("click", () => { mode = "main"; currentPolygon = []; draw(); });
holeModeBtn.addEventListener("click", () => { mode = "hole"; currentPolygon = []; draw(); });

// --- キャンバスクリック ---
canvas.addEventListener("click", (e) => {
  if (!img) return;
  const rect = canvas.getBoundingClientRect();
  const x = Math.round(e.clientX - rect.left);
  const y = Math.round(e.clientY - rect.top);
  const pt = { x, y };

  if (mode === "scale") {
    // scale は最大2点。
    if (scalePoints.length >= 2) scalePoints.shift();
    scalePoints.push(pt);
    // scale 操作は undo 非対応（ユーザー指定）
    redoStack = [];
    draw();
    return;
  }

  // main / hole 共通で点追加
  currentPolygon.push(pt);
  // 点追加は undo に記録
  undoStack.push({ type: mode === "main" ? "main-point" : "hole-point", point: pt });
  // redo は新しい操作でクリア
  redoStack = [];

  // 自動閉じ判定（最初の点に近ければ閉じる）
  if (currentPolygon.length >= 3) {
    const first = currentPolygon[0];
    if (distance(first, pt) <= AUTO_CLOSE_DIST) {
      // 閉じ動作
      currentPolygon.push({ ...first }); // 閉じる
      if (mode === "main") {
        mainPolygon = [...currentPolygon];
        mainClosed = true;
        // 閉じた操作を記録（復元可能に）
        undoStack.push({ type: "main-close", polygon: [...mainPolygon] });
        currentPolygon = [];
      } else {
        holePolygons.push([...currentPolygon]);
        undoStack.push({ type: "hole-close", polygon: [...currentPolygon] });
        currentPolygon = [];
      }
    }
  }

  draw();
});

// --- キーボード操作（Enter でポリゴンを閉じる） ---
document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  if ((mode === "main" || mode === "hole") && currentPolygon.length >= 3) {
    // 明示的に閉じる
    currentPolygon.push({ ...currentPolygon[0] });
    if (mode === "main") {
      mainPolygon = [...currentPolygon];
      mainClosed = true;
      undoStack.push({ type: "main-close", polygon: [...mainPolygon] });
      currentPolygon = [];
    } else {
      holePolygons.push([...currentPolygon]);
      undoStack.push({ type: "hole-close", polygon: [...currentPolygon] });
      currentPolygon = [];
    }
    redoStack = [];
    draw();
  }
});

// --- リセット ---
resetBtn.addEventListener("click", () => {
  scalePoints = [];
  mainPolygon = [];
  holePolygons = [];
  currentPolygon = [];
  undoStack = [];
  redoStack = [];
  mainClosed = false;
  draw();
});

// --- Undo ---
undoBtn.addEventListener("click", () => {
  const last = undoStack.pop();
  if (!last) return;
  redoStack.push(last);

  switch (last.type) {
    case "main-point":
      // 描画中の点を削除（主に currentPolygon）
      if (currentPolygon.length > 0) currentPolygon.pop();
      break;
    case "hole-point":
      if (currentPolygon.length > 0) currentPolygon.pop();
      break;
    case "main-close":
      // 閉じたポリゴンを未閉じ状態に戻す
      mainClosed = false;
      // 最後に閉じた polygon は last.polygon
      // currentPolygon をその中身（末尾の重複点を除く）に戻す
      currentPolygon = last.polygon.slice(0, -1).map(p => ({ ...p }));
      mainPolygon = [];
      break;
    case "hole-close":
      // 閉じた hole を未閉じに戻す（最後の閉じ hole を currentPolygon に戻す）
      const popped = holePolygons.pop();
      if (popped) {
        currentPolygon = popped.slice(0, -1).map(p => ({ ...p }));
      }
      break;
    default:
      break;
  }

  draw();
});

// --- Redo ---
redoBtn.addEventListener("click", () => {
  const action = redoStack.pop();
  if (!action) return;
  undoStack.push(action);

  switch (action.type) {
    case "main-point":
      currentPolygon.push(action.point);
      break;
    case "hole-point":
      currentPolygon.push(action.point);
      break;
    case "main-close":
      // 再度閉じる
      mainPolygon = action.polygon.map(p => ({ ...p }));
      mainClosed = true;
      currentPolygon = [];
      break;
    case "hole-close":
      holePolygons.push(action.polygon.map(p => ({ ...p })));
      currentPolygon = [];
      break;
    default:
      break;
  }

  draw();
});

// --- 面積計算 ---
calculateBtn.addEventListener("click", () => {
  if (!mainClosed || mainPolygon.length < 3) {
    document.getElementById("result").innerText = "壁ポリゴンが閉じていません。";
    return;
  }

  const pxPerCm = getPxPerCm();
  const cmPerPx = 1 / pxPerCm;

  const wallAreaPx = polygonArea(mainPolygon);
  const holeAreaPx = holePolygons.reduce((sum, poly) => sum + polygonArea(poly), 0);

  const wallAreaCm2 = wallAreaPx * cmPerPx * cmPerPx;
  const holeAreaCm2 = holeAreaPx * cmPerPx * cmPerPx;
  const netAreaM2 = (wallAreaCm2 - holeAreaCm2) / 10000;

  const resultText = `\n【面積計算結果】\n壁面積（全体）：${(wallAreaCm2 / 10000).toFixed(2)} m²\n開口部合計　　：${(holeAreaCm2 / 10000).toFixed(2)} m²\n塗装対象面積　：${netAreaM2.toFixed(2)} m²\n※スケール線に基づいて計算しています。`;

  document.getElementById("result").innerText = resultText;
});

