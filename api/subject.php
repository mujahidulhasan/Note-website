<?php
// PHP Core Settings and Imports
require_once 'core.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_REQUEST['action']) ? sanitize_input($_REQUEST['action']) : ''; 
$input = ($method === 'POST' && $action !== 'add' && $action !== 'update') ? json_decode(file_get_contents("php://input"), true) : $_POST;

$UPLOAD_DIR = '../uploads/icons/';

if (!is_dir($UPLOAD_DIR)) {
    // নিশ্চিত করুন যে uploads ফোল্ডারের পারমিশন 777 আছে
    @mkdir($UPLOAD_DIR, 0777, true); 
}

switch ($action) {
    // --------------------------------------------------------------------------------
    // SECTION 1: READ OPERATIONS (PUBLIC ACCESS)
    // --------------------------------------------------------------------------------
    case 'list':
        // হোমপেজ এবং অ্যাডমিন প্যানেলের জন্য সাবজেক্ট তালিকা (শুধু active গুলো)
        if ($method !== 'GET') { http_response_code(405); echo json_encode(["success" => false, "message" => "Method Not Allowed."]); exit(); }
        try {
            $stmt = $pdo->query("SELECT id, name, icon_url, description FROM subjects WHERE is_deleted = FALSE ORDER BY name ASC");
            echo json_encode(["success" => true, "data" => $stmt->fetchAll()]);
        } catch (PDOException $e) { http_response_code(500); echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]); }
        break;
        
    case 'get_details':
        // --------------------------------------------------------------------------------
        // SECTION 2: SINGLE SUBJECT DETAIL (FOR EDITING)
        // --------------------------------------------------------------------------------
        require_admin_login(); 
        if ($method !== 'GET') { http_response_code(405); echo json_encode(["success" => false, "message" => "Method Not Allowed."]); exit(); }
        $subject_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        
        try {
            $stmt = $pdo->prepare("SELECT id, name, icon_url, description FROM subjects WHERE id = ?");
            $stmt->execute([$subject_id]);
            $subject = $stmt->fetch();
            
            if ($subject) { echo json_encode(["success" => true, "data" => $subject]); } 
            else { http_response_code(404); echo json_encode(["success" => false, "message" => "Subject not found."]); }
        } catch (PDOException $e) { http_response_code(500); echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]); }
        break;


    // --------------------------------------------------------------------------------
    // SECTION 3: WRITE OPERATIONS (ADD/UPDATE - File Upload Handling)
    // --------------------------------------------------------------------------------
    case 'add':
    case 'update': 
        require_admin_login(); 
        if ($method !== 'POST') { http_response_code(405); echo json_encode(["success" => false, "message" => "Method Not Allowed."]); exit(); }
        
        $subject_id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
        $name = isset($_POST['name']) ? sanitize_input($_POST['name']) : '';
        $description = isset($_POST['description']) ? sanitize_input($_POST['description']) : '';
        $existing_icon_url = isset($_POST['existing_icon_url']) ? sanitize_input($_POST['existing_icon_url']) : null;
        $icon_url = $existing_icon_url;

        if (empty($name)) { http_response_code(400); echo json_encode(["success" => false, "message" => "Subject Name is required."]); exit(); }

        $is_new_upload = isset($_FILES['icon_file']) && $_FILES['icon_file']['error'] === UPLOAD_ERR_OK;
        
        // 3.1: Add validation
        if ($action === 'add' && !$is_new_upload) {
             http_response_code(400); 
             echo json_encode(["success" => false, "message" => "Icon file is required for new subject."]); 
             exit(); 
        }

        if ($is_new_upload) {
            $icon_file = $_FILES['icon_file'];
            $file_ext = strtolower(pathinfo($icon_file['name'], PATHINFO_EXTENSION));
            if (!in_array($file_ext, ['png', 'svg', 'jpg', 'jpeg'])) {
                http_response_code(400); echo json_encode(["success" => false, "message" => "Invalid file type. Only PNG, SVG, JPG/JPEG allowed."]); exit();
            }

            $new_filename = uniqid('icon_', true) . '.' . $file_ext;
            $target_file = $UPLOAD_DIR . $new_filename;
            $icon_url = $target_file;

            // 3.2: Move uploaded file
            if (!move_uploaded_file($icon_file['tmp_name'], $target_file)) {
                 http_response_code(500); echo json_encode(["success" => false, "message" => "Failed to move uploaded file. Check 'uploads/icons' permissions."]); exit();
            }

            // 3.3: Delete old file on update
            if ($action === 'update' && $existing_icon_url && file_exists($existing_icon_url) && strpos($existing_icon_url, '/uploads/demo') === false) {
                 @unlink($existing_icon_url);
            }
        }
        
        // 3.4: Final DB execution
        try {
            if ($action === 'add') {
                $stmt = $pdo->prepare("INSERT INTO subjects (name, icon_url, description) VALUES (?, ?, ?)");
                $stmt->execute([$name, $icon_url, $description]);
                echo json_encode(["success" => true, "message" => "Subject added successfully!"]);
            } else {
                $stmt = $pdo->prepare("UPDATE subjects SET name = ?, icon_url = ?, description = ?, last_edited = NOW() WHERE id = ?");
                $stmt->execute([$name, $icon_url, $description, $subject_id]);
                echo json_encode(["success" => true, "message" => "Subject updated successfully!"]);
            }
        } catch (PDOException $e) { 
            if ($is_new_upload) { @unlink($icon_url); }
            http_response_code(500); echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]); 
        }
        break;

    // --------------------------------------------------------------------------------
    // SECTION 4: DELETE OPERATIONS (Soft Delete)
    // --------------------------------------------------------------------------------
    case 'delete':
    case 'delete_post': // 403 fix: POST method for delete
        require_admin_login(); 
        if ($method !== 'DELETE' && $method !== 'POST') { http_response_code(405); echo json_encode(["success" => false, "message" => "Method Not Allowed."]); exit(); }

        $subject_id = isset($_REQUEST['id']) ? (int)$_REQUEST['id'] : 0; 
        if ($subject_id === 0) { http_response_code(400); echo json_encode(["success" => false, "message" => "Subject ID is required."]); exit(); }

        try {
            // Soft Delete: is_deleted = TRUE
            $stmt = $pdo->prepare("UPDATE subjects SET is_deleted = TRUE, deleted_at = NOW() WHERE id = ?");
            $stmt->execute([$subject_id]);
            
            if ($stmt->rowCount() > 0) { 
                 echo json_encode(["success" => true, "message" => "Subject moved to trash successfully!"]); 
            } 
            else { http_response_code(404); echo json_encode(["success" => false, "message" => "Subject not found."]); }
        } catch (PDOException $e) { http_response_code(500); echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]); }
        break;
        
    // Future: Add action for 'restore' and 'purge_trash'

    default:
        http_response_code(400); echo json_encode(["success" => false, "message" => "Invalid action specified."]);
        break;
}
?>