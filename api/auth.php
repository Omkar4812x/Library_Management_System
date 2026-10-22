<?php
require_once 'config.php';

$action = $_GET['action'] ?? 'check';

switch ($action) {
    case 'check':
        if (isset($_SESSION['librax_user'])) {
            respond(['success' => true, 'user' => $_SESSION['librax_user']]);
        }
        respond(['success' => false, 'error' => 'Not logged in'], 401);

    case 'login':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            respond(['success' => false, 'error' => 'Method not allowed'], 405);
        }

        $body = getBody();
        $username = trim($body['username'] ?? '');
        $password = trim($body['password'] ?? '');

        if (!$username || !$password) {
            respond(['success' => false, 'error' => 'Username and password required'], 400);
        }

        $stmt = $pdo->prepare('SELECT id, username, name, role FROM users WHERE username = ? AND password = MD5(?)');
        $stmt->execute([$username, $password]);
        $user = $stmt->fetch();

        if ($user) {
            $_SESSION['librax_user'] = $user;
            respond(['success' => true, 'user' => $user]);
        } else {
            respond(['success' => false, 'error' => 'Invalid username or password'], 401);
        }

    case 'logout':
        session_unset();
        session_destroy();
        respond(['success' => true, 'message' => 'Logged out successfully']);

    default:
        respond(['success' => false, 'error' => 'Unknown action'], 400);
}
