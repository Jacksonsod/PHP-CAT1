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
        // Support both schemas: name or first_name/last_name
        $hasName = $conn->query("SHOW COLUMNS FROM users LIKE 'name'");
        $useName = $hasName && $hasName->num_rows > 0; if ($hasName) $hasName->free();
        $sql = $useName
            ? "SELECT user_id AS id, name, email, role, created_at FROM users ORDER BY user_id DESC"
            : "SELECT user_id AS id, CONCAT(IFNULL(first_name,''),' ',IFNULL(last_name,'')) AS name, email, role, created_at FROM users ORDER BY user_id DESC";
        $result = $conn->query($sql);
        $rows = [];
        while ($row = $result->fetch_assoc()) { $rows[] = $row; }
        echo json_encode([ 'success' => true, 'data' => $rows ]);
        exit();
    }

    if ($method === 'POST') {
        $contentType = isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : '';
        $payload = stripos($contentType, 'application/json') !== false
            ? (json_decode(file_get_contents('php://input'), true) ?: [])
            : $_POST;
        $action = $payload['action'] ?? '';

        if ($action === 'create') {
            $name = trim($payload['name'] ?? '');
            $email = trim($payload['email'] ?? '');
            $role = trim($payload['role'] ?? 'guest');
            $password = $payload['password'] ?? 'password12345';
            if ($name === '' || $email === '' || $role === '') { http_response_code(400); echo json_encode(['success'=>false,'message'=>'Name, email and role are required.']); exit(); }
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) { http_response_code(400); echo json_encode(['success'=>false,'message'=>'Invalid email']); exit(); }
            $exists = $conn->prepare("SELECT user_id FROM users WHERE email=?");
            $exists->bind_param('s', $email); $exists->execute(); $exists->store_result();
            if ($exists->num_rows > 0) { http_response_code(409); echo json_encode(['success'=>false,'message'=>'Email already exists']); exit(); }
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $hasName = $conn->query("SHOW COLUMNS FROM users LIKE 'name'");
            $useName = $hasName && $hasName->num_rows > 0; if ($hasName) $hasName->free();
            if ($useName) {
                $stmt = $conn->prepare("INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, NOW())");
                if (!$stmt) { http_response_code(500); echo json_encode(['success'=>false,'message'=>'DB prepare failed','error'=>$conn->error]); exit(); }
                $stmt->bind_param('ssss', $name, $email, $hash, $role);
            } else {
                // Split name best-effort
                $parts = preg_split('/\s+/', $name, 2); $first = $parts[0] ?? ''; $last = $parts[1] ?? '';
                $stmt = $conn->prepare("INSERT INTO users (first_name, last_name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
                if (!$stmt) { http_response_code(500); echo json_encode(['success'=>false,'message'=>'DB prepare failed','error'=>$conn->error]); exit(); }
                $stmt->bind_param('sssss', $first, $last, $email, $hash, $role);
            }
            $ok = $stmt->execute();
            echo json_encode([ 'success' => (bool)$ok, 'id' => $conn->insert_id ]);
            exit();
        }

        if ($action === 'update') {
            $id = intval($payload['id'] ?? 0);
            $name = trim($payload['name'] ?? '');
            $email = trim($payload['email'] ?? '');
            $role = trim($payload['role'] ?? 'guest');
            if ($id <= 0 || $name === '' || $email === '' || $role === '') { http_response_code(400); echo json_encode(['success'=>false,'message'=>'ID, name, email, role required']); exit(); }
            $hasName = $conn->query("SHOW COLUMNS FROM users LIKE 'name'");
            $useName = $hasName && $hasName->num_rows > 0; if ($hasName) $hasName->free();
            if ($useName) {
                $stmt = $conn->prepare("UPDATE users SET name=?, email=?, role=? WHERE user_id=?");
                if (!$stmt) { http_response_code(500); echo json_encode(['success'=>false,'message'=>'DB prepare failed','error'=>$conn->error]); exit(); }
                $stmt->bind_param('sssi', $name, $email, $role, $id);
            } else {
                $parts = preg_split('/\s+/', $name, 2); $first = $parts[0] ?? ''; $last = $parts[1] ?? '';
                $stmt = $conn->prepare("UPDATE users SET first_name=?, last_name=?, email=?, role=? WHERE user_id=?");
                if (!$stmt) { http_response_code(500); echo json_encode(['success'=>false,'message'=>'DB prepare failed','error'=>$conn->error]); exit(); }
                $stmt->bind_param('ssssi', $first, $last, $email, $role, $id);
            }
            $ok = $stmt->execute();
            echo json_encode([ 'success' => (bool)$ok ]);
            exit();
        }

        if ($action === 'delete') {
            $id = intval($payload['id'] ?? 0);
            if ($id <= 0) { http_response_code(400); echo json_encode(['success'=>false,'message'=>'Valid id required']); exit(); }
            $stmt = $conn->prepare("DELETE FROM users WHERE user_id = ?");
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
