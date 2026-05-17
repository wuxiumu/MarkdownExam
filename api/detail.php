<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require __DIR__ . '/parser.php';

$id = isset($_GET['id']) ? trim($_GET['id']) : '';

if (empty($id)) {
    examJson([
        'success' => false,
        'message' => '缺少测试ID'
    ], 400);
}

$filepath = getExamPathById($id);

if (!$filepath) {
    examJson([
        'success' => false,
        'message' => '测试不存在'
    ], 404);
}

$data = parseMarkdownExamFile($filepath);

if (!$data) {
    examJson([
        'success' => false,
        'message' => '解析失败'
    ], 500);
}

echo json_encode([
    'success' => true,
    'data' => $data
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
