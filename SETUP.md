# Local MySQL Setup Guide

## 1) Install MySQL and start it

Make sure MySQL is running on your local machine.

## 2) Create the database

Open MySQL CLI or phpMyAdmin and run:

```sql
CREATE DATABASE librax_db;
```

Then import the file:

```text
database/librax.sql
```

## 3) Configure database connection

In `api/config.php`, update this if needed:

```php
define('DB_HOST', 'localhost');
define('DB_PORT', 3306);
define('DB_NAME', 'librax_db');
define('DB_USER', 'root');
define('DB_PASS', '');
```

If your MySQL has a password, use it.

## 4) Run the app

Place the project in your XAMPP `htdocs` folder and open:

```text
http://localhost/Library_Management_System/index.html
```

## 5) Login

Username: `admin`
Password: `admin123`
