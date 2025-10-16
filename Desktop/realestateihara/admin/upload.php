from flask import Flask, request, render_template_string
from werkzeug.utils import secure_filename
import os
import json

app = Flask(__name__)
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')  # 絶対パスに変更
DATA_FILE = os.path.join(os.path.dirname(__file__), 'data.json')

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
        save_path = os.path.join(UPLOAD_FOLDER, filename)
        image.save(save_path)

        print(f"画像を保存しました: {os.path.abspath(save_path)}")  # ← 保存先を表示！

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

        return f"{name} を登録しました！"
    return "登録できませんでした。すべての項目を入力してください。"

if __name__ == '__main__':
    app.run(debug=True, port=5500)

