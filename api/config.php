<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

session_start();

// Database config for local MySQL
define('DB_HOST', 'localhost');
define('DB_PORT', 3306);
define('DB_NAME', 'librax_db');
define('DB_USER', 'root');
define('DB_PASS', 'root');
define('FINE_PER_DAY', 2);

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'DB Connection failed: ' . $e->getMessage()]);
    exit;
}

function respond($data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function requireAuth(): void {
    if (!isset($_SESSION['librax_user'])) {
        respond(['success' => false, 'error' => 'Unauthorized. Please login.'], 401);
    }
}

function getBody(): array {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}

function generateCode(PDO $pdo, string $counterName, string $prefix): string {
    $pdo->beginTransaction();
    try {
        $pdo->exec("UPDATE id_counters SET counter_value = counter_value + 1 WHERE counter_name = " . $pdo->quote($counterName));
        $stmt = $pdo->prepare('SELECT counter_value FROM id_counters WHERE counter_name = ?');
        $stmt->execute([$counterName]);
        $row = $stmt->fetch();
        $pdo->commit();
        return $prefix . str_pad((int)$row['counter_value'], 3, '0', STR_PAD_LEFT);
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function syncOverdueStatus(PDO $pdo): void {
    $pdo->exec("UPDATE transactions SET status = 'Overdue' WHERE status = 'Active' AND due_date < CURDATE()");
    $pdo->exec("UPDATE transactions SET fine_amount = DATEDIFF(CURDATE(), due_date) * " . FINE_PER_DAY . " WHERE status = 'Overdue' AND fine_paid = 0");
}
