document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");
    if (!form) return;
  
    const formErrorsField = document.getElementById("form-errors");
    const possibleBot = document.getElementById("possible_bot");
    const nameInput = form.elements["full-name"];
    const jobTitleInput = form.elements["job-title"];
    const msg = form.elements["message"];
  
  
    const infoIdByName = {
      message: "msg-info",
      "full-name": "full-name-info",
      email: "email-info",
      "job-title": "job-title-info",
      "contact-reason": "contact-info",
    };
  
    function getInfoOutput(field) {
      const name = field.name || field.id;
      const id = infoIdByName[name];
      return id ? document.getElementById(id) : null;
    }
  
    const errorIdByName = {
      "full-name": "full-name-error",
      email: "email-error",
      "job-title": "job-title-error",
      "contact-reason": "contact-error",
      message: "msg-error",
    };
  
    function getErrorOutput(field) {
      const name = field.name || field.id;
      const id = errorIdByName[name];
      return id ? document.getElementById(id) : null;
    }
  
    function clearError(field) {
      const out = getErrorOutput(field);
      if (out) {
        out.textContent = "";
        out.classList.add("hidden");
      }
    }
  
    function showError(field, message) {
      const out = getErrorOutput(field);
      if (!out) return;
      out.textContent = message;
      out.classList.remove("hidden");
    }
  
    function showTempError(input, message) {
      const out = getErrorOutput(input);
      if (!out) return;
  
      out.textContent = message;
      out.classList.remove("hidden");
      input.classList.add("flash");
  
      setTimeout(() => {
        out.classList.add("hidden");
        input.classList.remove("flash");
      }, 2000);
    }
  
  
    if (msg) {
      const msgInfo = getInfoOutput(msg);
      const maxLength = msg.maxLength > 0 ? msg.maxLength : 10000;
      const minLength = msg.minLength > 0 ? msg.minLength : 10;
  
      function updateMsgInfo() {
        const length = msg.value.length;
        const remaining = maxLength - length;
  
        if (msgInfo) {
          msgInfo.textContent =
            `At least ${minLength} characters. ${remaining} characters remaining.`;
          msgInfo.classList.toggle("warning", remaining <= 50);
        }
      }
  
      updateMsgInfo();
      msg.addEventListener("input", updateMsgInfo);
    }
  
  
    let illegalCharRegex;
    try {
        illegalCharRegex = new RegExp("[^\\p{L}\\p{M}\\p{Zs}.'-]", "gu");
    } catch (e) {
        illegalCharRegex = /[^A-Za-zÀ-ÖØ-öø-ÿ .'-]/g;
    }
  
    function enforceCharacterRules(event) {
      const input = event.target;
      const original = input.value;
      const cleaned = original.replace(illegalCharRegex, "");
  
      if (cleaned !== original) {
        input.value = cleaned;
        showTempError(input, "Invalid character entered.");
      }
    }
  
    if (nameInput) {
      nameInput.addEventListener("input", enforceCharacterRules);
    }
  
    if (jobTitleInput) {
      jobTitleInput.addEventListener("input", enforceCharacterRules);
    }
  
  
    if (possibleBot) {
      const markHuman = () => {
        possibleBot.value = "false";
      };
      form.addEventListener("input", markHuman, { once: true });
      form.addEventListener("change", markHuman, { once: true });
    }
  
  
    const form_errors = [];
  
    form.addEventListener("submit", (event) => {
      const fd = new FormData(form);
      const attemptErrors = [];
      let hasErrors = false;
  
      for (const element of form.elements) {
        if (!(element instanceof HTMLElement)) continue;
        if (element.type === "hidden" || element.type === "submit" || element.type === "button") {
          continue;
        }
        element.setCustomValidity("");
        clearError(element);
      }
  
      for (const [name, value] of fd) {
        const field = form.elements[name];
        if (!field || typeof field.checkValidity !== "function") continue;
  
        if (!field.checkValidity()) {
          hasErrors = true;
          const message = field.validationMessage || "Invalid value.";
          showError(field, message);
  
          attemptErrors.push({
            field: name,
            value,
            message,
          });
        }
      }
  
      if (attemptErrors.length > 0) {
        form_errors.push({
          timestamp: new Date().toISOString(),
          errors: attemptErrors,
        });
      }
      console.log("form_errors before submit:", form_errors);
      if (formErrorsField) {
        try {
          formErrorsField.value = JSON.stringify(form_errors);
        } catch {
          formErrorsField.value = "[]";
        }
      }
  
      if (hasErrors) {
        event.preventDefault();
      }
    });
});
  