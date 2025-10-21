from flask import Flask, request, render_template_string
import os

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/')
def index():
    with open('admin.html', encoding='utf-8') as f:
        return render_template_string(f.read())

@app.route('/upload', methods=['POST'])
def upload():
    image = request.files['property_image']
    name = request.form['property_name']
    if image and name:
        image.save(os.path.join(UPLOAD_FOLDER, f"{name}.jpg"))
        return f"{name} を登録しました！"
    return "登録できませんでした。すべての項目を入力してください。"

if __name__ == '__main__':
    app.run(debug=True, port=5500)
