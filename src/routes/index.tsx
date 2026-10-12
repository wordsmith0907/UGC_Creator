import { createFileRoute } from "@tanstack/react-router";
import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type PointerEvent,
} from "react";
import {
  workProjects,
  aboutAssets,
  services,
  type WorkProject,
} from "../data/projects";

// =============================================================================
// RING CAROUSEL CONSTANTS (Hero — DO NOT MODIFY)
// =============================================================================
const panelWidth = 360;
const panelGap = 10;
const panelCount = 16;
const radius = (panelCount * (panelWidth + panelGap)) / (2 * Math.PI);
const autoRotateDegreesPerSecond = 12;
const dragSensitivity = 0.25;
const inertiaFrictionPerFrame = 0.94;
const inertiaStopVelocity = 0.05;

const assets = [
  "/ringview/0.jpg",
  "/ringview/1.mp4",
  "/ringview/2.jpg",
  "/ringview/3.mp4",
  "/ringview/4.jpg",
  "/ringview/5.mp4",
  "/ringview/6.jpg",
  "/ringview/7.mp4",
];
const posters = [
  "/ringview/1-poster.jpg",
  "/ringview/3-poster.jpg",
  "/ringview/5-poster.jpg",
  "/ringview/7-poster.jpg",
];

// =============================================================================
// BRAND LOGOS (Temporary Placeholders)
// 👉 SWAP REAL BRAND LOGO URLs HERE:
// =============================================================================
const brandLogoRows: string[][] = [
  [
    "/ringview/0.jpg",
    "/ringview/1-poster.jpg",
    "/ringview/2.jpg",
    "/ringview/3-poster.jpg",
    "/ringview/4.jpg",
    "/ringview/5-poster.jpg",
    "/ringview/6.jpg",
    "/ringview/7-poster.jpg",
    "/ringview/0.jpg",
  ],
  [
    "/ringview/2.jpg",
    "/ringview/3-poster.jpg",
    "/ringview/4.jpg",
    "/ringview/5-poster.jpg",
    "/ringview/6.jpg",
    "/ringview/7-poster.jpg",
    "/ringview/0.jpg",
    "/ringview/1-poster.jpg",
    "/ringview/2.jpg",
  ],
  [
    "/ringview/4.jpg",
    "/ringview/5-poster.jpg",
    "/ringview/6.jpg",
    "/ringview/7-poster.jpg",
    "/ringview/0.jpg",
    "/ringview/1-poster.jpg",
    "/ringview/2.jpg",
    "/ringview/3-poster.jpg",
    "/ringview/4.jpg",
  ],
  [
    "/ringview/6.jpg",
    "/ringview/7-poster.jpg",
    "/ringview/0.jpg",
    "/ringview/1-poster.jpg",
    "/ringview/2.jpg",
    "/ringview/3-poster.jpg",
    "/ringview/4.jpg",
    "/ringview/5-poster.jpg",
    "/ringview/6.jpg",
  ],
];

