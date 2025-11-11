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
        // List all rooms with hotel name
        $sql = "SELECT r.room_id AS id, h.name AS hotel, r.room_number AS number, r.type, r.price, r.status
                FROM rooms r JOIN hotels h ON h.hotel_id = r.hotel_id
                ORDER BY r.room_id DESC";
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
            $hotelId = intval($payload['hotel_id'] ?? 0);
            if ($hotelId <= 0) {
                $hotelName = trim($payload['hotel'] ?? '');
                if ($hotelName !== '') {
                    $stmtH = $conn->prepare("SELECT hotel_id FROM hotels WHERE name = ? LIMIT 1");
                    $stmtH->bind_param('s', $hotelName);
                    $stmtH->execute();
                    $resH = $stmtH->get_result();
                    if ($rowH = $resH->fetch_assoc()) { $hotelId = intval($rowH['hotel_id']); }
                }
            }
            $number = trim($payload['number'] ?? '');
            $type = trim($payload['type'] ?? 'Standard');
            $price = floatval($payload['price'] ?? 0);
            $status = trim($payload['status'] ?? 'available');
            if ($hotelId <= 0 || $number === '') { http_response_code(400); echo json_encode(['success'=>false,'message'=>'Hotel and room number required']); exit(); }
            $stmt = $conn->prepare("INSERT INTO rooms (hotel_id, room_number, type, price, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
            if (!$stmt) { http_response_code(500); echo json_encode(['success'=>false,'message'=>'DB prepare failed','error'=>$conn->error]); exit(); }
            $stmt->bind_param('issds', $hotelId, $number, $type, $price, $status);
            $ok = $stmt->execute();
            echo json_encode([ 'success' => (bool)$ok, 'id' => $conn->insert_id ]);
            exit();
        }

        if ($action === 'update') {
            $id = intval($payload['id'] ?? 0);
            $hotelId = intval($payload['hotel_id'] ?? 0);
            if ($hotelId <= 0) {
                $hotelName = trim($payload['hotel'] ?? '');
                if ($hotelName !== '') {
                    $stmtH = $conn->prepare("SELECT hotel_id FROM hotels WHERE name = ? LIMIT 1");
                    $stmtH->bind_param('s', $hotelName);
                    $stmtH->execute();
                    $resH = $stmtH->get_result();
                    if ($rowH = $resH->fetch_assoc()) { $hotelId = intval($rowH['hotel_id']); }
                }
            }
            $number = trim($payload['number'] ?? '');
            $type = trim($payload['type'] ?? 'Standard');
            $price = floatval($payload['price'] ?? 0);
            $status = trim($payload['status'] ?? 'available');
            if ($id <= 0 || $hotelId <= 0 || $number === '') { http_response_code(400); echo json_encode(['success'=>false,'message'=>'ID, Hotel and room number required']); exit(); }
            $stmt = $conn->prepare("UPDATE rooms SET hotel_id=?, room_number=?, type=?, price=?, status=? WHERE room_id=?");
            if (!$stmt) { http_response_code(500); echo json_encode(['success'=>false,'message'=>'DB prepare failed','error'=>$conn->error]); exit(); }
            $stmt->bind_param('issdsi', $hotelId, $number, $type, $price, $status, $id);
            $ok = $stmt->execute();
            echo json_encode([ 'success' => (bool)$ok ]);
            exit();
        }

        if ($action === 'delete') {
            $id = intval($payload['id'] ?? 0);
            if ($id <= 0) { http_response_code(400); echo json_encode(['success'=>false,'message'=>'Valid id required']); exit(); }
            $stmt = $conn->prepare("DELETE FROM rooms WHERE room_id = ?");
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
