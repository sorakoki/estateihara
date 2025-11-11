// JSONを読み込んで表示
fetch('data/properties.json')
  .then(response => response.json())
  .then(data => {
    window.propertyData = data; // グローバルに保持
    renderProperties(data);
  })
  .catch(err => {
    const container = document.getElementById("property-list");
    if (container) {
      container.innerHTML = "<p>物件情報の読み込みに失敗しました。</p>";
    }
    console.error("JSON読み込みエラー:", err);
  });

// 物件一覧を表示する関数
function renderProperties(data) {
  const container = document.getElementById('property-list');
  container.innerHTML = ''; // 初期化

  data.forEach((property, index) => {
    const card = document.createElement('div');
    card.className = 'property';

    const totalCost = property.moving_cost
      ? Object.values(property.moving_cost).reduce((a, b) => a + b, 0)
      : 0;

    const mapEmbed = property.map
      ? `<iframe src="${property.map}" width="100%" height="200" style="border:0;" allowfullscreen></iframe>`
      : '';

    // 駐車場の表示テキストを生成
    let parkingText = '';
    switch (property.parking) {
      case 0:
        parkingText = 'なし';
        break;
      case 1:
        parkingText = '1台（家賃込み）';
        break;
      case 2:
        parkingText = '2台（+3,800円）';
        break;
      case 3:
        parkingText = '3台（+7,600円）';
        break;
      default:
        parkingText = '不明';
    }

    card.innerHTML = `
      <img src="data/${property.folder}/${property.images[0]}" alt="${property.name}">
      <div class="property-details">
        <div class="property-title">${property.name}</div>
        <div class="property-price">¥${property.price}（管理費込み: ¥${property.price + (property.management_fee || 0)}）</div>
        <p><strong>地域:</strong> ${property.location}</p>
        ${mapEmbed}
        <p><strong>間取り:</strong> ${property.layout}</p>
        <p><strong>敷金:</strong> ¥${property.deposit}</p>
        <p><strong>駐車場:</strong> ${parkingText}</p>
        <p><strong>鍵交換:</strong> ${property.key_exchange ? 'あり' : 'なし'}</p>
        <p><strong>火災保険:</strong> ${property.fire_insurance ? '加入' : '未加入'}</p>
        <p><strong>家賃保証:</strong> ${property.guarantee}</p>
        <p><strong>引越し費用合計:</strong> ¥${totalCost}</p>
        <p>${property.description}</p>
        <button onclick="editProperty(${index})">修正する</button>
      </div>
    `;

    container.appendChild(card);
  });
}

// 編集フォームを表示する関数
function editProperty(index) {
  const container = document.getElementById('property-list');
  const property = window.propertyData[index];

  const formHtml = `
    <div class="edit-form">
      <h3>${property.name} の修正</h3>
      <label>地域: <input type="text" id="edit-location" value="${property.location}"></label><br>
      <label>間取り: <input type="text" id="edit-layout" value="${property.layout}"></label><br>
      <label>敷金: <input type="number" id="edit-deposit" value="${property.deposit}"></label><br>
      <label>鍵交換: 
        <select id="edit-key">
          <option value="true" ${property.key_exchange ? 'selected' : ''}>あり</option>
          <option value="false" ${!property.key_exchange ? 'selected' : ''}>なし</option>
        </select>
      </label><br>
      <label>火災保険: 
        <select id="edit-fire">
          <option value="true" ${property.fire_insurance ? 'selected' : ''}>加入</option>
          <option value="false" ${!property.fire_insurance ? 'selected' : ''}>未加入</option>
        </select>
      </label><br>
      <label>家賃保証: 
        <select id="edit-guarantee">
          <option value="アルファ" ${property.guarantee === 'アルファ' ? 'selected' : ''}>アルファ</option>
          <option value="CIZ宅建保証" ${property.guarantee === 'CIZ宅建保証' ? 'selected' : ''}>CIZ宅建保証</option>
          <option value="ナップ" ${property.guarantee === 'ナップ' ? 'selected' : ''}>ナップ</option>
        </select>
      </label><br>
      <label>駐車場: 
        <select id="edit-parking">
          <option value="0" ${property.parking === 0 ? 'selected' : ''}>なし</option>
          <option value="1" ${property.parking === 1 ? 'selected' : ''}>1台（家賃込み）</option>
          <option value="2" ${property.parking === 2 ? 'selected' : ''}>2台（+3,800円）</option>
          <option value="3" ${property.parking === 3 ? 'selected' : ''}>3台（+7,600円）</option>
        </select>
      </label><br>
      <button onclick="saveProperty(${index})">保存</button>
    </div>
  `;

  container.innerHTML = formHtml;
}

// 編集内容を保存して再表示する関数
function saveProperty(index) {
  const location = document.getElementById('edit-location').value;
  const layout = document.getElementById('edit-layout').value;
  const deposit = parseInt(document.getElementById('edit-deposit').value, 10);
  const key_exchange = document.getElementById('edit-key').value === 'true';
  const fire_insurance = document.getElementById('edit-fire').value === 'true';
  const guarantee = document.getElementById('edit-guarantee').value;
  const parking = parseInt(document.getElementById('edit-parking').value, 10);

  const property = window.propertyData[index];
  property.location = location;
  property.layout = layout;
  property.deposit = deposit;
  property.key_exchange = key_exchange;
  property.fire_insurance = fire_insurance;
  property.guarantee = guarantee;
  property.parking = parking;

  renderProperties(window.propertyData);
}

