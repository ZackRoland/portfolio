// projects-data.js

// Containers for each section
const webContainer = document.getElementById("web-projects-container");
const mlContainer = document.getElementById("ml-projects-container");

// Buttons
const loadLocalBtn = document.getElementById("load-local");
const loadRemoteBtn = document.getElementById("load-remote");

function clearCards() {
    webContainer.innerHTML = "";
    mlContainer.innerHTML = "";
}

function renderCard(project) {
    const card = document.createElement("project-card");

  
    const demoLink = project.demoUrl ? `<li><a href="${project.demoUrl}">Demo</a></li>` : "";
    const blogLink = project.blogUrl ? `<li><a href="${project.blogUrl}">Blog</a></li>` : "";
    const repoLink = project.repoUrl ? `<li><a href="${project.repoUrl}">Repo</a></li>` : "";

    const techItems = (project.techStack || [])
        .map(t => `<li>${t}</li>`)
        .join("");

    const headingLevel = project.headingLevel || "h2";

    card.innerHTML = `
        <project-head>
            <project-links aria-label="Project resources">
                <ul>
                    ${demoLink}
                    ${repoLink}
                    ${blogLink}
                </ul>
            </project-links>
            <project-image>
                <picture>
                    ${project.imageSmallSrc ? `
                        <source 
                            srcset="${project.imageSmallSrc}"
                            media="(max-width: 600px)">` : ""}
                    <img
                        src="${project.imageSrc}"
                        width="${project.imageWidth || 400}"
                        height="${project.imageHeight || 400}"
                        alt="${project.imageAlt}">
                </picture>
            </project-image>
        </project-head>

        <project-body>
            <project-header>
                <project-name>
                    <${headingLevel}>${project.title}</${headingLevel}>
                </project-name>
                <project-date>
                    <time datetime="${project.dateIso || ""}">${project.dateLabel || ""}</time>
                </project-date>
            </project-header>

            <project-main>
                <project-description>
                    <p>${project.description}</p>
                </project-description>
                <project-tech>
                    <details ${project.techOpen ? "open" : ""}>
                        <summary>Tech Stack</summary>
                        <menu>
                            ${techItems}
                        </menu>
                    </details>
                </project-tech>
            </project-main>
        </project-body>
    `;

    if (project.category === "web") {
        webContainer.appendChild(card);
    } else if (project.category === "ml") {
        mlContainer.appendChild(card);
    }
    if (project.template) {
        card.classList.add("project-template");
    }
}

const LOCAL_STORAGE_KEY = "portfolio-projects";
const SOURCE_KEY = "portfolio-projects-source";

async function loadLocalProjects() {
    clearCards();
    seedLocalStorageIfEmpty();

    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    const projects = stored ? JSON.parse(stored) : [];
    projects.forEach(renderCard);

    localStorage.setItem(SOURCE_KEY, "local");
}

async function loadRemoteProjects() {
    clearCards();

    try {
        const res = await fetch("https://my-json-server.typicode.com/ZackRoland/portfolio-remote-projects/projects");

        if (!res.ok) {
            console.error("Failed to load remote data:", res.status, res.statusText);
            return;
        }

        const projects = await res.json();
        projects.forEach(renderCard);

        localStorage.setItem(SOURCE_KEY, "remote");
    } catch (err) {
        console.error("Error loading remote projects:", err);
    }
}


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
            imageSrc: "../assets/imgs/original/club-triton/home-page/home-page.png",
            imageSmallSrc: "/src/assets/.../club-triton-small.png",
            imageAlt: "Screenshot of The Club Triton project",
            demoUrl: "https://cse110-sp25-group13.github.io/The_club_triton/pages/home-page.html",
            repoUrl: "https://github.com/cse110-sp25-group13/The_club_triton",
            blogUrl: "placeholder",
            techStack: ["HTML5", "CSS", "Vanilla JS"],
            template:false,
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
            template:true,
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
            imageAlt: "Correlation matrix heatmap for the UK car crash severity dataset",
            demoUrl: "",
            repoUrl: "https://github.com/ZackRoland/UK_Car_Accident_Severity_Predictor",
            blogUrl: "",
            techStack: ["Python", "scikit-learn", "Pandas", "NumPy"],
            template:false,
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
            template:false,
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

// ---------- 4. BUTTON HANDLERS ----------



loadLocalBtn?.addEventListener("click", () => {
    loadLocalProjects();
});

loadRemoteBtn?.addEventListener("click", () => {
    loadRemoteProjects();
});
window.addEventListener("DOMContentLoaded", () => {
    seedLocalStorageIfEmpty();

    const source = localStorage.getItem(SOURCE_KEY) || "local";

    if (source === "remote") {
        loadRemoteProjects();
    } else {
        loadLocalProjects();
    }
});

