<?php
// core.php ফাইলটি ইনক্লুড করুন
require_once 'core.php';

$method = $_SERVER['REQUEST_METHOD'];

// শুধুমাত্র POST এবং GET রিকোয়েস্টগুলো গ্রহণ করা হবে
if ($method !== 'POST' && $method !== 'GET') {
    http_response_code(405); 
    echo json_encode(["success" => false, "message" => "Method Not Allowed."]);
    exit();
}

// JSON ইনপুট ডেটা গ্রহণ করা
$input = json_decode(file_get_contents("php://input"), true);
$action = isset($_GET['action']) ? sanitize_input($_GET['action']) : '';

switch ($action) {
    case 'login':
        // ------------------------------------
        // অ্যাডমিন লগইন লজিক (POST রিকোয়েস্ট)
        // ------------------------------------
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(["success" => false, "message" => "Use POST method for login."]);
            exit();
        }

        $username = isset($input['username']) ? sanitize_input($input['username']) : '';
        $password = isset($input['password']) ? $input['password'] : ''; 
        // পাসওয়ার্ড স্যানিটাইজ করা হয় না, কারণ আমরা এটি হ্যাশের সাথে তুলনা করব

        if (empty($username) || empty($password)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Username and password are required."]);
            exit();
        }

        try {
            $stmt = $pdo->prepare("SELECT id, username, password_hash, role FROM users WHERE username = ?");
            $stmt->execute([$username]);
            $user = $stmt->fetch();

            // যদি ইউজার পাওয়া যায় এবং পাসওয়ার্ড সঠিক হয়
            // এখানে আমরা SHA2 ব্যবহার করে ইনপুট পাসওয়ার্ডের হ্যাশ তৈরি করে ডাটাবেসের হ্যাশের সাথে মেলাচ্ছি
            if ($user && $user['password_hash'] === hash('sha256', $password)) {
                 // **গুরুত্বপূর্ণ:** প্রজেক্টে SHA2('admin', 256) ব্যবহার করা হয়েছে। 
                 // SHA256 ফাংশনটি PHP তে hash('sha256', $password) দ্বারা তৈরি করা যায়।

                // সেশন সেট করা
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['username'] = $user['username'];
                $_SESSION['role'] = $user['role'];

                echo json_encode(["success" => true, "message" => "Login successful!", "redirect" => "/admin/dashboard"]);

            } else {
                http_response_code(401); // Unauthorized
                echo json_encode(["success" => false, "message" => "Invalid username or password."]);
            }

        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
        }
        break;

    case 'logout':
        // ------------------------------------
        // অ্যাডমিন লগ আউট লজিক
        // ------------------------------------
        session_unset();
        session_destroy();
        echo json_encode(["success" => true, "message" => "Logged out successfully!"]);
        break;

    case 'check_auth':
        // ------------------------------------
        // অথেন্টিকেশন চেক
        // ------------------------------------
        if (is_admin_logged_in()) {
            echo json_encode(["success" => true, "is_logged_in" => true]);
        } else {
            http_response_code(401);
            echo json_encode(["success" => false, "is_logged_in" => false, "message" => "Not logged in."]);
        }
        break;

    default:
        http_response_code(400); 
        echo json_encode(["success" => false, "message" => "Invalid action specified."]);
        break;
}
?>
