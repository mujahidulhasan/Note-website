<?php
require_once 'core.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_REQUEST['action']) ? sanitize_input($_REQUEST['action']) : ''; 
$input = ($method === 'POST') ? json_decode(file_get_contents("php://input"), true) : $_POST;

switch ($action) {
    case 'list_notices':
        // অ্যাডমিন প্যানেলের জন্য সব নোটিশ লোড করা
        require_admin_login(); 
        if ($method !== 'GET') { http_response_code(405); echo json_encode(["success" => false, "message" => "Method Not Allowed."]); exit(); }

        try {
            $stmt = $pdo->query("SELECT id, content, is_active, created_at FROM notices ORDER BY created_at DESC");
            echo json_encode(["success" => true, "data" => $stmt->fetchAll()]);
        } catch (PDOException $e) { http_response_code(500); echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]); }
        break;
        
    case 'add_notice':
        // নতুন নোটিশ যোগ করা
        require_admin_login(); 
        if ($method !== 'POST') { http_response_code(405); echo json_encode(["success" => false, "message" => "Method Not Allowed."]); exit(); }
        
        $content = isset($input['content']) ? sanitize_input($input['content']) : '';
        $is_active = isset($input['is_active']) ? (int)$input['is_active'] : 0;

        if (empty($content)) { http_response_code(400); echo json_encode(["success" => false, "message" => "Notice content is required."]); exit(); }
        
        try {
            $stmt = $pdo->prepare("INSERT INTO notices (content, is_active) VALUES (?, ?)");
            $stmt->execute([$content, $is_active]);
            echo json_encode(["success" => true, "message" => "Notice posted successfully!"]);
        } catch (PDOException $e) { http_response_code(500); echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]); }
        break;

    case 'delete_notice':
        // নোটিশ মুছে ফেলা
        require_admin_login(); 
        if ($method !== 'DELETE' && $method !== 'POST') { http_response_code(405); echo json_encode(["success" => false, "message" => "Method Not Allowed."]); exit(); }
        
        $notice_id = isset($_REQUEST['id']) ? (int)$_REQUEST['id'] : 0;
        if ($notice_id === 0) { http_response_code(400); echo json_encode(["success" => false, "message" => "Notice ID is required."]); exit(); }

        try {
            $stmt = $pdo->prepare("DELETE FROM notices WHERE id = ?");
            $stmt->execute([$notice_id]);
            if ($stmt->rowCount() > 0) { echo json_encode(["success" => true, "message" => "Notice deleted successfully!"]); } 
            else { http_response_code(404); echo json_encode(["success" => false, "message" => "Notice not found."]); }
        } catch (PDOException $e) { http_response_code(500); echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]); }
        break;

    default:
        http_response_code(400); echo json_encode(["success" => false, "message" => "Invalid action specified."]);
        break;
}
?>