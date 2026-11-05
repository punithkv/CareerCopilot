import { useState, useEffect } from "react";
import {
  BriefcaseBusiness,
  Sparkles,
  FileText,
  ArrowRight,
  UploadCloud,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Trash2,
} from "lucide-react";

import {
  analyzeJob,
  uploadResume,
  getResumeStatus,
  deleteResume,
} from "../services/api";

function Dashboard({ onAnalysis }) {
  const [jobDescription, setJobDescription] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedResume, setUploadedResume] = useState(null);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [resumeStatus, setResumeStatus] = useState(null);
  useEffect(() => {
    const loadResumeStatus = async () => {
      try {
        const result = await getResumeStatus();
        setResumeStatus(result);
      } catch (err) {
        console.error("Unable to load resume status:", err);
      }
    };
    loadResumeStatus();
  }, []);
  
  // Delete uploaded resume
  const handleDeleteResume = async (fileId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this resume?"
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setUploadError("");

      await deleteResume(fileId);

      const status = await getResumeStatus();
      setResumeStatus(status);
      setUploadedResume(null);
    } catch (err) {
      setUploadError(
        err.response?.data?.detail ||
          "Unable to delete resume."
      );
    } finally {
      setDeleting(false);
    }
  };

  // Select PDF file
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    setUploadError("");
    setUploadedResume(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Only PDF files are supported.");
      setSelectedFile(null);
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File size must be less than 10 MB.");
      setSelectedFile(null);
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    setUploadProgress(0);
  };

  // Upload resume
  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError("Please select a PDF resume first.");
      return;
    }

    try {
      setUploading(true);
      setUploadError("");
      setUploadProgress(0);

      const result = await uploadResume(
        selectedFile,
        (percentage) => {
          setUploadProgress(percentage);
        }
      );

      setUploadedResume(result);
      getResumeStatus()
        .then((status) => setResumeStatus(status))
        .catch((err) => {
          console.error("Unable to refresh resume status:", err);
        });
      setSelectedFile(null);
      setUploadProgress(100);

      // Clear the file input
      const fileInput = document.getElementById("resume-file");
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (err) {
      console.error("Resume upload error:", err);

      setUploadError(
        err.response?.data?.detail ||
          "Unable to upload resume. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  // Analyze job description
  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      setError("Please enter a job description.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await analyzeJob(jobDescription);

      onAnalysis(result, jobDescription);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to analyze the job description."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="dashboard">
      {/* Hero section */}
      <section className="hero">
        <div className="hero-badge">
          <Sparkles size={16} />
          Local GenAI Career Assistant
        </div>

        <h1>
          Turn your resume into
          <span> career intelligence.</span>
        </h1>

        <p>
          Analyze job descriptions, discover skill gaps,
          and practice interviews using a completely
          local GenAI stack.
        </p>
      </section>

      {/* Main workspace */}
      <section className="workspace" id="resume-workspace">
        {/* Resume Upload Card */}
        <div className="card">
          <div className="card-header">
            <div className="icon-box">
              <FileText size={20} />
            </div>

            <div>
              <h2>Your Resume</h2>
              <p>Upload your PDF resume to CareerCopilot</p>
            </div>
          </div>

          {/* File selection */}
          <div className="resume-upload-area">
            <UploadCloud size={32} />

            <p>
              Select your resume in PDF format
            </p>

            <label
              htmlFor="resume-file"
              className="resume-file-label"
            >
              Choose PDF File
            </label>

            <input
              id="resume-file"
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              disabled={uploading}
              hidden
            />

            <span className="resume-file-hint">
              Maximum file size: 10 MB
            </span>
          </div>

          {/* Selected file */}
          {selectedFile && (
            <div className="selected-resume">
              <FileText size={19} />

              <div className="selected-resume-info">
                <strong>{selectedFile.name}</strong>

                <span>
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>

              {!uploading && (
                <button
                  type="button"
                  className="remove-file-button"
                  onClick={() => {
                    setSelectedFile(null);
                    setUploadProgress(0);

                    const input = document.getElementById("resume-file");
                    if (input) input.value = "";
                  }}
                  title="Remove selected file"
                >
                  <X size={17} />
                </button>
              )}
            </div>
          )}

          {/* Upload progress */}
          {uploading && (
            <div className="upload-progress-section">
              <div className="upload-progress-text">
                <span>Uploading and processing resume...</span>
                <strong>{uploadProgress}%</strong>
              </div>

              <div className="upload-progress-track">
                <div
                  className="upload-progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload error */}
          {uploadError && (
            <div className="upload-error">
              <AlertCircle size={17} />
              {uploadError}
            </div>
          )}

          {/* Upload success */}
          
{resumeStatus?.uploaded ? (
  <div className="resume-status">
    <CheckCircle size={20} color="#16a34a" />

    <div>
      <strong>Resume ready</strong>

      {resumeStatus.files.map((file) => (
  <div className="resume-file-item" key={file.file_id}>
    <div>
      <strong>{file.filename}</strong>
      <span>{file.chunks} chunks indexed</span>
    </div>

    <button
      type="button"
      className="resume-delete-button"
      onClick={() => handleDeleteResume(file.file_id)}
      disabled={deleting || uploading}
      title="Delete resume"
    >
      {deleting ? (
        <Loader2 size={17} className="upload-spinner" />
      ) : (
        <Trash2 size={17} />
      )}
      Delete
    </button>
  </div>
))}

      <span>
        Total indexed chunks: {resumeStatus.total_chunks}
      </span>
    </div>
  </div>
) : uploadedResume ? (
  <div className="resume-status">
    <CheckCircle size={20} color="#16a34a" />
    <div>
      <strong>Resume uploaded successfully</strong>
      <span>{uploadedResume.filename}</span>
    </div>
  </div>
) : (
  <div className="resume-status">
    <AlertCircle size={20} color="#d97706" />
    <div>
      <strong>No resume uploaded</strong>
      <span>Please upload your PDF resume.</span>
    </div>
  </div>
)}

          {/* Upload button */}
          <button
            type="button"
            className="upload-resume-button"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? (
              <>
                <Loader2 size={18} className="upload-spinner" />
                Processing...
              </>
            ) : (
              <>
                <UploadCloud size={18} />
                Upload Resume
              </>
            )}
          </button>
        </div>

        {/* Job Description Card */}
        <div className="card">
          <div className="card-header">
            <div className="icon-box">
              <BriefcaseBusiness size={20} />
            </div>

            <div>
              <h2>Job Description</h2>
              <p>Paste the role you're applying for</p>
            </div>
          </div>

          <textarea
            value={jobDescription}
            onChange={(event) => {
              setJobDescription(event.target.value);
              setError("");
            }}
            placeholder="Example: We are looking for a Python Developer with experience in FastAPI, SQL, REST APIs, Git and Docker..."
            rows={10}
          />

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          <button
            className="primary-button"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Analyze Job"}

            {!loading && <ArrowRight size={18} />}
          </button>
        </div>
      </section>
    </main>
  );
}

export default Dashboard;
