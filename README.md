# ProjectPulse — Client & Internal Project Management Platform

> **Bilcode Technology** · Full Stack Developer Take-Home Technical Test  
> Project Management Platform (Web Admin, Mobile Member App, Backend API, ML Task Breakdown & Kubernetes Deployment).

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Backend API** | **Laravel 11 (PHP 8.3)** | RESTful API, Token-based Auth (Sanctum), Eloquent ORM, PHPUnit |
| **Web Dashboard** | **Next.js 15 (React 19)** | Admin/PM Portal, Tailwind CSS, Hallmark Utilitarian UI |
| **Mobile App** | **Ionic 8 + React (Capacitor)** | Developer/Designer App, Native-like UI, Task Progress & Logging |
| **ML Service** | **Google Gemini / OpenAI API** | AI-assisted Client Brief Task Breakdown & Effort Estimation |
| **DevOps** | **Docker & Kubernetes (K8s)** | `docker-compose`, K8s Deployments, Services, Ingress & HPA |

---

## 🚀 Quick Start (Local Development)

### 1. Run Everything via Docker Compose
```bash
# Clone repository
git clone https://github.com/Rangga11268/bilcode-fullstack-test.git
cd bilcode-fullstack-test

# Start all services (Backend, Database, Web, Redis)
docker-compose up -d --build
```

Access points:
- **Web Dashboard (Admin)**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000/api`
- **API Documentation**: `http://localhost:8000/docs`

---

## 🔑 Dummy Credentials (Seeder)

| Role | Email | Password | Access |
|---|---|---|---|
| **Admin (PM)** | `admin@bilcode.com` | `password123` | Web Dashboard |
| **Member (Dev)** | `dev@bilcode.com` | `password123` | Mobile App / Web |
| **Member (Designer)** | `designer@bilcode.com` | `password123` | Mobile App / Web |

---

## 📦 Kubernetes Deployment (Local Cluster)

```bash
# Apply ConfigMap & Secrets
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.example.yaml

# Deploy Backend & Web
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/web-deployment.yaml
kubectl apply -f k8s/web-service.yaml
kubectl apply -f k8s/ingress.yaml

# Optional: Horizontal Pod Autoscaler
kubectl apply -f k8s/hpa.yaml
```

---

## 📄 License & Attribution
Developed for **Bilcode Technology** Technical Test by **Darell Rangga** ([darellrangga.me](https://www.darellrangga.me)).
