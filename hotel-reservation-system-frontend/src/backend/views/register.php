<?php
header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"));

// include connection
include "../config/config.php";
$query = "INSERT INTO users (name,email, password_hash,role,created_at) VALUES ('$data->name','$data->email','$data->password','$data->role',now())";
if(mysqli_query($conn, $query)){
    $response = [
        "message" => "User created successfully"
    ];
}

echo json_encode($response);
?>