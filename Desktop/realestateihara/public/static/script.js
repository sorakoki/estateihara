document.getElementById("imageInput").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;

  // ★ 対応ファイル形式の判定
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
    alert("画像の読み込みに失敗しました。ファイル形式・サイズ・壊れていないかご確認ください。");
  };
  img.src = url;
});