// =============================================================================
// ROUTE DEFINITION
// =============================================================================
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aurea Biazon — UGC Creator" },
      {
        name: "description",
        content:
          "Authentic UGC and visual storytelling for beauty, lifestyle and food brands.",
      },
      { property: "og:title", content: "Aurea Biazon — UGC Creator" },
      {
        property: "og:description",
        content:
          "Authentic UGC and visual storytelling for beauty, lifestyle and food brands.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

// =============================================================================
// SELECTED WORK PROJECT CARD COMPONENT
// =============================================================================
function ProjectCard({
  project,
  onOpen,
}: {
  project: WorkProject;
  onOpen: (p: WorkProject) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleMouseEnter = () => {
    if (project.video && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    if (project.video && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <article
      className="sw-card"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="sw-card-media"
        onClick={() => onOpen(project)}
        role="button"
        tabIndex={0}
        aria-label={`View ${project.title}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen(project);
          }
        }}
      >
        {project.video ? (
          <>
            <video
              ref={videoRef}
              src={project.video}
              poster={project.poster || project.image}
              muted
              loop
              playsInline
              preload="metadata"
            />
            <div
              className={`sw-card-poster-fade ${isPlaying ? "is-playing" : ""}`}
            >
              <img
                src={project.poster || project.image}
                alt={project.alt}
                loading="lazy"
                draggable={false}
              />
            </div>
          </>
        ) : (
          <img
            src={project.image}
            alt={project.alt}
            loading="lazy"
            draggable={false}
          />
        )}
      </div>
      <div className="sw-card-info">
        <h3 className="sw-card-title">{project.title}</h3>
        <p className="sw-card-category">{project.category}</p>
        <p className="sw-card-desc">{project.description}</p>
      </div>
    </article>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
function HomePage() {
  // ---------------------------------------------------------------------------
  // Ring carousel refs (Hero)
  // ---------------------------------------------------------------------------
  const ringRef = useRef<HTMLDivElement>(null);
  const rotation = useRef(0);
  const velocity = useRef(0);
  const dragging = useRef(false);
  const lastPointer = useRef({ x: 0, time: 0 });

  // ---------------------------------------------------------------------------
  // Selected Work horizontal scroll refs
  // ---------------------------------------------------------------------------
  const workSectionRef = useRef<HTMLElement>(null);
  const workTrackRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const [workProgress, setWorkProgress] = useState(0);

  // ---------------------------------------------------------------------------
  // Services accordion state
  // ---------------------------------------------------------------------------
  const [openService, setOpenService] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Video / project lightbox state
  // ---------------------------------------------------------------------------
  const [activeProject, setActiveProject] = useState<WorkProject | null>(null);

  // ---------------------------------------------------------------------------
  // Ring carousel animation loop (Hero — preserved exactly)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let previous = 0;

    const animate = (now: number) => {
      if (previous === 0) previous = now;
      const dt = Math.min(now - previous, 64);
      previous = now;

      if (!motion.matches) {
        if (!dragging.current) {
          rotation.current += (autoRotateDegreesPerSecond * dt) / 1000;
          if (Math.abs(velocity.current) >= inertiaStopVelocity) {
            const frames = dt / 16;
            const decay = Math.pow(inertiaFrictionPerFrame, frames);
            rotation.current +=
              (velocity.current * (1 - decay)) / (1 - inertiaFrictionPerFrame);
            velocity.current *= decay;
          } else {
            velocity.current = 0;
          }
        }
        if (ringRef.current)
          ringRef.current.style.transform = `rotateY(${rotation.current}deg)`;
      }

      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  // ---------------------------------------------------------------------------
  // Selected Work — horizontal scroll engine (desktop only)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const section = workSectionRef.current;
    const track = workTrackRef.current;
    if (!section || !track) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const isMobile = () => window.innerWidth < 768;

    let ticking = false;

    const onScroll = () => {
      if (isMobile() || motion.matches) return;
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          const rect = section.getBoundingClientRect();
          const sectionHeight = section.offsetHeight;
          const viewportHeight = window.innerHeight;
          const scrollableDistance = sectionHeight - viewportHeight;

          if (scrollableDistance <= 0) {
            ticking = false;
            return;
          }

          // p = 0 when section top hits viewport top, p = 1 when bottom of section reaches bottom of viewport
          const scrolled = -rect.top;
          const p = Math.max(0, Math.min(1, scrolled / scrollableDistance));

          setWorkProgress(p);

          const trackWidth = track.scrollWidth;
          const viewportWidth = window.innerWidth;
          const maxTranslate = trackWidth - viewportWidth;

          if (maxTranslate > 0) {
            const x = -p * maxTranslate;
            track.style.transform = `translate3d(${x}px, 0, 0)`;
          }

          ticking = false;
        });
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Selected Work — Custom editorial VIEW cursor (desktop only)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const track = workTrackRef.current;
    const cursor = cursorRef.current;
    if (!track || !cursor) return;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!finePointer.matches || reducedMotion.matches) return;

    let rafId = 0;
    let isHovering = false;
    let targetX = -100;
    let targetY = -100;
    let currentX = -100;
    let currentY = -100;

    const render = () => {
      currentX += (targetX - currentX) * 0.22;
      currentY += (targetY - currentY) * 0.22;

      if (cursor) {
        cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%) scale(${
          isHovering ? 1 : 0.4
        })`;
        cursor.style.opacity = isHovering ? "1" : "0";
      }

      rafId = requestAnimationFrame(render);
    };

    const updateHoverState = (
      x: number,
      y: number,
      target?: EventTarget | null
    ) => {
      if (document.body.style.overflow === "hidden") {
        isHovering = false;
        return;
      }
      const el =
        (target instanceof HTMLElement ? target : null) ||
        document.elementFromPoint(x, y);
      const cardMedia = el?.closest(".sw-card-media");
      if (cardMedia && track.contains(cardMedia)) {
        if (!isHovering) {
          currentX = x;
          currentY = y;
          isHovering = true;
        }
      } else {
        isHovering = false;
      }
    };

    const onPointerMove = (e: globalThis.PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      updateHoverState(targetX, targetY, e.target);
    };

    const onPointerLeave = () => {
      isHovering = false;
    };

    const onScroll = () => {
      if (targetX >= 0 && targetY >= 0) {
        updateHoverState(targetX, targetY);
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    rafId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    if (activeProject && cursorRef.current) {
      cursorRef.current.style.opacity = "0";
    }
  }, [activeProject]);

  // ---------------------------------------------------------------------------
  // Scroll-triggered reveal animations
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );

    document.querySelectorAll(".reveal-on-scroll").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // ---------------------------------------------------------------------------
  // Pointer handlers (Hero ring — preserved exactly)
  // ---------------------------------------------------------------------------
  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragging.current = true;
    velocity.current = 0;
    lastPointer.current = { x: event.clientX, time: performance.now() };
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (!dragging.current) return;
    const now = performance.now();
    const delta = -(event.clientX - lastPointer.current.x) * dragSensitivity;
    const dt = Math.max(now - lastPointer.current.time, 1);
    rotation.current += delta;
    if (Math.abs(delta) > 0) velocity.current = (delta / dt) * 16;
    if (ringRef.current)
      ringRef.current.style.transform = `rotateY(${rotation.current}deg)`;
    lastPointer.current = { x: event.clientX, time: now };
  };

  const onPointerEnd = () => {
    if (performance.now() - lastPointer.current.time > 80)
      velocity.current = 0;
    dragging.current = false;
  };

  // ---------------------------------------------------------------------------
  // Brand row hover slowdown (preserved exactly)
  // ---------------------------------------------------------------------------
  const onRowMouseEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    const track =
      event.currentTarget.querySelector<HTMLElement>(".brands-track");
    if (track) {
      const animations = track.getAnimations();
      animations.forEach((anim) => {
        const a = anim as unknown as {
          updatePlaybackRate?: (rate: number) => void;
          playbackRate?: number;
        };
        if (typeof a.updatePlaybackRate === "function") {
          a.updatePlaybackRate(0.7);
        } else if (typeof a.playbackRate === "number") {
          a.playbackRate = 0.7;
        }
      });
    }
  };

  const onRowMouseLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    const track =
      event.currentTarget.querySelector<HTMLElement>(".brands-track");
    if (track) {
      const animations = track.getAnimations();
      animations.forEach((anim) => {
        const a = anim as unknown as {
          updatePlaybackRate?: (rate: number) => void;
          playbackRate?: number;
        };
        if (typeof a.updatePlaybackRate === "function") {
          a.updatePlaybackRate(1);
        } else if (typeof a.playbackRate === "number") {
          a.playbackRate = 1;
        }
      });
    }
  };

  // ---------------------------------------------------------------------------
  // Services accordion toggle
  // ---------------------------------------------------------------------------
  const toggleService = useCallback((id: string) => {
    setOpenService((prev) => (prev === id ? null : id));
  }, []);

  // ---------------------------------------------------------------------------
  // Lightbox handlers
  // ---------------------------------------------------------------------------
  const openLightbox = useCallback((project: WorkProject) => {
    setActiveProject(project);
    document.body.style.overflow = "hidden";
  }, []);

  const closeLightbox = useCallback(() => {
    setActiveProject(null);
    document.body.style.overflow = "";
  }, []);

  // Escape key handler for lightbox
  useEffect(() => {
    if (!activeProject) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeProject, closeLightbox]);

  // ---------------------------------------------------------------------------
  // Contact form state
  // ---------------------------------------------------------------------------
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    email: "",
    service: "",
    message: "",
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(
      `Collaboration Inquiry from ${formData.name}`
    );
    const body = encodeURIComponent(
      `Name: ${formData.name}\nBrand: ${formData.brand}\nEmail: ${formData.email}\nService: ${formData.service}\n\nProject Details:\n${formData.message}`
    );
    window.location.href = `mailto:hello@aureabiazon.com?subject=${subject}&body=${body}`;
  };

  // ===========================================================================
  // RENDER
  // ===========================================================================
  return (
    <>
      {/* ================================================================== */}
      {/* NAVIGATION (preserved exactly)                                     */}
      {/* ================================================================== */}
      <header className="site-nav">
        <a className="site-nav-brand" href="#work">
          AUREA BIAZON
        </a>
        <nav className="site-nav-links" aria-label="Primary">
          <a href="#work">Work</a>
          <a href="#about">About</a>
          <a href="#rates">Rates</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      {/* ================================================================== */}
      {/* HERO (preserved exactly)                                           */}
      {/* ================================================================== */}
      <main id="work" className="hero-experience">
        <div className="hero-copy-block">
          <p className="hero-eyebrow">
            UGC CREATOR · BEAUTY · LIFESTYLE · FOOD
          </p>
          <h1 className="hero-heading">
            <span>Beautifully real.</span>
            <span>Naturally engaging.</span>
          </h1>
          <p className="hero-subheadline">
            Authentic UGC and visual storytelling for beauty, lifestyle and food
            brands.
          </p>
          <div className="hero-cta-wrap">
            <a href="#selected-work" className="hero-cta">
              View My Work →
            </a>
          </div>
        </div>

        <div
          className="ringview"
          aria-label="Rotating fashion carousel"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onLostPointerCapture={onPointerEnd}
        >
          <div className="ringview-ring" ref={ringRef}>
            {Array.from({ length: panelCount }, (_, index) => {
              const asset =
                assets[index % assets.length] ?? "/ringview/0.jpg";
              const isVideo = index % 2 === 1;
              const poster =
                posters[Math.floor((index % assets.length) / 2)] ??
                "/ringview/1-poster.jpg";
              return (
                <div
                  className={`ringview-panel ringview-panel-${index % assets.length}`}
                  style={{
                    transform: `rotateY(${index * 22.5}deg) translateZ(-${radius}px)`,
                  }}
                  key={index}
                  aria-hidden="true"
                >
                  {isVideo ? (
                    <video
                      src={asset}
                      poster={poster}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="auto"
                    />
                  ) : (
                    <img src={asset} alt="" draggable={false} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* ================================================================== */}
      {/* BRANDS I'VE WORKED WITH (preserved exactly)                        */}
      {/* ================================================================== */}
      <section
        className="brands-section"
        aria-label="Brands I've Worked With"
      >
        <div className="brands-header">
          <p className="brands-eyebrow">BRANDS I'VE WORKED WITH</p>
        </div>
        <div className="brands-grid">
          {brandLogoRows.map((row, rowIndex) => {
            const isLeft = rowIndex % 2 === 0;
            return (
              <div
                className="brands-row"
                key={rowIndex}
                onMouseEnter={onRowMouseEnter}
                onMouseLeave={onRowMouseLeave}
              >
                <div
                  className={`brands-track ${
                    isLeft ? "brands-track-left" : "brands-track-right"
                  }`}
                >
                  {[0, 1, 2, 3].map((groupIndex) => (
                    <div
                      className="brands-group"
                      key={groupIndex}
                      aria-hidden={groupIndex > 0 ? "true" : undefined}
                    >
                      {row.map((logoSrc, logoIndex) => (
                        <div
                          className="brand-badge"
                          key={`logo-${rowIndex}-${groupIndex}-${logoIndex}`}
                        >
                          <img
                            src={logoSrc}
                            alt=""
                            loading="lazy"
                            draggable={false}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================================================================== */}
      {/* SELECTED WORK — Horizontal Scroll Gallery                          */}
      {/* ================================================================== */}
      <section
        className="sw-section"
        id="selected-work"
        ref={workSectionRef}
        aria-labelledby="sw-heading"
      >
        <div className="sw-sticky">
          {/* Header */}
          <div className="sw-header">
            <p className="sw-eyebrow">SELECTED WORK</p>
            <h2 className="sw-heading" id="sw-heading">
              Stories in motion.
            </h2>
            <p className="sw-description reveal-on-scroll">
              From everyday moments to memorable brand stories, explore
              content created to capture attention and make genuine
              connections.
            </p>
          </div>

          {/* Project Track */}
          <div className="sw-track" ref={workTrackRef}>
            {workProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={openLightbox}
              />
            ))}
          </div>

          {/* Progress Bar */}
          <div className="sw-progress">
            <div className="sw-progress-track">
              <div
                className="sw-progress-fill"
                style={{ transform: `scaleX(${workProgress})` }}
              />
            </div>
            <span className="sw-progress-counter">
              {String(
                Math.min(
                  workProjects.length,
                  Math.ceil(workProgress * workProjects.length) || 1
                )
              ).padStart(2, "0")}{" "}
              / {String(workProjects.length).padStart(2, "0")}
            </span>
          </div>
        </div>
      </section>

      {/* Mobile swipe gallery (shown only < 768px) */}
      <section className="sw-mobile-section" aria-label="Selected Work Gallery">
        <div className="sw-mobile-header">
          <p className="sw-eyebrow">SELECTED WORK</p>
          <h2 className="sw-heading">Stories in motion.</h2>
          <p className="sw-description">
            From everyday moments to memorable brand stories, explore content
            created to capture attention and make genuine connections.
          </p>
        </div>
        <div className="sw-mobile-track">
          {workProjects.map((project) => (
            <article className="sw-mobile-card" key={project.id}>
              <div
                className="sw-card-media"
                onClick={() => openLightbox(project)}
                role="button"
                tabIndex={0}
                aria-label={`View ${project.title}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openLightbox(project);
                  }
                }}
              >
                <img
                  src={project.poster || project.image}
                  alt={project.alt}
                  loading="lazy"
                  draggable={false}
                />
              </div>
              <div className="sw-card-info">
                <h3 className="sw-card-title">{project.title}</h3>
                <p className="sw-card-category">{project.category}</p>
                <p className="sw-card-desc">{project.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ================================================================== */}
      {/* ABOUT AUREA — Editorial Portrait                                   */}
      {/* ================================================================== */}
      <section className="about-section" id="about" aria-labelledby="about-h">
        <div className="about-layout">
          <div className="about-images">
            <div className="about-img-primary reveal-on-scroll">
              <img
                src={aboutAssets.primary.image}
                alt={aboutAssets.primary.alt}
                loading="lazy"
                draggable={false}
              />
            </div>
            <div className="about-img-secondary reveal-on-scroll">
              <img
                src={aboutAssets.secondary.image}
                alt={aboutAssets.secondary.alt}
                loading="lazy"
                draggable={false}
              />
            </div>
          </div>
          <div className="about-text">
            <p className="about-eyebrow-new reveal-on-scroll">
              BEHIND THE FRAME
            </p>
            <h2 className="about-heading-new reveal-on-scroll" id="about-h">
              Not just content.
              <br />A point of view.
            </h2>
            <div className="about-body-new reveal-on-scroll">
              <p>Hi, I'm Aurea.</p>
              <p>
                I create UGC and visual content inspired by the beauty of
                everyday moments—from self-care rituals and lifestyle
                discoveries to food experiences and thoughtfully composed
                imagery.
              </p>
              <p>
                My creative approach is centered on making content feel natural,
                relatable, and visually engaging. I love the little details that
                bring a story to life: the right light, a genuine moment, and a
                perspective that feels personal.
              </p>
              <p>
                Through video and photography, I bring products and experiences
                into focus in a way that feels authentic to the people watching.
              </p>
            </div>
            <a
              href="#selected-work"
              className="about-cta reveal-on-scroll"
              onClick={(e) => {
                const target =
                  window.innerWidth < 768
                    ? document.querySelector(".sw-mobile-section")
                    : document.getElementById("selected-work");
                if (target) {
                  e.preventDefault();
                  target.scrollIntoView({ behavior: "smooth" });
                  window.history.pushState(null, "", "#selected-work");
                }
              }}
            >
              EXPLORE MY WORK
            </a>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SERVICES & RATES — Typography Accordion                            */}
      {/* ================================================================== */}
      <section
        className="services-section"
        id="rates"
        aria-labelledby="services-h"
      >
        <div className="services-inner">
          <div className="services-header reveal-on-scroll">
            <p className="services-eyebrow">03 / WORK WITH ME</p>
            <h2 className="services-heading" id="services-h">
              The art of creating together.
            </h2>
            <p className="services-subtext">
              Every brand has a story worth sharing. Let's find the right way to
              tell yours.
            </p>
          </div>

          <div className="services-list">
            {services.map((svc) => (
              <div
                className={`service-item ${openService === svc.id ? "service-item--open" : ""}`}
                key={svc.id}
              >
                <button
                  className="service-trigger"
                  onClick={() => toggleService(svc.id)}
                  aria-expanded={openService === svc.id}
                  aria-controls={`service-panel-${svc.id}`}
                >
                  <span className="service-number">{svc.number}</span>
                  <span className="service-title">{svc.title}</span>
                  <span className="service-icon" aria-hidden="true">
                    {openService === svc.id ? "−" : "+"}
                  </span>
                </button>
                <div
                  className="service-panel"
                  id={`service-panel-${svc.id}`}
                  role="region"
                  aria-labelledby={svc.id}
                  hidden={openService !== svc.id}
                >
                  <div className="service-panel-inner">
                    <p className="service-desc">{svc.description}</p>
                    <ul className="service-formats">
                      {svc.formats.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="services-rates reveal-on-scroll">
            <h3 className="rates-heading">
              Every collaboration is a little different.
            </h3>
            <p className="rates-body">
              Have a project in mind? Let's talk about the content you need and
              create an approach that fits your brand.
            </p>
            <a href="#contact" className="rates-cta">
              Enquire About Rates ↗
            </a>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* CONTACT — The Final Invitation                                     */}
      {/* ================================================================== */}
      <section
        className="contact-section"
        id="contact"
        aria-labelledby="contact-h"
      >
        <div className="contact-inner">
          <div className="contact-copy">
            <p className="contact-eyebrow reveal-on-scroll">
              04 / THE NEXT STORY
            </p>
            <h2 className="contact-heading reveal-on-scroll" id="contact-h">
              Something beautiful
              <br />
              starts here.
            </h2>
            <p className="contact-subtext reveal-on-scroll">
              Have a brand, a vision, or an idea worth bringing to life? I'd
              love to hear what you're dreaming up.
            </p>
          </div>

          <form
            className="contact-form reveal-on-scroll"
            onSubmit={handleFormSubmit}
          >
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="contact-name">Your name</label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Jane Smith"
                />
              </div>
              <div className="form-field">
                <label htmlFor="contact-brand">Brand / company</label>
                <input
                  id="contact-brand"
                  type="text"
                  value={formData.brand}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, brand: e.target.value }))
                  }
                  placeholder="Your Brand"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="contact-email">Email address</label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="jane@brand.com"
                />
              </div>
              <div className="form-field">
                <label htmlFor="contact-service">
                  What are you looking for?
                </label>
                <select
                  id="contact-service"
                  value={formData.service}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, service: e.target.value }))
                  }
                >
                  <option value="">Select a service</option>
                  <option value="UGC Video Creation">
                    UGC Video Creation
                  </option>
                  <option value="Product & Lifestyle Photography">
                    Product & Lifestyle Photography
                  </option>
                  <option value="Creative Content Package">
                    Creative Content Package
                  </option>
                  <option value="Something else">Something else</option>
                </select>
              </div>
            </div>
            <div className="form-field form-field--full">
              <label htmlFor="contact-message">
                Tell me about your project
              </label>
              <textarea
                id="contact-message"
                rows={5}
                value={formData.message}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, message: e.target.value }))
                }
                placeholder="Share a bit about your brand and what you're looking for…"
              />
            </div>
            <button type="submit" className="contact-submit">
              Let's Collaborate ↗
            </button>
            <p className="contact-alt">
              Or say hello directly at{" "}
              <a href="mailto:hello@aureabiazon.com">hello@aureabiazon.com</a>
            </p>
          </form>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FOOTER                                                             */}
      {/* ================================================================== */}
      <footer className="site-footer">
        <div className="footer-inner">
          <p className="footer-brand">AUREA BIAZON</p>
          <nav className="footer-links" aria-label="Footer">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram
            </a>
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              TikTok
            </a>
            <a href="#contact">Contact</a>
          </nav>
          <p className="footer-copy">
            © {new Date().getFullYear()} Aurea Biazon. All rights reserved.
          </p>
          <a href="#work" className="footer-top" aria-label="Back to top">
            ↑ Top
          </a>
        </div>
      </footer>

      {/* ================================================================== */}
      {/* SELECTED WORK — Custom Editorial VIEW Cursor                        */}
      {/* ================================================================== */}
      <div
        ref={cursorRef}
        className="sw-custom-cursor"
        aria-hidden="true"
      >
        <span>VIEW</span>
      </div>

      {/* ================================================================== */}
      {/* VIDEO / IMAGE LIGHTBOX                                             */}
      {/* ================================================================== */}
      {activeProject && (
        <div
          className="lightbox"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label={`${activeProject.title} viewer`}
        >
          <button
            className="lightbox-close"
            onClick={closeLightbox}
            aria-label="Close viewer"
          >
            ✕
          </button>
          <div
            className="lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="lightbox-media-wrap">
              {activeProject.video ? (
                <video
                  src={activeProject.video}
                  poster={activeProject.poster || activeProject.image}
                  autoPlay
                  controls
                  playsInline
                  className="lightbox-video"
                />
              ) : (
                <img
                  src={activeProject.image}
                  alt={activeProject.alt}
                  className="lightbox-img"
                />
              )}
            </div>
            <div className="lightbox-info">
              <h3 className="lightbox-title">{activeProject.title}</h3>
              <p className="lightbox-category">{activeProject.category}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}