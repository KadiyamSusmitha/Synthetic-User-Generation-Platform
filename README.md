# Synthetic User Generation Platform

An AI-powered user research and experiment management application designed to help users manage experiments, create surveys, work with personas, generate synthetic responses, and analyze research insights.

## Technology Stack

### Frontend
- React
- Vite
- Tailwind CSS
- React Router
- Recharts
- React Toastify

### Backend
- Python
- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL
- pgvector

### AI and Data Processing
- Google Gemini API
- Embeddings and vector search
- Synthetic response generation
- Analytics and insights

### Security and Reporting
- JWT authentication
- Password hashing
- Email-based OTP workflows
- Report generation with ReportLab

## Project Structure

```text
AI-Project/
├── syncuser-frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── package-lock.json
├── syncuser-backend/
│   ├── app/
│   ├── alembic/
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
└── README.md
```

The exact folders may vary depending on the current implementation.

## Prerequisites

Install the following before running the application:

- Python 3.11 or a compatible version
- Node.js and npm
- PostgreSQL
- A Gemini API key for AI features

## Backend Setup

Open PowerShell in the project root.

### 1. Navigate to the backend

```powershell
cd .\syncuser-backend
```

### 2. Create and activate a virtual environment

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 3. Install Python dependencies

```powershell
python -m pip install -r requirements.txt
```

### 4. Configure environment variables

Create your local `.env` file using `.env.example` as a reference. Update the database connection, Gemini API key, JWT secret, and SMTP settings with your own values.

**Never commit your real `.env` file or publish credentials.**

### 5. Start the backend

```powershell
uvicorn app.main:app --reload
```

The development API is available at `http://127.0.0.1:8000`.

If enabled in the application, interactive API documentation is available at `http://127.0.0.1:8000/docs`.

## Frontend Setup

Open a second PowerShell terminal from the project root.

### 1. Navigate to the frontend

```powershell
cd .\syncuser-frontend
```

### 2. Install dependencies

```powershell
npm install
```

### 3. Start the development server

```powershell
npm run dev
```

Open the local URL printed by Vite, typically `http://localhost:5173`.

## Database

Create and configure a PostgreSQL database, then set `DATABASE_URL` in the backend `.env` file.

Apply database migrations using the project's configured Alembic setup when required:

```powershell
alembic upgrade head
```

Run the migration command from the backend directory and ensure the database connection is configured first.

## Environment Variables

The backend `.env.example` file documents the configuration variables required by the application. Use placeholder values in examples and keep actual secrets private.

## Development Checks

Frontend production build:

```powershell
npm run build
```

Backend tests:

```powershell
python -m pytest
```

Run these commands from their respective frontend or backend directories.

## Security Notes

- Do not commit `.env` files, API keys, database passwords, JWT secrets, or email app passwords.
- Do not commit virtual environments, `node_modules`, or generated output.
- Use strong, unique secrets in deployed environments.
- Configure production CORS, HTTPS, database access, and email delivery appropriately before deployment.

## License

No license has been specified yet.
