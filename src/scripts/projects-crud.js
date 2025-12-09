// projects-crud.js

const LOCAL_STORAGE_KEY = "portfolio-projects";

// Reuse the same seed as projects-data.js so this page works
function seedLocalStorageIfEmpty() {
  if (localStorage.getItem(LOCAL_STORAGE_KEY)) return;

  const localProjects = [
    {
      id: "club-triton",
      category: "web",
      title: "The Club Triton",
      headingLevel: "h2",
      dateIso: "2025-04-01",
      dateLabel: "04/2025 - 06/2025",
      description:
        "A web-based card game modeled after the Card-Jitsu minigame from Disney's Club Penguin.",
      imageSrc: "/src/assets/imgs/original/club-triton/home-page/home-page.png",
      imageSmallSrc: "/src/assets/.../club-triton-small.png",
      imageAlt: "Screenshot of The Club Triton project",
      demoUrl:
        "https://cse110-sp25-group13.github.io/The_club_triton/pages/home-page.html",
      repoUrl: "https://github.com/cse110-sp25-group13/The_club_triton",
      blogUrl: "placeholder",
      techStack: ["HTML5", "CSS", "Vanilla JS"],
      template: false,
      techOpen: true
    },
    {
      id: "coming-soon-web-1",
      category: "web",
      title: "Coming Soon",
      headingLevel: "h3",
      dateIso: "",
      dateLabel: "TBD",
      description: "A future web or game project will live here.",
      imageSrc: "https://placehold.co/400x400?text=Coming+Soon+...",
      imageAlt: "Placeholder image for upcoming web or game project",
      demoUrl: "#",
      repoUrl: "#",
      blogUrl: "",
      techStack: ["TBD"],
      template: true,
      techOpen: false
    },
    {
      id: "uk-crash",
      category: "ml",
      title: "UK Car Crash Severity Classifier",
      headingLevel: "h2",
      dateIso: "2025-07-01",
      dateLabel: "07/2025 - 08/2025",
      description:
        "Predicts UK car crash injury severity using scikit-learn models and exploratory data analysis on a large accident dataset.",
      imageSrc: "../assets/imgs/original/corr-matrix/correlation-matrix.png",
      imageAlt:
        "Correlation matrix heatmap for the UK car crash severity dataset",
      demoUrl: "",
      repoUrl:
        "https://github.com/ZackRoland/UK_Car_Accident_Severity_Predictor",
      blogUrl: "",
      techStack: ["Python", "scikit-learn", "Pandas", "NumPy"],
      template: false,
      techOpen: true
    },
    {
      id: "amazon-hmm",
      category: "ml",
      title: "Amazon Stock Price Predictor",
      headingLevel: "h3",
      dateIso: "2025-06-01",
      dateLabel: "06/2025",
      description:
        "Constructed an HMM over daily bearish/bullish signals and used the Viterbi algorithm to model Amazon’s long-term market volatility.",
      imageSrc: "../assets/imgs/original/amazon/amazon-stock-data.png",
      imageAlt: "Amazon stock dataset image",
      demoUrl: "",
      repoUrl: "https://github.com/ZackRoland/CSE150-FinalProject",
      blogUrl: "",
      techStack: ["Python", "NumPy", "Matplotlib"],
      template: false,
      techOpen: false
    },
    {
      id: "coming-soon-ml-1",
      category: "ml",
      title: "Coming Soon",
      headingLevel: "h3",
      dateIso: "",
      dateLabel: "TBD",
      description: "A future ML or data science project will live here.",
      imageSrc: "https://placehold.co/400x400?text=Coming+Soon+...",
      imageAlt: "Placeholder image for upcoming ML project",
      demoUrl: "#",
      repoUrl: "#",
      blogUrl: "",
      techStack: ["TBD"],
      template: true,
      techOpen: false
    }
  ];

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localProjects));
}

function getProjects() {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveProjects(projects) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projects));
}

function renderProjectsJson() {
  const pre = document.getElementById("projects-json");
  const projects = getProjects();
  pre.textContent = JSON.stringify(projects, null, 2);
}

// --------- Form helpers ---------
function parseForm() {
  const id = document.getElementById("proj-id").value.trim();
  const category = document.getElementById("proj-category").value;
  const title = document.getElementById("proj-title").value.trim();
  const dateIso = document.getElementById("proj-date-iso").value;
  const dateLabel = document.getElementById("proj-date-label").value.trim();
  const description = document.getElementById("proj-description").value.trim();
  const imageSrc = document.getElementById("proj-image-src").value.trim();
  const demoUrl = document.getElementById("proj-demo-url").value.trim();
  const repoUrl = document.getElementById("proj-repo-url").value.trim();
  const blogUrl = document.getElementById("proj-blog-url").value.trim();
  const techStackStr =
    document.getElementById("proj-tech-stack").value.trim() || "";
  const template = document.getElementById("proj-template").checked;

  const techStack = techStackStr
    ? techStackStr.split(",").map(s => s.trim()).filter(Boolean)
    : [];

  return {
    id,
    category,
    title,
    headingLevel: "h2", // you can add a control later if you want
    dateIso,
    dateLabel,
    description,
    imageSrc,
    imageAlt: `Screenshot for ${title}`,
    demoUrl,
    repoUrl,
    blogUrl,
    techStack,
    template,
    techOpen: true
  };
}

// --------- Attach listeners once DOM is ready ---------
window.addEventListener("DOMContentLoaded", () => {
  seedLocalStorageIfEmpty();
  renderProjectsJson();

  const createBtn = document.getElementById("create-btn");
  const updateBtn = document.getElementById("update-btn");
  const deleteBtn = document.getElementById("delete-btn");

  createBtn.addEventListener("click", () => {
    const data = parseForm();
    if (!data.id) {
      alert("Please provide a project ID.");
      return;
    }

    const projects = getProjects();
    if (projects.some(p => p.id === data.id)) {
      alert("A project with that ID already exists. Use Update instead.");
      return;
    }

    projects.push(data);
    saveProjects(projects);
    renderProjectsJson();
    alert("Project created! Go to Projects → Load Local to see it.");
  });

  updateBtn.addEventListener("click", () => {
    const data = parseForm();
    if (!data.id) {
      alert("Please provide the ID of the project you want to update.");
      return;
    }

    const projects = getProjects();
    const index = projects.findIndex(p => p.id === data.id);
    if (index === -1) {
      alert("No project found with that ID.");
      return;
    }

    projects[index] = { ...projects[index], ...data };
    saveProjects(projects);
    renderProjectsJson();
    alert("Project updated! Reload local projects on the Projects page.");
  });

  deleteBtn.addEventListener("click", () => {
    const id = document.getElementById("proj-id").value.trim();
    if (!id) {
      alert("Enter the ID of the project you want to delete.");
      return;
    }

    const projects = getProjects();
    const filtered = projects.filter(p => p.id !== id);

    if (filtered.length === projects.length) {
      alert("No project found with that ID.");
      return;
    }

    saveProjects(filtered);
    renderProjectsJson();
    alert("Project deleted! Reload local projects on the Projects page.");
  });
});
