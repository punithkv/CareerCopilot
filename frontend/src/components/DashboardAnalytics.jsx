import CareerRecommendations from "./CareerRecommendations";
import { useEffect, useState } from "react";

import {
  FileText,
  Brain,
  Target,
  Trophy,
  Clock,
  ArrowRight,
  RefreshCw,
  CalendarDays,
  BarChart3,
  TrendingUp,
  X,
} from "lucide-react";

import {
  getInterviewHistory,
  getResumeStatus,
} from "../services/api";

import CareerRoadmap from "./CareerRoadmap";

// =====================================
// MONTHLY ANALYTICS CALCULATION
// =====================================

function getMonthlyAnalytics(sessions) {
  const months = [];

  for (let offset = 5; offset >= 0; offset--) {
    const date = new Date();

    date.setDate(1);
    date.setMonth(date.getMonth() - offset);

    const year = date.getFullYear();
    const month = date.getMonth();

    const monthlySessions = sessions.filter((session) => {
      const sessionDate = new Date(session.created_at);

      return (
        !Number.isNaN(sessionDate.getTime()) &&
        sessionDate.getFullYear() === year &&
        sessionDate.getMonth() === month
      );
    });

    const completed = monthlySessions.filter(
      (session) => session.completed
    );

    const averageScore =
      completed.length > 0
        ? completed.reduce(
            (total, session) =>
              total + Number(session.overall_score || 0),
            0
          ) / completed.length
        : 0;

    months.push({
      label: date.toLocaleDateString("en-US", {
        month: "short",
      }),
      key: `${year}-${month}`,
      year,
      month,
      count: monthlySessions.length,
      averageScore: Number(averageScore.toFixed(1)),
    });
  }

  return months;
}

// =====================================
// MAIN DASHBOARD ANALYTICS
// =====================================

