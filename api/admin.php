<?php
require_once 'core.php';

$method = $_SERVER['REQUEST_METHOD'];

// যদি JSON ডেটা দরকার হয়
$input = json_decode(file_get_contents("php://input"), true);
$action = isset($_GET['action']) ? sanitize_input($_GET['action']) : '';

// লগইন নিষ্ক্রিয় থাকায়, এই ফাইলটি চেক_অথ ছাড়া আর কোনো কাজে ব্যবহার হচ্ছে না।

switch ($action) {
    case 'login':
        http_response_code(401); 
        echo json_encode(["success" => false, "message" => "Login is temporarily disabled."]);
        break;

    case 'logout':
        echo json_encode(["success" => true, "message" => "Logged out successfully!"]);
        break;

    case 'check_auth':
        // যেহেতু লগইন নিষ্ক্রিয়, আমরা ধরে নিচ্ছি অথেন্টিকেশন সফল
        echo json_encode(["success" => true, "is_logged_in" => true]);
        break;

    default:
        http_response_code(400); 
        echo json_encode(["success" => false, "message" => "Invalid action specified."]);
        break;
}
?>