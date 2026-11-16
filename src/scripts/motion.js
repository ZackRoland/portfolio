(() => {
    "use strict";

    const root = document.documentElement;
    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const revealSelector = [
        "main > section",
        "main > aside",
        "main > game-title",
        "main > site-hub",
        ".principles-grid > article",
        ".skill-groups > section",
        "project-card"
    ].join(",");
    const pressSelector = [
        "#navigation a:not(.logo a)",
        "header > button[popovertarget]",
        ".primary-action",
        ".text-action",
        ".cta-links a",
        ".project-controls button",
        ".projects-cta a",
        "#manage-projects-link",
        "#submit",
        ".menu-btn"
    ].join(",");

    let revealObserver;

    function motionIsReduced() {
        return reduceQuery.matches;
    }

    function updateMotionState() {
        const reduced = motionIsReduced();
        root.classList.toggle("motion-capable", !reduced);
        root.classList.toggle("motion-reduced", reduced);
        window.dispatchEvent(new CustomEvent("portfolio-motion-change", {
            detail: { reduced }
        }));

        if (reduced) {
            document.querySelectorAll("[data-gravity-reveal]").forEach(element => {
                element.classList.add("is-visible");
                revealObserver?.unobserve(element);
            });
            document.querySelectorAll("project-card[data-gravity-card]").forEach(resetCard);
        }
    }

    function installSpaceField() {
        const field = document.createElement("div");
        field.className = "space-field";
        field.setAttribute("aria-hidden", "true");
        field.innerHTML = `
            <span class="space-field__stars"></span>
            <span class="space-field__dust"></span>
            <span class="space-field__glow"></span>`;
        document.body.prepend(field);
    }

    function observeReveal(element, index = 0) {
        if (element.dataset.gravityReveal !== undefined) return;
        element.dataset.gravityReveal = "";
        element.style.setProperty("--motion-delay", `${Math.min(index % 4, 3) * 55}ms`);

        if (motionIsReduced() || !revealObserver) {
            element.classList.add("is-visible");
            return;
        }

        revealObserver.observe(element);
    }

    function resetCard(card) {
        card.style.removeProperty("--gravity-rotate-x");
        card.style.removeProperty("--gravity-rotate-y");
        card.style.removeProperty("--gravity-image-x");
        card.style.removeProperty("--gravity-image-y");
    }

    function bindCard(card) {
        if (card.dataset.gravityCard !== undefined) return;
        card.dataset.gravityCard = "";

        card.addEventListener("pointermove", event => {
            if (motionIsReduced() || !finePointerQuery.matches) return;

            const bounds = card.getBoundingClientRect();
            const x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
            const y = ((event.clientY - bounds.top) / bounds.height) * 2 - 1;

            card.style.setProperty("--gravity-rotate-x", `${(-y * 1.25).toFixed(2)}deg`);
            card.style.setProperty("--gravity-rotate-y", `${(x * 1.5).toFixed(2)}deg`);
            card.style.setProperty("--gravity-image-x", `${(-x * 4).toFixed(2)}px`);
            card.style.setProperty("--gravity-image-y", `${(-y * 3).toFixed(2)}px`);
        });
        card.addEventListener("pointerleave", () => resetCard(card));
        card.addEventListener("focusout", event => {
            if (!card.contains(event.relatedTarget)) resetCard(card);
        });
    }

    function enhance(scope) {
        const revealElements = [];
        if (scope instanceof Element && scope.matches(revealSelector)) revealElements.push(scope);
        if (scope.querySelectorAll) revealElements.push(...scope.querySelectorAll(revealSelector));

        revealElements.forEach((element, index) => {
            observeReveal(element, index);
            if (element.matches("project-card")) bindCard(element);
        });

        const pressElements = [];
        if (scope instanceof Element && scope.matches(pressSelector)) pressElements.push(scope);
        if (scope.querySelectorAll) pressElements.push(...scope.querySelectorAll(pressSelector));
        pressElements.forEach(element => {
            element.dataset.gravityPress = "";
        });
    }

    function installObservers() {
        revealObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                revealObserver.unobserve(entry.target);
            });
        }, {
            threshold: .12,
            rootMargin: "0px 0px -6%"
        });

        enhance(document);

        const mutationObserver = new MutationObserver(records => {
            records.forEach(record => {
                record.addedNodes.forEach(node => {
                    if (node instanceof Element) enhance(node);
                });
            });
        });
        mutationObserver.observe(document.body, { childList: true, subtree: true });
    }

    function handleSystemPreferenceChange() {
        updateMotionState();
    }

    document.addEventListener("DOMContentLoaded", () => {
        installSpaceField();
        installObservers();
        updateMotionState();

        if (typeof reduceQuery.addEventListener === "function") {
            reduceQuery.addEventListener("change", handleSystemPreferenceChange);
        } else {
            reduceQuery.addListener(handleSystemPreferenceChange);
        }
    });
})();
