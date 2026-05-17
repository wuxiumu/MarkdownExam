<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$config = require __DIR__ . '/config.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($action === 'engines') {
    echo json_encode([
        'success' => true,
        'data' => $config['search_engines']
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid action'
    ]);
}