<?php
require_once 'config.php';
requireAuth();
syncOverdueStatus($pdo);

$stmt = $pdo->query('SELECT COUNT(*) FROM books');
$totalBooks = (int) $stmt->fetchColumn();

$stmt = $pdo->query('SELECT COUNT(*) FROM members');
$totalMembers = (int) $stmt->fetchColumn();

$stmt = $pdo->query("SELECT COUNT(*) FROM transactions WHERE status IN ('Active', 'Overdue')");
$totalIssued = (int) $stmt->fetchColumn();

$stmt = $pdo->query('SELECT SUM(available_copies) FROM books');
$totalAvailable = (int) ($stmt->fetchColumn() ?? 0);

$stmt = $pdo->query("SELECT COUNT(*) FROM transactions WHERE status = 'Overdue'");
$totalOverdue = (int) $stmt->fetchColumn();

$stmt = $pdo->query("SELECT COALESCE(SUM(fine_amount), 0) FROM transactions WHERE status = 'Overdue' AND fine_paid = 0");
$totalFineUnpaid = (float) $stmt->fetchColumn();

$stmt = $pdo->query("SELECT COALESCE(SUM(fine_amount), 0) FROM transactions WHERE fine_paid = 1");
$totalFineCollected = (float) $stmt->fetchColumn();

$stmt = $pdo->query("SELECT category, SUM(total_copies) as total FROM books GROUP BY category ORDER BY total DESC");
$categories = $stmt->fetchAll();

$stmt = $pdo->query("SELECT b.title AS book_title, m.name AS member_name, t.status, t.issue_date FROM transactions t JOIN books b ON b.id = t.book_id JOIN members m ON m.id = t.member_id ORDER BY t.id DESC LIMIT 6");
$recent = $stmt->fetchAll();

$stmt = $pdo->query("SELECT t.trans_code, b.title AS book_title, m.name AS member_name, DATEDIFF(CURDATE(), t.due_date) AS days_overdue, t.fine_amount, m.phone FROM transactions t JOIN books b ON b.id = t.book_id JOIN members m ON m.id = t.member_id WHERE t.status = 'Overdue' ORDER BY t.id DESC");
$overdueList = $stmt->fetchAll();

$stmt = $pdo->query("SELECT DATE_FORMAT(issue_date, '%b') AS month_label, COUNT(*) AS issue_count FROM transactions WHERE issue_date >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH) GROUP BY YEAR(issue_date), MONTH(issue_date), DATE_FORMAT(issue_date, '%b') ORDER BY YEAR(issue_date), MONTH(issue_date) ASC");
$trend = $stmt->fetchAll();

respond([
    'success' => true,
    'stats' => [
        'totalBooks' => $totalBooks,
        'totalMembers' => $totalMembers,
        'totalIssued' => $totalIssued,
        'totalAvailable' => $totalAvailable,
        'totalOverdue' => $totalOverdue,
        'totalFineUnpaid' => $totalFineUnpaid,
        'totalFineCollected' => $totalFineCollected,
    ],
    'categories' => $categories,
    'recent' => $recent,
    'overdueList' => $overdueList,
    'trend' => $trend,
]);
