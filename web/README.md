# ProjectPulse Web Admin Dashboard

Aplikasi Web Admin Dashboard untuk platform manajemen proyek internal Bilcode Technology.

## 🛠️ Tech Stack
- **Framework**: Next.js 15 (React 19) App Router
- **Styling**: Tailwind CSS + Hallmark Utilitarian OKLCH Token System
- **Language**: TypeScript

## 🚀 Cara Menjalankan

### 1. Menggunakan Docker Compose (Rekomendasi)
Jalankan dari direktori utama monorepo:
```bash
docker-compose up -d --build
```
Web dashboard akan berjalan pada [http://localhost:3000](http://localhost:3000).

### 2. Standalone Local Dev Server
```bash
# Install dependencies
npm install

# Jalankan server pengembang
npm run dev
```

### 3. Production Build Check
```bash
npm run build
```
