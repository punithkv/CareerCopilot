
import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

export async function generateCareerRecommendations(payload = {}) {
  const response = await axios.post(
    `${API_URL}/api/career/recommendations`,
    {
      target_role: payload.targetRole || "",
      interests: payload.interests || "",
    },
    {
      timeout: 660000
    }
  );

  return response.data;
}
