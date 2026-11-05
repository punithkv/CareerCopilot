import {
  CheckCircle2,
  XCircle,
  Target,
  Sparkles,
  Brain,
  BriefcaseBusiness,
} from "lucide-react";


function ScoreCard({ title, score, icon }) {
  return (
    <div className="score-card">
      <div className="score-icon">{icon}</div>

      <p>{title}</p>

      <h2>{Number(score ?? 0).toFixed(1)}%</h2>

      <div className="progress-track">
        <div
          className="progress-fill"
          style={{
            width: `${Math.min(100, Math.max(0, score ?? 0))}%`,
          }}
        />
      </div>
    </div>
  );
}


function MatchResult({ analysis, jobDescription, onStartInterview }) {
  if (!analysis?.match) {
    return null;
  }

  const match = analysis.match;

  const matchedSkills = match.matched_skills || [];
  const missingSkills = match.missing_skills || [];

  return (
    <section className="results-section">

      <div className="results-heading">
        <div>
          <span className="section-label">
            <Sparkles size={15} />
            AI ANALYSIS
          </span>

          <h2>Your job compatibility report</h2>

          <p>
            Here's how your resume compares with this job description.
          </p>
        </div>
      </div>


      <div className="overall-card">

        <div className="overall-score">
          <div
            className="score-circle"
            style={{
              "--score": `${Math.min(100, Math.max(0, match.overall_match_score ?? 0))}%`,
            }}
          >
            <div className="score-circle-inner">
              <strong>
                {Number(match.overall_match_score ?? 0).toFixed(0)}%
              </strong>
              <span>Match</span>
            </div>
          </div>
        </div>

        <div className="overall-info">
          <span className="section-label">
            <Target size={15} />
            OVERALL MATCH
          </span>

          <h2>
            {match.overall_match_score >= 80
              ? "Strong alignment"
              : match.overall_match_score >= 60
              ? "Good potential"
              : "Room for improvement"}
          </h2>

          <p>
            Your calculated match score combines semantic similarity
            and detected skill overlap. It is an indicative score,
            not a hiring probability.
          </p>
        </div>

      </div>


      <div className="score-grid">

        <ScoreCard
          title="Semantic Similarity"
          score={match.semantic_score}
          icon={<Brain size={20} />}
        />

        <ScoreCard
          title="Skill Match"
          score={match.skill_match_score}
          icon={<BriefcaseBusiness size={20} />}
        />

      </div>


      <div className="skills-grid">

        <div className="result-card">

          <h3>
            <CheckCircle2 size={19} />
            Matched Skills
          </h3>

          <p>Skills detected in both your resume and the job description.</p>

          <div className="skill-list">
            {matchedSkills.length > 0 ? (
              matchedSkills.map((skill) => (
                <span className="skill matched" key={skill}>
                  {skill}
                </span>
              ))
            ) : (
              <span>No matching skills detected.</span>
            )}
          </div>

        </div>


        <div className="result-card">

          <h3>
            <XCircle size={19} />
            Missing Skills
          </h3>

          <p>Skills required by the job but not detected in your resume.</p>

          <div className="skill-list">
            {missingSkills.length > 0 ? (
              missingSkills.map((skill) => (
                <span className="skill missing" key={skill}>
                  {skill}
                </span>
              ))
            ) : (
              <span>No missing skills detected.</span>
            )}
          </div>

        </div>

      </div>


      <div className="result-card ai-analysis-card">

        <h3>
          <Sparkles size={19} />
          AI Career Recommendations
        </h3>

        <div className="ai-analysis-content">
          {analysis.ai_analysis}
        </div>

      </div>


      <div className="interview-cta">

        <div>
          <h2>Ready to practice?</h2>

          <p>
            Generate personalized interview questions based on your
            resume and this job description.
          </p>
        </div>

        <button
          className="primary-button interview-button"
          onClick={() => onStartInterview(jobDescription)}
        >
          Start AI Interview
          <Sparkles size={18} />
        </button>

      </div>

    </section>
  );
}

export default MatchResult;