<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['success'=>false,'message'=>'Method not allowed']);
        exit();
    }

    include "../config/config.php";
    if (function_exists('mysqli_set_charset')) { $conn->set_charset('utf8mb4'); }

    // Identify guest by email (preferred) or user_id
    $email = isset($_GET['email']) ? trim($_GET['email']) : '';
    $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

    if (!$email && $userId <= 0) {
        http_response_code(400);
        echo json_encode(['success'=>false,'message'=>'email or user_id is required']);
        exit();
    }

    if ($email && $userId <= 0) {
        $stmt = $conn->prepare("SELECT user_id FROM users WHERE email=? LIMIT 1");
        if (!$stmt) { http_response_code(500); echo json_encode(['success'=>false,'message'=>'DB prepare failed','error'=>$conn->error]); exit(); }
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $res = $stmt->get_result();
        if ($row = $res->fetch_assoc()) { $userId = intval($row['user_id']); }
        $stmt->close();
        if ($userId <= 0) { http_response_code(404); echo json_encode(['success'=>false,'message'=>'User not found']); exit(); }
    }

    // Upcoming reservations (check_in_date > today)
    $sqlUpcoming = "SELECT r.reservation_id AS id, h.name AS hotel, rm.room_number AS room,
                           r.check_in_date AS checkIn, r.check_out_date AS checkOut, r.status
                    FROM reservations r
                    JOIN rooms rm ON rm.room_id = r.room_id
                    JOIN hotels h ON h.hotel_id = rm.hotel_id
                    WHERE r.user_id = ? AND r.check_in_date > CURDATE()
                    ORDER BY r.check_in_date ASC LIMIT 20";
    $upcoming = [];
    $stmt = $conn->prepare($sqlUpcoming);
    if ($stmt) {
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $res = $stmt->get_result();
        while ($row = $res->fetch_assoc()) { $upcoming[] = $row; }
        $stmt->close();
    }

    // Current stay (check_in_date <= today < check_out_date)
    $sqlCurrent = "SELECT r.reservation_id AS id, h.name AS hotel, rm.room_number AS room,
                          r.check_in_date AS checkIn, r.check_out_date AS checkOut, r.status
                   FROM reservations r
                   JOIN rooms rm ON rm.room_id = r.room_id
                   JOIN hotels h ON h.hotel_id = rm.hotel_id
                   WHERE r.user_id = ? AND CURDATE() >= r.check_in_date AND CURDATE() < r.check_out_date
                   ORDER BY r.check_in_date DESC LIMIT 1";
    $current = null;
    $stmt = $conn->prepare($sqlCurrent);
    if ($stmt) {
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $res = $stmt->get_result();
        if ($row = $res->fetch_assoc()) { $current = $row; }
        $stmt->close();
    }

    // Booking history (past stays)
    $sqlHistory = "SELECT r.reservation_id AS id, h.name AS hotel, rm.room_number AS room,
                          r.check_in_date AS checkIn, r.check_out_date AS checkOut, r.status
                   FROM reservations r
                   JOIN rooms rm ON rm.room_id = r.room_id
                   JOIN hotels h ON h.hotel_id = rm.hotel_id
                   WHERE r.user_id = ? AND r.check_out_date <= CURDATE()
                   ORDER BY r.check_out_date DESC LIMIT 50";
    $history = [];
    $stmt = $conn->prepare($sqlHistory);
    if ($stmt) {
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $res = $stmt->get_result();
        while ($row = $res->fetch_assoc()) { $history[] = $row; }
        $stmt->close();
    }

    // Loyalty points (if loyalty table exists)
    $points = 0; $tier = 'Bronze';
    $hasL = $conn->query("SHOW TABLES LIKE 'loyalty_accounts'");
    if ($hasL && $hasL->num_rows > 0) {
        $hasL->free();
        $stmt = $conn->prepare("SELECT points, tier FROM loyalty_accounts WHERE user_id=?");
        if ($stmt) { $stmt->bind_param('i', $userId); $stmt->execute(); $res = $stmt->get_result(); if ($row=$res->fetch_assoc()){ $points=intval($row['points']); $tier=$row['tier']; } $stmt->close(); }
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'upcoming' => $upcoming,
            'current' => $current,
            'history' => $history,
            'loyalty' => [ 'points' => $points, 'tier' => $tier ]
        ]
    ]);
    exit();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'Server error','error'=>$e->getMessage()]);
    exit();
}
