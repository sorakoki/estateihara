fetch("properties.json")
  .then(res => res.json())
  .then(data => {
    const container = document.querySelector(".property-list");
    data.forEach(p => {
      container.innerHTML += `
        <div class="property">
          <img src="${p.image}" alt="${p.name}" style="max-width:300px;"><br>
          <div class="property-details">
            <div class="property-title">${p.name}</div>
            <div class="property-price">価格: ${p.price} 円</div>
            <div class="property-location">所在地: ${p.location}</div>
            <div class="property-layout">間取り: ${p.layout}</div>
            <p>${p.description}</p>
          </div>
        </div>
      `;
    });
  })
  .catch(err => {
    document.querySelector(".property-list").innerHTML = "<p>物件情報の読み込みに失敗しました。</p>";
    console.error("JSON読み込みエラー:", err);
  });

  