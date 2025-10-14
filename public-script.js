fetch("properties.json")
  .then(res => res.json())
  .then(data => {
    const list = document.getElementById("list");
    data.forEach(p => {
      const card = document.createElement("div");
      card.className = "property-card";
      card.innerHTML = `
        <strong>物件名:</strong> ${p.name}<br>
        <strong>価格:</strong> ${p.price} 円<br>
        <strong>所在地:</strong> ${p.location}<br>
        <strong>間取り:</strong> ${p.layout}<br>
        <strong>説明:</strong> ${p.description}<br>
        <img src="../realestateihara/img/${p.name}/${p.images[0]}" alt="物件画像">

      `;
      list.appendChild(card);
    });
  });
