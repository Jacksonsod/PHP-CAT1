<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Method not allowed."]);
        exit();
    }

    if (!isset($_GET['token']) || empty($_GET['token'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Missing verification token."]);
        exit();
    }

    $token = $_GET['token'];

    include "../config/config.php";
    if (function_exists('mysqli_set_charset')) { $conn->set_charset('utf8mb4'); }

    // Check for required columns
    $hasTokenCol = false;
    $hasVerifiedCol = false;
    $hasExpiresCol = false;
    if ($res = $conn->query("SHOW COLUMNS FROM users LIKE 'verification_token'")) {
        $hasTokenCol = $res->num_rows > 0; $res->free();
    }
    if ($res = $conn->query("SHOW COLUMNS FROM users LIKE 'is_verified'")) {
        $hasVerifiedCol = $res->num_rows > 0; $res->free();
    }
    if ($res = $conn->query("SHOW COLUMNS FROM users LIKE 'verification_expires_at'")) {
        $hasExpiresCol = $res->num_rows > 0; $res->free();
    }

    if (!$hasTokenCol || !$hasVerifiedCol) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Email verification is not configured on the server."]);
        exit();
    }

    // Build SELECT query
    $sql = "SELECT user_id, email, is_verified";
    if ($hasExpiresCol) {
        $sql .= ", verification_expires_at";
    }
    $sql .= " FROM users WHERE verification_token = ?";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "DB prepare failed.", "error" => $conn->error]);
        exit();
    }
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $result = $stmt->get_result();

    if (!$result || $result->num_rows === 0) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid or already used verification token."]);
        exit();
    }

    $user = $result->fetch_assoc();

    if ($hasExpiresCol && !empty($user['verification_expires_at'])) {
        $expiresAt = strtotime($user['verification_expires_at']);
        if ($expiresAt !== false && $expiresAt < time()) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Verification link has expired."]);
            exit();
        }
    }

    if ((int)$user['is_verified'] === 1) {
        header('Location: http://localhost:5173/login?verified=1');
        exit();
    }

    // Mark user as verified and clear token
    if ($hasExpiresCol) {
        $update = $conn->prepare("UPDATE users SET is_verified = 1, verification_token = NULL, verification_expires_at = NULL WHERE verification_token = ?");
    } else {
        $update = $conn->prepare("UPDATE users SET is_verified = 1, verification_token = NULL WHERE verification_token = ?");
    }

    if (!$update) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "DB prepare failed.", "error" => $conn->error]);
        exit();
    }

    $update->bind_param("s", $token);
    $ok = $update->execute();

    if ($ok) {
        header('Location: http://localhost:5173/login?verified=1');
        exit();
    }

    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to verify email."]);
    exit();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server error.", "error" => $e->getMessage()]);
    exit();
}
