
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Clock,
  CheckCircle,
  Trash2,
  FileText,
  RefreshCw,
  History,
  Search,
  X,
} from "lucide-react";

import {
  getInterviewHistory,
  deleteInterviewSession,
} from "../services/api";

function InterviewHistory({ onViewReport, onResume }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search, filter and sorting states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  // Load interview history
  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getInterviewHistory();
      setSessions(result.sessions || []);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load interview history."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Delete an interview session
  const handleDelete = async (sessionId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this interview session?"
    );

    if (!confirmDelete) return;

    try {
      await deleteInterviewSession(sessionId);

      setSessions((previousSessions) =>
        previousSessions.filter(
          (session) => session.session_id !== sessionId
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to delete interview session."
      );
    }
  };

  // Clear search and filters
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSortOrder("newest");
  };

  // Search, filter and sort sessions
  const filteredSessions = sessions
    .filter((session) => {
      const jobDescription = (
        session.job_description || "Interview Session"
      ).toLowerCase();

      const matchesSearch = jobDescription.includes(
        searchTerm.toLowerCase().trim()
      );

      const matchesStatus =
  statusFilter === "all" ||
  (statusFilter === "completed" &&
    (session.completed || session.status === "completed")) ||
  (statusFilter === "paused" &&
    session.status === "paused") ||
  (statusFilter === "in-progress" &&
    !session.completed &&
    session.status !== "paused" &&
    session.status !== "completed");

return matchesSearch && matchesStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();

      return sortOrder === "newest"
        ? dateB - dateA
        : dateA - dateB;
    });

  // Dashboard statistics
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(
    (session) =>
      session.completed || session.status === "completed"
  ).length;
  const pausedSessions = sessions.filter(
    (session) => session.status === "paused"
  ).length;
  const inProgressSessions = sessions.filter(
    (session) =>
      !session.completed &&
    session.status !== "completed" &&
    session.status !== "paused"
  ).length;
  const averageScore =
  completedSessions > 0
  ? (
    sessions
    .filter((session) => session.completed)
    .reduce(
      (total, session) =>
        total + (Number(session.overall_score) || 0),
      0
    ) / completedSessions
  ).toFixed(1)
  : "0.0";

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Date unavailable";

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    return date.toLocaleString();
  };

  const hasActiveFilters =
    searchTerm !== "" ||
    statusFilter !== "all" ||
    sortOrder !== "newest";
    // Pagination calculations
  const totalPages = Math.ceil(
    filteredSessions.length / itemsPerPage
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentSessions = filteredSessions.slice(
    startIndex,
    startIndex + itemsPerPage
  );
  // Reset pagination when search, filter or sorting changes
useEffect(() => {
  setCurrentPage(1);
}, [searchTerm, statusFilter, sortOrder]);

// Keep current page valid when interviews are deleted
useEffect(() => {
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }

  if (totalPages === 0 && currentPage !== 1) {
    setCurrentPage(1);
  }
}, [currentPage, totalPages]);
  return (
  <div className="history-page">

      {/* Header */}
      <div className="history-header">
        <div>
          <h1>Interview History</h1>
          <p>
            Track your previous interviews and continue unfinished
            sessions.
          </p>
        </div>

        <button
          className="history-refresh-button"
          onClick={fetchHistory}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Statistics */}
<div className="history-stats">
  <div className="history-stat-card">
    <div className="history-stat-icon">
      <History size={22} />
    </div>
    <div>
      <h3>{totalSessions}</h3>
      <p>Total Interviews</p>
    </div>
  </div>

  <div className="history-stat-card">
    <div className="history-stat-icon">
      <CheckCircle size={22} />
    </div>
    <div>
      <h3>{completedSessions}</h3>
      <p>Completed</p>
    </div>
  </div>

  <div className="history-stat-card">
    <div className="history-stat-icon">
      <Clock size={22} />
    </div>
    <div>
      <h3>{inProgressSessions}</h3>
      <p>In Progress</p>
    </div>
  </div>

  <div className="history-stat-card">
    <div className="history-stat-icon">
      <RefreshCw size={22} />
    </div>
    <div>
      <h3>{pausedSessions}</h3>
      <p>Paused</p>
    </div>
  </div>

  <div className="history-stat-card">
    <div className="history-stat-icon">
      <FileText size={22} />
    </div>
    <div>
      <h3>{averageScore}/100</h3>
      <p>Average Score</p>
    </div>
  </div>
</div>

      {/* Loading */}
      {loading && (
        <div className="history-loading">
          <div className="spinner"></div>
          <p>Loading interview history...</p>
        </div>
      )}

      {/* Search and Filters */}
      {!loading && sessions.length > 0 && (
        <div className="history-filter-section">

          <div className="history-search-box">
            <Search size={19} />

            <input
              type="text"
              placeholder="Search by job description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {searchTerm && (
              <button
                className="history-search-clear"
                onClick={() => setSearchTerm("")}
                title="Clear search"
              >
                <X size={17} />
              </button>
            )}
          </div>

          <div className="history-filter-controls">

            <div className="history-status-filters">
              <button
                className={
                  statusFilter === "all" ? "active" : ""
                }
                onClick={() => setStatusFilter("all")}
              >
                All
              </button>

              <button
                className={
                  statusFilter === "completed" ? "active" : ""
                }
                onClick={() => setStatusFilter("completed")}
              >
                Completed
              </button>

              <button
                className={
                  statusFilter === "in-progress" ? "active" : ""
                }
                onClick={() => setStatusFilter("in-progress")}
              >
                In Progress
              </button>
              <button
  className={
    statusFilter === "paused" ? "active" : ""
  }
  onClick={() => setStatusFilter("paused")}
