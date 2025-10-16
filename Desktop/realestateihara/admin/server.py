from flask import Flask, request, render_template_string
from werkzeug.utils import secure_filename
import os
import json

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
DATA_FILE = 'data.json'

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/')
def index():
    with open('admin.html', encoding='utf-8') as f:
        return render_template_string(f.read())

@app.route('/upload', methods=['POST'])
def upload():
    image = request.files.get('property_image')
    name = request.form.get('property_name')
    rent = request.form.get('property_rent')
    location = request.form.get('property_location')
    layout = request.form.get('property_layout')
    description = request.form.get('property_description')

    if image and name:
        ext = os.path.splitext(image.filename)[1]
        filename = secure_filename(f"{name}{ext}")
        image_path = os.path.join(UPLOAD_FOLDER, filename)
        image.save(image_path)

        # JSONに保存
        property_data = {
            "name": name,
            "rent": rent,
            "location": location,
            "layout": layout,
            "description": description,
            "image": filename
        }

        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, encoding='utf-8') as f:
                data = json.load(f)
        else:
            data = []

        # 同名の物件があれば置き換え
        data = [p for p in data if p['name'] != name]
        data.append(property_data)

        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        # 絶対パスを取得
        abs_image_path = os.path.abspath(image_path)
        abs_data_path = os.path.abspath(DATA_FILE)

        return (
            f"{name} を登録しました！<br>"
            f"画像保存先: {abs_image_path}<br>"
            f"データ保存先: {abs_data_path}"
        )

    return "登録できませんでした。すべての項目を入力してください。"

if __name__ == '__main__':
    app.run(debug=True, port=5500)

