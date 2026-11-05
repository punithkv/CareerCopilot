
import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

export const analyzeJobApplication = async (data) => {
  const response = await axios.post(
    `${API_URL}/api/application-assistant/analyze`,
    data,
    {
      timeout: 660000,
    }
  );

  return response.data;
};