>
  Paused
</button>
            </div>

            <select
              className="history-sort-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>

          </div>

          <div className="history-filter-summary">
            <p>
              Showing <strong>{filteredSessions.length}</strong> of{" "}
              <strong>{totalSessions}</strong> interviews
            </p>

            {hasActiveFilters && (
              <button
                className="history-clear-filters"
                onClick={clearFilters}
              >
                <X size={15} />
                Clear Filters
              </button>
            )}
          </div>

        </div>
      )}

      {/* No interviews */}
      {!loading && sessions.length === 0 && !error && (
        <div className="history-empty">
          <History size={48} />
          <h2>No interviews yet</h2>
          <p>
            Your interview sessions will appear here after you
            start practising.
          </p>
        </div>
      )}

      {/* No matching results */}
      {!loading &&
        sessions.length > 0 &&
        filteredSessions.length === 0 && (
          <div className="history-empty">
            <Search size={42} />
            <h2>No matching interviews</h2>
            <p>
              Try changing your search term or filters.
            </p>

            <button
              className="history-view-button"
              onClick={clearFilters}
            >
              Clear Filters
              <X size={16} />
            </button>
          </div>
        )}

            {/* Interview list */}
      {!loading && filteredSessions.length > 0 && (
        <div className="history-list">
          {/* Pagination Controls */}
{!loading && totalPages > 1 && (
  <div className="history-pagination">

    <button
      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
      disabled={currentPage === 1}
    >
      Previous
    </button>

    <span>
      Page {currentPage} of {totalPages}
    </span>

    <button
      onClick={() =>
        setCurrentPage((page) => Math.min(totalPages, page + 1))
      }
      disabled={currentPage === totalPages}
    >
      Next
    </button>

  </div>
)}

          {currentSessions.map((session) => {
            const totalQuestions = session.total_questions || 0;
            const answeredQuestions = session.answered_questions || 0;

            const progressPercentage =
              totalQuestions > 0
                ? Math.min(
                    100,
                    Math.round(
                      (answeredQuestions / totalQuestions) * 100
                    )
                  )
                : 0;

            const isCompleted =
              session.completed || session.status === "completed";

            return (
              <div
                className="history-card"
                key={session.session_id}
              >

                <div className="history-card-content">

                  {/* Title and Status */}
                  <div className="history-card-title">
                    <h3>
                      {session.job_description
                        ? session.job_description.length > 100
                          ? session.job_description.substring(0, 100) + "..."
                          : session.job_description
                        : "Interview Session"}
                    </h3>

                    <span
                      className={`history-status ${
                        isCompleted
                          ? "completed"
                          : session.status === "paused"
                          ? "paused"
                          : "pending"
                      }`}
                    >
                      {isCompleted
                        ? "Completed"
                        : session.status === "paused"
                        ? "Paused"
                        : "In Progress"}
                    </span>
                  </div>

                  {/* Interview Details */}
                  <div className="history-card-details">
                    <span>
                      <Clock size={15} />
                      {formatDate(session.created_at)}
                    </span>

                    <span>
                      <FileText size={15} />
                      {answeredQuestions}/{totalQuestions} Questions
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="history-progress-section">
                    <div className="history-progress-info">
                      <span>Interview Progress</span>
                      <strong>{progressPercentage}%</strong>
                    </div>

                    <div className="history-progress-track">
                      <div
                        className="history-progress-fill"
                        style={{
                          width: `${progressPercentage}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Interview Score */}
                  {isCompleted && (
                    <div className="history-score">
                      Score:{" "}
                      <strong>
                        {Number(session.overall_score || 0).toFixed(1)}
                        /100
                      </strong>
                    </div>
                  )}

                </div>

                {/* Actions */}
                <div className="history-card-actions">

                  {isCompleted ? (
                    <button
                      className="history-view-button"
                      onClick={() =>
                        onViewReport?.(session.session_id)
                      }
                      disabled={!onViewReport}
                    >
                      View Report
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button
                      className="history-view-button"
                      onClick={() =>
                        onResume?.(session.session_id)
                      }
                      disabled={!onResume}
                      title={
                        !onResume
                          ? "Resume functionality is not connected yet"
                          : "Resume interview"
                      }
                    >
                      Resume Interview
                      <ArrowRight size={16} />
                    </button>
                  )}

                  <button
                    className="history-delete-button"
                    onClick={() =>
                      handleDelete(session.session_id)
                    }
                    title="Delete interview"
                  >
                    <Trash2 size={17} />
                  </button>

                </div>

              </div>
            );
          })}

        </div>
      )}
      </div>
  );
}
export default InterviewHistory;
