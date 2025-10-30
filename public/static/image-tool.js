document.addEventListener("DOMContentLoaded", function () {
  const imageInput = document.getElementById("imageInput");
  const canvas = document.getElementById("canvas");
  let img = null;

  if (!imageInput || !canvas) return;

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

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      URL.revokeObjectURL(url);
    };

    img.onerror = () => {
      alert("画像の読み込みに失敗しました。");
      URL.revokeObjectURL(url);
    };

    img.src = url;
  });
});
