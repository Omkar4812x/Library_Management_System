<?php
require_once 'config.php';
requireAuth();
syncOverdueStatus($pdo);

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

function bookRow(array $row): array {
    return [
        'id' => $row['book_code'],
        'dbId' => (int) $row['id'],
        'title' => $row['title'],
        'author' => $row['author'],
        'category' => $row['category'],
        'isbn' => $row['isbn'] ?? '',
        'publisher' => $row['publisher'] ?? '',
        'year' => $row['year_published'],
        'copies' => (int) $row['total_copies'],
        'available' => (int) $row['available_copies'],
        'shelf' => $row['shelf_location'] ?? '',
        'createdAt' => $row['created_at'],
    ];
}

switch ($method) {
    case 'GET':
        $search = $_GET['search'] ?? '';
        $category = $_GET['category'] ?? '';
        $status = $_GET['status'] ?? '';

        $sql = 'SELECT * FROM books WHERE 1=1';
        $params = [];

        if ($id) {
            $sql .= ' AND book_code = ?';
            $params[] = $id;
        }
        if ($search) {
            $sql .= ' AND (title LIKE ? OR author LIKE ? OR book_code LIKE ? OR isbn LIKE ?)';
            $like = "%$search%";
            array_push($params, $like, $like, $like, $like);
        }
        if ($category) {
            $sql .= ' AND category = ?';
            $params[] = $category;
        }
        if ($status === 'Available') {
            $sql .= ' AND available_copies > 0';
        } elseif ($status === 'Issued') {
            $sql .= ' AND available_copies = 0';
        }

        $sql .= ' ORDER BY id ASC';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $books = array_map('bookRow', $rows);
        respond(['success' => true, 'data' => $books, 'total' => count($books)]);

    case 'POST':
        $body = getBody();
        $title = trim($body['title'] ?? '');
        $author = trim($body['author'] ?? '');
        $category = trim($body['category'] ?? '');
        $copies = (int) ($body['copies'] ?? 1);

        if (!$title || !$author || !$category || $copies < 1) {
            respond(['success' => false, 'error' => 'title, author, category and copies are required'], 400);
        }

        $code = generateCode($pdo, 'book_counter', 'B');

        $stmt = $pdo->prepare('INSERT INTO books (book_code, title, author, category, isbn, publisher, year_published, total_copies, available_copies, shelf_location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $code,
            $title,
            $author,
            $category,
            trim($body['isbn'] ?? ''),
            trim($body['publisher'] ?? ''),
            (int) ($body['year'] ?? 0) ?: null,
            $copies,
            $copies,
            trim($body['shelf'] ?? ''),
        ]);

        $newId = $pdo->lastInsertId();
        $stmt2 = $pdo->prepare('SELECT * FROM books WHERE id = ?');
        $stmt2->execute([$newId]);
        respond(['success' => true, 'data' => bookRow($stmt2->fetch()), 'message' => "\"$title\" added to library"], 201);

    case 'PUT':
        if (!$id) {
            respond(['success' => false, 'error' => 'Book code required'], 400);
        }

        $body = getBody();
        $stmt = $pdo->prepare('SELECT * FROM books WHERE book_code = ?');
        $stmt->execute([$id]);
        $book = $stmt->fetch();
        if (!$book) {
            respond(['success' => false, 'error' => 'Book not found'], 404);
        }

        $newCopies = (int) ($body['copies'] ?? $book['total_copies']);
        $issuedCount = $book['total_copies'] - $book['available_copies'];
        $newAvailable = max(0, $newCopies - $issuedCount);

        $stmt = $pdo->prepare('UPDATE books SET title = ?, author = ?, category = ?, isbn = ?, publisher = ?, year_published = ?, total_copies = ?, available_copies = ?, shelf_location = ? WHERE book_code = ?');
        $stmt->execute([
            trim($body['title'] ?? $book['title']),
            trim($body['author'] ?? $book['author']),
            trim($body['category'] ?? $book['category']),
            trim($body['isbn'] ?? $book['isbn']),
            trim($body['publisher'] ?? $book['publisher']),
            (int) ($body['year'] ?? $book['year_published']) ?: null,
            $newCopies,
            $newAvailable,
            trim($body['shelf'] ?? $book['shelf_location']),
            $id,
        ]);

        $stmt2 = $pdo->prepare('SELECT * FROM books WHERE book_code = ?');
        $stmt2->execute([$id]);
        respond(['success' => true, 'data' => bookRow($stmt2->fetch()), 'message' => 'Book updated successfully']);

    case 'DELETE':
        if (!$id) {
            respond(['success' => false, 'error' => 'Book code required'], 400);
        }

        $stmt = $pdo->prepare('SELECT COUNT(*) FROM transactions t JOIN books b ON t.book_id = b.id WHERE b.book_code = ? AND t.status IN (\'Active\', \'Overdue\')');
        $stmt->execute([$id]);
        if ((int) $stmt->fetchColumn() > 0) {
            respond(['success' => false, 'error' => 'Cannot delete – book is currently issued to a member'], 409);
        }

        $stmt = $pdo->prepare('DELETE FROM books WHERE book_code = ?');
        $stmt->execute([$id]);
        respond(['success' => true, 'message' => 'Book deleted successfully']);

    default:
        respond(['success' => false, 'error' => 'Method not allowed'], 405);
}
