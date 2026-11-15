"use strict";

const FORM_ID = "contact-form";
const STATUS_ID = "contact-form-status";

const INFO_ID_BY_NAME = {
  message: "msg-info",
  "full-name": "full-name-info",
  email: "email-info",
  "job-title": "job-title-info",
  "contact-reason": "contact-info",
};

const ERROR_ID_BY_NAME = {
  message: "msg-error",
  "full-name": "full-name-error",
  email: "email-error",
  "job-title": "job-title-error",
  "contact-reason": "contact-error",
};

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById(FORM_ID);
  if (!(form instanceof HTMLFormElement)) return;

  setupCharacterCounter(form);
  setupCharacterFiltering(form);
  setupLiveValidation(form);
  getOrCreateStatusOutput(form);

  form.addEventListener("submit", (event) => {
    void handleSubmit(event, form);
  });
});

function getNamedControl(form, name) {
  const control = form.elements.namedItem(name);
  return control instanceof HTMLInputElement ||
    control instanceof HTMLTextAreaElement ||
    control instanceof HTMLSelectElement
    ? control
    : null;
}

function getOutput(idByName, control) {
  const id = idByName[control.name];
  return id ? document.getElementById(id) : null;
}

function getErrorOutput(control) {
  return getOutput(ERROR_ID_BY_NAME, control);
}

function clearFieldError(control) {
  control.setCustomValidity("");

  const output = getErrorOutput(control);
  if (!output) return;

  output.textContent = "";
  output.classList.add("hidden");
}

function showFieldError(control, message) {
  const output = getErrorOutput(control);
  if (!output) return;

  output.textContent = message;
  output.classList.remove("hidden");
}

function setupCharacterCounter(form) {
  const message = getNamedControl(form, "message");
  if (!(message instanceof HTMLTextAreaElement)) return;

  const output = getOutput(INFO_ID_BY_NAME, message);
  const minimum = message.minLength > 0 ? message.minLength : 0;
  const maximum = message.maxLength > 0 ? message.maxLength : 10_000;

  const update = () => {
    if (!output) return;

    const remaining = maximum - message.value.length;
    output.textContent = `At least ${minimum} characters. ${remaining} characters remaining.`;
    output.classList.toggle("warning", remaining <= 50);
  };

  update();
  message.addEventListener("input", update);
  form.addEventListener("reset", () => window.setTimeout(update, 0));
}

function setupCharacterFiltering(form) {
  let invalidCharacterPattern;

  try {
    invalidCharacterPattern = new RegExp("[^\\p{L}\\p{M}\\p{Zs}.'-]", "gu");
  } catch {
    invalidCharacterPattern = /[^A-Za-zÀ-ÖØ-öø-ÿ .'-]/g;
  }

  for (const fieldName of ["full-name", "job-title"]) {
    const input = getNamedControl(form, fieldName);
    if (!(input instanceof HTMLInputElement)) continue;

    input.addEventListener("input", () => {
      const cleanedValue = input.value.replace(invalidCharacterPattern, "");
      if (cleanedValue === input.value) return;

      input.value = cleanedValue;
      flashFieldError(input, "That character is not allowed.");
    });
  }
}

function flashFieldError(control, message) {
  showFieldError(control, message);
  control.classList.add("flash");

  window.setTimeout(() => {
    clearFieldError(control);
    control.classList.remove("flash");
  }, 2_000);
}

function setupLiveValidation(form) {
  for (const control of form.elements) {
    if (!isValidatedControl(control)) continue;

    const clearIfValid = () => {
      if (control.validity.valid) clearFieldError(control);
    };

    control.addEventListener("input", clearIfValid);
    control.addEventListener("change", clearIfValid);
  }
}

function isValidatedControl(control) {
  if (
    !(control instanceof HTMLInputElement) &&
    !(control instanceof HTMLTextAreaElement) &&
    !(control instanceof HTMLSelectElement)
  ) {
    return false;
  }

  return !["hidden", "submit", "button"].includes(control.type);
}

function validateForm(form) {
  let firstInvalidControl = null;

  for (const control of form.elements) {
    if (!isValidatedControl(control)) continue;

    clearFieldError(control);

    if (control.checkValidity()) continue;

    showFieldError(control, control.validationMessage || "Please check this field.");
    firstInvalidControl ??= control;
  }

  if (firstInvalidControl) {
    firstInvalidControl.focus();
    return false;
  }

  return true;
}

async function handleSubmit(event, form) {
  event.preventDefault();
  showFormStatus(form, "", "");

  if (!validateForm(form)) return;

  const submitButtons = form.querySelectorAll('button[type="submit"], input[type="submit"]');
  setSubmitState(submitButtons, true);

  try {
    const payload = new FormData(form);

    payload.delete("form-errors");
    payload.delete("possible_bot");

    const response = await fetch(form.action, {
      method: "POST",
      body: payload,
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });

    const result = await readJsonResponse(response);
    if (!response.ok) {
      throw new Error(result?.error || "Your message could not be sent. Please try again.");
    }

    form.reset();
    window.turnstile?.reset();
    showFormStatus(form, "Message sent successfully.", "success");
  } catch (error) {
    window.turnstile?.reset();
    showFormStatus(
      form,
      error instanceof Error
        ? error.message
        : "Your message could not be sent. Please try again.",
      "error",
    );
  } finally {
    setSubmitState(submitButtons, false);
  }
}

async function readJsonResponse(response) {
  const contentType = response.headers.get("Content-Type") || "";
  if (!contentType.includes("application/json")) return null;

  try {
    return await response.json();
  } catch {
    return null;
  }
}

function setSubmitState(buttons, isSubmitting) {
  for (const button of buttons) {
    button.disabled = isSubmitting;
    button.setAttribute("aria-busy", String(isSubmitting));
  }
}

function getOrCreateStatusOutput(form) {
  const existing = document.getElementById(STATUS_ID);
  if (existing) return existing;

  const output = document.createElement("output");
  output.id = STATUS_ID;
  output.setAttribute("role", "status");
  output.setAttribute("aria-live", "polite");
  form.append(output);
  return output;
}

function showFormStatus(form, message, status) {
  const output = getOrCreateStatusOutput(form);
  output.textContent = message;

  if (status) {
    output.dataset.status = status;
  } else {
    delete output.dataset.status;
  }
}
