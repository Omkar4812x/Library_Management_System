<?php
require_once 'config.php';
requireAuth();
syncOverdueStatus($pdo);

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$history = $_GET['history'] ?? null;

function memberRow(array $row): array {
    return [
        'id' => $row['member_code'],
        'dbId' => (int) $row['id'],
        'name' => $row['name'],
        'type' => $row['type'],
        'email' => $row['email'],
        'phone' => $row['phone'],
        'dept' => $row['department'] ?? '',
        'year' => $row['enrollment_year'],
        'booksIssued' => (int) $row['books_issued'],
        'status' => $row['status'],
    ];
}

switch ($method) {
    case 'GET':
        $search = $_GET['search'] ?? '';
        $type = $_GET['type'] ?? '';

        $sql = 'SELECT * FROM members WHERE 1=1';
        $params = [];

        if ($id) {
            $sql .= ' AND member_code = ?';
            $params[] = $id;
        }
        if ($search) {
            $sql .= ' AND (name LIKE ? OR email LIKE ? OR member_code LIKE ? OR phone LIKE ?)';
            $like = "%$search%";
            array_push($params, $like, $like, $like, $like);
        }
        if ($type) {
            $sql .= ' AND type = ?';
            $params[] = $type;
        }

        $sql .= ' ORDER BY id ASC';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        if ($history && $id) {
            $stmt2 = $pdo->prepare('SELECT t.trans_code, b.title AS book_title, t.issue_date, t.due_date, t.return_date, t.fine_amount, t.status FROM transactions t JOIN books b ON t.book_id = b.id WHERE t.member_id = (SELECT id FROM members WHERE member_code = ?) ORDER BY t.id DESC');
            $stmt2->execute([$id]);
            respond(['success' => true, 'data' => $stmt2->fetchAll()]);
        }

        $members = array_map('memberRow', $rows);
        respond(['success' => true, 'data' => $members, 'total' => count($members)]);

    case 'POST':
        $body = getBody();
        $name = trim($body['name'] ?? '');
        $type = trim($body['type'] ?? 'Student');
        $email = trim($body['email'] ?? '');
        $phone = trim($body['phone'] ?? '');

        if (!$name || !$email || !$phone) {
            respond(['success' => false, 'error' => 'name, email and phone are required'], 400);
        }

        $code = generateCode($pdo, 'member_counter', 'M');

        $stmt = $pdo->prepare('INSERT INTO members (member_code, name, type, email, phone, department, enrollment_year, books_issued, status) VALUES (?, ?, ?, ?, ?, ?, ?, 0, \"Active\")');
        $stmt->execute([
            $code,
            $name,
            $type,
            $email,
            $phone,
            trim($body['dept'] ?? ''),
            (int) ($body['year'] ?? 0) ?: null,
        ]);

        $newId = $pdo->lastInsertId();
        $stmt2 = $pdo->prepare('SELECT * FROM members WHERE id = ?');
        $stmt2->execute([$newId]);
        respond(['success' => true, 'data' => memberRow($stmt2->fetch()), 'message' => "\"$name\" added successfully"], 201);

    case 'PUT':
        if (!$id) {
            respond(['success' => false, 'error' => 'Member code required'], 400);
        }

        $body = getBody();
        $stmt = $pdo->prepare('SELECT * FROM members WHERE member_code = ?');
        $stmt->execute([$id]);
        $member = $stmt->fetch();
        if (!$member) {
            respond(['success' => false, 'error' => 'Member not found'], 404);
        }

        $stmt = $pdo->prepare('UPDATE members SET name = ?, type = ?, email = ?, phone = ?, department = ?, enrollment_year = ? WHERE member_code = ?');
        $stmt->execute([
            trim($body['name'] ?? $member['name']),
            trim($body['type'] ?? $member['type']),
            trim($body['email'] ?? $member['email']),
            trim($body['phone'] ?? $member['phone']),
            trim($body['dept'] ?? $member['department']),
            (int) ($body['year'] ?? $member['enrollment_year']) ?: null,
            $id,
        ]);

        $stmt2 = $pdo->prepare('SELECT * FROM members WHERE member_code = ?');
        $stmt2->execute([$id]);
        respond(['success' => true, 'data' => memberRow($stmt2->fetch()), 'message' => 'Member updated successfully']);

    case 'DELETE':
        if (!$id) {
            respond(['success' => false, 'error' => 'Member code required'], 400);
        }

        $stmt = $pdo->prepare('SELECT COUNT(*) FROM transactions WHERE member_id = (SELECT id FROM members WHERE member_code = ?) AND status IN (\'Active\', \'Overdue\')');
        $stmt->execute([$id]);
        if ((int) $stmt->fetchColumn() > 0) {
            respond(['success' => false, 'error' => 'Cannot delete – member has active transactions'], 409);
        }

        $stmt = $pdo->prepare('DELETE FROM members WHERE member_code = ?');
        $stmt->execute([$id]);
        respond(['success' => true, 'message' => 'Member deleted successfully']);

    default:
        respond(['success' => false, 'error' => 'Method not allowed'], 405);
}
