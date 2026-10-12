import { useEffect, useRef, useState } from "react";

export interface ServiceVideoPreviewItem {
  id: string;
  video: string;
  poster?: string;
  title: string;
}

interface ServiceVideoPreviewProps {
  activeServiceId: string | null;
  services: ServiceVideoPreviewItem[];
  rowRefs: Record<string, HTMLElement | null>;
  cursorOffset?: { x: number; y: number };
}

export function ServiceVideoPreview({
  activeServiceId,
  services,
  rowRefs,
  cursorOffset = { x: 0, y: 0 },
}: ServiceVideoPreviewProps) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [canHover, setCanHover] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  // Media query detection: only enable on devices with fine pointer hover
  useEffect(() => {
    if (typeof window === "undefined") return;

    const hoverQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updateCapabilities = () => {
      setCanHover(hoverQuery.matches);
      setPrefersReducedMotion(motionQuery.matches);
    };

    updateCapabilities();

    hoverQuery.addEventListener("change", updateCapabilities);
    motionQuery.addEventListener("change", updateCapabilities);

    return () => {
      hoverQuery.removeEventListener("change", updateCapabilities);
      motionQuery.removeEventListener("change", updateCapabilities);
    };
  }, []);

  // Update target preview position when activeServiceId or window dimensions change
  useEffect(() => {
    if (!activeServiceId || !canHover) {
      return;
    }

    const rowEl = rowRefs[activeServiceId];
    if (!rowEl) return;

    const updatePos = () => {
      const rect = rowEl.getBoundingClientRect();
      const previewWidth = 150;
      const previewHeight = 190;
      const padding = 24;

      // Primary placement: in the generous whitespace to the right of the row
      // Row is centered in max-width: 900px, so on desktop > 1024px there's ample margin
      let left = rect.right + 28;

      // If right margin is clipped by viewport boundary, position slightly inset on right edge of row
      if (left + previewWidth > window.innerWidth - padding) {
        // Try inside the right area of the row if there's sufficient room
        left = rect.right - previewWidth - 40;
      }

      // Vertical centering aligned with the service trigger / header
      let top = rect.top + 10;

      // Keep inside viewport vertically
      if (top + previewHeight > window.innerHeight - padding) {
        top = window.innerHeight - previewHeight - padding;
      }
      if (top < padding) {
        top = padding;
      }

      setPosition({ top, left });
    };

    updatePos();
    window.addEventListener("scroll", updatePos, { passive: true });
    window.addEventListener("resize", updatePos);

    return () => {
      window.removeEventListener("scroll", updatePos);
      window.removeEventListener("resize", updatePos);
    };
  }, [activeServiceId, rowRefs, canHover]);

  // Handle video playback strictly per active item
  useEffect(() => {
    services.forEach((svc) => {
      const vid = videoRefs.current[svc.id];
      if (!vid) return;

      if (svc.id === activeServiceId && !prefersReducedMotion) {
        vid.currentTime = 0;
        const playPromise = vid.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Gracefully ignore autoplay rejection
          });
        }
      } else {
        vid.pause();
        vid.currentTime = 0;
      }
    });
  }, [activeServiceId, prefersReducedMotion, services]);

  // If touch device or hover not supported, render nothing
  if (!canHover) {
    return null;
  }

  const isVisible = Boolean(activeServiceId && position);

  return (
    <div
      className={`service-video-preview-portal ${isVisible ? "is-visible" : ""}`}
      style={{
        transform: position
          ? `translate3d(${position.left + cursorOffset.x}px, ${position.top + cursorOffset.y}px, 0)`
          : undefined,
      }}
      aria-hidden="true"
    >
      <div className="service-video-preview-frame">
        {services.map((svc) => {
          const isActive = svc.id === activeServiceId;
          return (
            <div
              key={svc.id}
              className={`service-video-preview-item ${isActive ? "is-active" : ""}`}
            >
              {prefersReducedMotion && svc.poster ? (
                <img
                  src={svc.poster}
                  alt=""
                  className="service-preview-media"
                  loading="lazy"
                  draggable={false}
                />
              ) : (
                <video
                  ref={(el) => {
                    videoRefs.current[svc.id] = el;
                  }}
                  src={svc.video}
                  poster={svc.poster}
                  muted
                  loop
                  playsInline
                  preload="none"
                  className="service-preview-media"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
