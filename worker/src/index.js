import { handleContact } from "./contact.js";
import { HttpError } from "./validation.js";

const JSON_HEADERS = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const requestId = crypto.randomUUID();

        try {

            if (url.pathname !== "/api/contact") {
                return readJsonResponse({ error: "Not found." }, 404)
            }

            if (request.method !== "POST") {
                return new Response(
                    JSON.stringify({ error: "Method not allowed." }),
                    {
                        status: 405,
                        headers: {
                            ...JSON_HEADERS,
                            Allow: "POST",
                        },
                    },
                );
            }
            
            return await handleContact(request,env,requestID);
        }   catch (error) {
            if (error instanceof HttpError) {
                return readJsonResponse({ error: error.message }, error.status );
            }

            console.error({
                event: "contact_unhandled_error",
                requestId,
                error:
                    error instanceof Error
                    ? error.message
                    : "Unknown error",
            });

            return readJsonResponse(
                { error: "Your message could not be sent. Please try again"},
                500,
            );
        }
    },
};

function jsonResponse(body, status = 200){
    return new Response(JSON.stringify(body), {
        status,
        headers: JSON_HEADERS,
    });
}