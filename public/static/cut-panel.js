document.addEventListener('DOMContentLoaded', function () {
  const btn = document.getElementById('calcCutBtn');
  if (!btn) return;

  btn.onclick = function () {
    const A = parseFloat(document.getElementById('cutA').value);
    const B = parseFloat(document.getElementById('cutB').value);
    const C = parseFloat(document.getElementById('cutC').value);
    const D = parseFloat(document.getElementById('cutD').value);

    if ([A, B, C, D].some(v => isNaN(v) || v <= 0)) {
      document.getElementById('cutResult').innerText = "全ての辺の長さを正しく入力してください。";
      return;
    }

    const width = Math.min(A, C);
    const height = Math.min(B, D);

    const cutA = A - width;
    const cutB = B - height;
    const cutC = C - width;
    const cutD = D - height;

    let msg = `【切るべき長さ】\n`;
    msg += `上辺Aから ${cutA} mm\n`;
    msg += `右辺Bから ${cutB} mm\n`;
    msg += `下辺Cから ${cutC} mm\n`;
    msg += `左辺Dから ${cutD} mm\n\n`;
    msg += `※最も短い辺に合わせて長方形に近づける計算です。\n`;
    msg += `ノコギリの厚みも考慮してください。`;

    document.getElementById('cutResult').innerText = msg;
  };
});