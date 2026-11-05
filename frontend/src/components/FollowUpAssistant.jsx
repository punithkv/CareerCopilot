
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Mail,
  Sparkles,
  Copy,
  RefreshCw,
  CalendarDays,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Building2,
  BriefcaseBusiness,
  Send,
} from "lucide-react";

import { getApplications } from "../services/applicationApi";
import { getApiError } from "../services/errorHandler";
import "./FollowUpAssistant.css";

const API_URL = "http://127.0.0.1:8000/api/follow-up/generate";

function formatDate(value) {
  if (!value) return "No follow-up date";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function FollowUpAssistant({ onBack }) {
  const [applications, setApplications] = useState([]);
  const [selectedId, setSelectedId] = useState("");

  const [filter, setFilter] = useState("All");

  const [loadingApplications, setLoadingApplications] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const [copied, setCopied] = useState(false);

  const selectedApplication = useMemo(
    () =>
      applications.find(
        (application) => String(application.id) === String(selectedId)
      ) || null,
    [applications, selectedId]
  );

  const loadApplications = useCallback(async () => {
    try {
      setLoadingApplications(true);
      setError("");

      const data = await getApplications("All", "");

      const applicationList = Array.isArray(data)
        ? data
        : data.applications || [];

      setApplications(applicationList);
    } catch (err) {
      setError(
        getApiError(
          err,
          "Unable to load applications. Please check the backend."
        )
      );
    } finally {
      setLoadingApplications(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const visibleApplications = useMemo(() => {
    const today = getTodayString();

    return applications.filter((application) => {
      const status = String(application.status || "").toLowerCase();

      if (status === "offer" || status === "rejected") {
        return false;
      }

      const followUpDate = application.follow_up_date;

      if (filter === "Overdue") {
        return Boolean(
          followUpDate && followUpDate < today
        );
      }

      if (filter === "Upcoming") {
        return Boolean(
          followUpDate && followUpDate >= today
        );
      }

      return Boolean(followUpDate);
    });
  }, [applications, filter]);

  const handleFilterChange = (value) => {
    setFilter(value);
    setSelectedId("");
    setSubject("");
    setEmailBody("");
    setError("");
    setSuccess("");
  };

  const handleSelectApplication = (event) => {
    setSelectedId(event.target.value);
    setSubject("");
    setEmailBody("");
    setCopied(false);
    setError("");
    setSuccess("");
  };

  const handleGenerate = async () => {
    if (!selectedApplication) {
      setError("Please select a job application first.");
      return;
    }

    try {
      setGenerating(true);
      setError("");
      setSuccess("");
      setCopied(false);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          application_id: selectedApplication.id,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const apiError = new Error(
          data.detail || "Unable to generate follow-up email."
        );

        apiError.response = {
          status: response.status,
          data,
        };

        throw apiError;
      }

      // Support common response formats from the backend.
      const result = data.email || data.result || data;

      const generatedSubject =
        result.subject ||
        data.subject ||
        `Follow-up regarding ${selectedApplication.role} application`;

      const generatedBody =
        result.body ||
        result.email_body ||
        result.message ||
        data.body ||
        data.email_body ||
        "";

      if (!generatedBody) {
        throw new Error(
          "The AI response did not contain an email body. Please try again."
        );
      }

      setSubject(generatedSubject);
      setEmailBody(generatedBody);

      setSuccess("Follow-up email generated successfully.");
    } catch (err) {
      setError(
        getApiError(
          err,
          "Unable to generate the follow-up email. Check that the backend and Ollama are running."
        )
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!subject.trim() && !emailBody.trim()) {
      setError("Generate an email before copying.");
      return;
    }

    const completeEmail = `Subject: ${subject}\n\n${emailBody}`;

    try {
      await navigator.clipboard.writeText(completeEmail);
      setCopied(true);
      setSuccess("Email copied to clipboard.");

      window.setTimeout(() => {
        setCopied(false);
      }, 2500);
    } catch {
      setError("Unable to copy the email. Please copy it manually.");
    }
  };

  const handleReset = () => {
    setSubject("");
    setEmailBody("");
    setError("");
    setSuccess("");
    setCopied(false);
  };

  const overdueCount = applications.filter((application) => {
    const today = getTodayString();
    const status = String(application.status || "").toLowerCase();

    return (
      application.follow_up_date &&
      application.follow_up_date < today &&
      status !== "offer" &&
      status !== "rejected"
    );
  }).length;

  const upcomingCount = applications.filter((application) => {
    const today = getTodayString();
    const status = String(application.status || "").toLowerCase();

    return (
      application.follow_up_date &&
      application.follow_up_date >= today &&
      status !== "offer" &&
      status !== "rejected"
    );
  }).length;

  return (
    <main className="follow-up-page">
      <header className="follow-up-header">
        <div>
          <div className="follow-up-eyebrow">
            <Sparkles size={16} />
            LOCAL GENAI CAREER ASSISTANT
          </div>

          <h1>AI Follow-up Assistant</h1>

          <p>
            Generate professional follow-up emails for your job
            applications using your local AI assistant.
          </p>
        </div>

        {onBack && (
          <button
            type="button"
            className="follow-up-back-btn"
            onClick={onBack}
          >
            <ArrowLeft size={17} />
            Back
          </button>
        )}
      </header>

      {error && (
        <div className="follow-up-alert error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="follow-up-alert success" role="status">
          <CheckCircle2 size={18} />
          <span>{success}</span>

          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Dismiss success message"
          >
            ×
          </button>
        </div>
      )}

      <section className="follow-up-stats">
        <article className="follow-up-stat-card">
          <div className="follow-up-stat-icon">
            <BriefcaseBusiness size={21} />
          </div>

          <div>
            <span>Applications</span>
            <strong>{applications.length}</strong>
          </div>
        </article>

        <article className="follow-up-stat-card">
          <div className="follow-up-stat-icon overdue">
            <AlertCircle size={21} />
          </div>

          <div>
            <span>Overdue Follow-ups</span>
            <strong>{overdueCount}</strong>
          </div>
        </article>

        <article className="follow-up-stat-card">
          <div className="follow-up-stat-icon upcoming">
            <CalendarDays size={21} />
          </div>

          <div>
            <span>Upcoming Follow-ups</span>
            <strong>{upcomingCount}</strong>
          </div>
        </article>
      </section>

      <section className="follow-up-workspace">
        <div className="follow-up-selection-panel">
          <div className="follow-up-section-heading">
            <div>
              <h2>Select Application</h2>
              <p>Choose the application for your follow-up email.</p>
            </div>

            <button
              type="button"
              className="follow-up-refresh-btn"
              onClick={loadApplications}
              disabled={loadingApplications}
              title="Refresh applications"
            >
              <RefreshCw
                size={17}
                className={loadingApplications ? "follow-up-spin" : ""}
              />
            </button>
          </div>

          <div className="follow-up-filter">
            <label htmlFor="follow-up-filter">Filter applications</label>

            <select
              id="follow-up-filter"
              value={filter}
              onChange={(event) =>
                handleFilterChange(event.target.value)
              }
            >
              <option value="All">All with follow-up dates</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          {loadingApplications ? (
            <div className="follow-up-empty">
              <RefreshCw className="follow-up-spin" size={25} />
              <p>Loading applications...</p>
            </div>
          ) : visibleApplications.length === 0 ? (
            <div className="follow-up-empty">
              <CalendarDays size={35} />

              <h3>No applications found</h3>

              <p>
                Add a follow-up date to an application in your Job
                Application Tracker to see it here.
              </p>
            </div>
          ) : (
            <div className="follow-up-application-list">
              {visibleApplications.map((application) => (
                <button
                  type="button"
                  key={application.id}
                  className={`follow-up-application-card ${
                    String(selectedId) === String(application.id)
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    handleSelectApplication({
                      target: { value: String(application.id) },
                    })
                  }
                >
                  <div className="follow-up-company-icon">
                    <Building2 size={19} />
                  </div>

                  <div className="follow-up-application-info">
                    <strong>{application.company}</strong>
                    <span>{application.role}</span>

                    <small>
                      <CalendarDays size={13} />
                      {formatDate(application.follow_up_date)}
                    </small>
                  </div>

                  <span
                    className={`follow-up-status ${
                      application.follow_up_date < getTodayString()
                        ? "overdue"
                        : "upcoming"
                    }`}
                  >
                    {application.follow_up_date < getTodayString()
                      ? "Overdue"
                      : "Upcoming"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="follow-up-editor-panel">
          <div className="follow-up-section-heading">
            <div>
              <h2>Generate Follow-up Email</h2>
              <p>Use AI to draft a professional follow-up message.</p>
            </div>

            <Mail size={23} />
          </div>

          {selectedApplication ? (
            <div className="follow-up-selected-details">
              <div>
                <span>Company</span>
                <strong>{selectedApplication.company}</strong>
              </div>

              <div>
                <span>Job Role</span>
                <strong>{selectedApplication.role}</strong>
              </div>

              <div>
                <span>Application Status</span>
                <strong>{selectedApplication.status}</strong>
              </div>

              <div>
                <span>Follow-up Date</span>
                <strong>
                  {formatDate(selectedApplication.follow_up_date)}
                </strong>
              </div>
            </div>
          ) : (
            <div className="follow-up-select-placeholder">
              <Mail size={32} />
              <p>Select an application to get started.</p>
            </div>
          )}

          <button
            type="button"
            className="follow-up-generate-btn"
            onClick={handleGenerate}
            disabled={!selectedApplication || generating}
          >
            {generating ? (
              <>
                <RefreshCw size={18} className="follow-up-spin" />
                Generating Email...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generate Follow-up Email
              </>
            )}
          </button>

          {(subject || emailBody) && (
            <div className="follow-up-email-editor">
              <div className="follow-up-email-heading">
                <div>
                  <h3>
                    <Mail size={18} />
                    Generated Email
                  </h3>
                  <p>Review and edit the email before sending it.</p>
                </div>

                <button
                  type="button"
                  className="follow-up-reset-btn"
                  onClick={handleReset}
                >
                  <RefreshCw size={15} />
                  Clear
                </button>
              </div>

              <label htmlFor="follow-up-subject">Email Subject</label>

              <input
                id="follow-up-subject"
                type="text"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Enter email subject"
              />

              <label htmlFor="follow-up-body">Email Body</label>

              <textarea
                id="follow-up-body"
                rows={13}
                value={emailBody}
                onChange={(event) => setEmailBody(event.target.value)}
                placeholder="Your generated follow-up email will appear here..."
              />

              <div className="follow-up-editor-actions">
                <button
                  type="button"
                  className="follow-up-copy-btn"
                  onClick={handleCopy}
                  disabled={!subject.trim() && !emailBody.trim()}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 size={17} />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={17} />
                      Copy Email
                    </>
                  )}
                </button>
              </div>

              <p className="follow-up-disclaimer">
                <AlertCircle size={14} />
                Review the generated email and verify all details before
                sending it to a recruiter. This assistant does not send
                emails automatically.
              </p>
            </div>
          )}
        </div>
      </section>

      <footer className="follow-up-footer">
        <Clock size={15} />
        Follow-up dates are taken from your Job Application Tracker.
      </footer>
    </main>
  );
}

export default FollowUpAssistant;
