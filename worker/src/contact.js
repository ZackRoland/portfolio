import {
    HttpError,
    validateContactForm,
} from "./validation.js";
  
const MAX_BODY_BYTES = 20_000;
  
export async function handleContact(
    request,
    env,
    requestId,
)   {
    verifyOrigin(request, env.ALLOWED_ORIGINS);
  
    const ip =
      request.headers.get("CF-Connecting-IP") ||
      "unknown";
  
    const rateLimit = await env.CONTACT_RATE_LIMITER.limit({
      key: `contact:${ip}`,
    });
  
    if (!rateLimit.success) {
      throw new HttpError(
        429,
        "Too many requests. Please try again later.",
      );
    }
  
    const formData = await parseFormData(request);
    const submission = validateContactForm(formData);
  
    /*
     * Give honeypot bots a fake success response so they do not
     * learn that the submission was rejected.
     */
    if (submission.isBot) {
      console.warn({
        event: "contact_honeypot",
        requestId,
      });
  
      return jsonResponse({ ok: true });
    }
  
    await verifyTurnstile({
      token: submission.turnstileToken,
      ip,
      secret: env.TURNSTILE_SECRET_KEY,
      expectedHostname: env.TURNSTILE_HOSTNAME,
    });
  
    const emailResult = await env.EMAIL.send({
      to: env.CONTACT_TO_EMAIL,
      from: {
        email: env.CONTACT_FROM_EMAIL,
        name: "Portfolio Website",
      },
      replyTo: {
        email: submission.email,
        name: submission.name,
      },
      subject: `Portfolio inquiry: ${submission.reasonLabel}`,
      text: createEmailBody(submission),
    });
  
    console.log({
      event: "contact_sent",
      requestId,
      messageId: emailResult.messageId,
      reason: submission.reason,
    });
  
    return jsonResponse({
      ok: true,
      message: "Message sent successfully.",
    });
}
  
function verifyOrigin(request, configuredOrigins) {
    const origin = request.headers.get("Origin");
  
    const allowedOrigins = String(configuredOrigins || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  
    if (!origin || !allowedOrigins.includes(origin)) {
      throw new HttpError(403, "Request origin is not allowed.");
    }
}
  
async function parseFormData(request) {
    const contentType =
      request.headers.get("Content-Type") || "";
  
    const supported =
      contentType.startsWith(
        "application/x-www-form-urlencoded",
      ) ||
      contentType.startsWith("multipart/form-data");
  
    if (!supported) {
      throw new HttpError(
        415,
        "Unsupported request format.",
      );
    }
  
    const declaredLength = Number(
      request.headers.get("Content-Length") || 0,
    );
  
    if (
      Number.isFinite(declaredLength) &&
      declaredLength > MAX_BODY_BYTES
    ) {
      throw new HttpError(413, "Request is too large.");
    }
  
    if (!request.body) {
      throw new HttpError(400, "Request body is missing.");
    }
  
    const reader = request.body.getReader();
    const chunks = [];
    let totalBytes = 0;
  
    while (true) {
      const { done, value } = await reader.read();
  
      if (done) break;
  
      totalBytes += value.byteLength;
  
      if (totalBytes > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new HttpError(413, "Request is too large.");
      }
  
      chunks.push(value);
    }
  
    const body = new Uint8Array(totalBytes);
    let offset = 0;
  
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }
  
    try {
      return await new Response(body, {
        headers: {
          "Content-Type": contentType,
        },
      }).formData();
    } catch {
      throw new HttpError(
        400,
        "The submitted form could not be read.",
      );
    }
}
  
async function verifyTurnstile({
    token,
    ip,
    secret,
    expectedHostname,
})  {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret,
          response: token,
          remoteip: ip,
          idempotency_key: crypto.randomUUID(),
        }),
      },
    );
  
    if (!response.ok) {
      throw new HttpError(
        503,
        "Human verification is temporarily unavailable.",
      );
    }
  
    const result = await response.json();
  
    const isValid =
      result.success === true &&
      result.hostname === expectedHostname &&
      result.action === "contact";
  
    if (!isValid) {
      console.warn({
        event: "turnstile_rejected",
        errorCodes: result["error-codes"] || [],
      });
  
      throw new HttpError(
        400,
        "Human verification failed. Please try again.",
      );
    }
}
  
function createEmailBody(submission) {
    return [
      "New portfolio contact submission",
      "",
      `Name: ${submission.name}`,
      `Email: ${submission.email}`,
      `Job title: ${submission.jobTitle}`,
      `Reason: ${submission.reasonLabel}`,
      "",
      "Message:",
      submission.message,
    ].join("\n");
}
  
function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
}