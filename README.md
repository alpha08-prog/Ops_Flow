# 🏛️ Operations Management System (OMS)

A comprehensive, production-ready full-stack application designed to streamline and modernize office operations, administrative tasks, and management workflows.

![OMS Project Structure](https://img.shields.io/badge/Architecture-MERN--like-blue)
![Prisma](https://img.shields.io/badge/ORM-Prisma-1B222D?style=flat&logo=Prisma&logoColor=white)
![Docker](https://img.shields.io/badge/Containerization-Docker-2496ED?style=flat&logo=Docker&logoColor=white)
![Jenkins](https://img.shields.io/badge/CI%2FCD-Jenkins-D24939?style=flat&logo=Jenkins&logoColor=white)

---

## 🚀 Overview

The Operations Management System (OMS) is a major **Ops Flow Project**, built with a heavy focus on robust DevOps practices, containerization, and automated CI/CD pipelines. This repository contains the complete infrastructure-as-code configuration alongside the web application services, making it extremely easy to provision, deploy, and scale.

---

## 🛠️ Infrastructure & DevOps Stack

- **Containerization Engine:** Docker
- **Container Orchestration:** Docker Compose
- **Continuous Integration/Deployment:** Jenkins
- **Reverse Proxy / Web Server:** Nginx (via Frontend Docker image)
- **Database:** PostgreSQL 15 (Alpine Linux image)
- **Application Environment:** Node.js 18+

### **Container Services Strategy**
The environment is decoupled into three primary containers communicating via isolated Docker networks defined in `docker-compose.yml`:
1. **`oms_postgres` (`db`):** The data persistence layer built from a lightweight PostgreSQL alpine image. Keeps persistent volume mounts for data storage (`postgres_data:/var/lib/postgresql/data`).
2. **`oms_backend` (`backend`):** Node.js API server utilizing Prisma ORM. Connects to `oms_postgres` via internal Docker DNS (`db:5432`).
3. **`oms_frontend` (`frontend`):** Built React SPA shipped and served statically behind an Nginx web server, mapping traffic efficiently from port `80`.

---

## 🔄 CI/CD Pipeline (Jenkins)

The included `Jenkinsfile` provides a fully automated build and deployment pipeline optimized for a continuous delivery workflow on Windows Jenkins nodes.

### **Pipeline Stages**
1. **Checkout:** Retrieves the latest Git repository commit.
2. **Install Dependencies:** Executes `npm install` gracefully inside isolated backend and frontend directories using Windows batch commands (`bat`).
3. **Test & Lint:** Invokes Playwright UI tests (`test:ui --run`) and unit testing. Uses `catchError` to elegantly handle testing failures without causing a complete build failure during rapid prototyping.
4. **Build Docker Images:** Triggers `docker-compose build` to compile the multi-stage Dockerfiles across all services.
5. **Deploy via Docker Compose:** Pushes the updated service stack into action seamlessly using `docker-compose up -d`.

---

## 🏗️ Getting Started (DevOps Deployment)

Deploying the OMS locally or on a production VM relies entirely on the container configuration. Follow these steps for an automated local launch:

### **1. Rapid Deployment via Docker Compose**

**Prerequisites:** Ensure **Docker Desktop** (or Docker Engine) is running locally.

```bash
# Clone the repository
git clone <repository-url>
cd opsflow

# Build images and start all services in detached mode
docker-compose up -d --build

# View and tail logs for diagnosing application runtime
docker-compose logs -f
```

### **2. Service Health Checks & Endpoints**
Once the containers are up, you can verify deployments via the following endpoints:
- **Frontend App (Nginx Proxy):** `http://localhost:80`
- **Backend API:** `http://localhost:5000`
- **PostgreSQL Database:** Exposed internally on `localhost:5432`

### **3. Teardown and Cleanup**
```bash
# Bring down the containers and clean up the network layer
docker-compose down

# To also completely wipe out internal database volumes and start entirely fresh:
docker-compose down -v
```

---

## 📂 Project Structure

```text
opsflow/
├── docker-compose.yml      # Multi-container orchestration & networking config
├── Jenkinsfile             # Jenkins continuous integration pipeline definitions
├── .dockerignore           # Excludes local environments from container images
├── backend/                # API Gateway Server
│   ├── Dockerfile          # Image configuration for the Node.js backend
│   └── src/                # Backend routes and schema logic
├── frontend/               # UI Application
│   ├── Dockerfile          # Image compiling the Vite app into Nginx static assets
│   └── src/                # Frontend UI components
└── README.md               # Primary DevOps context and architectural overview
```

---

## 🗄️ Application Features Quick-Glance

While this root repository emphasizes the Ops configuration layer, the functional software layer serves important administrative enterprise workflows:
- **Role-Based Access Control (RBAC):** Super Admin, Admin, and Staff constraints.
- **Grievance Management:** Life-cycle tracking tools.
- **Visitor Logs & Tour Programs:** Resource oversight and schedule tracking.

For detailed application-specific commands (such as running Prisma database migrations, local Node environments, testing configurations, and `.env` template guidelines), please refer to the respective service documentation:
- [Backend Development Guide](./backend/README.md)
- [Frontend Development Guide](./frontend/README.md)

---
> *Architectural setup optimized for performance, logging, containerization, and deployment resilience.*
