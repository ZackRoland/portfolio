export async function onRequestPost(context) {
    const { request, env} = context;
    
    const turnstileSecret = env.TURNSTILE_SECRET_KEY;
    const resendApiKey = env.RESEND_API_KEY;
    const destination = env.CONTACT_TO_EMAIL;
    const source = env.CONTACT_FROM_EMAIL;
    // Validate Turnstile, Validate Form Data, then send email.

    const formData = await request.formData();
    const turnstileToken = formData.get("cf-turnstile-response");

    const verificationBody = new FormData();
    verificationBody.set("secret", turnstileSecret);
    verificationBody.set("response", turnstileToken)

    const verificationResponse = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
            method: "POST",
            body: verificationBody,
        },
    );
    
    const verification = await verificationResponse.jsson();

    if (!verification.success) {
        return Response.json(
            { error: "Human verification failed." },
            { status: 400},
        );
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from: source,
            to: [destination],
            reply_to: submittedEmail,
            subject: `Portfolio inquiry from ${submittedName}`,
            text: submittedMessage,
        }),
    });
}

