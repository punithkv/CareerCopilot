
import { useState } from "react";
import axios from "axios";
import {
  Sparkles,
  BriefcaseBusiness,
  Target,
  BookOpen,
  CalendarDays,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Lightbulb,
  Award,
  ArrowRight,
} from "lucide-react";

import { getApiError } from "../services/errorHandler";
import "./CareerRecommendations.css";

const API_URL = "http://127.0.0.1:8000/api/career/recommendations";

function asText(value) {
  if (value === null || value === undefined) return "";

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(asText).filter(Boolean).join(", ");
  }

  if (typeof value === "object") {
    return (
      value.name ||
      value.title ||
      value.skill ||
      value.description ||
      value.text ||
      ""
    );
  }

  return "";
}

function getList(value) {
  if (Array.isArray(value)) return value;

  if (typeof value === "string" && value.trim()) {
    return value
      .split(/\n|,/)
      .map((item) => item.replace(/^[-*•\d.)\s]+/, "").trim())
      .filter(Boolean);
  }

  return [];
}

function SectionCard({ title, icon: Icon, children, className = "" }) {
  return (
    <section className={`cr-card ${className}`}>
      <div className="cr-card-heading">
        <div className="cr-card-icon">
          <Icon size={20} />
        </div>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ItemList({ items, emptyMessage = "No information available." }) {
  const values = getList(items);

  if (!values.length) {
    return <p className="cr-muted">{emptyMessage}</p>;
  }

  return (
    <ul className="cr-list">
      {values.map((item, index) => (
        <li key={`item-${index}`}>
          <CheckCircle2 size={16} />
          <span>{asText(item)}</span>
        </li>
      ))}
    </ul>
  );
}

function CareerRecommendations({ onBack }) {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateRecommendations = async () => {
    try {
      setLoading(true);
      setError("");
      setRecommendations(null);

      const response = await axios.post(
        API_URL,
        {},
        {
          timeout: 660000,
        }
      );

      const data = response.data;

      // Support both direct and wrapped API responses.
      const result = data?.recommendations || data;

      if (!result || typeof result !== "object") {
        throw new Error("The backend returned an invalid recommendation response.");
      }

      setRecommendations(result);
    } catch (err) {
      setError(
        getApiError(
          err,
          "Unable to generate career recommendations. Check that the backend and Ollama are running."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const roles = getList(recommendations?.recommended_roles);
  const strengths = getList(recommendations?.strengths);
  const prioritySkills = getList(recommendations?.priority_skills);
  const roadmap = getList(
    recommendations?.thirty_day_plan ||
    recommendations?.["30_day_plan"] ||
    recommendations?.plan_30_days ||
    recommendations?.learning_plan
  );
  const cautions = getList(recommendations?.cautions);

  const applicationInsights =
    recommendations?.application_insights;

  return (
    <main className="cr-page">
      <header className="cr-header">
        <div>
          <div className="cr-eyebrow">
            <Sparkles size={16} />
            LOCAL GENAI CAREER ASSISTANT
          </div>

          <h1>AI Career Recommendations</h1>

          <p>
            Get personalized career guidance based on your resume,
            interview performance and job application history.
          </p>
        </div>

        <div className="cr-header-actions">
          {onBack && (
            <button
              type="button"
              className="cr-secondary-btn"
              onClick={onBack}
            >
              Back
            </button>
          )}

          <button
            type="button"
            className="cr-primary-btn"
            onClick={generateRecommendations}
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw className="cr-spin" size={17} />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={17} />
                {recommendations ? "Regenerate" : "Generate Recommendations"}
              </>
            )}
          </button>
        </div>
      </header>

      {!recommendations && !loading && !error && (
        <section className="cr-empty-state">
          <div className="cr-empty-icon">
            <Lightbulb size={38} />
          </div>

          <h2>Discover your next career opportunity</h2>

          <p>
            Generate recommendations to understand suitable job roles,
            identify skill gaps and create a focused learning plan.
          </p>

          <button
            type="button"
            className="cr-primary-btn"
            onClick={generateRecommendations}
          >
            <Sparkles size={17} />
            Generate My Career Plan
          </button>

          <small>
            Make sure you have uploaded your resume before generating
            recommendations.
          </small>
        </section>
      )}

      {loading && (
        <section className="cr-loading">
          <RefreshCw className="cr-spin" size={32} />
          <h2>Analyzing your career profile...</h2>
          <p>
            Your local AI is reviewing your resume, interview results
            and application history. This may take a few minutes.
          </p>
        </section>
      )}

      {error && (
        <div className="cr-error">
          <AlertCircle size={19} />
          <span>{error}</span>

          <button
            type="button"
            onClick={generateRecommendations}
            disabled={loading}
          >
            Retry
          </button>
        </div>
      )}

      {recommendations && !loading && (
        <div className="cr-results">
          <section className="cr-summary">
            <div className="cr-summary-icon">
              <Award size={27} />
            </div>

            <div>
              <span className="cr-label">YOUR CAREER SUMMARY</span>
              <h2>Your personalized career direction</h2>
              <p>
                {asText(recommendations.career_summary) ||
                  "Your career recommendations have been generated."}
              </p>
            </div>
          </section>

          <div className="cr-grid">
            <SectionCard
              title="Recommended Job Roles"
              icon={BriefcaseBusiness}
            >
              {roles.length > 0 ? (
                <div className="cr-role-list">
                  {roles.map((role, index) => {
                    const roleName = asText(role);

                    return (
                      <div className="cr-role-item" key={`role-${index}`}>
                        <div className="cr-role-number">
                          {index + 1}
                        </div>

                        <div>
                          <strong>
                            {typeof role === "object"
                              ? role.title || role.name || role.role || roleName
                              : roleName}
                          </strong>

                          {typeof role === "object" && (
                            <p>
                              {asText(
                                role.reason ||
                                role.description ||
                                role.match_reason
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="cr-muted">No job roles were returned.</p>
              )}
            </SectionCard>

            <SectionCard title="Your Strengths" icon={Award}>
              <ItemList items={strengths} />
            </SectionCard>

            <SectionCard
              title="Priority Skills to Learn"
              icon={Target}
            >
              <ItemList items={prioritySkills} />
            </SectionCard>

            <SectionCard
              title="30-Day Career Preparation Plan"
              icon={CalendarDays}
              className="cr-roadmap-card"
            >
              {roadmap.length > 0 ? (
                <div className="cr-roadmap">
                  {roadmap.map((task, index) => (
                    <div className="cr-roadmap-item" key={`task-${index}`}>
                      <div className="cr-roadmap-marker">
                        {index + 1}
                      </div>

                      <div>
                        <strong>
                          {typeof task === "object"
                            ? task.title || task.task || `Task ${index + 1}`
                            : asText(task)}
                        </strong>

                        {typeof task === "object" && (
                          <>
                            {task.week && (
                              <span className="cr-week">
                                {asText(task.week)}
                              </span>
                            )}

                            <p>
                              {asText(
                                task.description ||
                                task.activity ||
                                task.details
                              )}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="cr-muted">
                  No preparation plan was returned.
                </p>
              )}
            </SectionCard>

            <SectionCard
              title="Job Application Insights"
              icon={TrendingUp}
              className="cr-insights-card"
            >
              {typeof applicationInsights === "string" ? (
                <p>{applicationInsights}</p>
              ) : applicationInsights &&
                typeof applicationInsights === "object" ? (
                <div className="cr-insights">
                  {Object.entries(applicationInsights).map(
                    ([key, value]) => (
                      <div key={key}>
                        <span>
                          {key
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (letter) =>
                              letter.toUpperCase()
                            )}
                        </span>
                        <strong>{asText(value)}</strong>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="cr-muted">
                  No application insights available.
                </p>
              )}
            </SectionCard>

            <SectionCard
              title="Important Cautions"
              icon={AlertCircle}
            >
              <ItemList
                items={cautions}
                emptyMessage="No specific cautions were returned."
              />
            </SectionCard>
          </div>

          <div className="cr-footer">
            <div>
              <BookOpen size={18} />
              <span>
                Review your learning priorities regularly and update
                your career plan as you gain new skills.
              </span>
            </div>

            <button
              type="button"
              className="cr-secondary-btn"
              onClick={generateRecommendations}
              disabled={loading}
            >
              Regenerate Plan
              <ArrowRight size={16} />
            </button>
          </div>

          <p className="cr-disclaimer">
            These are AI-generated career suggestions based on the
            information available in your CareerCopilot account.
            Review them before making career decisions.
          </p>
        </div>
      )}
    </main>
  );
}

export default CareerRecommendations;
