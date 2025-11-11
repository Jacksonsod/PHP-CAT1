<?php
header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json; charset=utf-8');
try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $contentType = isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : '';
        if (stripos($contentType, 'application/json') !== false) {
            $data = json_decode(file_get_contents('php://input'));
        } else {
            // Expecting application/x-www-form-urlencoded or multipart/form-data
            $data = (object) $_POST;
        }
        include "../config/config.php";
        if (function_exists('mysqli_set_charset')) { $conn->set_charset('utf8mb4'); }

        if (!$data) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Invalid request payload."
            ]);
            exit();
        }

        // Normalize name: prefer explicit name, else combine first_name + last_name
        $first = isset($data->first_name) ? trim($data->first_name) : '';
        $last  = isset($data->last_name) ? trim($data->last_name) : '';
        $name  = isset($data->name) ? trim($data->name) : trim(($first . ' ' . $last));

        // Validate input
        if (
            empty($name) ||
            empty($data->email) ||
            empty($data->password) ||
            empty($data->role)
        ) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "All fields are required."]);
            exit();
        }

        // Validate name
        if (!preg_match("/^[a-zA-Z\s]{2,}$/", $name)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Name must be at least 2 characters and contain only letters and spaces."]);
            exit();
        }

        // Validate email format
        if (!filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid email format."]);
            exit();
        }

        // Check if email already exists
        $checkEmail = $conn->prepare("SELECT user_id FROM users WHERE email = ?");
        $checkEmail->bind_param("s", $data->email);
        $checkEmail->execute();
        $checkEmail->store_result();
        if ($checkEmail->num_rows > 0) {
            http_response_code(409);
            echo json_encode(["success" => false, "message" => "Email is already registered."]);    
            exit();
        }

        // Validate password length
        if (strlen($data->password) < 8) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Password must be at least 8 characters long."]);
            exit();
        }

        // Validate role
        $validRoles = ['guest', 'reception', 'housekeeping', 'admin'];
        if (!in_array($data->role, $validRoles)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid role selected."]);
            exit();
        }

        // Hash password
        $hashedPassword = password_hash($data->password, PASSWORD_DEFAULT);

        // Decide which columns exist: 'name' OR ('first_name','last_name')
        $hasNameCol = false;
        $hasFirstCol = false;
        $hasLastCol = false;
        if ($res = $conn->query("SHOW COLUMNS FROM users LIKE 'name'")) {
            $hasNameCol = $res->num_rows > 0; $res->free();
        }
        if ($res = $conn->query("SHOW COLUMNS FROM users LIKE 'first_name'")) {
            $hasFirstCol = $res->num_rows > 0; $res->free();
        }
        if ($res = $conn->query("SHOW COLUMNS FROM users LIKE 'last_name'")) {
            $hasLastCol = $res->num_rows > 0; $res->free();
        }

        if ($hasNameCol) {
            $query = $conn->prepare("INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, NOW())");
            if (!$query) {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "DB prepare failed.", "error" => $conn->error]);
                exit();
            }
            $query->bind_param("ssss", $name, $data->email, $hashedPassword, $data->role);
        } elseif ($hasFirstCol && $hasLastCol) {
            $first = isset($data->first_name) ? trim($data->first_name) : '';
            $last  = isset($data->last_name) ? trim($data->last_name) : '';
            $query = $conn->prepare("INSERT INTO users (first_name, last_name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
            if (!$query) {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "DB prepare failed.", "error" => $conn->error]);
                exit();
            }
            $query->bind_param("sssss", $first, $last, $data->email, $hashedPassword, $data->role);
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Users table is missing required name columns."]);
            exit();
        }

        $ok = $query->execute();
        if ($ok) {
            $newId = $conn->insert_id;
            echo json_encode([
                "success" => true,
                "message" => "Redirecting to {$data->role} dashboard...",
                "user" => [
                    "user_id" => $newId,
                    "name" => $name,
                    "email" => $data->email,
                    "role" => $data->role
                ]
            ]);
            exit();
        }

        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to create user.", "error" => $query->error]);
        exit();
    }

    // Fallback for unsupported methods
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed."]);
    exit();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Server error.",
        "error" => $e->getMessage()
    ]);
    exit();
}
?>
