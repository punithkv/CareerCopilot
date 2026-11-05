
function asText(value) {
  if (value == null) return "";

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(asText).filter(Boolean).join(", ");
  }

  return value.name || value.skill || value.text || "";
}

function ValueList({ title, value }) {
  const values = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",").map((item) => item.trim()).filter(Boolean)
      : [];

  if (!values.length) return null;

  return (
    <section className="card">
      <h3>{title}</h3>
      <ul>
        {values.map((item, index) => (
          <li key={`${title}-${index}`}>{asText(item)}</li>
        ))}
      </ul>
    </section>
  );
}

export default function JobAnalysis({
  analysis,
  jobDescription = "",
  onStartInterview,
}) {
  if (!analysis) {
    return (
      <section className="card">
        <h2>Job Analysis</h2>
        <p>Complete job analysis to see your results here.</p>
      </section>
    );
  }

  const matchScore =
    analysis.match_score ??
    analysis.match_percentage ??
    analysis.score ??
    analysis.compatibility_score;

  const matchingSkills =
    analysis.matching_skills ??
    analysis.matched_skills ??
    analysis.skills_match;

  const missingSkills =
    analysis.missing_skills ??
    analysis.gap_skills ??
    analysis.skills_to_learn;

  const recommendations =
    analysis.recommendations ??
    analysis.improvement_suggestions;

  const summary =
    analysis.summary ??
    analysis.analysis ??
    analysis.message;

  return (
    <main className="job-analysis-page">
      <section className="hero">
        <p className="eyebrow">CAREER MATCH</p>
        <h1>Job Analysis Results</h1>
        <p>Review how your profile compares with the target role.</p>
      </section>

      {matchScore != null && (
        <section className="card">
          <h2>Resume Match Score</h2>
          <p className="report-score">
            {typeof matchScore === "number"
              ? `${matchScore}${matchScore <= 1 ? "" : "%"}`
              : asText(matchScore)}
          </p>
        </section>
      )}

      {summary && (
        <section className="card">
          <h2>Analysis Summary</h2>
          <p>{asText(summary)}</p>
        </section>
      )}

      <div className="report-grid">
        <ValueList
          title="Matching Skills"
          value={matchingSkills}
        />

        <ValueList
          title="Skills to Improve"
          value={missingSkills}
        />

        <ValueList
          title="Recommendations"
          value={recommendations}
        />
      </div>

      {jobDescription && (
        <section className="card">
          <h3>Analyzed Job Description</h3>
          <p>{jobDescription}</p>
        </section>
      )}

      <details className="card">
        <summary>View complete API response</summary>
        <pre className="result-json">
          {JSON.stringify(analysis, null, 2)}
        </pre>
      </details>

      {onStartInterview && (
        <button
          type="button"
          className="primary-btn"
          onClick={onStartInterview}
        >
          Start Mock Interview
        </button>
      )}
    </main>
  );
}
