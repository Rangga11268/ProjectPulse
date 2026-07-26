# ProjectPulse Backend REST API Engine

Backend RESTful API Engine untuk platform manajemen proyek internal Bilcode Technology.

## 🛠️ Tech Stack
- **Framework**: Laravel 11 (PHP 8.3)
- **Database**: MySQL 8.0 / SQLite
- **Authentication**: Laravel Sanctum API Tokens
- **Testing**: PHPUnit / Artisan Test

## 🚀 Cara Menjalankan & Testing

### 1. Menggunakan Docker Compose (Rekomendasi)
Jalankan dari direktori utama monorepo:
```bash
docker-compose up -d --build
```
API Engine akan berjalan pada `http://localhost:8000/api`.

### 2. Standalone Local Dev Server
```bash
# Install dependencies
composer install

# Inisialisasi Database & Seeder
php artisan migrate:fresh --seed

# Run Automated Test Suite
php artisan test

# Start Local Server
php artisan serve
```

### 3. Account Credentials (Seeder)
- **Admin/PM**: `admin@bilcode.com` / `password123`
- **Developer**: `dev@bilcode.com` / `password123`
- **Desainer**: `designer@bilcode.com` / `password123`
