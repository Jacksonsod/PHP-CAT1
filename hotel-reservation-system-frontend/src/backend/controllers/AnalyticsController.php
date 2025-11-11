<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

try {
    include "../config/config.php";
    if (function_exists('mysqli_set_charset')) { $conn->set_charset('utf8mb4'); }

    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['success'=>false,'message'=>'Method not allowed']);
        exit();
    }

    // Aggregations for analytics
    $out = [];

    // Revenue last 30 days (payments table)
    $sqlRev = "SELECT DATE(paid_at) AS date, SUM(amount) AS revenue FROM payments WHERE status='paid' GROUP BY DATE(paid_at) ORDER BY DATE(paid_at) DESC LIMIT 30";
    if ($res = $conn->query($sqlRev)) {
        $out['revenue'] = [];
        while ($row = $res->fetch_assoc()) { $out['revenue'][] = $row; }
    } else {
        $out['revenue'] = [];
    }

    // Occupancy by room type (rooms joined with reservations for today)
    $sqlOcc = "SELECT r.type AS room_type, COUNT(DISTINCT r.room_id) AS occupied
               FROM rooms r
               JOIN reservations rs ON rs.room_id = r.room_id AND CURDATE() BETWEEN rs.check_in_date AND DATE_SUB(rs.check_out_date, INTERVAL 1 DAY)
               GROUP BY r.type";
    if ($res = $conn->query($sqlOcc)) {
        $out['occupancyByType'] = [];
        while ($row = $res->fetch_assoc()) { $out['occupancyByType'][] = $row; }
    } else { $out['occupancyByType'] = []; }

    // Booking sources (stubbed unless source exists)
    $out['bookingSources'] = [];

    echo json_encode(['success'=>true,'data'=>$out]);
    exit();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'Server error','error'=>$e->getMessage()]);
    exit();
}
