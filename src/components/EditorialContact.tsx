import { useState, useRef, useEffect, type FormEvent, type MouseEvent } from "react";
import { EyeFollowCTA } from "./EyeFollowCTA";
import {
  validateContactForm,
  submitContactForm,
  extractFirstName,
  type ContactFormData,
  type FormErrors,
} from "../lib/contact-submission";

/**
 * State machine for Editorial Contact:
 * - "invitation": initial centered invitation with EyeFollowCTA
 * - "opening": FLIP transition expanding invitation to split-screen form
 * - "form": split-screen form is active and editable
 * - "submitting": submit request in flight ("SENDING...")
 * - "closingToSuccess": form fades & collapses, returning to centered invitation
 * - "success": centered invitation returned, thank-you confirmation revealed beneath CTA
 * - "error": submission failed, inline error displayed, form remains open
 */
export type ContactSectionState =
  | "invitation"
  | "opening"
  | "form"
  | "submitting"
  | "closingToSuccess"
  | "success"
  | "error";

export function EditorialContact() {
  const [state, setState] = useState<ContactSectionState>("invitation");

  // Form input values (preserved during failed attempts & back navigation)
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    brand: "",
    service: "",
    message: "",
  });

  // Successful submission data (for thank-you personalization)
  const [confirmedFirstName, setConfirmedFirstName] = useState<string>("");

  // Validation & Server errors
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  // DOM Refs
  const sectionRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const ctaWrapRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const backBtnRef = useRef<HTMLButtonElement>(null);
  const thankYouHeadingRef = useRef<HTMLHeadingElement>(null);

  // Derived flags
  const isFormVisible =
    state === "opening" || state === "form" || state === "submitting" || state === "error";
  const isClosing = state === "closingToSuccess";
  const isSuccess = state === "success";

  // Focus management on entering form state
  useEffect(() => {
    if (state === "form") {
      nameInputRef.current?.focus({ preventScroll: true });
    }
  }, [state]);

  // Focus management on entering success state
  useEffect(() => {
    if (state === "success") {
      // Focus thank-you heading for accessible announcement
      thankYouHeadingRef.current?.focus({ preventScroll: true });
    }
  }, [state]);

  /* --------------------------------------------------------------------------
     Transition: Invitation -> Form (The Opening FLIP)
     -------------------------------------------------------------------------- */
  const handleOpenForm = (e?: MouseEvent) => {
    if (e) e.preventDefault();
    // Guard against repeated clicks / mid-transition clicks
    if (state !== "invitation" && state !== "success") return;

    // If reopening after a previous success, clear success copy & start fresh
    if (state === "success") {
      setConfirmedFirstName("");
      setFormData({
        name: "",
        email: "",
        brand: "",
        service: "",
        message: "",
      });
      setErrors({});
      setServerError(null);
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const introEl = introRef.current;

    if (reducedMotion || !introEl) {
      setState("form");
      return;
    }

    // FLIP Step 1: Measure First
    const firstRect = introEl.getBoundingClientRect();
    setState("opening");

    // FLIP Step 2 & 3: Measure Last & Invert
    requestAnimationFrame(() => {
      const lastRect = introEl.getBoundingClientRect();
      const deltaX = firstRect.left - lastRect.left;
      const deltaY = firstRect.top - lastRect.top;

      introEl.style.transition = "none";
      introEl.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
      introEl.offsetHeight; // Force reflow

      // FLIP Step 4: Play
      introEl.style.transition = "transform 0.65s cubic-bezier(0.22, 1, 0.36, 1)";
      introEl.style.transform = "translate3d(0, 0, 0)";

      setTimeout(() => {
        introEl.style.transition = "";
        introEl.style.transform = "";
        setState("form");
      }, 700);
    });
  };

  /* --------------------------------------------------------------------------
     Transition: Form -> Invitation (Back To Invitation Link)
     -------------------------------------------------------------------------- */
  const handleBackToInvitation = () => {
    if (state !== "form" && state !== "error") return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const introEl = introRef.current;

    if (reducedMotion || !introEl) {
      setState("invitation");
      return;
    }

    const firstRect = introEl.getBoundingClientRect();
    setState("opening"); // temporarily toggle for inverse measurement

    requestAnimationFrame(() => {
      // Switch state to invitation
      setState("invitation");

      requestAnimationFrame(() => {
        const lastRect = introEl.getBoundingClientRect();
        const deltaX = firstRect.left - lastRect.left;
        const deltaY = firstRect.top - lastRect.top;

        introEl.style.transition = "none";
        introEl.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
        introEl.offsetHeight; // Force reflow

        introEl.style.transition = "transform 0.65s cubic-bezier(0.22, 1, 0.36, 1)";
        introEl.style.transform = "translate3d(0, 0, 0)";

        setTimeout(() => {
          introEl.style.transition = "";
          introEl.style.transform = "";
          const ctaBtn = ctaWrapRef.current?.querySelector("a, button") as HTMLElement | null;
          ctaBtn?.focus();
        }, 700);
      });
    });
  };

  /* --------------------------------------------------------------------------
     Form Submission Handler
     -------------------------------------------------------------------------- */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (state === "submitting" || state === "closingToSuccess") return;

    // Validate fields
    const validationErrors = validateContactForm(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      // Focus first error field
      if (validationErrors.name) {
        nameInputRef.current?.focus();
      } else if (validationErrors.email) {
        document.getElementById("contact-email")?.focus();
      } else if (validationErrors.message) {
        document.getElementById("contact-message")?.focus();
      }
      return;
    }

    setState("submitting");
    setServerError(null);

    try {
      const result = await submitContactForm(formData);

      if (result.success) {
        // Confirmed backend acceptance!
        const parsedName = extractFirstName(formData.name);
        setConfirmedFirstName(parsedName);

        // Run the 4-phase success timeline (total ~1.25s)
        triggerSuccessCollapse();
      } else {
        // Submission failure: preserve entered values, stay on form, show error
        setState("error");
        setServerError(
          result.error ||
            "Your enquiry couldn't be confirmed. Please try again, or contact me directly by email."
        );
      }
    } catch {
      setState("error");
      setServerError(
        "Your enquiry couldn't be confirmed. Please try again, or contact me directly by email."
      );
    }
  };

  /* --------------------------------------------------------------------------
     Exact Success Animation Timeline (1.25 seconds total)
     Phase A (0.00-0.30s): Fade form contents, translate up 8px
     Phase B (0.20-0.85s): Collapse split layout, return intro to center
     Phase C (0.65-0.95s): Restore eye-follow CTA
     Phase D (0.90-1.25s): Reveal thank-you group below CTA
     -------------------------------------------------------------------------- */
  const triggerSuccessCollapse = () => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      setState("success");
      return;
    }

    const introEl = introRef.current;
    const firstRect = introEl ? introEl.getBoundingClientRect() : null;

    // Enter closing phase: triggers Phase A (CSS form exit)
    setState("closingToSuccess");

    // Phase B: Start layout collapse
    setTimeout(() => {
      // Transition introEl back to center
      if (introEl && firstRect) {
        // Temporarily clear inline transforms
        introEl.style.transition = "none";
        introEl.style.transform = "";
      }

      // Phase C & D: Settle into final success state
      setTimeout(() => {
        setState("success");

        // Gentle scroll adjustment if needed on mobile to keep confirmation visible
        if (window.innerWidth < 900 && sectionRef.current) {
          const rect = sectionRef.current.getBoundingClientRect();
          if (rect.top < 0) {
            window.scrollBy({
              top: rect.top - 20,
              behavior: "smooth",
            });
          }
        }
      }, 700);
    }, 250);
  };

  const isExpanded = isFormVisible || isClosing;

  return (
    <section
      className={`editorial-contact-section ${isExpanded ? "is-revealed" : "is-collapsed"} ${
        isClosing ? "is-closing" : ""
      } ${isSuccess ? "is-success" : ""}`}
      id="contact"
      ref={sectionRef}
      aria-labelledby="contact-heading"
    >
      <div className="editorial-contact-inner">
        {/* ================================================================ */}
        {/* LEFT COLUMN / CENTER INVITATION                                   */}
        {/* ================================================================ */}
        <div className="editorial-intro-col" ref={introRef}>
          {/* Eyebrows */}
          <div className="editorial-eyebrows-wrap">
            <p
              className={`editorial-eyebrow eyebrow-state-a ${!isExpanded ? "is-active" : ""}`}
              aria-hidden={isExpanded}
            >
              THE NEXT STORY
            </p>
            <p
              className={`editorial-eyebrow eyebrow-state-b ${isExpanded ? "is-active" : ""}`}
              aria-hidden={!isExpanded}
            >
              LET'S CONNECT
            </p>
          </div>

          {/* Headings */}
          <div className="editorial-headings-wrap">
            <h2
              className={`editorial-heading heading-state-a ${!isExpanded ? "is-active" : ""}`}
              id="contact-heading"
              aria-hidden={isExpanded}
            >
              Every great story
              <br />
              starts somewhere.
            </h2>
            <h2
              className={`editorial-heading heading-state-b ${isExpanded ? "is-active" : ""}`}
              aria-hidden={!isExpanded}
            >
              Let's make
              <br />
              something beautiful.
            </h2>
          </div>

          {/* Supporting Copy */}
          <div className="editorial-subtext-wrap">
            <p
              className={`editorial-subtext subtext-state-a ${!isExpanded ? "is-active" : ""}`}
              aria-hidden={isExpanded}
            >
              Have a brand, a vision, or an idea worth bringing to life? Let's make
              something beautiful together.
            </p>
            <p
              className={`editorial-subtext subtext-state-b ${isExpanded ? "is-active" : ""}`}
              aria-hidden={!isExpanded}
            >
              Tell me a little about your brand, your idea, and what you're looking
              to create. I'd love to hear what you have in mind.
            </p>
          </div>

          {/* Primary CTA: Restored in invitation & success states */}
          <div
            className={`editorial-cta-wrap ${!isExpanded ? "is-visible" : "is-hidden"}`}
            ref={ctaWrapRef}
            aria-hidden={isExpanded}
          >
            <EyeFollowCTA
              text="LET'S COLLABORATE"
              href="#contact"
              onClick={handleOpenForm}
            />
          </div>

          {/* Back to Invitation Link (Form State) */}
          <div
            className={`editorial-back-wrap ${isExpanded ? "is-visible" : "is-hidden"}`}
            aria-hidden={!isExpanded}
          >
            <button
              type="button"
              className="editorial-back-link"
              onClick={handleBackToInvitation}
              ref={backBtnRef}
              disabled={state === "submitting" || isClosing}
              tabIndex={isExpanded && !isClosing ? 0 : -1}
            >
              BACK TO INVITATION
            </button>
          </div>

          {/* ============================================================== */}
          {/* Phase D: THANK-YOU REVEAL (Directly BELOW the eye-follow CTA)  */}
          {/* ============================================================== */}
          {isSuccess && (
            <div
              className="editorial-thankyou-reveal"
              role="status"
              aria-live="polite"
            >
              <div className="thankyou-reveal-divider" aria-hidden="true" />
              <p className="thankyou-reveal-eyebrow">MESSAGE SENT</p>
              <h3
                className="thankyou-reveal-heading"
                ref={thankYouHeadingRef}
                tabIndex={-1}
              >
                And so, our story begins.
              </h3>
              <p className="thankyou-reveal-body">
                {confirmedFirstName
                  ? `Thank you, ${confirmedFirstName}. Your enquiry has been sent successfully. I'm looking forward to learning more about your idea.`
                  : "Thank you for reaching out. Your enquiry has been sent successfully. I'm looking forward to learning more about your idea."}
              </p>
            </div>
          )}
        </div>

        {/* ================================================================ */}
        {/* RIGHT COLUMN: The Editorial Form Sheet                            */}
        {/* ================================================================ */}
        <div
          className={`editorial-form-col ${isExpanded ? "is-revealed" : "is-collapsed"} ${
            isClosing ? "is-exiting" : ""
          }`}
          aria-hidden={!isExpanded}
        >
          <div className="enquiry-sheet">
            <div className="enquiry-header">
              <h3 className="enquiry-title">TELL ME ABOUT YOUR PROJECT</h3>
              <p className="enquiry-subtitle">
                A few details to get the conversation started.
              </p>
            </div>

            {/* Server Error / Notice */}
            {serverError && (
              <div
                className="enquiry-status-region enquiry-error-banner"
                role="alert"
                aria-live="assertive"
              >
                <p>{serverError}</p>
              </div>
            )}

            <form
              className="enquiry-form"
              onSubmit={handleSubmit}
              noValidate
            >
              {/* Field 1: Name */}
              <div
                className={`enquiry-field ${errors.name ? "has-error" : ""}`}
                style={{ "--field-i": 0 } as React.CSSProperties}
              >
                <label htmlFor="contact-name">YOUR NAME *</label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  required
                  ref={nameInputRef}
                  disabled={state === "submitting" || isClosing}
                  placeholder="What should I call you?"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                  tabIndex={isFormVisible && !isClosing ? 0 : -1}
                  aria-invalid={errors.name ? "true" : undefined}
                  aria-describedby={errors.name ? "error-name" : undefined}
                />
                {errors.name && (
                  <span className="enquiry-error" id="error-name">
                    {errors.name}
                  </span>
                )}
              </div>

              {/* Field 2: Email */}
              <div
                className={`enquiry-field ${errors.email ? "has-error" : ""}`}
                style={{ "--field-i": 1 } as React.CSSProperties}
              >
                <label htmlFor="contact-email">EMAIL ADDRESS *</label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  required
                  disabled={state === "submitting" || isClosing}
                  placeholder="you@brand.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, email: e.target.value }))
                  }
                  tabIndex={isFormVisible && !isClosing ? 0 : -1}
                  aria-invalid={errors.email ? "true" : undefined}
                  aria-describedby={errors.email ? "error-email" : undefined}
                />
                {errors.email && (
                  <span className="enquiry-error" id="error-email">
                    {errors.email}
                  </span>
                )}
              </div>

              {/* Field 3: Brand */}
              <div
                className="enquiry-field"
                style={{ "--field-i": 2 } as React.CSSProperties}
              >
                <label htmlFor="contact-brand">BRAND / COMPANY</label>
                <input
                  id="contact-brand"
                  name="brand"
                  type="text"
                  disabled={state === "submitting" || isClosing}
                  placeholder="Your brand name (optional)"
                  value={formData.brand}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, brand: e.target.value }))
                  }
                  tabIndex={isFormVisible && !isClosing ? 0 : -1}
                />
              </div>

              {/* Field 4: Service */}
              <div
                className="enquiry-field"
                style={{ "--field-i": 3 } as React.CSSProperties}
              >
                <label htmlFor="contact-service">WHAT ARE YOU LOOKING FOR?</label>
                <select
                  id="contact-service"
                  name="service"
                  disabled={state === "submitting" || isClosing}
                  value={formData.service}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, service: e.target.value }))
                  }
                  tabIndex={isFormVisible && !isClosing ? 0 : -1}
                >
                  <option value="">Select a service (optional)</option>
                  <option value="UGC Video Creation">UGC Video Creation</option>
                  <option value="Product & Lifestyle Photography">
                    Product & Lifestyle Photography
                  </option>
                  <option value="Creative Content Package">
                    Creative Content Package
                  </option>
                  <option value="Something Else">Something Else</option>
                </select>
              </div>

              {/* Field 5: Message */}
              <div
                className={`enquiry-field enquiry-field--full ${
                  errors.message ? "has-error" : ""
                }`}
                style={{ "--field-i": 4 } as React.CSSProperties}
              >
                <label htmlFor="contact-message">TELL ME ABOUT YOUR IDEA *</label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={4}
                  required
                  disabled={state === "submitting" || isClosing}
                  placeholder="A little about your project, the content you need, and what you're imagining..."
                  value={formData.message}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, message: e.target.value }))
                  }
                  tabIndex={isFormVisible && !isClosing ? 0 : -1}
                  aria-invalid={errors.message ? "true" : undefined}
                  aria-describedby={errors.message ? "error-message" : undefined}
                />
                {errors.message && (
                  <span className="enquiry-error" id="error-message">
                    {errors.message}
                  </span>
                )}
              </div>

              {/* Submit button & note */}
              <div
                className="enquiry-submit-row"
                style={{ "--field-i": 5 } as React.CSSProperties}
              >
                <button
                  type="submit"
                  className="enquiry-submit-btn"
                  disabled={state === "submitting" || isClosing}
                  tabIndex={isFormVisible && !isClosing ? 0 : -1}
                >
                  {state === "submitting" ? "SENDING..." : "SEND ENQUIRY"}
                </button>
                <p className="enquiry-footer-note">
                  Looking forward to hearing what you're creating.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
