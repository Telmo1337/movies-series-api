
<p align="center">
  <img src="cinexio.svg" alt="Cinexio Logo" width="600" />
</p>


# CINEXIO - Web Applications Movie & Series Management API 

Backend Project using Node, Express, Prisma ORM and MySQL (Dockerized).
This repository contains a complete backend API for managing movies and series.  
It includes user authentication, media management, personal libraries, comments, and more.

# Installation and Execution

The entire project run automatically through **Docker Compose**, without requiring:

- Node.js installation;
- MySQL installation;
- `.env` file creation;
- `npm install`;
- Prisma setup.

Everything is fully automated.

---

# 1. Requirements

Before running the project, make sure your system has:

### Windows/macOS
- **Docker Desktop installed (Windows/Mac);**

### Linux
- **Docker Engine + Docker Compose plugin installed;**

To verify if Docker is running on Linux:
```bash
sudo systemctl status docker
```

To start Docker if it's stopped:
```bash
sudo systemctl start docker
```

---

# 2. Clone the repository

```bash

git clone https://github.com/Telmo1337/Cinexio-AW

```
And after you clone go to the project directory:

```bash
cd Cinexio-AW
```

---

# 3. Ensure Docker is Running

### Windows / macOS

Open **Docker Desktop** and wait until the message **"Docker is running"** appears.

### Linux

Check Docker Engine:
```bash
sudo systemctl status docker
```

Start Docker if needed:
```bash
sudo systemctl start docker
```

---

# 4. Start the Environment (Backend + DB)

Run a single cmd:

```bash
npm run projectAW
```

### This will:
1. Start the MySQL container;
2. Start the Backend container;
3. Wait until MySQL is fully ready;
4. Automatically apply **all Prisma migrations**;
5. Launch the Express server.

No manual setup needed.

---

# 5. Access the API
Once started, the API will be available at:
 http://localhost:5050

You can test all endpoints using Postman, Insomnia or any HTTP client.

---

# 6. Postman Collection & Environment

This project includes a Postman collection containing all API endpoints, as well as the environment required to test authentication and protected features.

### How to use it:
1. Open Postman (or the Postman extension in VS Code);
2. Import the file `postman/collection/Cinexio - Movies&TVshows API - collection.postman_collection.json`
3. Import the file `postman/collection/Cinexio - Movies&TVshows API - env.postman_environment.json`
4. Set the Environment as active
5. Register and Run the Login endpoint to automatically generate and save the token and other variables.


### **Collection**
<img src="https://github.com/user-attachments/assets/e9806e97-d2a8-4920-9206-7b5aa2f89245" width="300" />

### **Environment Variables**
<img src="https://github.com/user-attachments/assets/c46359b8-e84a-4d4a-ac27-af634695c8f8" width="300" />


---

# 7. Optional

Only if you want to see the startup process:

```bash
docker logs aw-backend -f
```


Only if you want to see the docker status:

```bash
docker ps
```
---

# 8. How to stop the environment

To stop and remove all containers and data:

```bash
npm run projectAW-stop
```

---

# Final notes:

- No .env and no npm install required;
- Works on any OS;
- Everything runs automatically with Docker Compose;
- **DO NOT** run the backend manually with Node/npm;

---

## Important to know:

Both cmds `npm run projectAW` and `npm run projectAW-stop` use the `docker compose down -v` flag.
The `-v` flag forces Docker to remove all volumes associated with the containers.

**This means:**
- The **database is deleted and recreated from scratch every time** you start or stop the project using these cmds.
- All stored data (users, media, comments, etc.) is erased because the database volume is destroyed.

This behaviour is intentional for development:
- It guarantees a fully clean environment on every run, avoiding conflicts with cached data, old migrations or inconsistent states.

### If you do NOT want the database to reset every time:

- You must remove the `-v` flag from the scripts in the `package.json`.

Example:
```json
{
 "scripts": {
    "projectAW": "docker compose down && docker compose up -d --build",
    "projectAW-stop": "docker compose down"
  }
}
```
**By removing `-v`, the database volume becomes persistent and the data will no longer be wiped between runs.**

---

© 2025 – Academic project develop by Telmo Regalado and Tiago Silva
