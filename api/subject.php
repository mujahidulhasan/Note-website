<?php
// core.php ফাইলটি ইনক্লুড করুন, যা সংযোগ এবং নিরাপত্তা হ্যান্ডেল করে
require_once 'core.php';

// শুধুমাত্র GET অনুরোধগুলো গ্রহণ করুন
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(["success" => false, "message" => "Only GET requests are allowed."]);
    exit();
}

// ইনপুট স্যানিটাইজেশন
$action = isset($_GET['action']) ? sanitize_input($_GET['action']) : '';

switch ($action) {
    case 'list':
        // ------------------------------------
        // সকল সাবজেক্টের তালিকা ফেচ করা
        // ------------------------------------
        try {
            // সাবজেক্ট টেবিল থেকে ID, নাম এবং আইকন URL নির্বাচন করুন
            $stmt = $pdo->query("SELECT id, name, icon_url FROM subjects ORDER BY name ASC");
            $subjects = $stmt->fetchAll();

            // যদি কোনো সাবজেক্ট পাওয়া না যায়
            if (!$subjects) {
                echo json_encode(["success" => true, "message" => "No subjects found.", "data" => []]);
                exit();
            }
            
            // সাফল্যজনকভাবে ডেটা ফেরত দিন
            echo json_encode(["success" => true, "data" => $subjects]);

        } catch (PDOException $e) {
            // ডাটাবেস এরর হ্যান্ডেল করা
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
        }
        break;

    // ভবিষ্যতে এখানে অন্যান্য অ্যাকশন (যেমন: একক সাবজেক্ট বিবরণ) যোগ করা যেতে পারে।
    
    default:
        // কোনো বৈধ অ্যাকশন না থাকলে
        http_response_code(400); // Bad Request
        echo json_encode(["success" => false, "message" => "Invalid action specified."]);
        break;
}
?>
