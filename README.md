# AI-Powered Road Damage Detection & Municipal Reporting System

An AI-driven prototype designed to detect road damage from images, estimate its severity, and assist with generating structured municipal complaint reports.

## Overview

Road damage such as potholes can affect road safety, vehicle condition, and transportation efficiency. This project explores how computer vision and generative AI can support road-condition assessment and streamline the reporting process.

The system combines a YOLOv8 object-detection model with a FastAPI backend, a React-based frontend, and Google's Gemini API for AI-assisted complaint generation.

## Key Technologies

| Technology | Purpose |
|---|---|
| Python | Backend and AI integration |
| FastAPI | REST API and backend orchestration |
| YOLOv8n | Road damage object detection |
| Google Gemini API | AI-assisted complaint generation |
| React | User interface |
| Vite | Frontend development and build tooling |
| JWT | Authentication tokens |
| bcrypt | Password hashing |

## System Architecture

1. **Frontend:** Users interact with the React application to access the available detection and reporting features.
2. **Backend API:** FastAPI receives requests and coordinates the relevant processing logic.
3. **Damage Detection:** YOLOv8n processes road images to identify supported damage classes and return detection results.
4. **Severity Assessment:** The application evaluates detection results using its configured severity logic.
5. **Complaint Generation:** Gemini assists in generating complaint text based on the information supplied by the application.
6. **Authentication:** JWT-based authentication and role-based access control are used for protected functionality, where implemented.

## Authentication and Security

- Passwords are hashed using bcrypt rather than stored as plain text.
- JWTs are used to authenticate requests to protected endpoints.
- Role-based access distinguishes administrative and standard-user permissions, where enforced by the backend.
- API credentials should be provided through environment variables and must never be committed to version control.

## Getting Started

### Prerequisites

- Python
- Node.js and npm
- Git
- A Gemini API key if the complaint-generation feature requires it

### 1. Clone the repository

```bash
git clone https://github.com/harsh-ly/ai-road-damage-detection.git
cd ai-road-damage-detection
```

### 2. Set up the backend

Navigate to the backend directory and create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows:

```powershell
.venv\Scripts\Activate.ps1
```

Install dependencies using the dependency file provided by the project. For example, if the backend contains `requirements.txt`:

```bash
pip install -r requirements.txt
```

Configure the required environment variables using the project's expected variable names. Never commit your real `.env` file.

Start the FastAPI server using the actual application entry point. For example, if it is `main.py` and exposes `app`:

```bash
uvicorn main:app --reload
```

FastAPI commonly provides interactive API documentation at `/docs` when enabled.

### 3. Set up the frontend

Navigate to the frontend directory:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite in your terminal.

> **Note:** Directory names, dependency files, startup commands, and environment-variable names must match the actual repository. Adjust these instructions if your project uses a different structure.

## Project Status

**Prototype / In Development**

The project demonstrates an approach to integrating object detection, backend APIs, authentication, and AI-assisted complaint generation. Detection accuracy, severity calculations, image annotation display, authorization enforcement, and end-to-end reporting should be validated against the current implementation before production deployment.

## Future Improvements

- Improve the severity-assessment logic and validate it against documented criteria.
- Display annotated detection images consistently in the frontend.
- Expand evaluation using representative road-damage images.
- Strengthen API validation, error handling, and authorization tests.
- Improve deployment configuration, monitoring, and automated testing.

## Security Notice

Do not commit API keys, JWT secrets, database credentials, private datasets, or user information. If a credential has been exposed, revoke or rotate it.

## License

See the [LICENSE](LICENSE) file for the project's licensing terms.
