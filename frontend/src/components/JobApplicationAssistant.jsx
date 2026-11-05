
import { useState } from "react";
import {
  BriefcaseBusiness,
  Sparkles,
  Target,
  CheckCircle,
  AlertCircle,
  Copy,
  RotateCcw,
  Mail,
  FileText,
  Save,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

import { analyzeJobApplication } from "../services/jobApplicationAssistantApi";
import { createApplication } from "../services/applicationApi";
import { getApiError } from "../services/errorHandler";

import "./JobApplicationAssistant.css";

function getLocalDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function JobApplicationAssistant({
  onBack,
  onOpenTracker,
}) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState("");

  const [saved, setSaved] = useState(false);

  // Analyze job application
  const handleAnalyze = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!company.trim()) {
      setError("Please enter the company name.");
      return;
    }

    if (!role.trim()) {
      setError("Please enter the job role.");
      return;
    }

    if (jobDescription.trim().length < 50) {
      setError(
        "Job description must contain at least 50 characters."
      );
      return;
    }

    if (jobDescription.trim().length > 12000) {
      setError(
        "Job description cannot exceed 12000 characters."
      );
      return;
    }

    try {
      setLoading(true);
      setResult(null);
      setSaved(false);

      const data = await analyzeJobApplication({
        company: company.trim(),
        role: role.trim(),
        job_description: jobDescription.trim(),
      });

      // Backend response:
      // {
      //   success: true,
      //   company: "...",
      //   role: "...",
      //   analysis: { ... }
      // }

      const analysis = data.analysis || data;

      setResult({
        ...analysis,
        company: data.company || company.trim(),
        role: data.role || role.trim(),
      });
    } catch (err) {
      setError(
        getApiError(
          err,
          "Unable to analyze this job application. Check that the backend and Ollama are running."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // Copy generated content
  const copyText = async (text, label) => {
    if (!text) {
      setError("There is no content available to copy.");
      return;
    }

    try {
      await navigator.clipboard.writeText(String(text));

      setCopied(label);

      window.setTimeout(() => {
        setCopied("");
      }, 2000);
    } catch {
      setError(
        "Unable to copy. Please select and copy the text manually."
      );
    }
  };

  // Save analyzed job to Job Application Tracker
  const handleSaveToTracker = async () => {
    if (!result || saved || saving) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const matchingSkills = Array.isArray(result.matching_skills)
        ? result.matching_skills.join(", ")
        : "";

      const missingSkills = Array.isArray(result.missing_skills)
        ? result.missing_skills.join(", ")
        : "";

      const notes = [
        `AI Fit Score: ${result.fit_score ?? "Not available"}/100`,
        `Fit Category: ${result.fit_category || "Not available"}`,
        `Application Decision: ${
          result.application_decision || "Not available"
        }`,
        `Matching Skills: ${matchingSkills || "Not available"}`,
        `Missing Skills: ${missingSkills || "Not available"}`,
        `Summary: ${result.match_summary || "Not available"}`,
      ].join("\n");

      await createApplication({
        company: result.company || company.trim(),
        role: result.role || role.trim(),
        status: "Applied",
        salary: "",
        application_date: getLocalDate(),
        job_link: "",
        follow_up_date: null,
        notes,
      });

      setSaved(true);
      setSuccess(
        "Job application successfully saved to your tracker."
      );
    } catch (err) {
      setError(
        getApiError(
          err,
          "Unable to save the application to your tracker."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  // Reset the form
  const resetForm = () => {
    setCompany("");
    setRole("");
    setJobDescription("");
    setResult(null);
    setError("");
    setSuccess("");
    setCopied("");
    setSaved(false);
  };

  return (
    <main className="jaa-page">

      {/* Header */}
      <header className="jaa-header">
        <div>
          <div className="jaa-eyebrow">
            <Sparkles size={16} />
            LOCAL GENAI CAREER ASSISTANT
          </div>

          <h1>AI Job Application Assistant</h1>

          <p>
            Discover how well your resume matches a role and
            prepare a tailored job application using local AI.
          </p>
        </div>

        {onBack && (
          <button
            type="button"
            className="jaa-secondary-button"
            onClick={onBack}
          >
            Back to Dashboard
          </button>
        )}
      </header>

      {/* Job Information Form */}
      <form
        className="jaa-form"
        onSubmit={handleAnalyze}
      >
        <div className="jaa-section-heading">
          <BriefcaseBusiness size={21} />

          <div>
            <h2>Job information</h2>
            <p>
              Paste the job description you want to apply for.
            </p>
          </div>
        </div>

        <div className="jaa-input-grid">

          <label>
            Company name

            <input
              value={company}
              onChange={(event) => {
                setCompany(event.target.value);
                setSaved(false);
              }}
              placeholder="Example: Infosys"
              maxLength={150}
              required
            />
          </label>

          <label>
            Job role

            <input
              value={role}
              onChange={(event) => {
                setRole(event.target.value);
                setSaved(false);
              }}
              placeholder="Example: Python Developer"
              maxLength={150}
              required
            />
          </label>

        </div>

        <label className="jaa-description-label">
          Job description

          <textarea
            value={jobDescription}
            onChange={(event) => {
              setJobDescription(event.target.value);
              setSaved(false);
            }}
            placeholder="Paste the complete job description here..."
            rows={9}
            maxLength={12000}
            required
          />

          <small>
            {jobDescription.length} / 12000 characters
          </small>
        </label>

        {/* Error Message */}
        {error && (
          <div className="jaa-error">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="jaa-success">
            <CheckCircle2 size={18} />
            {success}
          </div>
        )}

        {/* Form Buttons */}
        <div className="jaa-form-actions">

          <button
            type="submit"
            className="jaa-primary-button"
            disabled={loading}
          >
            <Sparkles size={18} />

            {loading
              ? "Analyzing with local AI..."
              : "Analyze Job Match"}
          </button>

          <button
            type="button"
            className="jaa-secondary-button"
            onClick={resetForm}
            disabled={loading || saving}
          >
            <RotateCcw size={16} />
            Reset
          </button>

        </div>

        {loading && (
          <p className="jaa-loading-note">
            Qwen is comparing your resume with the job
            description. This can take a few minutes on a
            local computer.
          </p>
        )}

      </form>

      {/* AI Results */}
      {result && (
        <section className="jaa-results">

          {/* Result Heading */}
          <div className="jaa-result-heading">

            <div>
              <span className="jaa-eyebrow">
                AI MATCH REPORT
              </span>

              <h2>
                {result.role} at {result.company}
              </h2>

              <p>
                {result.match_summary ||
                  "Your job application analysis is ready."}
              </p>
            </div>

            <div className="jaa-score">
              <strong>
                {result.fit_score ?? "—"}
              </strong>

              <span>/ 100 match</span>
            </div>

          </div>

          {/* Application Decision */}
          <div className="jaa-decision">
            <Target size={19} />

            <div>
              <strong>
                {result.application_decision ||
                  "Review your match report"}
              </strong>

              <span>
                {result.fit_category || "Match category unavailable"}
              </span>
            </div>
          </div>

          {/* Skill Analysis */}
          <div className="jaa-result-grid">

            <ResultList
              title="Matching skills"
              items={result.matching_skills}
              icon={<CheckCircle size={18} />}
              className="jaa-positive"
            />

            <ResultList
              title="Skills to develop"
              items={result.missing_skills}
              icon={<AlertCircle size={18} />}
              className="jaa-warning"
            />

            <ResultList
              title="Relevant resume evidence"
              items={result.relevant_experience}
              icon={<FileText size={18} />}
            />

            <ResultList
              title="Improvement suggestions"
              items={result.improvement_suggestions}
              icon={<Target size={18} />}
            />

          </div>

          {/* Cover Letter */}
          {result.cover_letter && (
            <section className="jaa-document-card">

              <div className="jaa-document-heading">
                <div>
                  <FileText size={20} />
                  <h3>Tailored cover letter</h3>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    copyText(result.cover_letter, "letter")
                  }
                >
                  <Copy size={16} />

                  {copied === "letter"
                    ? "Copied"
                    : "Copy"}
                </button>
              </div>

              <p className="jaa-document-text">
                {result.cover_letter}
              </p>

            </section>
          )}

          {/* Application Email */}
          {result.application_email && (
            <section className="jaa-document-card">

              <div className="jaa-document-heading">
                <div>
                  <Mail size={20} />
                  <h3>Application email</h3>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    copyText(
                      `Subject: ${
                        result.application_email?.subject || ""
                      }\n\n${
                        result.application_email?.body || ""
                      }`,
                      "email"
                    )
                  }
                >
                  <Copy size={16} />

                  {copied === "email"
                    ? "Copied"
                    : "Copy"}
                </button>
              </div>

              <strong>
                Subject:{" "}
                {result.application_email.subject || ""}
              </strong>

              <p className="jaa-document-text">
                {result.application_email.body || ""}
              </p>

            </section>
          )}

          {/* Interview Preparation */}
          <ResultList
            title="Interview preparation topics"
            items={result.interview_preparation}
            icon={<Target size={18} />}
          />

          {/* Save to Tracker */}
          <section className="jaa-save-panel">

            <div>
              <h3>
                <BriefcaseBusiness size={20} />
                Job Application Tracker
              </h3>

              <p>
                Save this company and role to your application
                tracker so you can monitor your progress.
              </p>
            </div>

            <button
              type="button"
              className="jaa-primary-button"
              onClick={handleSaveToTracker}
              disabled={saving || saved}
            >
              {saved ? (
                <>
                  <CheckCircle2 size={18} />
                  Saved to Tracker
                </>
              ) : saving ? (
                "Saving..."
              ) : (
                <>
                  <Save size={18} />
                  Save Application
                </>
              )}
            </button>

            {saved && onOpenTracker && (
              <button
                type="button"
                className="jaa-secondary-button"
                onClick={onOpenTracker}
              >
                Open Application Tracker
                <ExternalLink size={16} />
              </button>
            )}

          </section>

          <p className="jaa-disclaimer">
            AI-generated suggestions are based on the resume
            and job description you supplied. Review all details
            before applying.
          </p>

        </section>
      )}

    </main>
  );
}

// Reusable result list
function ResultList({
  title,
  items,
  icon,
  className = "",
}) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return (
    <section className={`jaa-list-card ${className}`}>

      <h3>
        {icon}
        {title}
      </h3>

      <ul>
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>
            {typeof item === "string"
              ? item
              : item?.name || item?.skill || item?.text || ""}
          </li>
        ))}
      </ul>

    </section>
  );
}

export default JobApplicationAssistant;
