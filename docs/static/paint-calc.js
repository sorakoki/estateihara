document.addEventListener("DOMContentLoaded", function () {
  const paintCalcBtn = document.getElementById("paintCalcBtn");

  paintCalcBtn.addEventListener("click", () => {
    const paintRate = parseFloat(document.getElementById("paintPerM2").value); // kg/m²
    const coatCount = parseInt(document.getElementById("coatTimes").value);   // 回数
    const lossRate = parseFloat(document.getElementById("lossPercent").value); // %
    const canSize = parseFloat(document.getElementById("canSize").value);     // kg/缶

    if (
      isNaN(paintRate) || isNaN(coatCount) ||
      isNaN(lossRate) || isNaN(canSize) ||
      typeof mainPolygon === "undefined" || mainPolygon.length < 3
    ) {
      document.getElementById("paintResult").innerText = "入力値が不足しています。";
      return;
    }

    const pxPerCm = getPxPerCm();
    const cmPerPx = 1 / pxPerCm;

    const wallAreaPx = polygonArea(mainPolygon);
    const holeAreaPx = holePolygons.reduce((sum, poly) => sum + polygonArea(poly), 0);
    const netAreaCm2 = wallAreaPx - holeAreaPx;
    const netAreaM2 = (netAreaCm2 * cmPerPx * cmPerPx) / 10000;

    const totalKg = netAreaM2 * paintRate * coatCount * (1 + lossRate / 100);
    const cansNeeded = Math.ceil(totalKg / canSize);

    const resultText = `
【塗料量計算】
塗装対象面積　：${netAreaM2.toFixed(2)} m²
必要塗料量　　：約 ${totalKg.toFixed(2)} kg
必要缶数　　　：${cansNeeded} 缶（1缶 ${canSize}kg）
※${coatCount}回塗り、ロス率 ${lossRate}%、標準塗布量 ${paintRate}kg/m²
`;

    document.getElementById("paintResult").innerText = resultText;
  });
});
