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

  if (!imageInput || !canvas) return;

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

    if (mode === "main") {
      mainPolygon.push(point);
      undoStack.push({ type: "main", point });
    } else if (mode === "hole") {
      currentHole.push(point);
      undoStack.push({ type: "hole", point });
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
    document.getElementById("result").innerText = "※面積計算はまだ未実装です";
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && currentHole.length > 2) {
      holePolygons.push([...currentHole]);
      currentHole = [];
      draw();
    }
  });

  function draw() {
    const ctx = canvas.getContext("2d");
    if (!ctx || !img) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    // 壁ポリゴン
    if (mainPolygon.length > 1) {
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(mainPolygon[0].x, mainPolygon[0].y);
      for (let i = 1; i < mainPolygon.length; i++) {
        ctx.lineTo(mainPolygon[i].x, mainPolygon[i].y);
      }
      ctx.stroke();
    }

    // 開口部（確定済み）
    ctx.strokeStyle = "green";
    ctx.lineWidth = 2;
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

    // 開口部（描画中）
    if (currentHole.length > 1) {
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
});


