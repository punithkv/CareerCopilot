
import { useState } from "react";
import {
  Target,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Brain,
  Loader2,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

import { analyzeResume } from "../services/api";
import { getApiError } from "../services/errorHandler";

function ResumeAnalyzer({ onBack }) {
  const [jobDescription, setJobDescription] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    // Validate job description
    if (!jobDescription.trim()) {
      setError("Please enter a job description.");
      return;
    }

    if (jobDescription.trim().length < 50) {
      setError(
        "Please enter a job description containing at least 50 characters."
      );
      return;
    }

    if (jobDescription.trim().length > 12000) {
      setError(
        "Job description cannot exceed 12,000 characters."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      setAnalysis(null);

      const result = await analyzeResume(
        jobDescription.trim()
      );

      setAnalysis(result);
    } catch (err) {
      setError(
        getApiError(
          err,
          "Unable to analyze your resume. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setJobDescription("");
    setAnalysis(null);
    setError("");
  };

  const matchPercentage =
    analysis?.skill_match_percentage ?? 0;

  return (
    <div className="resume-analyzer-page">
      {/* Header */}
      <div className="analyzer-header">
        <button
          type="button"
          className="back-button"
          onClick={onBack}
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div>
          <h1>Resume Skill Analyzer</h1>
          <p>
            Discover your strengths and identify skills to
            improve for your target job.
          </p>
        </div>
      </div>

      {/* Job Description Input */}
      <div className="analyzer-input-card">
        <h2>
          <Target size={21} />
          Target Job Description
        </h2>

        <textarea
          rows="7"
          placeholder="Paste the complete job description here..."
          value={jobDescription}
          onChange={(e) => {
            setJobDescription(e.target.value);
            if (error) setError("");
          }}
          maxLength={12000}
          disabled={loading}
        />

        <div className="analyzer-character-count">
          {jobDescription.length}/12000 characters
        </div>

        {error && (
          <div className="analyzer-error" role="alert">
            <AlertCircle size={17} />
            {error}
          </div>
        )}

        <div className="analyzer-button-group">
          <button
            type="button"
            className="analyze-button"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spin" />
                Analyzing Resume...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Analyze My Resume
              </>
            )}
          </button>

          {(analysis || jobDescription) && (
            <button
              type="button"
              className="analyze-reset-button"
              onClick={handleReset}
              disabled={loading}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="analyzer-results">

          {/* Match Score */}
          <div className="analyzer-score-card">
            <div>
              <h2>Skill Match Score</h2>
              <p>
                How closely your detected skills match the job
                requirements.
              </p>
            </div>

            <div className="score-circle">
              <strong>
                {Number(matchPercentage).toFixed(1)}%
              </strong>
              <span>Skill Match</span>
            </div>
          </div>

          {/* Skill Summary */}
          <div className="skill-summary-grid">
            <div className="skill-summary-card">
              <CheckCircle size={22} />

              <h3>
                {analysis.matched_skills?.length || 0}
              </h3>

              <p>Matched Skills</p>
            </div>

            <div className="skill-summary-card">
              <AlertCircle size={22} />

              <h3>
                {analysis.missing_skills?.length || 0}
              </h3>

              <p>Missing Skills</p>
            </div>

            <div className="skill-summary-card">
              <Brain size={22} />

              <h3>
                {analysis.resume_skills?.length || 0}
              </h3>

              <p>Resume Skills</p>
            </div>
          </div>

          {/* Skill Categories */}
          <div className="skill-details-grid">

            {/* Resume Skills */}
            <div className="skill-detail-card">
              <h2>
                <Brain size={20} />
                Skills in Your Resume
              </h2>

              <div className="skill-tags">
                {analysis.resume_skills?.length ? (
                  analysis.resume_skills.map((skill, index) => (
                    <span
                      className="skill-tag"
                      key={`${skill}-${index}`}
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p>No skills detected.</p>
                )}
              </div>
            </div>

            {/* Required Skills */}
            <div className="skill-detail-card">
              <h2>
                <Target size={20} />
                Required Job Skills
              </h2>

              <div className="skill-tags">
                {analysis.required_skills?.length ? (
                  analysis.required_skills.map((skill, index) => (
                    <span
                      className="skill-tag required"
                      key={`${skill}-${index}`}
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p>No required skills detected.</p>
                )}
              </div>
            </div>

            {/* Matched Skills */}
            <div className="skill-detail-card">
              <h2>
                <CheckCircle size={20} />
                Matched Skills
              </h2>

              <div className="skill-tags">
                {analysis.matched_skills?.length ? (
                  analysis.matched_skills.map((skill, index) => (
                    <span
                      className="skill-tag matched"
                      key={`${skill}-${index}`}
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p>No matching skills detected.</p>
                )}
              </div>
            </div>

            {/* Missing Skills */}
            <div className="skill-detail-card">
              <h2>
                <AlertCircle size={20} />
                Missing Skills
              </h2>

              <div className="skill-tags">
                {analysis.missing_skills?.length ? (
                  analysis.missing_skills.map((skill, index) => (
                    <span
                      className="skill-tag missing"
                      key={`${skill}-${index}`}
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p>No missing skills detected.</p>
                )}
              </div>
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="recommendations-card">
            <h2>
              <BookOpen size={21} />
              AI Career Recommendations
            </h2>

            <div className="recommendations-content">
              {analysis.recommendations ||
                "No recommendations available."}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

export default ResumeAnalyzer;
