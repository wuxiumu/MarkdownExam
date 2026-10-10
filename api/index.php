<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$config = require __DIR__ . '/config.php';
require __DIR__ . '/parser.php';

$keyword = isset($_GET['keyword']) ? trim($_GET['keyword']) : '';
$adminKeyword = isset($config['admin_keyword']) ? (string) $config['admin_keyword'] : '';
$adminRedirect = isset($config['admin_redirect']) ? (string) $config['admin_redirect'] : '/admin/index.php';

if ($adminKeyword !== '' && hash_equals($adminKeyword, $keyword)) {
    echo json_encode([
        'success' => true,
        'redirect' => $adminRedirect !== '' ? $adminRedirect : '/admin/index.php',
        'message' => '跳转到管理后台'
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$exams = listExamSummaries($keyword);

echo json_encode([
    'success' => true,
    'data' => $exams,
    'total' => count($exams)
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
