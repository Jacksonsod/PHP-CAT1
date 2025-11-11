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
        // Today's arrivals: reservations to be checked in today
        $hasName = $conn->query("SHOW COLUMNS FROM users LIKE 'name'");
        $useName = $hasName && $hasName->num_rows > 0; if ($hasName) $hasName->free();
        $guestExpr = $useName ? "u.name" : "CONCAT(IFNULL(u.first_name,''),' ',IFNULL(u.last_name,''))";
        $sql = "SELECT r.reservation_id AS id, 
                       $guestExpr AS guest,
                       rm.room_number AS room,
                       r.check_in_date AS checkIn,
                       r.status
                FROM reservations r
                JOIN users u ON u.user_id = r.user_id
                JOIN rooms rm ON rm.room_id = r.room_id
                WHERE r.check_in_date = CURDATE() AND r.status IN ('pending','confirmed')
                ORDER BY r.reservation_id DESC";
        $result = $conn->query($sql);
        $rows = [];
        while ($row = $result->fetch_assoc()) { $rows[] = $row; }
        echo json_encode([ 'success' => true, 'data' => $rows ]);
        exit();
    }

    if ($method === 'POST') {
        $payload = (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false)
            ? (json_decode(file_get_contents('php://input'), true) ?: [])
            : $_POST;
        $action = $payload['action'] ?? '';

        if ($action === 'checkin') {
            $reservationId = intval($payload['reservation_id'] ?? 0);
            $staff = intval($payload['staff_user_id'] ?? 0) ?: null;
            if ($reservationId <= 0) { http_response_code(400); echo json_encode(['success'=>false,'message'=>'reservation_id required']); exit(); }

            // Insert into check_ins and update reservation status
            $stmt = $conn->prepare("INSERT INTO check_ins (reservation_id, staff_user_id, check_in_at) VALUES (?, ?, NOW())");
            if (!$stmt) { http_response_code(500); echo json_encode(['success'=>false,'message'=>'DB prepare failed','error'=>$conn->error]); exit(); }
            if ($staff !== null) { $stmt->bind_param('ii', $reservationId, $staff); } else { $null = null; $stmt->bind_param('ii', $reservationId, $null); }
            $ok1 = $stmt->execute();

            $stmt2 = $conn->prepare("UPDATE reservations SET status='checked_in' WHERE reservation_id=?");
            if (!$stmt2) { http_response_code(500); echo json_encode(['success'=>false,'message'=>'DB prepare failed','error'=>$conn->error]); exit(); }
            $stmt2->bind_param('i', $reservationId);
            $ok2 = $stmt2->execute();

            echo json_encode(['success' => (bool)($ok1 && $ok2)]);
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
