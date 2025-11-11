<?php
header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json; charset=utf-8');

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Method not allowed."]); 
        exit();
    }

    $contentType = isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : '';
    if (stripos($contentType, 'application/json') !== false) {
        $data = json_decode(file_get_contents('php://input'));
    } else {
        $data = (object) $_POST; // form-encoded
    }

    include "../config/config.php";
    if (function_exists('mysqli_set_charset')) { $conn->set_charset('utf8mb4'); }

    if (empty($data->email) || empty($data->password)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Email and password are required."]);
        exit();
    }

    // Determine available name columns
    $hasNameCol = false; $hasFirstCol = false; $hasLastCol = false;
    if ($res = $conn->query("SHOW COLUMNS FROM users LIKE 'name'")) { $hasNameCol = $res->num_rows > 0; $res->free(); }
    if ($res = $conn->query("SHOW COLUMNS FROM users LIKE 'first_name'")) { $hasFirstCol = $res->num_rows > 0; $res->free(); }
    if ($res = $conn->query("SHOW COLUMNS FROM users LIKE 'last_name'")) { $hasLastCol = $res->num_rows > 0; $res->free(); }

    if ($hasNameCol) {
        $sql = "SELECT user_id, name, email, password_hash, role FROM users WHERE email = ?";
    } elseif ($hasFirstCol && $hasLastCol) {
        $sql = "SELECT user_id, CONCAT(first_name, ' ', last_name) AS name, email, password_hash, role FROM users WHERE email = ?";
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Users table missing name columns."]); 
        exit();
    }

    $query = $conn->prepare($sql);
    if (!$query) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "DB prepare failed.", "error" => $conn->error]);
        exit();
    }
    $email = $data->email;
    $query->bind_param("s", $email);
    $query->execute();
    $result = $query->get_result();

    if ($result && $result->num_rows === 1) {
        $user = $result->fetch_assoc();
        if (password_verify($data->password, $user['password_hash'])) {
            $role = $user['role'];
            echo json_encode([
                "success" => true,
                "message" => "Redirecting to {$role} dashboard...",
                "user" => [
                    "user_id" => $user['user_id'],
                    "name" => $user['name'],
                    "email" => $user['email'],
                    "role" => $role
                ]
            ]);
            exit();
        }
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Incorrect password."]); 
        exit();
    }

    http_response_code(404);
    echo json_encode(["success" => false, "message" => "User not found."]); 
    exit();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server error.", "error" => $e->getMessage()]);
    exit();
}
?>
