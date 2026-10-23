# LibraX – Library Management System

A web-based library management system built with HTML, CSS, JavaScript, PHP, and MySQL. It supports login, dashboard statistics, book management, member management, issue/return handling, reservations, overdue tracking, and reports.

## Features

- Admin login system
- Dashboard overview with stats
- Book management (add, edit, delete, search)
- Member management
- Issue and return books
- Fine tracking for overdue books
- Reservations management
- Reports and summary data
- Light/Dark theme toggle
- Live date and time in the top bar

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: PHP
- Database: MySQL
- Local server: PHP built-in server

## Project Structure

```text
Library_Management_System/
├── api/
│   ├── auth.php
│   ├── books.php
│   ├── config.php
│   ├── dashboard.php
│   ├── members.php
│   └── transactions.php
├── css/
│   └── style.css
├── database/
│   └── librax.sql
├── js/
│   ├── api.js
│   └── app.js
├── report/
│   └── project_report.html
├── index.html
├── SETUP.md
├── setup_xampp.ps1
├── README.md
└── .
```

## Requirements :

- PHP 8+
- MySQL
- Web browser
- Local server environment such as XAMPP or direct MySQL + PHP installation

## Database Setup :

1. Start MySQL.
2. Import the SQL file:
   - `database/librax.sql`
3. Make sure the database name is:
   - `librax_db`
4. Verify that the credentials in [api/config.php](api/config.php) match your local MySQL setup.

Default config currently used by the project:

```php
define('DB_HOST', 'localhost');
define('DB_PORT', 3306);
define('DB_NAME', 'librax_db');
define('DB_USER', 'root');
define('DB_PASS', 'root');
```

## Run the Project Locally :

Open PowerShell in the project folder and run:

```powershell
cd "D:\Projects\03_Web_Applications\Library_Management_System"
& "C:\xampp\php\php.exe" -S localhost:8000
```

Then open:

```text
http://localhost:8000/
```

## Login Credentials :

```text
Username: admin
Password: admin123
```

## Notes "

- This project is designed for local use on a personal machine.
- It uses a local MySQL database and PHP backend.
- The top bar date/time updates in real time.

## Developer Notes :

The project was verified locally with:

- PHP backend running successfully on `localhost:8000`
- MySQL-backed login working
- Dashboard API returning valid data

## License

This project is intended for academic and local development use.
