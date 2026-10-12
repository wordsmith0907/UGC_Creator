/**
 * Contact Submission Adapter
 *
 * Handles validation, client-side rate limiting, sanitized dispatch,
 * and confirmed delivery reporting for Aurea Biazon's Editorial Contact Experience.
 *
 * Configuration:
 * 1. Transactional Email API / Webhook (Preferred):
 *    Set environment variable `VITE_CONTACT_API_URL` to your production endpoint
 *    (e.g., Resend webhook, Formspree endpoint, or serverless function:
 *     https://formspree.io/f/xxxxxx or https://api.resend.com/emails).
 *
 * 2. Test / Development Mode:
 *    Set `VITE_CONTACT_TEST_MODE="true"` to safely simulate confirmed API acceptance
 *    without sending real emails or leaking test data.
 *
 * 3. Verified Recipient:
 *    The designated creator email is `hello@aureabiazon.com`.
 */

export interface ContactFormData {
  name: string;
  email: string;
  brand?: string;
  service?: string;
  message: string;
}

export interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

export interface SubmissionResult {
  success: boolean;
  error?: string;
  unconfigured?: boolean;
}

// Client-side rate-limiting / duplicate prevention state
const RATE_LIMIT_WINDOW_MS = 30000; // 30 seconds
let lastSubmissionTimestamp = 0;
let lastSubmissionHash = "";

/**
 * Validates the contact form inputs according to design specification:
 * - Required name, email, message
 * - Valid RFC-compliant email pattern
 * - Trimmed lengths
 */
export function validateContactForm(data: ContactFormData): FormErrors {
  const errors: FormErrors = {};

  const trimmedName = data.name.trim();
  if (!trimmedName) {
    errors.name = "Please enter your name.";
  } else if (trimmedName.length > 100) {
    errors.name = "Name must be less than 100 characters.";
  }

  const trimmedEmail = data.email.trim();
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!trimmedEmail) {
    errors.email = "Please enter your email address.";
  } else if (!emailRegex.test(trimmedEmail)) {
    errors.email = "Please enter a valid email address.";
  }

  const trimmedMessage = data.message.trim();
  if (!trimmedMessage) {
    errors.message = "Tell me a little about your project.";
  } else if (trimmedMessage.length < 10) {
    errors.message = "Please include a few more details (at least 10 characters).";
  } else if (trimmedMessage.length > 3000) {
    errors.message = "Message must be under 3,000 characters.";
  }

  return errors;
}

/**
 * Extracts the first name safely for personalization.
 */
export function extractFirstName(fullName: string): string {
  const clean = fullName.trim();
  if (!clean) return "";
  const first = clean.split(/\s+/)[0];
  // Filter out non-alphabetic garbage or emoji
  if (!first || first.length > 30 || !/^[A-Za-zÀ-ÖØ-öø-ÿ'-]+$/.test(first)) {
    return "";
  }
  return first;
}

/**
 * Submits the contact enquiry to the configured backend or reports unconfigured state.
 * Only returns { success: true } after verified provider acceptance.
 */
export async function submitContactForm(
  data: ContactFormData
): Promise<SubmissionResult> {
  const now = Date.now();
  const submissionHash = `${data.email.trim().toLowerCase()}:${data.message.trim()}`;

  // Duplicate submission protection
  if (
    lastSubmissionHash === submissionHash &&
    now - lastSubmissionTimestamp < RATE_LIMIT_WINDOW_MS
  ) {
    return {
      success: false,
      error: "You recently submitted this identical enquiry. Please wait a moment before trying again.",
    };
  }

  // Rate limiting check
  if (now - lastSubmissionTimestamp < 5000) {
    return {
      success: false,
      error: "Please wait a few seconds between submissions.",
    };
  }

  const env = (import.meta as unknown as { env?: Record<string, string> }).env || {};
  const apiUrl = env["VITE_CONTACT_API_URL"];
  const isTestMode = env["VITE_CONTACT_TEST_MODE"] === "true" || env["MODE"] === "test";

  // Safe testing mode (for automated / local test without sending live email)
  if (isTestMode && !apiUrl) {
    await new Promise((res) => setTimeout(res, 800)); // Simulate realistic network roundtrip
    lastSubmissionTimestamp = now;
    lastSubmissionHash = submissionHash;
    return { success: true };
  }

  // If a real backend endpoint is configured
  if (apiUrl) {
    try {
      const payload = {
        name: data.name.trim(),
        email: data.email.trim(),
        brand: data.brand?.trim() || "",
        service: data.service || "Unspecified",
        message: data.message.trim(),
        to: "hello@aureabiazon.com",
        replyTo: data.email.trim(),
        submittedAt: new Date().toISOString(),
      };

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        return {
          success: false,
          error:
            "Your enquiry couldn't be confirmed. Please try again, or contact me directly by email.",
        };
      }

      // Record successful submission
      lastSubmissionTimestamp = now;
      lastSubmissionHash = submissionHash;
      return { success: true };
    } catch {
      return {
        success: false,
        error:
          "Your enquiry couldn't be confirmed. Please try again, or contact me directly by email.",
      };
    }
  }

  // Unconfigured state: Do NOT fake success, do NOT show thank-you animation,
  // report honest actionable configuration notice.
  return {
    success: false,
    unconfigured: true,
    error:
      "Contact backend is not configured yet (missing VITE_CONTACT_API_URL). Please configure an email API endpoint or contact hello@aureabiazon.com directly.",
  };
}
