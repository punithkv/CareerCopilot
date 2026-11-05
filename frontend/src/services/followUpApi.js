
import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api/follow-up";

export const generateFollowUpEmail = async (application, tone = "Professional") => {
  const response = await axios.post(
    `${API_URL}/generate`,
    {
      company: application.company,
      role: application.role,
      status: application.status,
      application_date: application.application_date || null,
      follow_up_date: application.follow_up_date || null,
      notes: application.notes || "",
      tone,
    },
    {
      timeout: 660000,
    }
  );

  return response.data;
};
