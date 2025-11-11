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

    // Arrivals today: reservations expected to check-in today (pending/confirmed)
    $sqlArr = "SELECT COUNT(*) AS c FROM reservations WHERE check_in_date = CURDATE() AND status IN ('pending','confirmed')";
    $arrivals = 0; if ($res = $conn->query($sqlArr)) { $row = $res->fetch_assoc(); $arrivals = intval($row['c']); }

    // Departures today: reservations expected to check-out today (checked_in/confirmed)
    $sqlDep = "SELECT COUNT(*) AS c FROM reservations WHERE check_out_date = CURDATE() AND status IN ('checked_in','confirmed')";
    $departures = 0; if ($res = $conn->query($sqlDep)) { $row = $res->fetch_assoc(); $departures = intval($row['c']); }

    // Occupancy today: rooms with a reservation overlapping today
    $sqlTotRooms = "SELECT COUNT(*) AS c FROM rooms"; $totalRooms = 0;
    if ($res = $conn->query($sqlTotRooms)) { $row = $res->fetch_assoc(); $totalRooms = intval($row['c']); }

    $sqlOcc = "SELECT COUNT(DISTINCT r.room_id) AS c
               FROM reservations r
               WHERE CURDATE() >= r.check_in_date AND CURDATE() < r.check_out_date AND r.status IN ('checked_in','confirmed')";
    $occupiedRooms = 0; if ($res = $conn->query($sqlOcc)) { $row = $res->fetch_assoc(); $occupiedRooms = intval($row['c']); }

    $occupancy = $totalRooms > 0 ? round(($occupiedRooms / $totalRooms) * 100) : 0;

    echo json_encode([
        'success' => true,
        'data' => [
            'arrivals' => $arrivals,
            'departures' => $departures,
            'occupancy' => $occupancy,
            'occupiedRooms' => $occupiedRooms,
            'totalRooms' => $totalRooms
        ]
    ]);
    exit();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'Server error','error'=>$e->getMessage()]);
    exit();
}
