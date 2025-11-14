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
        // List reservations with guest name and room number
        // Support users schema with either name or first_name/last_name
        $hasName = $conn->query("SHOW COLUMNS FROM users LIKE 'name'");
        $useName = $hasName && $hasName->num_rows > 0; if ($hasName) $hasName->free();
        $guestExpr = $useName ? "u.name" : "CONCAT(IFNULL(u.first_name,''),' ',IFNULL(u.last_name,''))";
        $sql = "SELECT r.reservation_id AS id, $guestExpr AS guest, rm.room_number AS room, 
                       r.check_in_date AS checkIn, r.check_out_date AS checkOut, r.status, r.total_price
                FROM reservations r
                JOIN users u ON u.user_id = r.user_id
                JOIN rooms rm ON rm.room_id = r.room_id
                ORDER BY r.reservation_id DESC";
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

        // Helper to resolve user by email or name
        $resolveUserId = function($payload) use ($conn) {
            $userId = intval($payload['user_id'] ?? 0);
            if ($userId > 0) return $userId;
            $email = trim($payload['email'] ?? '');
            if ($email !== '') {
                $st = $conn->prepare("SELECT user_id FROM users WHERE email=? LIMIT 1");
                $st->bind_param('s', $email); $st->execute(); $res = $st->get_result();
                if ($row = $res->fetch_assoc()) return intval($row['user_id']);
            }
            $name = trim($payload['guest'] ?? '');
            if ($name !== '') {
                // Try match name or first+last concat
                $hasName = $conn->query("SHOW COLUMNS FROM users LIKE 'name'");
                $useName = $hasName && $hasName->num_rows > 0; if ($hasName) $hasName->free();
                if ($useName) {
                    $st = $conn->prepare("SELECT user_id FROM users WHERE name=? LIMIT 1");
                    $st->bind_param('s', $name);
                } else {
                    $parts = preg_split('/\s+/', $name, 2); $first = $parts[0] ?? ''; $last = $parts[1] ?? '';
                    $st = $conn->prepare("SELECT user_id FROM users WHERE first_name=? AND last_name=? LIMIT 1");
                    $st->bind_param('ss', $first, $last);
                }
                $st->execute(); $res = $st->get_result();
                if ($row = $res->fetch_assoc()) return intval($row['user_id']);
            }
            return 0;
        };

        // Helper to resolve room by id or number
        $resolveRoomId = function($payload) use ($conn) {
            $roomId = intval($payload['room_id'] ?? 0);
            if ($roomId > 0) return $roomId;
            $number = trim($payload['room'] ?? '');
            if ($number !== '') {
                $st = $conn->prepare("SELECT room_id FROM rooms WHERE room_number=? LIMIT 1");
                $st->bind_param('s', $number); $st->execute(); $res = $st->get_result();
                if ($row = $res->fetch_assoc()) return intval($row['room_id']);
            }
            return 0;
        };

        if ($action === 'create') {
            $uid = $resolveUserId($payload);
            $rid = $resolveRoomId($payload);
            $checkIn = $payload['checkIn'] ?? '';
            $checkOut = $payload['checkOut'] ?? '';
            $status = $payload['status'] ?? 'pending';
            if ($uid <= 0 || $rid <= 0 || $checkIn === '' || $checkOut === '') { http_response_code(400); echo json_encode(['success'=>false,'message'=>'User/Room and dates required']); exit(); }

            // Ensure room is currently available (not cleaning/maintenance/etc.)
            $roomStatusStmt = $conn->prepare("SELECT status FROM rooms WHERE room_id = ? LIMIT 1");
            if (!$roomStatusStmt) { http_response_code(500); echo json_encode(['success'=>false,'message'=>'DB prepare failed','error'=>$conn->error]); exit(); }
            $roomStatusStmt->bind_param('i', $rid);
            $roomStatusStmt->execute();
            $roomRes = $roomStatusStmt->get_result();
            $roomRow = $roomRes->fetch_assoc();
            if (!$roomRow || strtolower($roomRow['status']) !== 'available') {
                http_response_code(400);
                echo json_encode(['success'=>false,'message'=>'Selected room is not available']);
                exit();
            }

            // Prevent double booking for overlapping dates (pending/confirmed/checked_in)
            $overlapStmt = $conn->prepare("SELECT COUNT(*) AS cnt FROM reservations WHERE room_id = ? AND status IN ('pending','confirmed','checked_in') AND NOT (check_out_date <= ? OR check_in_date >= ?)");
            if (!$overlapStmt) { http_response_code(500); echo json_encode(['success'=>false,'message'=>'DB prepare failed','error'=>$conn->error]); exit(); }
            $overlapStmt->bind_param('iss', $rid, $checkIn, $checkOut);
            $overlapStmt->execute();
            $overlapRes = $overlapStmt->get_result();
            $overlapRow = $overlapRes->fetch_assoc();
            if ($overlapRow && intval($overlapRow['cnt']) > 0) {
                http_response_code(409);
                echo json_encode(['success'=>false,'message'=>'Room already booked for the selected dates']);
                exit();
            }

            $stmt = $conn->prepare("INSERT INTO reservations (user_id, room_id, check_in_date, check_out_date, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
            if (!$stmt) { http_response_code(500); echo json_encode(['success'=>false,'message'=>'DB prepare failed','error'=>$conn->error]); exit(); }
            $stmt->bind_param('iisss', $uid, $rid, $checkIn, $checkOut, $status);
            $ok = $stmt->execute();
            echo json_encode([ 'success' => (bool)$ok, 'id' => $conn->insert_id ]);
            exit();
        }

        if ($action === 'update') {
            $id = intval($payload['id'] ?? 0);
            $uid = $resolveUserId($payload);
            $rid = $resolveRoomId($payload);
            $checkIn = $payload['checkIn'] ?? '';
            $checkOut = $payload['checkOut'] ?? '';
            $status = $payload['status'] ?? 'pending';
            if ($id <= 0 || $uid <= 0 || $rid <= 0 || $checkIn === '' || $checkOut === '') { http_response_code(400); echo json_encode(['success'=>false,'message'=>'ID, User/Room and dates required']); exit(); }

            // Ensure room is currently available when updating reservation
            $roomStatusStmt = $conn->prepare("SELECT status FROM rooms WHERE room_id = ? LIMIT 1");
            if (!$roomStatusStmt) { http_response_code(500); echo json_encode(['success'=>false,'message'=>'DB prepare failed','error'=>$conn->error]); exit(); }
            $roomStatusStmt->bind_param('i', $rid);
            $roomStatusStmt->execute();
            $roomRes = $roomStatusStmt->get_result();
            $roomRow = $roomRes->fetch_assoc();
            if (!$roomRow || strtolower($roomRow['status']) !== 'available') {
                http_response_code(400);
                echo json_encode(['success'=>false,'message'=>'Selected room is not available']);
                exit();
            }

            // Prevent double booking for overlapping dates, excluding this reservation itself
            $overlapStmt = $conn->prepare("SELECT COUNT(*) AS cnt FROM reservations WHERE room_id = ? AND reservation_id <> ? AND status IN ('pending','confirmed','checked_in') AND NOT (check_out_date <= ? OR check_in_date >= ?)");
            if (!$overlapStmt) { http_response_code(500); echo json_encode(['success'=>false,'message'=>'DB prepare failed','error'=>$conn->error]); exit(); }
            $overlapStmt->bind_param('iiss', $rid, $id, $checkIn, $checkOut);
            $overlapStmt->execute();
            $overlapRes = $overlapStmt->get_result();
            $overlapRow = $overlapRes->fetch_assoc();
            if ($overlapRow && intval($overlapRow['cnt']) > 0) {
                http_response_code(409);
                echo json_encode(['success'=>false,'message'=>'Room already booked for the selected dates']);
                exit();
            }

            $stmt = $conn->prepare("UPDATE reservations SET user_id=?, room_id=?, check_in_date=?, check_out_date=?, status=? WHERE reservation_id=?");
            if (!$stmt) { http_response_code(500); echo json_encode(['success'=>false,'message'=>'DB prepare failed','error'=>$conn->error]); exit(); }
            $stmt->bind_param('iisssi', $uid, $rid, $checkIn, $checkOut, $status, $id);
            $ok = $stmt->execute();
            echo json_encode([ 'success' => (bool)$ok ]);
            exit();
        }

        if ($action === 'delete') {
            $id = intval($payload['id'] ?? 0);
            if ($id <= 0) { http_response_code(400); echo json_encode(['success'=>false,'message'=>'Valid id required']); exit(); }
            $stmt = $conn->prepare("DELETE FROM reservations WHERE reservation_id = ?");
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
