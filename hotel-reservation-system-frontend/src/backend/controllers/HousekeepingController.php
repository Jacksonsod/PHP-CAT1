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

    // Pending tasks: dirty or maintenance rooms
    $pending = 0; $dirty = 0; $maint = 0;
    if ($res = $conn->query("SELECT SUM(status='dirty') AS dirty, SUM(status='maintenance') AS maint FROM rooms")) {
        $row = $res->fetch_assoc();
        $dirty = intval($row['dirty']);
        $maint = intval($row['maint']);
        $pending = $dirty + $maint;
    }

    // Rooms cleaned today (from room_status_logs if exists, else fall back to rooms updated today to available)
    $hasLog = $conn->query("SHOW TABLES LIKE 'room_status_logs'");
    $cleanedToday = 0;
    if ($hasLog && $hasLog->num_rows > 0) {
        $hasLog->free();
        $sql = "SELECT COUNT(*) AS c FROM room_status_logs WHERE status='available' AND DATE(changed_at)=CURDATE()";
        if ($res = $conn->query($sql)) { $row = $res->fetch_assoc(); $cleanedToday = intval($row['c']); }
    } else {
        // Fallback heuristic: rooms currently available with any check-out today
        $sql = "SELECT COUNT(DISTINCT rm.room_id) AS c
                FROM rooms rm
                JOIN reservations r ON r.room_id = rm.room_id AND r.check_out_date = CURDATE()
                WHERE rm.status='available'";
        if ($res = $conn->query($sql)) { $row = $res->fetch_assoc(); $cleanedToday = intval($row['c']); }
    }

    // Efficiency metric: cleanedToday / (dirty + cleanedToday) as percentage
    $den = ($dirty + $cleanedToday);
    $eff = $den > 0 ? round(($cleanedToday / $den) * 100) : 0;

    echo json_encode([
        'success' => true,
        'data' => [
            'pendingTasks' => $pending,
            'dirty' => $dirty,
            'maintenance' => $maint,
            'cleanedToday' => $cleanedToday,
            'efficiency' => $eff
        ]
    ]);
    exit();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'Server error','error'=>$e->getMessage()]);
    exit();
}
