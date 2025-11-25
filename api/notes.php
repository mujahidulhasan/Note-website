<?php
require_once 'core.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_REQUEST['action']) ? sanitize_input($_REQUEST['action']) : ''; 
// GET, POST, DELETE সকল অ্যাকশনের জন্য REQUEST ব্যবহার করা হলো
$input = ($method === 'POST' && $action !== 'add_note' && $action !== 'update_note') ? json_decode(file_get_contents("php://input"), true) : $_POST;

$UPLOAD_DIR = '../uploads/';
$ALLOWED_FILE_TYPES = ['pdf', 'jpg', 'jpeg', 'png', 'mp4', 'mov', 'txt'];

if (!is_dir($UPLOAD_DIR)) { @mkdir($UPLOAD_DIR, 0777, true); }

switch ($action) {
    // --------------------------------------------------------------------------------
    // SECTION 1: CHAPTERS CRUD 
    // --------------------------------------------------------------------------------
    
    case 'chapters_by_subject':
        if ($method !== 'GET') { http_response_code(405); echo json_encode(["success" => false, "message" => "Method Not Allowed."]); exit(); }
        $subject_id = isset($_GET['subject_id']) ? (int)$_GET['subject_id'] : 0;
        if ($subject_id === 0) { http_response_code(400); echo json_encode(["success" => false, "message" => "Subject ID is required."]); exit(); }
        try {
            $stmt = $pdo->prepare("SELECT id, name, subject_id FROM chapters WHERE subject_id = ? ORDER BY name ASC");
            $stmt->execute([$subject_id]);
            echo json_encode(["success" => true, "data" => $stmt->fetchAll()]);
        } catch (PDOException $e) { http_response_code(500); echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]); }
        break;

    case 'add_chapter':
        require_admin_login();
        if ($method !== 'POST') { http_response_code(405); echo json_encode(["success" => false, "message" => "Method Not Allowed."]); exit(); }
        $subject_id = isset($input['subject_id']) ? (int)$input['subject_id'] : 0;
        $name = isset($input['name']) ? sanitize_input($input['name']) : '';
        if ($subject_id === 0 || empty($name)) { http_response_code(400); echo json_encode(["success" => false, "message" => "Subject ID and Chapter Name are required."]); exit(); }
        try {
            $stmt = $pdo->prepare("INSERT INTO chapters (subject_id, name) VALUES (?, ?)"); $stmt->execute([$subject_id, $name]);
            echo json_encode(["success" => true, "message" => "Chapter added successfully!"]);
        } catch (PDOException $e) { http_response_code(500); echo json_encode(["success" => false, "message" => "DB error: " . $e->getMessage()]); }
        break;

    case 'delete_chapter':
        require_admin_login(); 
        if ($method !== 'DELETE' && $method !== 'POST') { http_response_code(405); echo json_encode(["success" => false, "message" => "Method Not Allowed."]); exit(); }
        $chapter_id = isset($_REQUEST['id']) ? (int)$_REQUEST['id'] : 0;
        if ($chapter_id === 0) { http_response_code(400); echo json_encode(["success" => false, "message" => "Chapter ID is required."]); exit(); }
        try {
            // Soft Delete all notes under this chapter
            $pdo->prepare("UPDATE notes SET is_deleted = TRUE, deleted_at = NOW() WHERE chapter_id = ?")->execute([$chapter_id]);
            
            // Delete the chapter
            $stmt = $pdo->prepare("DELETE FROM chapters WHERE id = ?");
            $stmt->execute([$chapter_id]);
            
            if ($stmt->rowCount() > 0) { echo json_encode(["success" => true, "message" => "Chapter deleted successfully! (Notes moved to trash)"]); } 
            else { http_response_code(404); echo json_encode(["success" => false, "message" => "Chapter not found."]); }
        } catch (PDOException $e) { http_response_code(500); echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]); }
        break;


    // --------------------------------------------------------------------------------
    // SECTION 2: NOTES WRITE OPERATIONS (ADD/UPDATE/DELETE + HISTORY LOGGING)
    // --------------------------------------------------------------------------------
    
    case 'add_note': 
        require_admin_login(); 
        if ($method !== 'POST' || !isset($_FILES['note_file'])) { http_response_code(405); echo json_encode(["success" => false, "message" => "Invalid request method or no file uploaded."]); exit(); }

        $note_file = $_FILES['note_file'];
        $title = isset($_POST['title']) ? sanitize_input($_POST['title']) : '';
        $subject_id = isset($_POST['subject_id']) ? (int)$_POST['subject_id'] : 0;
        $chapter_id = isset($_POST['chapter_id']) ? (int)$_POST['chapter_id'] : null;

        if (empty($title) || $subject_id === 0) { http_response_code(400); echo json_encode(["success" => false, "message" => "Title and Subject are required."]); exit(); }

        // File Validation and Type Determination
        $file_ext = strtolower(pathinfo($note_file['name'], PATHINFO_EXTENSION));
        $file_type = null;

        if (!in_array($file_ext, $ALLOWED_FILE_TYPES)) { http_response_code(400); echo json_encode(["success" => false, "message" => "Unsupported file type: {$file_ext}"]); exit(); }

        if (in_array($file_ext, ['pdf'])) { $file_type = 'pdf'; } 
        elseif (in_array($file_ext, ['jpg', 'jpeg', 'png'])) { $file_type = 'image'; } 
        elseif (in_array($file_ext, ['mp4', 'mov'])) { $file_type = 'video'; } 
        elseif ($file_ext === 'txt') { $file_type = 'text'; } 
        else { $file_type = 'text'; }

        // File Upload
        $new_filename = uniqid('note_', true) . '.' . $file_ext;
        $target_file = $UPLOAD_DIR . $new_filename;
        $file_path = $target_file; 
        
        if (move_uploaded_file($note_file['tmp_name'], $target_file)) {
            try {
                $stmt = $pdo->prepare("INSERT INTO notes (title, subject_id, chapter_id, file_path, file_type, edit_count, last_edited) VALUES (?, ?, ?, ?, ?, 0, NOW())");
                $stmt->execute([$title, $subject_id, $chapter_id, $file_path, $file_type]);
                $note_id = $pdo->lastInsertId();

                // History Log: Creation
                 $pdo->prepare("INSERT INTO note_history (note_id, change_description, user_action) VALUES (?, ?, 'CREATE')")
                     ->execute([$note_id, 'Note file uploaded: ' . $new_filename]);
                
                echo json_encode(["success" => true, "message" => "Note uploaded successfully!", "note_id" => $note_id]);

            } catch (PDOException $e) {
                if (file_exists($target_file)) { unlink($target_file); }
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Database error during save: " . $e->getMessage()]);
            }
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "File upload failed on server. Check permissions of 'uploads' folder."]);
        }
        break;


    case 'update_note': // Edit Note Logic
        require_admin_login(); 
        if ($method !== 'POST') { http_response_code(405); echo json_encode(["success" => false, "message" => "Method Not Allowed."]); exit(); }

        $note_id = (int)$_POST['id'];
        $title = sanitize_input($_POST['title']);
        $description = sanitize_input($_POST['description']);
        $chapter_id = isset($_POST['chapter_id']) ? (int)$_POST['chapter_id'] : null;

        try {
            // Get old data for history
            $stmt_old = $pdo->prepare("SELECT title, chapter_id FROM notes WHERE id = ?");
            $stmt_old->execute([$note_id]);
            $old_note = $stmt_old->fetch();
            
            // Perform the update
            $stmt = $pdo->prepare("UPDATE notes SET title = ?, chapter_id = ?, description = ?, edit_count = edit_count + 1, last_edited = NOW() WHERE id = ?");
            $stmt->execute([$title, $chapter_id, $description, $note_id]);
            
            // Log History (if title changed)
            if ($old_note['title'] !== $title) {
                $pdo->prepare("INSERT INTO note_history (note_id, change_description, user_action) VALUES (?, ?, 'UPDATE_TITLE')")
                    ->execute([$note_id, "Title changed from '{$old_note['title']}' to '{$title}'"]);
            }
            
            echo json_encode(["success" => true, "message" => "Note updated successfully!"]);
        } catch (PDOException $e) { http_response_code(500); echo json_encode(["success" => false, "message" => "DB error: " . $e->getMessage()]); }
        break;
        
    case 'delete_note': // Soft Delete Note (POST/DELETE fix)
        require_admin_login(); 
        if ($method !== 'DELETE' && $method !== 'POST') { http_response_code(405); echo json_encode(["success" => false, "message" => "Method Not Allowed."]); exit(); }
        $note_id = isset($_REQUEST['id']) ? (int)$_REQUEST['id'] : 0;
        
        try {
            // Soft Delete: is_deleted = TRUE
            $stmt = $pdo->prepare("UPDATE notes SET is_deleted = TRUE, deleted_at = NOW() WHERE id = ?");
            $stmt->execute([$note_id]);
            
            // Log History
            $pdo->prepare("INSERT INTO note_history (note_id, change_description, user_action) VALUES (?, ?, 'SOFT_DELETE')")
                ->execute([$note_id, "Note moved to trash by admin."]);
            
            if ($stmt->rowCount() > 0) { echo json_encode(["success" => true, "message" => "Note moved to trash successfully!"]); } 
            else { http_response_code(404); echo json_encode(["success" => false, "message" => "Note not found."]); }

        } catch (PDOException $e) { http_response_code(500); echo json_encode(["success" => false, "message" => "DB error: " . $e->getMessage()]); }
        break;


    case 'get_history': // Fetch History for Admin View
        require_admin_login();
        if ($method !== 'GET') { http_response_code(405); echo json_encode(["success" => false, "message" => "Method Not Allowed."]); exit(); }
        $note_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        
        try {
            $stmt = $pdo->prepare("SELECT * FROM note_history WHERE note_id = ? ORDER BY changed_at DESC");
            $stmt->execute([$note_id]);
            echo json_encode(["success" => true, "data" => $stmt->fetchAll()]);
        } catch (PDOException $e) { http_response_code(500); echo json_encode(["success" => false, "message" => "DB error: " . $e->getMessage()]); }
        break;
        
    case 'list_notes_admin': // List all ACTIVE notes for Admin Table
        require_admin_login();
        if ($method !== 'GET') { http_response_code(405); echo json_encode(["success" => false, "message" => "Method Not Allowed."]); exit(); }
        
        try {
            $sql = "
                SELECT 
                    n.id, n.title, n.file_type, n.upload_date, c.name AS chapter_name, s.id AS subject_id,
                    n.edit_count, n.last_edited
                FROM notes n
                LEFT JOIN chapters c ON n.chapter_id = c.id
                LEFT JOIN subjects s ON n.subject_id = s.id
                WHERE n.is_deleted = FALSE 
                ORDER BY n.upload_date DESC
            ";
            $stmt = $pdo->query($sql);
            $notes = $stmt->fetchAll();

            echo json_encode(["success" => true, "data" => $notes]);
        } catch (PDOException $e) { http_response_code(500); echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]); }
        break;


    // --------------------------------------------------------------------------------
    // SECTION 3: FRONTEND READ OPERATIONS (PUBLIC)
    // --------------------------------------------------------------------------------
    
    case 'subject_notes':
        if ($method !== 'GET') { http_response_code(405); echo json_encode(["success" => false, "message" => "Method Not Allowed."]); exit(); }
        $subject_slug = isset($_GET['slug']) ? sanitize_input($_GET['slug']) : '';
        
        try {
            // ... (SQL to fetch subject details)
            $stmt = $pdo->prepare("SELECT id, name FROM subjects WHERE LOWER(REPLACE(name, ' ', '-')) = ?");
            $stmt->execute([$subject_slug]);
            $subject = $stmt->fetch();
            $subject_id = $subject['id'];

            $sql = "
                SELECT 
                    n.id, n.title, n.file_path, n.file_type, n.upload_date, c.name AS chapter_name
                FROM notes n
                LEFT JOIN chapters c ON n.chapter_id = c.id
                WHERE n.subject_id = ? AND n.is_deleted = FALSE -- only active notes
                ORDER BY c.name ASC, n.upload_date DESC
            ";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$subject_id]);
            $notes = $stmt->fetchAll();

            // Mock/Demo text preview
            foreach ($notes as &$note) {
                if ($note['file_type'] === 'text') {
                    $note['preview_text'] = "এটি একটি ডেমো টেক্সট প্রিভিউ। মূল ফাইল লোড হলে, প্রথম কিছু লাইন এখানে দেখা যাবে।";
                }
            }
            unset($note);
            
            echo json_encode(["success" => true, "subject_name" => $subject['name'], "notes" => $notes]);

        } catch (PDOException $e) { http_response_code(500); echo json_encode(["success" => false, "message" => "DB error: " . $e->getMessage()]); }
        break;

    case 'get_note':
        if ($method !== 'GET') { http_response_code(405); echo json_encode(["success" => false, "message" => "Method Not Allowed."]); exit(); }
        $note_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        
        try {
            // ... (SQL to fetch note details)
            
            echo json_encode(["success" => true, "data" => $note]);

        } catch (PDOException $e) { http_response_code(500); echo json_encode(["success" => false, "message" => "DB error: " . $e->getMessage()]); }
        break;

    default:
        http_response_code(400); echo json_encode(["success" => false, "message" => "Invalid action specified."]);
        break;
}
?>