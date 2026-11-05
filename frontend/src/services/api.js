
import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Analyze job description
export const analyzeJob = async (jobDescription) => {
  const response = await api.post("/api/jobs/analysis", {
    job_description: jobDescription,
  });

  return response.data;
};

// Upload PDF resume
export const uploadResume = async (file, onProgress) => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await api.post(
    "/api/resume/upload",
    formData,
    {
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentage = Math.round(
            (progressEvent.loaded / progressEvent.total) * 100
          );

          onProgress(percentage);
        }
      },
    }
  );

  return response.data;
};

// Analyze resume against job description
export const analyzeResume = async (jobDescription) => {
  const response = await api.post("/api/resume/analyze", {
    job_description: jobDescription,
  });

  return response.data;
};

// Start interview
export const startInterview = async (
  jobDescription,
  difficulty,
  count,
  candidateName,
  candidateEmail,
  targetJobRole,
  resumeFilename
) => {
  const response = await api.post("/api/session/start", {
    job_description: jobDescription,
    difficulty: difficulty.toLowerCase(),
    count,
    candidate_name: candidateName,
    candidate_email: candidateEmail,
    target_job_role: targetJobRole,
    resume_filename: resumeFilename,
  });

  return response.data;
};

// Submit interview answer
export const submitInterviewAnswer = async (
  sessionId,
  question,
  answer
) => {
  const response = await api.post(
    `/api/session/${sessionId}/answer`,
    {
      question,
      answer,
    }
  );

  return response.data;
};

// Get interview report
export const getInterviewReport = async (sessionId) => {
  const response = await api.get(
    `/api/session/${sessionId}/report`
  );

  return response.data;
};

// Get interview history
export const getInterviewHistory = async () => {
  const response = await api.get("/api/session/history");

  return response.data;
};

// Delete interview session
export const deleteInterviewSession = async (sessionId) => {
  const response = await api.delete(
    `/api/session/${sessionId}`
  );

  return response.data;
};

// Retrieve saved interview session
export const getInterviewSession = async (sessionId) => {
  const response = await api.get(
    `/api/session/${sessionId}`
  );

  return response.data;
};

export default api;
// Get uploaded resume status
export const getResumeStatus = async () => {
  const response = await api.get("/api/resume/status");
  return response.data;
};
// Delete an uploaded resume
export const deleteResume = async (fileId) => {
  const response = await api.delete(`/api/resume/${fileId}`);
  return response.data;
};
// Pause an interview session
export const pauseInterviewSession = async (
  sessionId,
  elapsedSeconds
) => {
  const response = await api.post(
    `/api/session/${sessionId}/pause`,
    {
      elapsed_seconds: elapsedSeconds,
    }
  );

  return response.data;
};

// Resume an interview session
export const resumeInterviewSession = async (sessionId) => {
  const response = await api.post(
    `/api/session/${sessionId}/resume`
  );

  return response.data;
};
// Automatically save interview timer progress
export const updateInterviewTimer = async (
  sessionId,
  elapsedSeconds
) => {
  const response = await api.post(
    `/api/session/${sessionId}/timer`,
    {
      elapsed_seconds: elapsedSeconds,
    }
  );

  return response.data;
};