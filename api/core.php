<?php
// PHP Error Reporting: সব এরর ডিসপ্লে করা বন্ধ করুন
error_reporting(0);
ini_set('display_errors', 0);

// সেশন শুরু
session_start();

// CORS Headers: এটি যেকোনো ডোমেইন থেকে অনুরোধ করার অনুমতি দেয়।
// প্রোডাকশনের জন্য এটি শুধুমাত্র আপনার ডোমেইনে সীমাবদ্ধ রাখুন।
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// যদি OPTIONS মেথড হয়, তাহলে এক্সিট করুন
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ----------------------------------------------------
// ডাটাবেস কনফিগারেশন
// ----------------------------------------------------
define('DB_HOST', 'localhost');
define('DB_NAME', 'study_vault'); // আপনার ডাটাবেস নাম পরিবর্তন করুন
define('DB_USER', 'root');      // আপনার ইউজারনেম পরিবর্তন করুন
define('DB_PASS', '');          // আপনার পাসওয়ার্ড পরিবর্তন করুন

// ----------------------------------------------------
// PDO সংযোগ (Database Connection)
// ----------------------------------------------------
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    // ডাটাবেস সংযোগ ব্যর্থ হলে 500 এরর দিন
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed: " . $e->getMessage()]);
    exit();
}

// ----------------------------------------------------
// নিরাপত্তা ফাংশন (Security Function)
// ----------------------------------------------------

/**
 * ইনপুট থেকে HTML ট্যাগগুলো স্যানিটাইজ করে (XSS প্রতিরোধ)
 * @param string $data
 * @return string
 */
function sanitize_input($data) {
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}

/**
 * অ্যাডমিন লগইন চেক করে
 * @return bool
 */
function is_admin_logged_in() {
    return isset($_SESSION['user_id']) && isset($_SESSION['username']) && $_SESSION['role'] === 'admin';
}

/**
 * যদি অ্যাডমিন লগইন না করে থাকে, তাহলে অ্যাক্সেস ব্লক করে
 */
function require_admin_login() {
    if (!is_admin_logged_in()) {
        http_response_code(401); // Unauthorized
        echo json_encode(["success" => false, "message" => "Unauthorized access. Admin login required."]);
        exit();
    }
}
?>
