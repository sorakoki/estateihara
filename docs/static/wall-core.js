document.addEventListener("DOMContentLoaded", function () {
  const imageInput = document.getElementById("imageInput");
  const canvas = document.getElementById("canvas");
  const scaleModeBtn = document.getElementById("scaleModeBtn");
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
  let currentPolygon = [];
  let undoStack = [];
  let redoStack = [];
  let mode = "main";
  let mainClosed = false;

  function getPxPerCm() {
    if (scalePoints.length !== 2) return 1;
    const dx = scalePoints[1].x - scalePoints[0].x;
    const dy = scalePoints[1].y - scalePoints[0].y;
    const pxLength = Math.sqrt(dx * dx + dy * dy);
    const refCm = parseFloat(document.getElementById("refCm").value);
    if (!refCm || refCm <= 0) return 1;
    return pxLength / refCm;
  }

  function isPolygonClosed(polygon) {
    if (polygon.length < 3) return false;
    const first = polygon[0];
    const last = polygon[polygon.length - 1];
    const dx = last.x - first.x;
    const dy = last.y - first.y;
    const distancePx = Math.sqrt(dx * dx + dy * dy);
    const pxPerCm = getPxPerCm();
    const distanceCm = distancePx / pxPerCm;
    return distanceCm < 20; // 20cm以内なら閉じたとみなす
  }

  imageInput.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      alert("JPEGまたはPNG画像を選択してください。");
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
      currentPolygon = [];
      undoStack = [];
      redoStack = [];
      mainClosed = false;

      draw();
      URL.revokeObjectURL(url);
    };

    img.onerror = () => {
      alert("画像の読み込みに失敗しました。");
      URL.revokeObjectURL(url);
    };

    img.src = url;
  });

  scaleModeBtn.addEventListener("click", () => { mode = "scale"; });
  mainModeBtn.addEventListener("click", () => { mode = "main"; });
  holeModeBtn.addEventListener("click", () => { mode = "hole"; });

  canvas.addEventListener("click", function (e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const point = { x, y };
    const pxPerCm = getPxPerCm();
    if (!pxPerCm) {
      alert("まずスケール線を設定してください。");
      return;
    }

    if (mode === "scale") {
      if (scalePoints.length < 2) {
        scalePoints.push(point);
        undoStack.push({ type: "scale", point });
        draw();
      }
      return;
    }

    if (mode === "main") {
      if (mainClosed) return;

      currentPolygon.push(point);
      undoStack.push({ type: "main", point });

      if (isPolygonClosed(currentPolygon)) {
        mainPolygon = currentPolygon.slice();
        mainClosed = true;
        currentPolygon = [];
      }

      draw();
      return;
    }

    if (mode === "hole") {
      currentPolygon.push(point);
      undoStack.push({ type: "hole", point });

      if (isPolygonClosed(currentPolygon)) {
        holePolygons.push(currentPolygon.slice());
        currentPolygon = [];
      }

      draw();
      return;
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && currentPolygon.length >= 3) {
      currentPolygon.push({ ...currentPolygon[0] }); // 強制的に閉じる

      if (mode === "main") {
        mainPolygon = currentPolygon.slice();
        mainClosed = true;
      } else if (mode === "hole") {
        holePolygons.push(currentPolygon.slice());
      }

      currentPolygon = [];
      draw();
    }
  });

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

  undoBtn.addEventListener("click", () => {
    const last = undoStack.pop();
    if (!last) return;
    redoStack.push(last);

    if (last.type === "main") {
      currentPolygon.pop();
      mainClosed = false;
    } else if (last.type === "hole") {
      currentPolygon.pop();
    } else if (last.type === "scale") {
      scalePoints.pop();
    }

    draw();
  });

  redoBtn.addEventListener("click", () => {
    const last = redoStack.pop();
    if (!last) return;
    undoStack.push(last);

    if (last.type === "main") {
      currentPolygon.push(last.point);
    } else if (last.type === "hole") {
      currentPolygon.push(last.point);
    } else if (last.type === "scale") {
      scalePoints.push(last.point);
    }

    draw();
  });

  calculateBtn.addEventListener("click", () => {
    if (!isPolygonClosed(mainPolygon)) {
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

    const resultText = `
【面積計算結果】
壁面積（全体）：${(wallAreaCm2 / 10000).toFixed(2)} m²
開口部合計　　：${(holeAreaCm2 / 10000).toFixed(2)} m²
塗装対象面積　：${netAreaM2.toFixed(2)} m²
※スケール線に基づいて計算しています。
`;

    document.getElementById("result").innerText = resultText;
  });

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

    // 壁ポリゴン（確定済み）
if (mainPolygon.length > 2) {
  ctx.beginPath();
  ctx.moveTo(mainPolygon[0].x, mainPolygon[0].y);
  for (let i = 1; i < mainPolygon.length; i++) {
    ctx.lineTo(mainPolygon[i].x, mainPolygon[i].y);
  }

  if (isPolygonClosed(mainPolygon)) {
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 165, 0, 0.4)";
    ctx.fill();
  }

  ctx.strokeStyle = "orange";
  ctx.lineWidth = 3;
  ctx.setLineDash([]);
  ctx.stroke();
}


      
    

    // 壁（メイン）描画中
    if (currentPolygon.length > 1 && mode === "main") {
      ctx.strokeStyle = "orange";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(currentPolygon[0].x, currentPolygon[0].y);
      for (let i = 1; i < currentPolygon.length; i++) {
        ctx.lineTo(currentPolygon[i].x, currentPolygon[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      const last = currentPolygon[currentPolygon.length - 1];
      ctx.fillStyle = "orange";
      ctx.font = "14px sans-serif";
      ctx.fillText("壁（メイン）描画中", last.x + 10, last.y - 10);
    }

    // 開口部（確定済み）
    holePolygons.forEach(polygon => {
      if (polygon.length > 2) {
        ctx.beginPath();
        ctx.moveTo(polygon[0].x, polygon[0].y);
        for (let i = 1; i < polygon.length; i++) {
          ctx.lineTo(polygon[i].x, polygon[i].y);
        }

        if (isPolygonClosed(polygon)) {
          ctx.closePath();
          ctx.fillStyle = "rgba(0, 128, 0, 0.4)";
          ctx.fill();
        }

        ctx.strokeStyle = "green";
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.stroke();
      }
    });

    // 開口部（描画中）
    if (currentPolygon.length > 1 && mode === "hole") {
      ctx.strokeStyle = "green";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(currentPolygon[0].x, currentPolygon[0].y);
      for (let i = 1; i < currentPolygon.length; i++) {
        ctx.lineTo(currentPolygon[i].x, currentPolygon[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      const last = currentPolygon[currentPolygon.length - 1];
      ctx.fillStyle = "green";
      ctx.font = "14px sans-serif";
      ctx.fillText("開口部描画中", last.x + 10, last.y - 10);
    }
  } // ← draw() 関数の閉じ括弧
}); // ← DOMContentLoaded の閉じ括弧