function DashboardAnalytics({ onNavigate }) {
  const [sessions, setSessions] = useState([]);
  const [resumeStatus, setResumeStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [error, setError] = useState("");

  // =====================================
  // LOAD DASHBOARD DATA
  // =====================================

  const loadDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [historyResult, resumeResult] = await Promise.all([
        getInterviewHistory(),
        getResumeStatus(),
      ]);

      setSessions(historyResult.sessions || []);
      setResumeStatus(resumeResult);
    } catch (err) {
      console.error("Dashboard analytics error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load dashboard analytics."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // =====================================
  // INTERVIEW STATISTICS
  // =====================================

  const completedSessions = sessions.filter(
    (session) => session.completed
  );

  const averageScore =
    completedSessions.length > 0
      ? (
          completedSessions.reduce(
            (total, session) =>
              total + Number(session.overall_score || 0),
            0
          ) / completedSessions.length
        ).toFixed(1)
      : "0.0";

  const recentSessions = [...sessions]
    .sort(
      (a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
    )
    .slice(0, 5);

  // =====================================
  // MONTHLY CHART DATA
  // =====================================

  const monthlyAnalytics = getMonthlyAnalytics(sessions);

  const maxInterviews = Math.max(
    ...monthlyAnalytics.map((month) => month.count),
    1
  );

  // =====================================
  // SELECTED MONTH DETAILS
  // =====================================

  const selectedMonthData = selectedMonth
    ? monthlyAnalytics.find(
        (month) => month.key === selectedMonth
      )
    : null;

  const selectedMonthSessions = selectedMonthData
    ? sessions.filter((session) => {
        const date = new Date(session.created_at);

        return (
          !Number.isNaN(date.getTime()) &&
          date.getFullYear() === selectedMonthData.year &&
          date.getMonth() === selectedMonthData.month
        );
      }).sort(
        (a, b) =>
          new Date(b.created_at) - new Date(a.created_at)
      )
    : [];

  // =====================================
  // CHART SELECTION HANDLER
  // =====================================

  const handleMonthSelection = (monthKey) => {
    setSelectedMonth((current) =>
      current === monthKey ? null : monthKey
    );
  };

  const handleChartKeyDown = (event, monthKey) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleMonthSelection(monthKey);
    }
  };

  // =====================================
  // LOADING SCREEN
  // =====================================

  if (loading) {
    return (
      <div className="analytics-loading">
        <RefreshCw
          size={24}
          className="analytics-spin"
        />
        <p>Loading your career dashboard...</p>
      </div>
    );
  }

  // =====================================
  // DASHBOARD UI
  // =====================================

  return (
    <section className="dashboard-analytics">

      {/* HEADER */}

      <div className="analytics-header">
        <div>
          <h2>Career Overview</h2>
          <p>
            Your learning and interview performance at a glance.
          </p>
        </div>

        <button
          className="analytics-refresh"
          type="button"
          onClick={() => loadDashboardData(true)}
          disabled={refreshing}
        >
          <RefreshCw
            size={16}
            className={refreshing ? "analytics-spin" : ""}
          />

          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="analytics-error">
          {error}

          <button
            type="button"
            onClick={() => loadDashboardData(true)}
          >
            Try again
          </button>
        </div>
      )}

      {/* STATISTICS CARDS */}

      <div className="analytics-stats-grid">

        <div className="analytics-stat-card">
          <div className="analytics-icon">
            <FileText size={22} />
          </div>

          <h3>
            {resumeStatus?.files?.length || 0}
          </h3>

          <p>Uploaded Resumes</p>
        </div>

        <div className="analytics-stat-card">
          <div className="analytics-icon">
            <Brain size={22} />
          </div>

          <h3>{sessions.length}</h3>

          <p>Total Interviews</p>
        </div>

        <div className="analytics-stat-card">
          <div className="analytics-icon">
            <Trophy size={22} />
          </div>

          <h3>{completedSessions.length}</h3>

          <p>Completed Interviews</p>
        </div>

        <div className="analytics-stat-card">
          <div className="analytics-icon">
            <Target size={22} />
          </div>

          <h3>{averageScore}/100</h3>

          <p>Average Interview Score</p>
        </div>

      </div>

      {/* RESUME OVERVIEW AND QUICK ACTIONS */}

      <div className="analytics-main-grid">

        {/* RESUME OVERVIEW */}

        <div className="analytics-panel">

          <h3>
            <FileText size={19} />
            Resume Overview
          </h3>

          {resumeStatus?.uploaded ? (
            <>
              {resumeStatus.files.map((file) => (
                <div
                  className="analytics-resume-item"
                  key={file.file_id}
                >
                  <FileText size={19} />

                  <div>
                    <strong>{file.filename}</strong>

                    <p>
                      {file.chunks} indexed chunks
                    </p>
                  </div>
                </div>
              ))}

              <p className="analytics-success">
                Resume indexed successfully.
              </p>
            </>
          ) : (
            <div className="analytics-empty">
              <p>No resume uploaded yet.</p>

              <button
                type="button"
                onClick={() => {
                  onNavigate("dashboard");

                  setTimeout(() => {
                    document
                      .getElementById("resume-workspace")
                      ?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                  }, 100);
                }}
              >
                Upload Resume
                <ArrowRight size={15} />
              </button>
            </div>
          )}

        </div>

        {/* QUICK ACTIONS */}

        <div className="analytics-panel">

          <h3>
            <Brain size={19} />
            Quick Actions
          </h3>

          <button
            className="analytics-action"
            type="button"
            onClick={() => {
              document
                .getElementById("resume-workspace")
                ?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
            }}
          >
            <FileText size={18} />

            Upload Resume / Job Matching

            <ArrowRight size={16} />
          </button>

          <button
            className="analytics-action"
            type="button"
            onClick={() => onNavigate("analyzer")}
          >
            <Target size={18} />

            Resume Skill Analyzer

            <ArrowRight size={16} />
          </button>

          <button
            className="analytics-action"
            type="button"
            onClick={() => onNavigate("history")}
          >
            <Clock size={18} />

            Interview History

            <ArrowRight size={16} />
          </button>

        </div>

      </div>

      {/* =====================================
          NEW: CAREER PREPARATION ROADMAP
      ===================================== */}

      <CareerRoadmap sessions={completedSessions} />

      {/* INTERACTIVE ANALYTICS CHARTS */}

      <div className="analytics-charts-grid">

        {/* INTERVIEW ACTIVITY CHART */}

        <div className="analytics-panel chart-panel">

          <h3>
            <BarChart3 size={19} />
            Monthly Interview Activity
          </h3>

          <p className="chart-description">
            Number of interviews conducted each month.
            Click a month to see its details.
          </p>

          <div className="bar-chart">

            {monthlyAnalytics.map((month) => (
              <div
                className={`bar-chart-column ${
                  selectedMonth === month.key
                    ? "selected-chart-month"
                    : ""
                }`}
                key={month.key}
                onClick={() =>
                  handleMonthSelection(month.key)
                }
                role="button"
                tabIndex={0}
                aria-pressed={selectedMonth === month.key}
                aria-label={`${month.label} ${month.year}: ${month.count} interviews`}
                onKeyDown={(event) =>
                  handleChartKeyDown(event, month.key)
                }
              >
                <span className="bar-value">
                  {month.count}
                </span>

                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      height: `${
                        (month.count / maxInterviews) * 100
                      }%`,
                    }}
                    title={`${month.count} interviews in ${month.label} ${month.year}`}
                  />
                </div>

                <span className="bar-label">
                  {month.label}
                </span>
              </div>
            ))}

          </div>

        </div>

        {/* PERFORMANCE TREND CHART */}

        <div className="analytics-panel chart-panel">

          <h3>
            <TrendingUp size={19} />
            Interview Performance Trend
          </h3>

          <p className="chart-description">
            Average score from completed interviews.
            Click a month to see its details.
          </p>

          <div className="performance-chart">

            {monthlyAnalytics.map((month) => (
              <div
                className={`performance-row ${
                  selectedMonth === month.key
                    ? "selected-chart-month"
                    : ""
                }`}
                key={month.key}
                onClick={() =>
                  handleMonthSelection(month.key)
                }
                role="button"
                tabIndex={0}
                aria-pressed={selectedMonth === month.key}
                aria-label={`${month.label} ${month.year}: average score ${month.averageScore}`}
                onKeyDown={(event) =>
                  handleChartKeyDown(event, month.key)
                }
              >
                <span>{month.label}</span>

                <div className="performance-track">
                  <div
                    className="performance-fill"
                    style={{
                      width: `${Math.min(
                        Math.max(month.averageScore, 0),
                        100
                      )}%`,
                    }}
                    title={`Average score: ${month.averageScore}/100`}
                  />
                </div>

                <strong>
                  {month.averageScore}
                </strong>

              </div>
            ))}

          </div>

        </div>

      </div>

      {/* SELECTED MONTH DETAILS */}

      {selectedMonthData && (
        <div className="analytics-panel selected-month-panel">

          <div className="analytics-header">

            <div>
              <h3>
                <CalendarDays
                  size={19}
                  style={{
                    display: "inline",
                    marginRight: "8px",
                    verticalAlign: "middle",
                  }}
                />

                {selectedMonthData.label}{" "}
                {selectedMonthData.year} Details
              </h3>

              <p>
                {selectedMonthData.count} interviews ·
                Average score:{" "}
                {selectedMonthData.averageScore}/100
              </p>
            </div>

            <button
              className="analytics-refresh"
              type="button"
              onClick={() => setSelectedMonth(null)}
            >
              <X size={16} />
              Clear selection
            </button>

          </div>

          {selectedMonthSessions.length > 0 ? (
            selectedMonthSessions.map((session) => (
              <div
                className="recent-session-item"
                key={session.session_id}
              >
                <div>
                  <strong>
                    {session.job_description
                      ? session.job_description.slice(0, 75)
                      : "Interview Session"}
                  </strong>

                  <p>
                    {session.answered_questions || 0}/
                    {session.total_questions || 0} questions answered
                  </p>
                </div>

                <span
                  className={
                    session.completed
                      ? "analytics-completed"
                      : "analytics-pending"
                  }
                >
                  {session.completed
                    ? "Completed"
                    : "In Progress"}
                </span>

              </div>
            ))
          ) : (
            <p className="analytics-empty">
              No interviews in this month.
            </p>
          )}

        </div>
      )}

      {/* RECENT INTERVIEW ACTIVITY */}

      <div className="analytics-panel recent-activity">

        <h3>
          <Clock size={19} />
          Recent Interview Activity
        </h3>

        {recentSessions.length > 0 ? (
          recentSessions.map((session) => (
            <div
              className="recent-session-item"
              key={session.session_id}
            >
              <div>
                <strong>
                  {session.job_description
                    ? session.job_description.slice(0, 75)
                    : "Interview Session"}

                  {session.job_description?.length > 75
                    ? "..."
                    : ""}
                </strong>

                <p>
                  {session.answered_questions || 0}/
                  {session.total_questions || 0} questions answered
                </p>
              </div>

              <span
                className={
                  session.completed
                    ? "analytics-completed"
                    : "analytics-pending"
                }
              >
                {session.completed
                  ? "Completed"
                  : "In Progress"}
              </span>
            </div>
          ))
        ) : (
          <p className="analytics-empty">
            No interview activity yet. Start practising!
          </p>
        )}

        <button
          className="analytics-history-link"
          type="button"
          onClick={() => onNavigate("history")}
        >
          View All Interviews
          <ArrowRight size={16} />
        </button>

      </div>
      {/* AI Career Recommendation Engine */}
      <CareerRecommendations />
    </section>
  );
}

export default DashboardAnalytics;
