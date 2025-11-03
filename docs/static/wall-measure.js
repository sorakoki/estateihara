document.addEventListener("DOMContentLoaded", function () {
  const imageInput = document.getElementById("imageInput");
  const canvas = document.getElementById("canvas");
  let img = null;
  let scalePoints = [];
  let mainPolygon = [];
  let holePolygons = [];
  let currentHole = [];
  let undoStack = [];
  let redoStack = [];

  if (!imageInput || !canvas) return;

  imageInput.addEventListener("change", function (e) {
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

      // 初期化
      scalePoints = [];
      mainPolygon = [];
      holePolygons = [];
      currentHole = [];
      undoStack = [];
      redoStack = [];

      draw(); // ← draw() 関数が定義されている前提
      URL.revokeObjectURL(url);
    };

    img.onerror = () => {
      alert("画像の読み込みに失敗しました。\nファイル形式・サイズ・壊れていないかご確認ください。");
      URL.revokeObjectURL(url);
    };

    img.src = url;
  });
});
