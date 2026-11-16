(() => {
    "use strict";

    const root = document.documentElement;
    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const saverRetryMs = 15000;
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
    let saver;
    let idleTimer;
    let saverHideTimer;
    let lastActivityAt = 0;

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

    function idleDelayMs() {
        const configured = Number.parseFloat(
            getComputedStyle(root).getPropertyValue("--screensaver-idle-ms")
        );
        return Number.isFinite(configured) ? Math.max(configured, 5000) : 60000;
    }

    function formIsInUse() {
        const active = document.activeElement;
        if (active?.matches("input, textarea, select, [contenteditable='true']")) return true;

        return [...document.querySelectorAll("form input, form textarea, form select")].some(control => {
            if (control.disabled || control.type === "hidden") return false;
            if (control.matches("[type='checkbox'], [type='radio']")) return control.checked;
            if (control instanceof HTMLSelectElement) return control.selectedIndex > 0;
            return control.value.trim() !== "";
        });
    }

    function screenSaverCanStart() {
        return !motionIsReduced()
            && !document.hidden
            && !formIsInUse()
            && !document.querySelector(":popover-open");
    }

    function hideScreenSaver() {
        if (!saver || saver.hidden) return;
        saver.classList.remove("is-active");
        document.body.classList.remove("screensaver-active");
        window.clearTimeout(saverHideTimer);
        saverHideTimer = window.setTimeout(() => {
            if (!saver.classList.contains("is-active")) saver.hidden = true;
        }, 650);
    }

    function scheduleScreenSaver(delay = idleDelayMs()) {
        window.clearTimeout(idleTimer);
        if (motionIsReduced() || document.hidden) return;
        idleTimer = window.setTimeout(showScreenSaver, delay);
    }

    function showScreenSaver() {
        if (!screenSaverCanStart()) {
            scheduleScreenSaver(saverRetryMs);
            return;
        }

        window.clearTimeout(saverHideTimer);
        saver.hidden = false;
        document.body.classList.add("screensaver-active");
        requestAnimationFrame(() => saver.classList.add("is-active"));
    }

    function noteActivity() {
        hideScreenSaver();

        const now = Date.now();
        if (now - lastActivityAt < 250) return;
        lastActivityAt = now;
        scheduleScreenSaver();
    }

    function installScreenSaver() {
        // The Minecraft-style homepage will receive its own idle experience later.
        if (document.querySelector("main.start-screen")) return;

        const debris = [
            ["HTML", "11%", "72%", "10s", "-2s", "7vw", "-8deg", "11deg"],
            ["CSS", "78%", "76%", "13s", "-7s", "-6vw", "7deg", "-13deg"],
            ["JS", "18%", "31%", "12s", "-5s", "9vw", "12deg", "-9deg"],
            ["PYTHON", "73%", "28%", "15s", "-10s", "-8vw", "-5deg", "14deg"],
            ["A11Y", "39%", "83%", "11s", "-4s", "5vw", "8deg", "-12deg"],
            ["GIT", "86%", "48%", "14s", "-8s", "-5vw", "-11deg", "9deg"],
            ["MATH", "7%", "49%", "16s", "-12s", "8vw", "4deg", "-15deg"],
            ["UI", "62%", "88%", "12s", "-6s", "-7vw", "-6deg", "12deg"]
        ].map(([label, x, y, duration, delay, driftX, startRotate, endRotate]) => `
            <span class="saver-debris" style="--x:${x};--y:${y};--duration:${duration};--delay:${delay};--drift-x:${driftX};--start-rotate:${startRotate};--end-rotate:${endRotate}">${label}</span>
        `).join("");

        saver = document.createElement("div");
        saver.className = "anti-gravity-saver";
        saver.hidden = true;
        saver.setAttribute("aria-hidden", "true");
        saver.innerHTML = `
            <div class="saver-stage">
                <div class="saver-comet"></div>
                <div class="saver-ring saver-ring--outer"></div>
                <div class="saver-ring"></div>
                <div class="saver-core">
                    <strong>ZR</strong>
                    <small>Portfolio / idle</small>
                </div>
                ${debris}
                <p class="saver-status">Anti-gravity mode · move to re-enter</p>
            </div>`;
        document.body.append(saver);

        ["pointermove", "pointerdown", "touchstart", "scroll"].forEach(type => {
            document.addEventListener(type, noteActivity, { passive: true });
        });
        ["keydown", "focusin", "input"].forEach(type => {
            document.addEventListener(type, noteActivity);
        });
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                window.clearTimeout(idleTimer);
                hideScreenSaver();
                return;
            }
            noteActivity();
        });
        scheduleScreenSaver();
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
        if (motionIsReduced()) {
            window.clearTimeout(idleTimer);
            hideScreenSaver();
        } else {
            scheduleScreenSaver();
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        installSpaceField();
        installObservers();
        updateMotionState();
        installScreenSaver();

        if (typeof reduceQuery.addEventListener === "function") {
            reduceQuery.addEventListener("change", handleSystemPreferenceChange);
        } else {
            reduceQuery.addListener(handleSystemPreferenceChange);
        }
    });
})();
