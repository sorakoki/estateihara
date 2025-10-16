import { updateFileInput, createImagePreview } from "../shared/common.js";

const form = document.getElementById("property-form");
const preview = document.getElementById("preview");
const list = document.getElementById("list");
const editIndexInput = document.getElementById("edit-index");
const imageInput = document.getElementById("image");

// ✅ ページ読み込み時の処理
window.addEventListener("DOMContentLoaded", () => {
  // 前回入力の復元
  const last = JSON.parse(localStorage.getItem("lastProperty") || "null");
  if (last) {
    document.getElementById("property_name").value = last.name || "";
    document.getElementById("price").value = last.price || "";
    document.getElementById("location").value = last.location || "";
    document.getElementById("layout").value = last.layout || "";
    document.getElementById("description").value = last.description || "";

    const info = document.createElement("div");
    info.innerHTML = `
      <p style="background:#eef;padding:10px;border-left:4px solid #88f;">
        前回の登録情報が自動入力されています。内容を確認して必要なら修正してください。
      </p>
    `;
    form.prepend(info);
  }

  const params = new URLSearchParams(window.location.search);
  if (params.get("status") === "success") {
    alert("保存しました！");
    history.replaceState(null, "", "admin.html");
  }

  displayProperties();
});

// ✅ 画像プレビュー＋削除ボタン（複数対応）
imageInput.addEventListener("change", () => {
  preview.innerHTML = "";
  const files = Array.from(imageInput.files);
  const updatedFiles = [];

  files.forEach((file) => {
    updatedFiles.push(file);
    createImagePreview(file, preview, () => {
      updatedFiles.splice(updatedFiles.indexOf(file), 1);
      updateFileInput(updatedFiles, imageInput);
    });
  });
});

// ✅ 登録・更新処理（複数画像対応＋入力記憶）
form.addEventListener("submit", function (event) {
  event.preventDefault();

  const name = document.getElementById("property_name").value;
  const price = document.getElementById("price").value;
  const location = document.getElementById("location").value;
  const layout = document.getElementById("layout").value;
  const description = document.getElementById("description").value;
  const imageFiles = Array.from(imageInput.files);
  const editIndex = parseInt(editIndexInput.value);

  // 入力内容を記憶
  const lastProperty = { name, price, location, layout, description };
  localStorage.setItem("lastProperty", JSON.stringify(lastProperty));

  const saveProperty = (imageDataArray) => {
    const property = { name, price, location, layout, description, image: imageDataArray };
    const saved = JSON.parse(localStorage.getItem("properties") || "[]");

    if (editIndex >= 0) {
      saved[editIndex] = property;
    } else {
      saved.push(property);
    }

    localStorage.setItem("properties", JSON.stringify(saved));
    displayProperties();
    form.reset();
    preview.innerHTML = "";
    editIndexInput.value = -1;
  };

  if (imageFiles.length > 0) {
    const readers = imageFiles.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then((imageDataArray) => {
      saveProperty(imageDataArray);
    });
  } else {
    const saved = JSON.parse(localStorage.getItem("properties") || "[]");
    const existingImages = editIndex >= 0 ? saved[editIndex].image : [];
    saveProperty(existingImages);
  }
});

// ✅ 一覧表示（複数画像対応）
function displayProperties() {
  const saved = JSON.parse(localStorage.getItem("properties") || "[]");
  list.innerHTML = "<h2>登録済み物件一覧</h2>";
  saved.forEach((p, index) => {
    const card = document.createElement("div");
    card.className = "property-card";

    let imageHTML = "";
    if (Array.isArray(p.image)) {
      p.image.forEach((imgSrc) => {
        imageHTML += `<img src="${imgSrc}" alt="物件画像" style="max-width:200px; margin-right: 10px;">`;
      });
    } else {
      imageHTML = `<img src="${p.image}" alt="物件画像" style="max-width:200px;">`;
    }

    card.innerHTML = `
      <strong>物件名:</strong> ${p.name}<br>
      <strong>価格:</strong> ${p.price} 円<br>
      <strong>所在地:</strong> ${p.location}<br>
      <strong>間取り:</strong> ${p.layout}<br>
      <strong>説明:</strong> ${p.description}<br>
      ${imageHTML}
      <br>
      <button onclick="editProperty(${index})">編集</button>
      <button onclick="deleteProperty(${index})">削除</button>
    `;
    list.appendChild(card);
  });
}

// ✅ 編集機能（複数画像対応）
window.editProperty = function (index) {
  const saved = JSON.parse(localStorage.getItem("properties") || "[]");
  const p = saved[index];
  document.getElementById("property_name").value = p.name;
  document.getElementById("price").value = p.price;
  document.getElementById("location").value = p.location;
  document.getElementById("layout").value = p.layout;
  document.getElementById("description").value = p.description;

  preview.innerHTML = `<h2>画像プレビュー</h2>`;
  if (Array.isArray(p.image)) {
    p.image.forEach((imgSrc) => {
      const img = document.createElement("img");
      img.src = imgSrc;
      img.alt = "物件画像";
      img.style.maxWidth = "200px";
      img.style.marginRight = "10px";
      preview.appendChild(img);
    });
  } else {
    preview.innerHTML += `<img src="${p.image}" alt="物件画像" style="max-width:300px;">`;
  }

  editIndexInput.value = index;
};

// ✅ 削除機能
window.deleteProperty = function (index) {
  if (confirm("この物件を削除しますか？")) {
    const saved = JSON.parse(localStorage.getItem("properties") || "[]");
    saved.splice(index, 1);
    localStorage.setItem("properties", JSON.stringify(saved));
    displayProperties();
  }
};

// ✅ JSON保存
document.getElementById("download-json").addEventListener("click", function () {
  const properties = localStorage.getItem("properties");
  if (!properties || properties === "[]") {
    alert("保存されている物件情報がありません。");
    return;
  }

  const blob = new Blob([properties], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "properties.json";
  a.click();

  URL.revokeObjectURL(url);
});
