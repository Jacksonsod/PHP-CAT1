<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

try {
    include "../config/config.php";
    if (function_exists('mysqli_set_charset')) { $conn->set_charset('utf8mb4'); }

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        // List all hotels
        $result = $conn->query("SELECT hotel_id AS id, name, location, description, created_at FROM hotels ORDER BY hotel_id DESC");
        $rows = [];
        while ($row = $result->fetch_assoc()) { $rows[] = $row; }
        echo json_encode([ 'success' => true, 'data' => $rows ]);
        exit();
    }

    if ($method === 'POST') {
        // Parse form-encoded, multipart/form-data (for image upload) or JSON
        $contentType = isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : '';
        if (stripos($contentType, 'application/json') !== false) {
            $payload = json_decode(file_get_contents('php://input'), true) ?: [];
        } else {
            $payload = $_POST;
        }
        $action = isset($payload['action']) ? $payload['action'] : '';

        // Helper for handling an optional uploaded image (for create/update)
        $handleImageUpload = function(?string $existingPath = null) {
            if (!isset($_FILES['image']) || $_FILES['image']['error'] === UPLOAD_ERR_NO_FILE) {
                return $existingPath; // nothing uploaded; keep existing or null
            }

            if (!is_dir(__DIR__ . '/../uploads/hotels')) {
                @mkdir(__DIR__ . '/../uploads/hotels', 0775, true);
            }

            $file = $_FILES['image'];
            if ($file['error'] !== UPLOAD_ERR_OK) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Image upload error.']);
                exit();
            }

            $allowedMime = ['image/jpeg', 'image/png', 'image/webp'];
            $allowedExt = ['jpg', 'jpeg', 'png', 'webp'];

            $finfo = new finfo(FILEINFO_MIME_TYPE);
            $mime  = $finfo->file($file['tmp_name']);
            if (!in_array($mime, $allowedMime, true)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Only image files (JPG, PNG, WEBP) are allowed.']);
                exit();
            }

            $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            if (!in_array($ext, $allowedExt, true)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid image file extension.']);
                exit();
            }

            // max ~2MB
            if ($file['size'] > 2 * 1024 * 1024) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Image is too large. Max size is 2MB.']);
                exit();
            }

            $basename = bin2hex(random_bytes(8)) . '.' . $ext;
            $targetRel = 'uploads/hotels/' . $basename;
            $targetAbs = __DIR__ . '/../' . $targetRel;

            if (!move_uploaded_file($file['tmp_name'], $targetAbs)) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to save uploaded image.']);
                exit();
            }

            return $targetRel; // store relative path in DB
        };

        if ($action === 'create') {
            $name = trim($payload['name'] ?? '');
            $location = trim($payload['location'] ?? '');
            $description = trim($payload['description'] ?? '');
            if ($name === '' || $location === '') {
                http_response_code(400);
                echo json_encode([ 'success' => false, 'message' => 'Name and location are required.' ]);
                exit();
            }
            // Optional image upload
            $imagePath = $handleImageUpload(null);

            if ($imagePath !== null) {
                $stmt = $conn->prepare("INSERT INTO hotels (name, location, description, image_path, created_at) VALUES (?, ?, ?, ?, NOW())");
                if (!$stmt) { http_response_code(500); echo json_encode(['success'=>false,'message'=>'DB prepare failed','error'=>$conn->error]); exit(); }
                $stmt->bind_param('ssss', $name, $location, $description, $imagePath);
            } else {
                $stmt = $conn->prepare("INSERT INTO hotels (name, location, description, created_at) VALUES (?, ?, ?, NOW())");
                if (!$stmt) { http_response_code(500); echo json_encode(['success'=>false,'message'=>'DB prepare failed','error'=>$conn->error]); exit(); }
                $stmt->bind_param('sss', $name, $location, $description);
            }
            $ok = $stmt->execute();
            if ($ok) {
                echo json_encode([ 'success' => true, 'id' => $conn->insert_id ]);
            } else {
                http_response_code(500);
                echo json_encode([ 'success' => false, 'message' => 'Insert failed', 'error' => $stmt->error ]);
            }
            exit();
        }

        if ($action === 'update') {
            $id = intval($payload['id'] ?? 0);
            $name = trim($payload['name'] ?? '');
            $location = trim($payload['location'] ?? '');
            $description = trim($payload['description'] ?? '');
            if ($id <= 0 || $name === '' || $location === '') {
                http_response_code(400);
                echo json_encode([ 'success' => false, 'message' => 'ID, name and location are required.' ]);
                exit();
            }
            // Existing image path (if column exists)
            $currentImage = null;
            if ($res = $conn->query('SHOW COLUMNS FROM hotels LIKE "image_path"')) {
                if ($res->num_rows > 0) {
                    $res->free();
                    $res2 = $conn->prepare('SELECT image_path FROM hotels WHERE hotel_id = ?');
                    if ($res2) {
                        $res2->bind_param('i', $id);
                        $res2->execute();
                        $rs = $res2->get_result();
                        if ($row = $rs->fetch_assoc()) { $currentImage = $row['image_path']; }
                    }
                } else {
                    $res->free();
                }
            }

            $imagePath = $handleImageUpload($currentImage);

            if ($imagePath !== null) {
                $stmt = $conn->prepare("UPDATE hotels SET name = ?, location = ?, description = ?, image_path = ? WHERE hotel_id = ?");
                if (!$stmt) { http_response_code(500); echo json_encode(['success'=>false,'message'=>'DB prepare failed','error'=>$conn->error]); exit(); }
                $stmt->bind_param('ssssi', $name, $location, $description, $imagePath, $id);
            } else {
                $stmt = $conn->prepare("UPDATE hotels SET name = ?, location = ?, description = ? WHERE hotel_id = ?");
                if (!$stmt) { http_response_code(500); echo json_encode(['success'=>false,'message'=>'DB prepare failed','error'=>$conn->error]); exit(); }
                $stmt->bind_param('sssi', $name, $location, $description, $id);
            }
            $ok = $stmt->execute();
            echo json_encode([ 'success' => (bool)$ok ]);
            exit();
        }

        if ($action === 'delete') {
            $id = intval($payload['id'] ?? 0);
            if ($id <= 0) { http_response_code(400); echo json_encode(['success'=>false,'message'=>'Valid id required']); exit(); }
            $stmt = $conn->prepare("DELETE FROM hotels WHERE hotel_id = ?");
            if (!$stmt) { http_response_code(500); echo json_encode(['success'=>false,'message'=>'DB prepare failed','error'=>$conn->error]); exit(); }
            $stmt->bind_param('i', $id);
            $ok = $stmt->execute();
            echo json_encode([ 'success' => (bool)$ok ]);
            exit();
        }

        http_response_code(400);
        echo json_encode([ 'success' => false, 'message' => 'Unknown action' ]);
        exit();
    }

    http_response_code(405);
    echo json_encode([ 'success' => false, 'message' => 'Method not allowed' ]);
    exit();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([ 'success' => false, 'message' => 'Server error', 'error' => $e->getMessage() ]);
    exit();
}
