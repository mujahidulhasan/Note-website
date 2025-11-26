<?php
require_once __DIR__ . '/core.php';

try {
    $stmt = $pdo->query("SELECT 1 AS ok");
    $row = $stmt->fetch();
    echo json_encode(["success" => true, "message" => "DB connected", "row" => $row]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "DB connection/query failed: " . $e->getMessage()]);
}

?>