
import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

const resumeImprovementApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180000,
});

export const improveResume = async ({
  task,
  targetJobRole = "",
  jobDescription = "",
  experienceText = "",
}) => {
  const response = await resumeImprovementApi.post(
    "/api/resume/improvement",
    {
      task,
      target_job_role: targetJobRole,
      job_description: jobDescription,
      experience_text: experienceText,
    }
  );

  return response.data;
};

export default resumeImprovementApi;
