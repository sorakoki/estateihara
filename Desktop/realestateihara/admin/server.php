<?php
$uploadFolder = '../uploads/';
$dataFile = '../data.json';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = $_POST['property_name'] ?? '';
    $price = $_POST['price'] ?? '';
    $location = $_POST['location'] ?? '';
    $layout = $_POST['layout'] ?? '';
    $description = $_POST['description'] ?? '';
    $images = $_FILES['property_image'] ?? [];

    if ($name && !empty($images['name'][0])) {
        $propertyFolder = $uploadFolder . $name . '/';
        if (!file_exists($propertyFolder)) {
            mkdir($propertyFolder, 0777, true);
        }

        $imagePaths = [];
        foreach ($images['tmp_name'] as $i => $tmpName) {
            $ext = pathinfo($images['name'][$i], PATHINFO_EXTENSION);
            $imagePath = $propertyFolder . "image_$i." . $ext;
            if (move_uploaded_file($tmpName, $imagePath)) {
                $imagePaths[] = $imagePath;
            }
        }

        $propertyData = [
            "name" => $name,
            "price" => $price,
            "location" => $location,
            "layout" => $layout,
            "description" => $description,
            "images" => $imagePaths
        ];

        $data = [];
        if (file_exists($dataFile)) {
            $json = file_get_contents($dataFile);
            $decoded = json_decode($json, true);
            if (is_array($decoded)) {
                $data = $decoded;
            }
        }

        $data[] = $propertyData;
        $result = file_put_contents($dataFile, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

        if ($result === false) {
            echo "⚠️ データの保存に失敗しました。";
        } else {
            echo "<h2>✅ {$name} を登録しました！（" . count($imagePaths) . " 枚の画像を保存）</h2>";
        }
    } else {
        echo "⚠️ 登録できませんでした。すべての項目を入力してください。";
    }
}
?>



