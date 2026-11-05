
import {
  Award,
  Target,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react";
import { exportInterviewReport } from "../services/pdfService";
import { useState } from "react";

function toList(value) {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
}

function InterviewReport({ report, onBack }) {
  const [expandedQuestion, setExpandedQuestion] = useState(0);
  const handleExportPDF = () => {
  try {
    exportInterviewReport(report);
  } catch (error) {
    console.error("PDF export failed:", error);
    alert("Unable to export the interview report. Please try again.");
  }
};

  if (!report) {
    return (
      <div className="report-page">
        <p>No interview report is available.</p>
        <button className="primary-button" onClick={onBack}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const score = Number(report.overall_score ?? 0);
  const questions = report.questions || [];

  const metrics = [
    ["Correctness", report.average_correctness],
    ["Technical Depth", report.average_technical_depth],
    ["Clarity", report.average_clarity],
    ["Relevance", report.average_relevance],
    ["Completeness", report.average_completeness],
  ];

  const strengths = toList(report.strengths);
  const weaknesses = toList(report.weaknesses);
  const recommendations = toList(report.recommendations);

  const scoreLabel =
    score >= 80
      ? "Excellent"
      : score >= 65
      ? "Good"
      : score >= 50
      ? "Average"
      : "Needs Improvement";

  return (
    <div className="report-page">
      <div className="report-container">

        <button className="report-back" onClick={onBack}>
          <ArrowLeft size={17} />
          Back to Dashboard
        </button>

        <div className="report-heading">
          <div>
            <span className="section-label">CAREERCOPILOT</span>
            <h1>Interview Performance Report</h1>
            <p>
              Your AI-powered interview evaluation and performance analysis.
            </p>
          </div>

          <div className="report-heading-actions">
  <button
    className="primary-button"
    onClick={handleExportPDF}
    disabled={!report}
  >
    <Download size={17} />
    Export PDF
  </button>

  <div className="report-award">
    <Award size={30} />
  </div>
</div>
        </div>

        {/* Overall score */}
        <section className="report-score-card">
          <div className="score-circle">
            <strong>{score.toFixed(1)}</strong>
            <span>/10</span>
          </div>

          <div className="score-description">
            <span className="section-label">OVERALL PERFORMANCE</span>
            <h2>{scoreLabel}</h2>
            <p>
              {report.summary ||
                `You completed ${report.total_questions} interview questions.`}
            </p>
            <p className="question-count">
              <CheckCircle size={16} />
              {report.total_questions || 0} questions evaluated
            </p>
          </div>
        </section>

        {/* Performance metrics */}
        <section className="report-section">
          <h2>Performance Breakdown</h2>

          <div className="metrics-grid">
            {metrics.map(([label, value]) => {
              const metricScore = Math.min(
                100,
                Math.max(0, Number(value ?? 0))
              );

              return (
                <div className="report-metric" key={label}>
                  <div className="metric-heading">
                    <span>{label}</span>
                    <strong>{metricScore.toFixed(1)}%</strong>
                  </div>

                  <div className="metric-track">
                    <div
                      className="metric-progress"
                      style={{ width: `${metricScore}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Strengths and weaknesses */}
        <div className="report-feedback-grid">

          <section className="report-section feedback-card">
            <div className="report-card-heading">
              <CheckCircle size={20} />
              <h2>Your Strengths</h2>
            </div>

            {strengths.length ? (
              <ul>
                {strengths.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>No strengths recorded.</p>
            )}
          </section>

          <section className="report-section feedback-card">
            <div className="report-card-heading warning-heading">
              <AlertTriangle size={20} />
              <h2>Areas to Improve</h2>
            </div>

            {weaknesses.length ? (
              <ul>
                {weaknesses.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>No improvement areas recorded.</p>
            )}
          </section>

        </div>

        {/* Recommendations */}
        <section className="report-section feedback-card">
          <div className="report-card-heading recommendation-heading">
            <Lightbulb size={20} />
            <h2>Recommended Improvements</h2>
          </div>

          {recommendations.length ? (
            <ul>
              {recommendations.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>No additional recommendations recorded.</p>
          )}
        </section>

        {/* Individual question evaluations */}
        <section className="report-section">
          <h2>Question-by-Question Analysis</h2>

          {questions.length === 0 ? (
            <p>No question evaluations are available.</p>
          ) : (
            <div className="question-report-list">
              {questions.map((item, index) => {
                const isExpanded = expandedQuestion === index;

                return (
                  <div className="question-report-card" key={index}>

                    <button
                      className="question-report-toggle"
                      onClick={() =>
                        setExpandedQuestion(
                          isExpanded ? -1 : index
                        )
                      }
                    >
                      <div>
                        <span className="question-number">
                          QUESTION {index + 1}
                        </span>
                        <h3>{item.question}</h3>
                      </div>

                      <div className="question-score">
                        <strong>
                          {Number(item.overall_score ?? 0).toFixed(1)}
                        </strong>
                        <span>/100</span>
                        {isExpanded ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="question-report-details">

                        <h4>Your Answer</h4>
                        <p>{item.answer || "No answer recorded."}</p>

                        <h4>Score Breakdown</h4>

                        <div className="question-mini-metrics">
                          {[
                            ["Correctness", item.correctness],
                            ["Technical Depth", item.technical_depth],
                            ["Clarity", item.clarity],
                            ["Relevance", item.relevance],
                            ["Completeness", item.completeness],
                          ].map(([label, value]) => (
                            <div key={label}>
                              <span>{label}</span>
                              <strong>{value ?? 0}/100</strong>
                            </div>
                          ))}
                        </div>

                        <h4>AI Feedback</h4>
                        <p>
                          {item.feedback ||
                            item.evaluation?.feedback ||
                            "No feedback available."}
                        </p>

                        {item.evaluation?.ideal_answer && (
                          <>
                            <h4>Ideal Answer</h4>
                            <p>{item.evaluation.ideal_answer}</p>
                          </>
                        )}

                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </section>

        <button
          className="primary-button report-home-button"
          onClick={onBack}
        >
          <Target size={18} />
          Return to Dashboard
        </button>

      </div>
    </div>
  );
}

export default InterviewReport;
