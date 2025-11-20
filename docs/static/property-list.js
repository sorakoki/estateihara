document.addEventListener('DOMContentLoaded', () => {
  fetch('data/properties.json')
    .then(response => response.json())
    .then(data => {
      window.propertyData = data;
      renderProperties(data);
      scrollToHash(); // ← スクロール処理を呼び出す
    })
    .catch(err => {
      const container = document.getElementById("property-list");
      if (container) {
        container.innerHTML = "<p>物件情報の読み込みに失敗しました。</p>";
      }
      console.error("JSON読み込みエラー:", err);
    });
});

function scrollToHash() {
  const hash = decodeURIComponent(window.location.hash);
  if (hash) {
    const target = document.querySelector(hash);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }
}


// ↓ .then() の外に関数定義を置く！
function scrollToHash() {
  const hash = decodeURIComponent(window.location.hash);
  if (hash) {
    const target = document.querySelector(hash);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }
}


function renderProperties(data) {
  const container = document.getElementById('property-list');
  container.innerHTML = '';

  data.forEach((property, index) => {
  const card = document.createElement('div');
  card.className = 'property';

  const anchorId = property.id;
  card.id = anchorId;

  // 🔍 ここで画像パスを確認！
  const imagePath = `data/${property.folder}/${property.images[0]}`;

  console.log(`描画中: ${property.name}`);
  console.log(`画像パス: ${imagePath}`);



    const totalCost = property.moving_cost
      ? Object.values(property.moving_cost).reduce((a, b) => a + b, 0)
      : 0;

    const mapEmbed = property.map
      ? `<iframe src="${property.map}" width="100%" height="200" style="border:0;" allowfullscreen></iframe>`
      : '';

    let parkingText = '';
    switch (property.parking) {
      case 0: parkingText = 'なし'; break;
      case 1: parkingText = '1台（家賃込み）'; break;
      case 2: parkingText = '2台（+3,800円）'; break;
      case 3: parkingText = '3台（+7,600円）'; break;
      default: parkingText = '不明';
    }

    const imageHtml = property.images?.length
  ? property.images.map(img =>
      `<img src="data/${property.folder}/${img}" alt="${property.name}" style="max-width: 100%; margin-bottom: 8px;">`
    ).join('')
  : '';


    const noteHtml = `
      <p class="contract-note">
        Gmail以外のメールアドレスをご利用の場合も、右記アドレス、
        <a href="mailto:info@2two.2box.jp">info@2two.2box.jp</a> にて承りますのでご安心ください。<br>
        どうぞよろしくお願いいたします。
      </p>
    `;

    card.innerHTML = `
      ${imageHtml}
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
        <p>${property.description}</p>
        <p><strong>引越し費用合計:</strong> ¥${totalCost}</p>
        <button onclick="editProperty(${index})">修正する</button>
        <button onclick="contract('${property.name}')">仮契約する</button>
        ${noteHtml}
      </div>
    `;

    container.appendChild(card);
  });
}


// 仮契約フォームを開く関数（一本化）
function contract(propertyName) {
  const baseUrl = "https://docs.google.com/forms/d/e/1FAIpQLSf0__cCjAhoCB53r2AdZYqpSvI4da5dBvY2cMa7HaqxSYghpw/viewform";
  const entryId = "entry.2035525307"; // ← 物件名のフィールドID（こっちが正しければ）
  const url = `${baseUrl}?usp=pp_url&${entryId}=${encodeURIComponent(propertyName)}`;
  window.open(url, "_blank", "noopener,noreferrer");
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
          <option value="">選択してください</option>
          <option value="true" ${property.key_exchange === true ? 'selected' : ''}>あり</option>
          <option value="false" ${property.key_exchange === false ? 'selected' : ''}>なし</option>
        </select>
      </label><br>
      <label>火災保険: 
        <select id="edit-fire">
          <option value="">選択してください</option>
          <option value="true" ${property.fire_insurance === true ? 'selected' : ''}>加入</option>
          <option value="false" ${property.fire_insurance === false ? 'selected' : ''}>未加入</option>
        </select>
      </label><br>
      <label>家賃保証: 
        <select id="edit-guarantee">
          <option value="">選択してください</option>
          <option value="アルファ" ${property.guarantee === 'アルファ' ? 'selected' : ''}>アルファ</option>
          <option value="CIZ宅建保証" ${property.guarantee === 'CIZ宅建保証' ? 'selected' : ''}>CIZ宅建保証</option>
          <option value="ナップ" ${property.guarantee === 'ナップ' ? 'selected' : ''}>ナップ</option>
        </select>
      </label><br>
      <label>駐車場: 
        <select id="edit-parking">
          <option value="">選択してください</option>
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
  const deposit = parseInt(document.getElementById('edit-deposit').value, 10) || 0;

  const keyVal = document.getElementById('edit-key').value;
  const key_exchange = keyVal === "" ? null : keyVal === 'true';

  const fireVal = document.getElementById('edit-fire').value;
  const fire_insurance = fireVal === "" ? null : fireVal === 'true';

  const guarantee = document.getElementById('edit-guarantee').value || null;

  const parkingVal = document.getElementById('edit-parking').value;
  const parking = parkingVal === "" ? null : parseInt(parkingVal, 10);

  const property = window.propertyData[index];
  property.location = location;
  property.layout = layout;
  property.deposit = deposit;
  property.key_exchange = key_exchange;
  property.fire_insurance = fire_insurance;
  property.guarantee = guarantee;
  property.parking = parking;

  console.log('保存後の物件データ:', window.propertyData); // ← ここを修正！

  renderProperties(window.propertyData);
}
