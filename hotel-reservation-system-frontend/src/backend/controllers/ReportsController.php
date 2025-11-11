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

    $report = isset($_GET['report']) ? $_GET['report'] : '';

    if ($report === 'daily_occupancy') {
        // Requires view v_daily_occupancy
        $limit = 30;
        $sql = "SELECT date, hotel_id, hotel_name, occupied_rooms FROM v_daily_occupancy ORDER BY date DESC, hotel_id ASC LIMIT ?";
        $stmt = $conn->prepare($sql);
        if (!$stmt) { http_response_code(500); echo json_encode(['success'=>false,'message'=>'DB prepare failed','error'=>$conn->error]); exit(); }
        $stmt->bind_param('i', $limit);
        $stmt->execute();
        $res = $stmt->get_result();
        $rows = [];
        while ($row = $res->fetch_assoc()) { $rows[] = $row; }
        echo json_encode(['success'=>true,'data'=>$rows]);
        exit();
    }

    if ($report === 'revenue_by_day') {
        // Requires view v_revenue_by_day
        $limit = 30;
        $sql = "SELECT date, total_revenue FROM v_revenue_by_day ORDER BY date DESC LIMIT ?";
        $stmt = $conn->prepare($sql);
        if (!$stmt) { http_response_code(500); echo json_encode(['success'=>false,'message'=>'DB prepare failed','error'=>$conn->error]); exit(); }
        $stmt->bind_param('i', $limit);
        $stmt->execute();
        $res = $stmt->get_result();
        $rows = [];
        while ($row = $res->fetch_assoc()) { $rows[] = $row; }
        echo json_encode(['success'=>true,'data'=>$rows]);
        exit();
    }

    http_response_code(400);
    echo json_encode(['success'=>false,'message'=>'Unknown report']);
    exit();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'Server error','error'=>$e->getMessage()]);
    exit();
}
