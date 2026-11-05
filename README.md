# CareerCopilot – AI-Powered Career Assistant

CareerCopilot is a locally powered AI career assistant designed to help job seekers analyze resumes, prepare for interviews, evaluate job opportunities, manage applications, and plan their career development.

The application combines a React frontend, FastAPI backend, retrieval-augmented generation (RAG), and a locally hosted Ollama language model.

## Key Features

### 1. Resume Analyzer
- Resume quality analysis.
- AI-generated resume summaries.
- ATS-oriented feedback.
- Experience and skills analysis.
- Skill-gap identification.

### 2. AI Interview Preparation
- Job-role-based interview preparation.
- Interview answer evaluation.
- Interview reports and performance scores.
- Interview history.
- PDF interview report generation.

### 3. Career Recommendation Engine
- Career-role recommendations.
- Identification of strengths and skill gaps.
- Personalized learning priorities.
- 30-day career preparation plan.

### 4. Job Application Tracker
- Add, update, and delete applications.
- Track application statuses.
- Search and filter applications.
- Follow-up reminders.
- Application statistics.

### 5. AI Job Application Assistant
- Analyze job descriptions against resume information.
- Identify matching and missing skills.
- Generate application recommendations.
- Prepare application-related content.
- Save analyzed opportunities to the tracker.

### 6. AI Follow-up Assistant
- Generate professional follow-up email drafts.
- Use application information to prepare relevant messages.
- Edit and copy generated emails.

## Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React.js, Vite, JavaScript, CSS |
| Backend | Python, FastAPI |
| AI Model | Ollama, Qwen 2.5 3B |
| RAG | ChromaDB, sentence-transformers |
| Database | SQLite |
| HTTP Communication | Axios |
| Reporting | jsPDF |

## System Architecture

1. The user interacts with the React frontend.
2. The frontend sends requests to FastAPI endpoints.
3. The backend retrieves relevant resume and application information.
4. The RAG pipeline retrieves relevant document context where applicable.
5. Ollama runs the local language model to generate responses.
6. The backend returns results to the frontend.
7. The frontend displays the analysis, recommendations, or reports.

## Prerequisites

- Python 3.13 or a compatible version supported by your dependencies.
- Node.js and npm.
- Ollama.
- Git.

## Installation and Setup

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd genai-portfolio
```

### 2. Download the local AI model

```bash
ollama pull qwen2.5:3b
```

Start Ollama before using AI features.

### 3. Configure the backend

```bash
cd backend

python -m venv venv
```

Windows PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and configure your environment if required by the application.

Start FastAPI:

```bash
uvicorn app.main:app --reload
```

Backend:

http://127.0.0.1:8000

API documentation:

http://127.0.0.1:8000/docs

### 4. Configure the frontend

Open another terminal:

```bash
cd frontend

npm install
```

Copy `.env.example` to `.env` if the frontend uses environment-based API configuration.

Start the frontend:

```bash
npm run dev
```

Frontend:

http://localhost:5173

## Running the Application

Start these services:

1. Ollama.
2. FastAPI backend.
3. React frontend.

Keep all required services running while using the application.

## Testing

Run the basic health-check script:

```bash
cd backend
python test_careercopilot.py
```

Test the individual application features through the frontend and API documentation.

## Privacy and Security

- The language model runs locally through Ollama.
- Do not commit personal resumes, uploaded documents, database files, or environment secrets.
- Configure CORS and application settings appropriately before deployment.
- Review uploaded-file validation and access controls before exposing the application publicly.

## Future Enhancements

- User authentication and role-based access.
- Cloud deployment.
- Advanced resume parsing.
- More comprehensive job recommendations.
- Integration with external job portals.
- Improved interview analytics.
- Automated application reminders.

## Author

Punith K V

GitHub: ADD_YOUR_GITHUB_PROFILE_LINK

LinkedIn: ADD_YOUR_LINKEDIN_PROFILE_LINK