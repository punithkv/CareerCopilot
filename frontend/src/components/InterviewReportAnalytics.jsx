
import { useEffect, useMemo, useState } from "react";
import {
  Award,
  TrendingUp,
  TrendingDown,
  Target,
  BriefcaseBusiness,
  RefreshCw,
  Lightbulb,
  BarChart3,
} from "lucide-react";

import { getInterviewReport } from "../services/api";
import "./InterviewReportAnalytics.css";

const CATEGORY_CONFIG = [
  {
    key: "average_correctness",
    label: "Correctness",
  },
  {
    key: "average_technical_depth",
    label: "Technical Depth",
  },
  {
    key: "average_clarity",
    label: "Clarity",
  },
  {
    key: "average_relevance",
    label: "Relevance",
  },
  {
    key: "average_completeness",
    label: "Completeness",
  },
];

function getAverage(values) {
  const validValues = values
    .map(Number)
    .filter(Number.isFinite);

  if (!validValues.length) {
    return 0;
  }

  return validValues.reduce(
    (total, value) => total + value,
    0
  ) / validValues.length;
}

function formatScore(value) {
  return Number(value || 0).toFixed(1);
}

function InterviewReportAnalytics({ sessions = [] }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Stable key prevents unnecessary report requests
  // whenever the parent component re-renders.
  const sessionKey = useMemo(
    () =>
      sessions
        .filter(
          (session) =>
            session.completed && session.session_id
        )
        .map((session) => session.session_id)
        .join("|"),
    [sessions]
  );

  // Fetch reports for all completed interviews.
  useEffect(() => {
    let cancelled = false;

    const sessionIds = sessionKey
      ? sessionKey.split("|")
      : [];

    if (!sessionIds.length) {
      setReports([]);
      setLoading(false);
      setError("");
      return;
    }

    const loadReports = async () => {
      setLoading(true);
      setError("");

      try {
        const results = await Promise.allSettled(
          sessionIds.map((id) => getInterviewReport(id))
        );

        if (cancelled) return;

        const successfulReports = results
          .filter(
            (result) =>
              result.status === "fulfilled" &&
              result.value
          )
          .map((result) => result.value)
          .filter(
            (report) =>
              Number(report.total_questions || 0) > 0
          );

        setReports(successfulReports);

        const failedCount = results.filter(
          (result) => result.status === "rejected"
        ).length;

        if (failedCount === results.length) {
          setError(
            "Unable to retrieve interview reports. Please refresh the dashboard."
          );
        } else if (failedCount > 0) {
          setError(
            `${failedCount} interview report(s) could not be loaded. Analytics may be incomplete.`
          );
        }
      } catch (err) {
        console.error(
          "Interview report analytics error:",
          err
        );

        if (!cancelled) {
          setError(
            "Unable to calculate interview analytics."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadReports();

    return () => {
      cancelled = true;
    };
  }, [sessionKey]);

  // ------------------------------------
  // CATEGORY PERFORMANCE
  // ------------------------------------

  const categoryAnalytics = useMemo(() => {
    return CATEGORY_CONFIG.map((category) => {
      const values = reports
        .map((report) => report[category.key])
        .filter(
          (value) =>
            value !== undefined &&
            value !== null &&
            Number.isFinite(Number(value))
        );

      return {
        ...category,
        score: getAverage(values),
      };
    });
  }, [reports]);

  const rankedCategories = [...categoryAnalytics]
    .sort((a, b) => b.score - a.score);

  const strongestCategory =
    reports.length > 0
      ? rankedCategories[0]
      : null;

  const weakestCategory =
    reports.length > 0
      ? rankedCategories[rankedCategories.length - 1]
      : null;

  // ------------------------------------
  // OVERALL PERFORMANCE TREND
  // ------------------------------------

  const performanceTrend = useMemo(() => {
    return [...reports]
      .sort(
        (a, b) =>
          new Date(a.created_at || 0) -
          new Date(b.created_at || 0)
      )
      .slice(-8)
      .map((report, index) => ({
        ...report,
        displayNumber: index + 1,
        score: Number(
          report.overall_score ||
          report.average_score ||
          0
        ),
      }));
  }, [reports]);

  const latestScore =
    performanceTrend.length > 0
      ? performanceTrend[performanceTrend.length - 1].score
      : 0;

  const previousScore =
    performanceTrend.length > 1
      ? performanceTrend[performanceTrend.length - 2].score
      : null;

  const scoreChange =
    previousScore !== null
      ? latestScore - previousScore
      : null;

  // ------------------------------------
  // ROLE-WISE PERFORMANCE
  // ------------------------------------

  const roleAnalytics = useMemo(() => {
    const groupedRoles = {};

    reports.forEach((report) => {
      const role =
        report.target_job_role?.trim() ||
        "Role not specified";

      if (!groupedRoles[role]) {
        groupedRoles[role] = [];
      }

      groupedRoles[role].push(
        Number(
          report.overall_score ||
          report.average_score ||
          0
        )
      );
    });

    return Object.entries(groupedRoles)
      .map(([role, scores]) => ({
        role,
        count: scores.length,
        averageScore: getAverage(scores),
      }))
      .sort(
        (a, b) =>
          b.averageScore - a.averageScore
      );
  }, [reports]);

  // ------------------------------------
  // LOADING STATE
  // ------------------------------------

  if (loading) {
    return (
      <section className="report-analytics-section">
        <div className="report-analytics-header">
          <div>
            <h2>Interview Report Analytics</h2>
            <p>
              Analyzing your completed interview reports...
            </p>
          </div>

          <RefreshCw
            size={22}
            className="analytics-spin"
          />
        </div>
      </section>
    );
  }

  // ------------------------------------
  // EMPTY STATE
  // ------------------------------------

  if (!reports.length) {
    return (
      <section className="report-analytics-section">
        <div className="report-analytics-header">
          <div>
            <h2>Interview Report Analytics</h2>
            <p>
              Understand your strengths and track your
              interview preparation progress.
            </p>
          </div>

          <BarChart3 size={24} />
        </div>

        {error && (
          <p className="report-analytics-error">
            {error}
          </p>
        )}

        <div className="report-analytics-empty">
          <Target size={35} />

          <h3>No report analytics available</h3>

          <p>
            Complete at least one interview to see
            category scores, role-wise performance
            and improvement trends.
          </p>
        </div>
      </section>
    );
  }

  // ------------------------------------
  // MAIN ANALYTICS UI
  // ------------------------------------

  return (
    <section className="report-analytics-section">

      <div className="report-analytics-header">
        <div>
          <h2>Interview Report Analytics</h2>

          <p>
            Performance insights from your completed
            interviews.
          </p>
        </div>

        <div className="report-analytics-count">
          <Award size={17} />
          {reports.length} Reports Analyzed
        </div>
      </div>

      {error && (
        <p className="report-analytics-error">
          {error}
        </p>
      )}

      {/* PERFORMANCE SUMMARY */}

      <div className="report-summary-grid">

        <div className="report-summary-card">
          <div className="report-summary-icon">
            <BarChart3 size={21} />
          </div>

          <span>Analyzed Interviews</span>

          <strong>{reports.length}</strong>
        </div>

        <div className="report-summary-card">
          <div className="report-summary-icon">
            <TrendingUp size={21} />
          </div>

          <span>Latest Interview Score</span>

          <strong>
            {formatScore(latestScore)}/100
          </strong>
        </div>

        <div className="report-summary-card">
          <div className="report-summary-icon">
            {scoreChange === null ||
            scoreChange >= 0 ? (
              <TrendingUp size={21} />
            ) : (
              <TrendingDown size={21} />
            )}
          </div>

          <span>Change from Previous Interview</span>

          <strong
            className={
              scoreChange === null
                ? ""
                : scoreChange >= 0
                ? "report-positive"
                : "report-negative"
            }
          >
            {scoreChange === null
              ? "N/A"
              : `${scoreChange > 0 ? "+" : ""}${formatScore(scoreChange)}`}
          </strong>
        </div>

      </div>

      {/* CATEGORY PERFORMANCE */}

      <div className="report-analytics-grid">

        <div className="report-analytics-panel">
          <h3>
            <Target size={19} />
            Category Performance
          </h3>

          <p className="report-panel-description">
            Average scores across all completed interviews.
          </p>

          <div className="report-category-list">

            {categoryAnalytics.map((category) => (
              <div
                className="report-category-row"
                key={category.key}
              >
                <div className="report-category-heading">
                  <span>{category.label}</span>

                  <strong>
                    {formatScore(category.score)}/100
                  </strong>
                </div>

                <div className="report-progress-track">
                  <div
                    className="report-progress-fill"
                    style={{
                      width: `${Math.min(
                        Math.max(category.score, 0),
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}

          </div>
        </div>

        {/* STRONGEST AND WEAKEST */}

        <div className="report-analytics-panel">
          <h3>
            <Award size={19} />
            Strengths and Improvement Areas
          </h3>

          <p className="report-panel-description">
            Based on your average category performance.
          </p>

          {strongestCategory && (
            <div className="report-insight-card report-strength-card">
              <span>Strongest Category</span>

              <h4>
                {strongestCategory.label}
              </h4>

              <strong>
                {formatScore(strongestCategory.score)}/100
              </strong>

              <p>
                This is your highest-scoring interview
                evaluation category.
              </p>
            </div>
          )}

          {weakestCategory && (
            <div className="report-insight-card report-weakness-card">
              <span>Needs More Practice</span>

              <h4>
                {weakestCategory.label}
              </h4>

              <strong>
                {formatScore(weakestCategory.score)}/100
              </strong>

              <p>
                Focus on improving this category in
                your next practice interview.
              </p>
            </div>
          )}

        </div>

      </div>

      {/* INTERVIEW IMPROVEMENT TREND */}

      <div className="report-analytics-panel report-trend-panel">
        <h3>
          <TrendingUp size={19} />
          Interview Improvement Trend
        </h3>

        <p className="report-panel-description">
          Your latest eight completed interviews,
          ordered from oldest to newest.
        </p>

        <div className="report-trend-list">

          {performanceTrend.map((item) => (
            <div
              className="report-trend-row"
              key={item.session_id}
            >
              <span className="report-trend-label">
                Interview {item.displayNumber}
              </span>

              <div className="report-progress-track">
                <div
                  className="report-progress-fill"
                  style={{
                    width: `${Math.min(
                      Math.max(item.score, 0),
                      100
                    )}%`,
                  }}
                />
              </div>

              <strong>
                {formatScore(item.score)}
              </strong>
            </div>
          ))}

        </div>

        {scoreChange !== null && (
          <div className="report-trend-note">
            {scoreChange > 0 ? (
              <>
                <TrendingUp size={17} />
                Your latest score improved by{" "}
                {formatScore(scoreChange)} points
                compared with your previous interview.
              </>
            ) : scoreChange < 0 ? (
              <>
                <TrendingDown size={17} />
                Your latest score decreased by{" "}
                {formatScore(Math.abs(scoreChange))} points
                compared with your previous interview.
              </>
            ) : (
              <>
                Your latest score is the same as your
                previous interview.
              </>
            )}
          </div>
        )}
      </div>

      {/* ROLE-WISE PERFORMANCE */}

      <div className="report-analytics-panel report-role-panel">
        <h3>
          <BriefcaseBusiness size={19} />
          Performance by Target Job Role
        </h3>

        <p className="report-panel-description">
          Compare your average interview score for
          different job roles.
        </p>

        {roleAnalytics.length > 0 ? (
          <div className="report-role-list">

            {roleAnalytics.map((item) => (
              <div
                className="report-role-row"
                key={item.role}
              >
                <div className="report-role-info">
                  <strong>{item.role}</strong>

                  <span>
                    {item.count} interview
                    {item.count !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="report-role-score">
                  <div className="report-progress-track">
                    <div
                      className="report-progress-fill"
                      style={{
                        width: `${Math.min(
                          Math.max(item.averageScore, 0),
                          100
                        )}%`,
                      }}
                    />
                  </div>

                  <strong>
                    {formatScore(item.averageScore)}/100
                  </strong>
                </div>
              </div>
            ))}

          </div>
        ) : (
          <p className="report-analytics-empty-text">
            No target job role information is available.
          </p>
        )}

        <div className="report-analytics-note">
          <Lightbulb size={18} />

          <p>
            Older interviews without a saved target job
            role are grouped under "Role not specified".
          </p>
        </div>

      </div>

    </section>
  );
}

export default InterviewReportAnalytics;
