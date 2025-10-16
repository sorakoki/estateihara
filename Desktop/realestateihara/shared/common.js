export function getImagePath(propertyName, fileName) {
  return `../realestateihara/img/data/${fileName}`;
}

export function updateFileInput(files, inputElement) {
  const dataTransfer = new DataTransfer();
  files.forEach(file => dataTransfer.items.add(file));
  inputElement.files = dataTransfer.files;
}

export function createImagePreview(file, previewArea, onRemove) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const container = document.createElement("div");
    container.style.position = "relative";
    container.style.display = "inline-block";
    container.style.margin = "10px";

    const img = document.createElement("img");
    img.src = e.target.result;
    img.alt = file.name;
    img.style.maxWidth = "200px";
    img.style.display = "block";

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "削除";
    removeBtn.style.position = "absolute";
    removeBtn.style.top = "5px";
    removeBtn.style.right = "5px";
    removeBtn.style.background = "rgba(255,0,0,0.7)";
    removeBtn.style.color = "white";
    removeBtn.style.border = "none";
    removeBtn.style.cursor = "pointer";
    removeBtn.addEventListener("click", onRemove);

    container.appendChild(img);
    container.appendChild(removeBtn);
    previewArea.appendChild(container);
  };
  reader.readAsDataURL(file);
}
