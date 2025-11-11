<?php
$host = 'localhost';
$db = 'hotel_reservation';
$user = 'root';
$pass = '';

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed.',
        'error' => $conn->connect_error
    ]);
    exit();
}
?>
