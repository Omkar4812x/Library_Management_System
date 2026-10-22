CREATE DATABASE IF NOT EXISTS librax_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE librax_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('admin','librarian') DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_code VARCHAR(10) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    isbn VARCHAR(30),
    publisher VARCHAR(255),
    year_published INT,
    total_copies INT DEFAULT 1,
    available_copies INT DEFAULT 1,
    shelf_location VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('Student','Faculty','Staff') DEFAULT 'Student',
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    department VARCHAR(100),
    enrollment_year INT,
    books_issued INT DEFAULT 0,
    status ENUM('Active','Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trans_code VARCHAR(10) UNIQUE NOT NULL,
    book_id INT NOT NULL,
    member_id INT NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE DEFAULT NULL,
    fine_amount DECIMAL(8,2) DEFAULT 0.00,
    fine_paid TINYINT(1) DEFAULT 0,
    status ENUM('Active','Returned','Overdue') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE RESTRICT,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reserve_code VARCHAR(10) UNIQUE NOT NULL,
    book_id INT NOT NULL,
    member_id INT NOT NULL,
    reserve_date DATE NOT NULL,
    status ENUM('Pending','Fulfilled','Cancelled') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS id_counters (
    counter_name VARCHAR(50) PRIMARY KEY,
    counter_value INT DEFAULT 0
);

INSERT INTO users (username, password, name, role) VALUES
    ('admin', MD5('admin123'), 'Administrator', 'admin')
ON DUPLICATE KEY UPDATE username = username;

INSERT INTO id_counters (counter_name, counter_value) VALUES
    ('book_counter', 0),
    ('member_counter', 0),
    ('trans_counter', 0),
    ('reserve_counter', 0)
ON DUPLICATE KEY UPDATE counter_name = counter_name;

INSERT INTO books (book_code, title, author, category, isbn, publisher, year_published, total_copies, available_copies, shelf_location) VALUES
    ('B001', 'Introduction to Algorithms', 'Thomas H. Cormen', 'Computer Science', '978-0262033848', 'MIT Press', 2009, 3, 2, 'CS-01'),
    ('B002', 'Clean Code', 'Robert C. Martin', 'Technology', '978-0132350884', 'Prentice Hall', 2008, 2, 2, 'T-03'),
    ('B003', 'The Great Gatsby', 'F. Scott Fitzgerald', 'Fiction', '978-0743273565', 'Scribner', 1925, 4, 4, 'L-02'),
    ('B004', 'A Brief History of Time', 'Stephen Hawking', 'Science', '978-0553380163', 'Bantam Books', 1988, 2, 1, 'S-01'),
    ('B005', 'Discrete Mathematics', 'Kenneth H. Rosen', 'Mathematics', '978-0073383095', 'McGraw-Hill', 2012, 3, 3, 'M-01'),
    ('B006', 'The Art of War', 'Sun Tzu', 'History', '978-1599869773', 'El Paso Norte Press', 2009, 2, 2, 'H-01'),
    ('B007', 'Operating System Concepts', 'Abraham Silberschatz', 'Computer Science', '978-1118063330', 'Wiley', 2018, 4, 3, 'CS-02'),
    ('B008', 'Database System Concepts', 'Henry F. Korth', 'Computer Science', '978-0078022159', 'McGraw-Hill', 2019, 3, 2, 'CS-03'),
    ('B009', 'Linear Algebra Done Right', 'Sheldon Axler', 'Mathematics', '978-3319110806', 'Springer', 2015, 2, 2, 'M-02'),
    ('B010', 'Wings of Fire', 'A.P.J. Abdul Kalam', 'Literature', '978-8173711466', 'Universities Press', 1999, 5, 4, 'LT-01'),
    ('B011', 'Computer Networks', 'Andrew S. Tanenbaum', 'Computer Science', '978-0132126953', 'Pearson', 2010, 3, 3, 'CS-04'),
    ('B012', 'The Alchemist', 'Paulo Coelho', 'Fiction', '978-0062315007', 'HarperCollins', 2014, 3, 3, 'L-03')
ON DUPLICATE KEY UPDATE title = title;

UPDATE id_counters SET counter_value = 12 WHERE counter_name = 'book_counter';

INSERT INTO members (member_code, name, type, email, phone, department, enrollment_year, books_issued, status) VALUES
    ('M001', 'Arjun Sharma', 'Student', 'arjun.sharma@mca.edu', '9876543210', 'MCA', 2024, 1, 'Active'),
    ('M002', 'Priya Patil', 'Student', 'priya.patil@mca.edu', '9812345678', 'MCA', 2024, 2, 'Active'),
    ('M003', 'Dr. Rajesh Desai', 'Faculty', 'r.desai@college.edu', '9765432100', 'CS Dept.', 2018, 0, 'Active'),
    ('M004', 'Sneha Kulkarni', 'Student', 'sneha.k@mca.edu', '9899887766', 'MCA', 2025, 1, 'Active'),
    ('M005', 'Rohan Mehta', 'Student', 'rohan.m@mca.edu', '9123456789', 'MCA', 2024, 0, 'Active'),
    ('M006', 'Prof. Anita Joshi', 'Faculty', 'anita.j@college.edu', '9000001111', 'Mathematics', 2015, 0, 'Active'),
    ('M007', 'Vikas Sutar', 'Staff', 'vikas.s@college.edu', '9988776655', 'Admin', 2020, 0, 'Active')
ON DUPLICATE KEY UPDATE name = name;

UPDATE id_counters SET counter_value = 7 WHERE counter_name = 'member_counter';

INSERT INTO transactions (trans_code, book_id, member_id, issue_date, due_date, return_date, fine_amount, fine_paid, status) VALUES
    ('T001', 1, 1, DATE_SUB(CURDATE(), INTERVAL 10 DAY), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 10 DAY), INTERVAL 14 DAY), NULL, 0.00, 0, 'Active'),
    ('T002', 4, 1, DATE_SUB(CURDATE(), INTERVAL 20 DAY), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 20 DAY), INTERVAL 14 DAY), NULL, 12.00, 0, 'Overdue'),
    ('T003', 2, 2, DATE_SUB(CURDATE(), INTERVAL 5 DAY), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 5 DAY), INTERVAL 14 DAY), NULL, 0.00, 0, 'Active'),
    ('T004', 7, 2, DATE_SUB(CURDATE(), INTERVAL 30 DAY), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 30 DAY), INTERVAL 14 DAY), DATE_SUB(CURDATE(), INTERVAL 18 DAY), 0.00, 0, 'Returned'),
    ('T005', 8, 4, DATE_SUB(CURDATE(), INTERVAL 3 DAY), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 3 DAY), INTERVAL 14 DAY), NULL, 0.00, 0, 'Active'),
    ('T006', 10, 2, DATE_SUB(CURDATE(), INTERVAL 8 DAY), DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 8 DAY), INTERVAL 14 DAY), NULL, 0.00, 0, 'Active')
ON DUPLICATE KEY UPDATE trans_code = trans_code;

UPDATE id_counters SET counter_value = 6 WHERE counter_name = 'trans_counter';
