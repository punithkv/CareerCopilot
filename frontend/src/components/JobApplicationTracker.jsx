
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  ExternalLink,
  X,
  CheckCircle2,
  Clock3,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

import {
  getApplications,
  getApplicationStats,
  createApplication,
  updateApplication,
  deleteApplication,
} from "../services/applicationApi";

import { getApiError } from "../services/errorHandler";

import "./JobApplicationTracker.css";

const STATUSES = [
  "Applied",
  "Assessment",
  "Interview",
  "Offer",
  "Rejected",
];

const createEmptyForm = () => ({
  company: "",
  role: "",
  status: "Applied",
  salary: "",
  application_date: new Date().toISOString().slice(0, 10),
  job_link: "",
  follow_up_date: "",
  notes: "",
});

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function JobApplicationTracker({ onBack }) {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);

  const [form, setForm] = useState(createEmptyForm);
  const [editingId, setEditingId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load applications and dashboard statistics
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [applicationData, statsData] = await Promise.all([
        getApplications("All", search.trim()),
        getApplicationStats(),
      ]);

      setApplications(applicationData.applications || []);
      setStats(statsData);
    } catch (err) {
      setError(
        getApiError(
          err,
          "Unable to load applications. Check whether the backend is running."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter applications
  const visibleApplications = useMemo(() => {
    if (filter === "All") {
      return applications;
    }

    if (filter === "Overdue") {
      return applications.filter((item) => item.overdue);
    }

    return applications.filter(
      (item) => item.status === filter
    );
  }, [applications, filter]);

  // Open form for a new application
  const openNewForm = () => {
    setEditingId(null);
    setForm(createEmptyForm());
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  // Open form for editing an application
  const openEditForm = (application) => {
    setEditingId(application.id);

    setForm({
      company: application.company || "",
      role: application.role || "",
      status: application.status || "Applied",
      salary: application.salary || "",
      application_date: application.application_date || "",
      job_link: application.job_link || "",
      follow_up_date: application.follow_up_date || "",
      notes: application.notes || "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  // Close form
  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(createEmptyForm());
  };

  // Handle input changes
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // Create or update an application
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.company.trim() || !form.role.trim()) {
      setError("Company name and job role are required.");
      return;
    }

    if (!form.application_date) {
      setError("Please select the application date.");
      return;
    }

    if (form.notes.trim().length > 3000) {
      setError("Notes cannot exceed 3000 characters.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        ...form,
        company: form.company.trim(),
        role: form.role.trim(),
        job_link: form.job_link.trim(),
        salary: form.salary.trim(),
        notes: form.notes.trim(),
        follow_up_date: form.follow_up_date || null,
      };

      if (editingId !== null) {
        await updateApplication(editingId, payload);
        setSuccess("Application updated successfully.");
      } else {
        await createApplication(payload);
        setSuccess("Application added successfully.");
      }

      closeForm();
      await loadData();
    } catch (err) {
      setError(
        getApiError(
          err,
          "Unable to save this application."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete an application
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this application?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await deleteApplication(id);

      setSuccess("Application deleted successfully.");

      await loadData();
    } catch (err) {
      setError(
        getApiError(
          err,
          "Unable to delete this application."
        )
      );
    }
  };

  // Update application status
  const handleStatusChange = async (id, status) => {
    try {
      setError("");
      setSuccess("");

      await updateApplication(id, { status });

      setSuccess("Application status updated.");

      await loadData();
    } catch (err) {
      setError(
        getApiError(
          err,
          "Unable to update application status."
        )
      );
    }
  };

  // Dashboard statistic cards
  const cards = [
    {
      label: "Total Applications",
      value: stats?.total ?? 0,
      icon: BriefcaseBusiness,
      color: "blue",
    },
    {
      label: "Interviews",
      value: stats?.interview ?? 0,
      icon: CheckCircle2,
      color: "purple",
    },
    {
      label: "Offers",
      value: stats?.offers ?? 0,
      icon: TrendingUp,
      color: "green",
    },
    {
      label: "Pending Follow-ups",
      value: stats?.overdue_followups ?? 0,
      icon: AlertCircle,
      color: "orange",
    },
  ];

  return (
    <main className="application-page">

      {/* Header */}
      <header className="application-header">
        <div>
          <div className="application-eyebrow">
            CAREER MANAGEMENT
          </div>

          <h1>Job Application Tracker</h1>

          <p>
            Organize your job applications, track progress and never
            miss a follow-up.
          </p>
        </div>

        <div className="application-header-actions">
          {onBack && (
            <button
              type="button"
              className="application-secondary-btn"
              onClick={onBack}
            >
              Back
            </button>
          )}

          <button
            type="button"
            className="application-primary-btn"
            onClick={openNewForm}
          >
            <Plus size={18} />
            Add Application
          </button>
        </div>
      </header>

      {/* Error message */}
      {error && (
        <div className="application-alert error">
          <AlertCircle size={17} />

          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="application-alert success">
          <CheckCircle2 size={17} />

          <span>{success}</span>

          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Statistics */}
      <section className="application-stats">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              className="application-stat-card"
              key={card.label}
            >
              <div
                className={`application-stat-icon ${card.color}`}
              >
                <Icon size={21} />
              </div>

              <div>
                <p>{card.label}</p>
                <h2>{card.value}</h2>
              </div>
            </article>
          );
        })}
      </section>

      {/* Offer conversion rate */}
      <section className="application-conversion">
        <div>
          <span>Offer conversion rate</span>

          <strong>
            {stats?.conversion_rate ?? 0}%
          </strong>
        </div>

        <p>
          Offers divided by decided applications (offers and rejections).
        </p>
      </section>

      {/* Add / Edit form */}
      {showForm && (
        <section className="application-form-panel">

          <div className="application-form-heading">
            <div>
              <h2>
                {editingId !== null
                  ? "Edit Application"
                  : "Add New Application"}
              </h2>

              <p>
                Enter the details of the job you applied for.
              </p>
            </div>

            <button
              type="button"
              className="application-close-btn"
              onClick={closeForm}
              aria-label="Close form"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="application-form-grid">

              <label>
                Company Name *

                <input
                  type="text"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="e.g. Infosys"
                  maxLength={150}
                  required
                />
              </label>

              <label>
                Job Role *

                <input
                  type="text"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  placeholder="e.g. Python Developer"
                  maxLength={150}
                  required
                />
              </label>

              <label>
                Application Status

                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Salary / Package

                <input
                  type="text"
                  name="salary"
                  value={form.salary}
                  onChange={handleChange}
                  placeholder="e.g. 4.5 LPA"
                />
              </label>

              <label>
                Application Date *

                <input
                  type="date"
                  name="application_date"
                  value={form.application_date}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Follow-up Date

                <input
                  type="date"
                  name="follow_up_date"
                  value={form.follow_up_date}
                  onChange={handleChange}
                />
              </label>

              <label className="application-full-width">
                Job Posting Link

                <input
                  type="url"
                  name="job_link"
                  value={form.job_link}
                  onChange={handleChange}
                  placeholder="https://..."
                />
              </label>

              <label className="application-full-width">
                Notes

                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                  maxLength={3000}
                  placeholder="Recruiter details, interview date, preparation notes..."
                />

                <small>
                  {form.notes.length}/3000 characters
                </small>
              </label>

            </div>

            <div className="application-form-actions">
              <button
                type="button"
                className="application-secondary-btn"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="application-primary-btn"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId !== null
                    ? "Save Changes"
                    : "Add Application"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Application list */}
      <section className="application-list-panel">

        <div className="application-list-heading">
          <div>
            <h2>Your Applications</h2>

            <p>
              Manage and update your job search progress.
            </p>
          </div>

          <button
            type="button"
            className="application-refresh-btn"
            onClick={loadData}
            disabled={loading}
            title="Refresh applications"
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>

        {/* Search and filter */}
        <div className="application-toolbar">

          <div className="application-search">
            <Search size={18} />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search company or role..."
            />
          </div>

          <select
            className="application-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="All">All Applications</option>
            <option value="Overdue">Overdue Follow-ups</option>

            {STATUSES.map((status) => (
              <option value={status} key={status}>
                {status}
              </option>
            ))}
          </select>

        </div>

        {/* Loading state */}
        {loading ? (
          <div className="application-empty">
            <RefreshCw
              className="application-spinner"
              size={25}
            />

            <p>Loading applications...</p>
          </div>

        ) : visibleApplications.length === 0 ? (

          /* Empty state */
          <div className="application-empty">
            <BriefcaseBusiness size={36} />

            <h3>No applications found</h3>

            <p>
              Add your first job application to start tracking your progress.
            </p>

            <button
              type="button"
              className="application-primary-btn"
              onClick={openNewForm}
            >
              <Plus size={17} />
              Add Application
            </button>
          </div>

        ) : (

          /* Applications table */
          <div className="application-table-wrap">
            <table className="application-table">

              <thead>
                <tr>
                  <th>Company / Role</th>
                  <th>Applied On</th>
                  <th>Status</th>
                  <th>Follow-up</th>
                  <th>Salary</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {visibleApplications.map((item) => (
                  <tr key={item.id}>

                    {/* Company and role */}
                    <td>
                      <div className="application-company">
                        <strong>{item.company}</strong>

                        <span>{item.role}</span>

                        {item.job_link && (
                          <a
                            href={item.job_link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View job
                            <ExternalLink size={12} />
                          </a>
                        )}

                        {item.notes && (
                          <small title={item.notes}>
                            Note: {item.notes}
                          </small>
                        )}
                      </div>
                    </td>

                    {/* Application date */}
                    <td>
                      {formatDate(item.application_date)}
                    </td>

                    {/* Status */}
                    <td>
                      <select
                        className={`application-status-select status-${(
                          item.status || "applied"
                        ).toLowerCase()}`}
                        value={item.status}
                        onChange={(event) =>
                          handleStatusChange(
                            item.id,
                            event.target.value
                          )
                        }
                        aria-label={`Status for ${item.company}`}
                      >
                        {STATUSES.map((status) => (
                          <option value={status} key={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Follow-up date */}
                    <td>
                      <span
                        className={
                          item.overdue
                            ? "follow-up-overdue"
                            : ""
                        }
                      >
                        {item.overdue && (
                          <AlertCircle size={13} />
                        )}

                        {formatDate(item.follow_up_date)}
                      </span>
                    </td>

                    {/* Salary */}
                    <td>
                      {item.salary || "—"}
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="application-row-actions">

                        <button
                          type="button"
                          onClick={() => openEditForm(item)}
                          title="Edit application"
                          aria-label="Edit application"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          className="delete"
                          onClick={() => handleDelete(item.id)}
                          title="Delete application"
                          aria-label="Delete application"
                        >
                          <Trash2 size={16} />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}
      </section>

      {/* Footer note */}
      <div className="application-footer-note">
        <Clock3 size={15} />

        Follow-up dates earlier than today are highlighted as overdue
        until the application reaches Offer or Rejected.
      </div>

    </main>
  );
}

export default JobApplicationTracker;
