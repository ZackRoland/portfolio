export class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.name = "HttpError";
        this.status = status;
    }
}

const REASON_LABELS = new Map([
    ["job-opportunity", "Job Opportunity"],
    ["research-opportunity", "Research Oportunity"],
    ["other-inquiries", "Other Inquiries"],
])

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const NAME_PATTERN = /^[\p{L}\p{M}\p{Zs}.'-]+$/u;
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u;

export function validateContactForm(formData) {
    const honeypot = optionalText(formData, "website");
    if (honeypot.trim()) {
        return { isBot: true };
    }

    const name = requiredSingleLine(
        formData,
        "full-name",
        "Name",
        3,
        100,
    );

    if (!NAME_PATTERN.test(name)) {
        throw new HttpError(
            400,
            "Please enter a valid name."
        );
    }

    const email = requiredSingleLine(
        formData,
        "email",
        "Email",
        5,
        254,
    ).toLowerCase();
    
    if (!EMAIL_PATTERN.test(email)) {
        throw new HttpError(
            400,
            "Please enter a valid email address.",
        );
    }

    const jobTitle = requiredSingleLine(
        formData,
        "job-title",
        "Job Title",
        3,
        200,
    );

    const reason = requiredSingleLine(
        formData,
        "contact-reason",
        "Contact Reason",
        1,
        50,
    );

    const reasonLabel = REASON_LABELS.get(reason);

    if (!reasonLabel){
        throw new HttpError(
            400,
            "Please enter a valid reason."
        )
    };

    const message = requiredMultiline(
        formData,
        "message",
        "Message",
        10,
        10_000,
    );

    const turnstileToken = requiredSingleLine(
        formData,
        "cf-turnstile-response",
        "Human verification",
        1,
        2_048,
    );
    return {
        isBot: false,
        name,
        email,
        jobTitle,
        reason,
        reasonLabel,
        message,
        turnstileToken,
    };
}

function requiredSingleLine(
    formData,
    name,
    label,
    minimum,
    maximum,
  ) {
    const value = requiredText(formData, name, label).trim();
  
    if (/[\r\n\0]/u.test(value)) {
      throw new HttpError(
        400,
        `${label} contains invalid characters.`,
      );
    }
  
    assertLength(value, label, minimum, maximum);
    return value;
}

function requiredMultiline(
    formData,
    name,
    label,
    minimum,
    maximum,
  ) {
    const value = requiredText(formData, name, label)
      .replace(/\r\n?/gu, "\n")
      .trim();
  
    if (CONTROL_CHARACTERS.test(value)) {
      throw new HttpError(
        400,
        `${label} contains invalid characters.`,
      );
    }
  
    assertLength(value, label, minimum, maximum);
    return value;
}

function requiredText(formData, name, label){
    const value = formData.get(name);

    if (typeof value !== "string" || !value.trim()){
        throw new HttpError(400, `${label} is required`);
    }
    return value;
}

function optionalText(formData, name){
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
}

function assertLength(value, label, minimum, maximum) {
    if (value.length < minimum || value.length > maximum) {
        throw new HttpError(
            400,
            `${label} must contain between ${minimum} and ${maximum} characters.`,
        );
    }
}