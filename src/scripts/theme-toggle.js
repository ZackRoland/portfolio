document.addEventListener("DOMContentLoaded", () => {
    const html = document.documentElement;

    // Load saved theme
    const saved = localStorage.getItem("theme");
    if (saved === "dark") html.classList.add("dark");
    if (saved === "light") html.classList.remove("dark");

    // Attach handlers to the buttons
    document.querySelectorAll("[data-theme]").forEach(btn => {
        btn.addEventListener("click", () => {
            const theme = btn.dataset.theme;

            if (theme === "dark") {
                html.classList.add("dark");
            } else {
                html.classList.remove("dark");
            }

            localStorage.setItem("theme", theme);
        });
    });
});