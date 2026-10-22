<?php
require_once 'config.php';
requireAuth();
syncOverdueStatus($pdo);

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';
$id = $_GET['id'] ?? null;

function txnRow(array $r): array {
    return [
        'id' => $r['trans_code'],
        'dbId' => (int) $r['id'],
        'bookId' => $r['book_code'],
        'bookTitle' => $r['book_title'],
        'bookAuthor' => $r['author'] ?? '',
        'memberId' => $r['member_code'],
        'memberName' => $r['member_name'],
        'memberType' => $r['member_type'],
        'issueDate' => $r['issue_date'],
        'dueDate' => $r['due_date'],
        'returnDate' => $r['return_date'],
        'fine' => (float) $r['fine_amount'],
        'finePaid' => (bool) $r['fine_paid'],
        'status' => $r['status'],
    ];
}

function fetchTxns(PDO $pdo, string $where = '', array $params = [], string $filter = ''): array {
    $filterSql = '';
    if ($filter && $filter !== 'all') {
        $filterSql = ' AND t.status = ' . $pdo->quote(ucfirst($filter));
    }

    $sql = "SELECT t.*, t.trans_code, t.fine_amount, t.fine_paid, b.book_code, b.title AS book_title, b.author, m.member_code, m.name AS member_name, m.type AS member_type FROM transactions t JOIN books b ON t.book_id = b.id JOIN members m ON t.member_id = m.id WHERE 1=1 $where $filterSql ORDER BY t.id DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return array_map('txnRow', $stmt->fetchAll());
}

