<?php
header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json; charset=utf-8');

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
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
        // Composer autoloader for PHPMailer
        require __DIR__ . '/../../../../vendor/autoload.php';
        // Email configuration
        $emailConfig = require __DIR__ . '/../config/email_config.php';
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
        $hasVerifiedCol = false;
        $hasTokenCol = false;
        $hasExpiresCol = false;
        if ($res = $conn->query("SHOW COLUMNS FROM users LIKE 'name'")) {
            $hasNameCol = $res->num_rows > 0; $res->free();
        }
        if ($res = $conn->query("SHOW COLUMNS FROM users LIKE 'first_name'")) {
            $hasFirstCol = $res->num_rows > 0; $res->free();
        }
        if ($res = $conn->query("SHOW COLUMNS FROM users LIKE 'last_name'")) {
            $hasLastCol = $res->num_rows > 0; $res->free();
        }
        if ($res = $conn->query("SHOW COLUMNS FROM users LIKE 'is_verified'")) {
            $hasVerifiedCol = $res->num_rows > 0; $res->free();
        }
        if ($res = $conn->query("SHOW COLUMNS FROM users LIKE 'verification_token'")) {
            $hasTokenCol = $res->num_rows > 0; $res->free();
        }
        if ($res = $conn->query("SHOW COLUMNS FROM users LIKE 'verification_expires_at'")) {
            $hasExpiresCol = $res->num_rows > 0; $res->free();
        }

        if ($hasNameCol) {
            // Build dynamic INSERT with optional verification fields
            $columns = "name, email, password_hash, role, created_at";
            $placeholders = "?, ?, ?, ?, NOW()";
            $types = "ssss";
            $params = [$name, $data->email, $hashedPassword, $data->role];

            if ($hasVerifiedCol) {
                $columns .= ", is_verified";
                $placeholders .= ", ?";
                $types .= "i";
                $isVerified = 0;
                $params[] = $isVerified;
            }

            $verificationToken = null;
            if ($hasTokenCol) {
                $columns .= ", verification_token";
                $placeholders .= ", ?";
                $types .= "s";
                $verificationToken = bin2hex(random_bytes(16));
                $params[] = $verificationToken;
            }

            if ($hasExpiresCol) {
                $columns .= ", verification_expires_at";
                $placeholders .= ", ?";
                $types .= "s";
                $expiresAt = date('Y-m-d H:i:s', time() + 24 * 60 * 60); // 24 hours from now
                $params[] = $expiresAt;
            }

            $sql = "INSERT INTO users ($columns) VALUES ($placeholders)";
            $query = $conn->prepare($sql);
            if (!$query) {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "DB prepare failed.", "error" => $conn->error]);
                exit();
            }

            $query->bind_param($types, ...$params);
        } elseif ($hasFirstCol && $hasLastCol) {
            $first = isset($data->first_name) ? trim($data->first_name) : '';
            $last  = isset($data->last_name) ? trim($data->last_name) : '';

            $columns = "first_name, last_name, email, password_hash, role, created_at";
            $placeholders = "?, ?, ?, ?, ?, NOW()";
            $types = "sssss";
            $params = [$first, $last, $data->email, $hashedPassword, $data->role];

            if ($hasVerifiedCol) {
                $columns .= ", is_verified";
                $placeholders .= ", ?";
                $types .= "i";
                $isVerified = 0;
                $params[] = $isVerified;
            }

            $verificationToken = null;
            if ($hasTokenCol) {
                $columns .= ", verification_token";
                $placeholders .= ", ?";
                $types .= "s";
                $verificationToken = bin2hex(random_bytes(16));
                $params[] = $verificationToken;
            }

            if ($hasExpiresCol) {
                $columns .= ", verification_expires_at";
                $placeholders .= ", ?";
                $types .= "s";
                $expiresAt = date('Y-m-d H:i:s', time() + 24 * 60 * 60);
                $params[] = $expiresAt;
            }

            $sql = "INSERT INTO users ($columns) VALUES ($placeholders)";
            $query = $conn->prepare($sql);
            if (!$query) {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "DB prepare failed.", "error" => $conn->error]);
                exit();
            }

            $query->bind_param($types, ...$params);
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Users table is missing required name columns."]);
            exit();
        }

        $ok = $query->execute();
        if ($ok) {
            $newId = $conn->insert_id;

            // Build optional verification URL
            $verificationUrl = null;
            if (!empty($verificationToken)) {
                $baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'];
                $scriptDir = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\');
                $verificationUrl = $baseUrl . $scriptDir . '/VerifyEmailController.php?token=' . urlencode($verificationToken);

                // Send verification email via PHPMailer + Gmail SMTP
                try {
                    $mail = new PHPMailer(true);
                    $mail->isSMTP();
                    $mail->Host = $emailConfig['host'];
                    $mail->SMTPAuth = true;
                    $mail->Username = $emailConfig['username'];
                    $mail->Password = $emailConfig['password'];
                    $mail->SMTPSecure = $emailConfig['encryption'];
                    $mail->Port = $emailConfig['port'];

                    $mail->setFrom($emailConfig['from_email'], $emailConfig['from_name']);
                    $mail->addAddress($data->email, $name);

                    $mail->isHTML(true);
                    $mail->Subject = 'Verify your account';
                    $safeName = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
                    $safeUrl = htmlspecialchars($verificationUrl, ENT_QUOTES, 'UTF-8');
                    $mail->Body =
                        '<p>Hello ' . $safeName . ',</p>' .
                        '<p>Please verify your email address by clicking the button below:</p>' .
                        '<p><a href="' . $safeUrl . '" style="display:inline-block;padding:10px 20px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:4px;">Verify Email</a></p>' .
                        '<p>If you did not create an account, you can ignore this email.</p>';

                    $mail->AltBody =
                        "Hello " . $name . "\n\n" .
                        "Please verify your email address by clicking the link below:\n" .
                        $verificationUrl . "\n\n" .
                        "If you did not create an account, you can ignore this email.";

                    $mail->send();
                } catch (Exception $e) {
                    // Optional: log error; account is still created even if email sending fails
                }
            }

            echo json_encode([
                "success" => true,
                "message" => "Account created successfully. Please verify your email before logging in.",
                "user" => [
                    "user_id" => $newId,
                    "name" => $name,
                    "email" => $data->email,
                    "role" => $data->role
                ],
                "verification_url" => $verificationUrl
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
