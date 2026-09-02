# Microservice Pipeline & State Sync System

A dual-container setup featuring an Nginx reverse proxy serving a static React frontend, integrated with a telemetry Node.js backend engine.

## Architecture

* **Frontend:** Nginx-hosted static UI listening on port 80.
* **Backend:** Node.js Telemetry Microservice running on port 5000.
* **Proxying:** `/api/` requests are routed transparently to the backend service.

## Local Setup

Run the multi-container application locally using Docker Compose: bash
docker-compose up --build -d### Verification

Check service health and proxy routing via PowerShell:
### Verification

Check service health and proxy routing via PowerShell:
powershell
Invoke-RestMethod -Uri http://localhost/api/status

3.Initialize & Push to GitHub:Execute the following commands in PowerShell to initialize Git and push the project to GitHub:
# Initialize git repository
git init

# Add configuration files and source code
git add .
git commit -m "feat: setup microservice pipeline with docker compose and nginx proxy"

# Rename branch to main
git branch -M main

# Link your remote repository (replace with your actual GitHub repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.NAME.git

# Push to GitHub
git push -u origin main