switch ($action) {
    case 'list':
        $filter = $_GET['filter'] ?? 'all';
        $data = fetchTxns($pdo, '', [], $filter);
        respond(['success' => true, 'data' => $data, 'total' => count($data)]);

    case 'issue':
        if ($method !== 'POST') {
            respond(['success' => false, 'error' => 'POST required'], 405);
        }

        $body = getBody();
        $bookCode = trim($body['bookId'] ?? '');
        $memCode = trim($body['memberId'] ?? '');
        $dueDate = trim($body['dueDate'] ?? '');

        if (!$bookCode || !$memCode || !$dueDate) {
            respond(['success' => false, 'error' => 'bookId, memberId, dueDate are required'], 400);
        }

        $stmtB = $pdo->prepare('SELECT * FROM books WHERE book_code = ?');
        $stmtB->execute([$bookCode]);
        $book = $stmtB->fetch();
        if (!$book) {
            respond(['success' => false, 'error' => 'Book not found'], 404);
        }
        if ((int) $book['available_copies'] < 1) {
            respond(['success' => false, 'error' => 'No copies available for this book'], 409);
        }

        $stmtM = $pdo->prepare("SELECT * FROM members WHERE member_code = ? AND status = 'Active'");
        $stmtM->execute([$memCode]);
        $member = $stmtM->fetch();
        if (!$member) {
            respond(['success' => false, 'error' => 'Member not found or inactive'], 404);
        }

        $dup = $pdo->prepare("SELECT COUNT(*) FROM transactions t WHERE t.book_id = ? AND t.member_id = ? AND t.status IN ('Active', 'Overdue')");
        $dup->execute([$book['id'], $member['id']]);
        if ((int) $dup->fetchColumn() > 0) {
            respond(['success' => false, 'error' => 'This member already has this book issued'], 409);
        }

        if ($dueDate <= date('Y-m-d')) {
            respond(['success' => false, 'error' => 'Due date must be in the future'], 400);
        }

        $transCode = generateCode($pdo, 'trans_counter', 'T');

        $pdo->beginTransaction();
        try {
            $ins = $pdo->prepare('INSERT INTO transactions (trans_code, book_id, member_id, issue_date, due_date, status) VALUES (?, ?, ?, CURDATE(), ?, "Active")');
            $ins->execute([$transCode, $book['id'], $member['id'], $dueDate]);

            $pdo->prepare('UPDATE books SET available_copies = available_copies - 1 WHERE id = ?')->execute([$book['id']]);
            $pdo->prepare('UPDATE members SET books_issued = books_issued + 1 WHERE id = ?')->execute([$member['id']]);
            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            respond(['success' => false, 'error' => 'Transaction failed: ' . $e->getMessage()], 500);
        }

        $data = fetchTxns($pdo, 'AND t.trans_code = ?', [$transCode]);
        respond(['success' => true, 'data' => $data[0] ?? [], 'message' => "\"{$book['title']}\" issued to {$member['name']}" ]);

    case 'return':
        if ($method !== 'POST') {
            respond(['success' => false, 'error' => 'POST required'], 405);
        }
        if (!$id) {
            respond(['success' => false, 'error' => 'Transaction code required'], 400);
        }

        $stmt = $pdo->prepare('SELECT t.*, b.title AS book_title, m.name AS member_name, b.id AS book_db_id, m.id AS member_db_id FROM transactions t JOIN books b ON t.book_id = b.id JOIN members m ON t.member_id = m.id WHERE t.trans_code = ?');
        $stmt->execute([$id]);
        $txn = $stmt->fetch();

        if (!$txn) {
            respond(['success' => false, 'error' => 'Transaction not found'], 404);
        }
        if ($txn['status'] === 'Returned') {
            respond(['success' => false, 'error' => 'Book already returned'], 409);
        }

        $today = new DateTime('today');
        $dueDate = new DateTime($txn['due_date']);
        $interval = $dueDate->diff($today);
        $overdueDays = ($today > $dueDate) ? (int) $interval->days : 0;
        $fine = $overdueDays * FINE_PER_DAY;

        $pdo->beginTransaction();
        try {
            $pdo->prepare('UPDATE transactions SET status = "Returned", return_date = CURDATE(), fine_amount = ? WHERE trans_code = ?')->execute([$fine, $id]);
            $pdo->prepare('UPDATE books SET available_copies = available_copies + 1 WHERE id = ?')->execute([$txn['book_db_id']]);
            $pdo->prepare('UPDATE members SET books_issued = GREATEST(0, books_issued - 1) WHERE id = ?')->execute([$txn['member_db_id']]);
            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            respond(['success' => false, 'error' => 'Return failed: ' . $e->getMessage()], 500);
        }

        $msg = $fine > 0 ? "Book returned. Fine: ₹$fine ($overdueDays days overdue). Please collect from member." : 'Book returned successfully! No fine applicable.';
        respond(['success' => true, 'fine' => $fine, 'overdueDays' => $overdueDays, 'message' => $msg]);

    case 'pay_fine':
        if ($method !== 'PUT' && $method !== 'POST') {
            respond(['success' => false, 'error' => 'PUT or POST required'], 405);
        }
        if (!$id) {
            respond(['success' => false, 'error' => 'Transaction code required'], 400);
        }

        $stmt = $pdo->prepare('SELECT * FROM transactions WHERE trans_code = ?');
        $stmt->execute([$id]);
        $txn = $stmt->fetch();
        if (!$txn) {
            respond(['success' => false, 'error' => 'Transaction not found'], 404);
        }
        if ($txn['fine_paid']) {
            respond(['success' => false, 'error' => 'Fine already marked as paid'], 409);
        }

        $pdo->prepare('UPDATE transactions SET fine_paid = 1 WHERE trans_code = ?')->execute([$id]);
        respond(['success' => true, 'message' => "Fine of ₹{$txn['fine_amount']} marked as paid"]);

    case 'reserve':
        if ($method !== 'POST') {
            respond(['success' => false, 'error' => 'POST required'], 405);
        }

        $body = getBody();
        $bookCode = trim($body['bookId'] ?? '');
        $memCode = trim($body['memberId'] ?? '');
        if (!$bookCode || !$memCode) {
            respond(['success' => false, 'error' => 'bookId and memberId required'], 400);
        }

        $stmtB = $pdo->prepare('SELECT * FROM books WHERE book_code = ?');
        $stmtB->execute([$bookCode]);
        $book = $stmtB->fetch();
        if (!$book) {
            respond(['success' => false, 'error' => 'Book not found'], 404);
        }
        if ((int) $book['available_copies'] > 0) {
            respond(['success' => false, 'error' => 'Book is available – please issue directly'], 409);
        }

        $stmtM = $pdo->prepare('SELECT * FROM members WHERE member_code = ?');
        $stmtM->execute([$memCode]);
        $member = $stmtM->fetch();
        if (!$member) {
            respond(['success' => false, 'error' => 'Member not found'], 404);
        }

        $dup = $pdo->prepare("SELECT id FROM reservations WHERE book_id = ? AND member_id = ? AND status = 'Pending'");
        $dup->execute([$book['id'], $member['id']]);
        if ($dup->fetch()) {
            respond(['success' => false, 'error' => 'Member already has a pending reservation for this book'], 409);
        }

        $resCode = generateCode($pdo, 'reserve_counter', 'R');
        $pdo->prepare('INSERT INTO reservations (reserve_code, book_id, member_id, reserve_date) VALUES (?, ?, ?, CURDATE())')->execute([$resCode, $book['id'], $member['id']]);

        respond(['success' => true, 'message' => "\"{$book['title']}\" reserved for {$member['name']} (Code: $resCode)"], 201);

    case 'reservations':
        $stmt = $pdo->prepare('SELECT r.reserve_code, r.reserve_date, r.status, b.book_code, b.title AS book_title, b.available_copies, m.member_code, m.name AS member_name FROM reservations r JOIN books b ON r.book_id = b.id JOIN members m ON r.member_id = m.id ORDER BY r.id DESC');
        $stmt->execute();
        respond(['success' => true, 'data' => $stmt->fetchAll()]);

    default:
        respond(['success' => false, 'error' => "Unknown action: $action"], 400);
}
