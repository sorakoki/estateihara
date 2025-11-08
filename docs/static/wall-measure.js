document.addEventListener("DOMContentLoaded", function () {
  const imageInput = document.getElementById("imageInput");
  const canvas = document.getElementById("canvas");
  const mainModeBtn = document.getElementById("mainModeBtn");
  const holeModeBtn = document.getElementById("holeModeBtn");
  const undoBtn = document.getElementById("undoBtn");
  const redoBtn = document.getElementById("redoBtn");
  const resetBtn = document.getElementById("resetBtn");
  const calculateBtn = document.getElementById("calculateBtn");

  let img = null;
  let scalePoints = [];
  let mainPolygon = [];
  let holePolygons = [];
  let currentHole = [];
  let undoStack = [];
  let redoStack = [];
  let mode = "main"; // "main" or "hole"

  imageInput.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      alert("この画像形式は対応していません。\nJPEGまたはPNG画像を選択してください。");
      return;
    }

    const url = URL.createObjectURL(file);
    img = new Image();

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
      URL.revokeObjectURL(url);
    };

    img.onerror = () => {
      alert("画像の読み込みに失敗しました。\nファイル形式・サイズ・壊れていないかご確認ください。");
      URL.revokeObjectURL(url);
    };

    img.src = url;
  });

  mainModeBtn.addEventListener("click", () => {
    mode = "main";
  });

  holeModeBtn.addEventListener("click", () => {
    mode = "hole";
  });

  canvas.addEventListener("click", function (e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const point = { x, y };

    const pxPerCm = getPxPerCm();

    if (mode === "main") {
      mainPolygon.push(point);
      undoStack.push({ type: "main", point });

      if (mainPolygon.length > 2) {
        const dist = distance(point, mainPolygon[0]);
        if (dist <= pxPerCm * 20) {
          mainPolygon.push(mainPolygon[0]);
        }
      }

    } else if (mode === "hole") {
      currentHole.push(point);
      undoStack.push({ type: "hole", point });

      if (currentHole.length > 2) {
        const dist = distance(point, currentHole[0]);
        if (dist <= pxPerCm * 20) {
          holePolygons.push([...currentHole, currentHole[0]]);
          currentHole = [];
        }
      }
    }

    draw();
  });

  resetBtn.addEventListener("click", () => {
    scalePoints = [];
    mainPolygon = [];
    holePolygons = [];
    currentHole = [];
    undoStack = [];
    redoStack = [];
    draw();
  });

  undoBtn.addEventListener("click", () => {
    const last = undoStack.pop();
    if (!last) return;

    redoStack.push(last);

    if (last.type === "main") {
      mainPolygon.pop();
    } else if (last.type === "hole") {
      currentHole.pop();
    }

    draw();
  });

  redoBtn.addEventListener("click", () => {
    const last = redoStack.pop();
    if (!last) return;

    undoStack.push(last);

    if (last.type === "main") {
      mainPolygon.push(last.point);
    } else if (last.type === "hole") {
      currentHole.push(last.point);
    }

    draw();
  });

  calculateBtn.addEventListener("click", () => {
    if (mainPolygon.length < 3) {
      document.getElementById("result").innerText = "壁ポリゴンが未完成です。";
      return;
    }

    const pxPerCm = getPxPerCm();
    const cmPerPx = 1 / pxPerCm;

    const wallAreaPx = polygonArea(mainPolygon);
    const holeAreaPx = holePolygons.reduce((sum, poly) => sum + polygonArea(poly), 0);

    const wallAreaCm2 = wallAreaPx * cmPerPx * cmPerPx;
    const holeAreaCm2 = holeAreaPx * cmPerPx * cmPerPx;
    const netAreaM2 = (wallAreaCm2 - holeAreaCm2) / 10000;

    const resultText = `
【面積計算結果】
壁面積（全体）：${(wallAreaCm2 / 10000).toFixed(2)} m²
開口部合計　　：${(holeAreaCm2 / 10000).toFixed(2)} m²
塗装対象面積　：${netAreaM2.toFixed(2)} m²
※スケール線に基づいて計算しています。
`;

    document.getElementById("result").innerText = resultText;
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && currentHole.length > 2) {
      holePolygons.push([...currentHole, currentHole[0]]);
      currentHole = [];
      draw();
    }
  });

  function draw() {
    const ctx = canvas.getContext("2d");
    if (!ctx || !img) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    // 基準長（点線・青）
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

    // 壁ポリゴン（オレンジ・太線）
    if (mainPolygon.length > 1) {
      ctx.strokeStyle = "orange";
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(mainPolygon[0].x, mainPolygon[0].y);
      for (let i = 1; i < mainPolygon.length; i++) {
        ctx.lineTo(mainPolygon[i].x, mainPolygon[i].y);
      }
      ctx.stroke();
    }

    // 開口部（確定済み）緑
    ctx.strokeStyle = "green";
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    holePolygons.forEach(polygon => {
      if (polygon.length > 1) {
        ctx.beginPath();
        ctx.moveTo(polygon[0].x, polygon[0].y);
        for (let i = 1; i < polygon.length; i++) {
          ctx.lineTo(polygon[i].x, polygon[i].y);
        }
        ctx.closePath();
        ctx.stroke();
      }
    });

    // 開口部（描画中）緑点線
    if (currentHole.length > 1) {
      ctx.strokeStyle = "green";
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(currentHole[0].x, currentHole[0].y);
      for (let i = 1; i < currentHole.length; i++) {
        ctx.lineTo(currentHole[i].x, currentHole[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function distance(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function getPxPerCm() {
  if (scalePoints.length === 2) {
    const dx = scalePoints[0].x - scalePoints[1].x;
    const dy = scalePoints[0].y - scalePoints[1].y;
    const pxLength = Math.sqrt(dx * dx + dy * dy);
    const refCm = parseFloat(document.getElementById("refCm").value);
    return pxLength / refCm;
  }
  return 1; // スケール未設定時の仮値
}

