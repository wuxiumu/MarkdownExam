<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

echo json_encode([
    'code' => 0,
    'message' => 'ok',
    'data' => [
        'php' => PHP_VERSION,
        'time' => date('Y-m-d H:i:s')
    ]
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
