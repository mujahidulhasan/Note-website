<?php
// WARNING: চূড়ান্ত এরর সাপ্রেশন (Fatal Error লুকিয়ে রাখবে)
error_reporting(0);
ini_set('display_errors', 0);
ini_set('max_execution_time', 300); // 300 সেকেন্ড (5 মিনিট)
ini_set('memory_limit', '256M');
// ----------------------------------------------------
// সেশন শুরু
// ----------------------------------------------------
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// ----------------------------------------------------
// ডাটাবেস কনফিগারেশন - এটি পরিবর্তন করবেন না!
// ----------------------------------------------------
define('DB_HOST', 'sql100.infinityfree.com'); 
define('DB_NAME', 'if0_40499921_Engnote'); 
define('DB_USER', 'if0_40499921');      
define('DB_PASS', 'ViSECXOQvC5'); 

// ----------------------------------------------------
// Headers
// ----------------------------------------------------
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ----------------------------------------------------
// PDO সংযোগ (Database Connection)
// ----------------------------------------------------
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed! Check credentials: " . $e->getMessage()]);
    exit();
}

// ----------------------------------------------------
// নিরাপত্তা ফাংশন (লগইন নিষ্ক্রিয়)
// ----------------------------------------------------

function sanitize_input($data) {
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}

function require_admin_login() {
    return true; 
}
?>