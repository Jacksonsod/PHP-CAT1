<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

try {
    include "../config/config.php";
    if (function_exists('mysqli_set_charset')) { $conn->set_charset('utf8mb4'); }

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        // List all hotels
        $result = $conn->query("SELECT hotel_id AS id, name, location, description, created_at FROM hotels ORDER BY hotel_id DESC");
        $rows = [];
        while ($row = $result->fetch_assoc()) { $rows[] = $row; }
        echo json_encode([ 'success' => true, 'data' => $rows ]);
        exit();
    }

    if ($method === 'POST') {
        // Parse form-encoded or JSON
        $contentType = isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : '';
        if (stripos($contentType, 'application/json') !== false) {
            $payload = json_decode(file_get_contents('php://input'), true) ?: [];
        } else {
            $payload = $_POST;
        }
        $action = isset($payload['action']) ? $payload['action'] : '';

        if ($action === 'create') {
            $name = trim($payload['name'] ?? '');
            $location = trim($payload['location'] ?? '');
            $description = trim($payload['description'] ?? '');
            if ($name === '' || $location === '') {
                http_response_code(400);
                echo json_encode([ 'success' => false, 'message' => 'Name and location are required.' ]);
                exit();
            }
            $stmt = $conn->prepare("INSERT INTO hotels (name, location, description, created_at) VALUES (?, ?, ?, NOW())");
            if (!$stmt) { http_response_code(500); echo json_encode(['success'=>false,'message'=>'DB prepare failed','error'=>$conn->error]); exit(); }
            $stmt->bind_param('sss', $name, $location, $description);
            $ok = $stmt->execute();
            if ($ok) {
                echo json_encode([ 'success' => true, 'id' => $conn->insert_id ]);
            } else {
                http_response_code(500);
                echo json_encode([ 'success' => false, 'message' => 'Insert failed', 'error' => $stmt->error ]);
            }
            exit();
        }

        if ($action === 'update') {
            $id = intval($payload['id'] ?? 0);
            $name = trim($payload['name'] ?? '');
            $location = trim($payload['location'] ?? '');
            $description = trim($payload['description'] ?? '');
            if ($id <= 0 || $name === '' || $location === '') {
                http_response_code(400);
                echo json_encode([ 'success' => false, 'message' => 'ID, name and location are required.' ]);
                exit();
            }
            $stmt = $conn->prepare("UPDATE hotels SET name = ?, location = ?, description = ? WHERE hotel_id = ?");
            if (!$stmt) { http_response_code(500); echo json_encode(['success'=>false,'message'=>'DB prepare failed','error'=>$conn->error]); exit(); }
            $stmt->bind_param('sssi', $name, $location, $description, $id);
            $ok = $stmt->execute();
            echo json_encode([ 'success' => (bool)$ok ]);
            exit();
        }

        if ($action === 'delete') {
            $id = intval($payload['id'] ?? 0);
            if ($id <= 0) { http_response_code(400); echo json_encode(['success'=>false,'message'=>'Valid id required']); exit(); }
            $stmt = $conn->prepare("DELETE FROM hotels WHERE hotel_id = ?");
            if (!$stmt) { http_response_code(500); echo json_encode(['success'=>false,'message'=>'DB prepare failed','error'=>$conn->error]); exit(); }
            $stmt->bind_param('i', $id);
            $ok = $stmt->execute();
            echo json_encode([ 'success' => (bool)$ok ]);
            exit();
        }

        http_response_code(400);
        echo json_encode([ 'success' => false, 'message' => 'Unknown action' ]);
        exit();
    }

    http_response_code(405);
    echo json_encode([ 'success' => false, 'message' => 'Method not allowed' ]);
    exit();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([ 'success' => false, 'message' => 'Server error', 'error' => $e->getMessage() ]);
    exit();
}
