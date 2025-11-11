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
        // Return all rooms with status and hotel
        $sql = "SELECT r.room_id AS id, r.room_number AS number, r.type, r.status, h.name AS hotel
                FROM rooms r JOIN hotels h ON h.hotel_id = r.hotel_id
                ORDER BY h.name ASC, r.room_number ASC";
        $res = $conn->query($sql);
        $rows = [];
        while ($row = $res->fetch_assoc()) { $rows[] = $row; }
        echo json_encode(['success'=>true, 'data'=>$rows]);
        exit();
    }

    if ($method === 'POST') {
        $payload = (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false)
            ? (json_decode(file_get_contents('php://input'), true) ?: [])
            : $_POST;
        $action = $payload['action'] ?? '';

        if ($action === 'update_status') {
            $id = intval($payload['id'] ?? 0);
            $status = trim($payload['status'] ?? 'available');
            if ($id <= 0) { http_response_code(400); echo json_encode(['success'=>false,'message'=>'Valid id required']); exit(); }
            $stmt = $conn->prepare("UPDATE rooms SET status=? WHERE room_id=?");
            if (!$stmt) { http_response_code(500); echo json_encode(['success'=>false,'message'=>'DB prepare failed','error'=>$conn->error]); exit(); }
            $stmt->bind_param('si', $status, $id);
            $ok = $stmt->execute();
            echo json_encode(['success'=>(bool)$ok]);
            exit();
        }

        http_response_code(400);
        echo json_encode(['success'=>false,'message'=>'Unknown action']);
        exit();
    }

    http_response_code(405);
    echo json_encode(['success'=>false,'message'=>'Method not allowed']);
    exit();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'Server error','error'=>$e->getMessage()]);
    exit();
}
