
import {
  FileSearch,
  BriefcaseBusiness,
  Mail,
  BrainCircuit,
  ClipboardList,
  History,
  ArrowRight,
} from "lucide-react";

import "./DashboardToolbox.css";

const tools = [
  {
    title: "Resume Analyzer",
    description: "Check resume quality, ATS readiness and skill gaps.",
    icon: FileSearch,
    page: "analyzer",
  },
  {
    title: "Job Application Tracker",
    description: "Manage applications, statuses and follow-up dates.",
    icon: BriefcaseBusiness,
    page: "applications",
  },
  {
    title: "AI Follow-up Assistant",
    description: "Generate professional follow-up email drafts.",
    icon: Mail,
    page: "follow-up",
  },
  {
    title: "AI Job Application Assistant",
    description: "Analyze a job description against your resume.",
    icon: BrainCircuit,
    page: "job-assistant",
  },
  {
    title: "Career Recommendations",
    description: "Explore suitable roles and skill priorities.",
    icon: ClipboardList,
    page: "recommendations",
  },
  {
    title: "Interview History",
    description: "Review previous interview sessions and reports.",
    icon: History,
    page: "history",
  },
];

function DashboardToolbox({ onNavigate }) {
  return (
    <section className="toolbox-section">
      <div className="toolbox-heading">
        <div>
          <span>CAREER WORKSPACE</span>
          <h2>All Career Tools</h2>
          <p>Choose a tool to continue your career preparation.</p>
        </div>
      </div>

      <div className="toolbox-grid">
        {tools.map((tool) => {
          const Icon = tool.icon;

          return (
            <button
              type="button"
              className="toolbox-card"
              key={tool.page}
              onClick={() => onNavigate(tool.page)}
            >
              <div className="toolbox-icon">
                <Icon size={22} />
              </div>

              <div className="toolbox-content">
                <h3>{tool.title}</h3>
                <p>{tool.description}</p>
              </div>

              <ArrowRight size={18} className="toolbox-arrow" />
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default DashboardToolbox;
