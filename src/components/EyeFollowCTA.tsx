import { useEffect, useRef, type MouseEvent } from "react";

interface EyeFollowCTAProps {
  text?: string;
  href?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
  className?: string;
}

export function EyeFollowCTA({
  text = "LET'S COLLABORATE",
  href = "#contact",
  onClick,
  className = "",
}: EyeFollowCTAProps) {
  const leftEyeRef = useRef<HTMLDivElement>(null);
  const rightEyeRef = useRef<HTMLDivElement>(null);
  const leftPupilRef = useRef<HTMLDivElement>(null);
  const rightPupilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only enable pointer tracking on fine pointer devices without reduced motion
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!finePointer.matches || reducedMotion.matches) return;

    const maxRadius = 4.8; // Constrained radius in px (eye: 20px, pupil: 7px)

    let rafId = 0;
    let isRunning = false;

    const targetLeft = { x: 0, y: 0 };
    const targetRight = { x: 0, y: 0 };
    const currentLeft = { x: 0, y: 0 };
    const currentRight = { x: 0, y: 0 };

    const getOffset = (eyeEl: HTMLElement | null, clientX: number, clientY: number) => {
      if (!eyeEl) return { x: 0, y: 0 };
      const rect = eyeEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist === 0) return { x: 0, y: 0 };
      const angle = Math.atan2(dy, dx);
      // Smooth scaling towards max radius for a natural, subtle gaze
      const travel = Math.min(dist * 0.06, maxRadius);
      return {
        x: Math.cos(angle) * travel,
        y: Math.sin(angle) * travel,
      };
    };

    const render = () => {
      // Smooth interpolation (lerp)
      currentLeft.x += (targetLeft.x - currentLeft.x) * 0.18;
      currentLeft.y += (targetLeft.y - currentLeft.y) * 0.18;
      currentRight.x += (targetRight.x - currentRight.x) * 0.18;
      currentRight.y += (targetRight.y - currentRight.y) * 0.18;

      if (leftPupilRef.current) {
        leftPupilRef.current.style.transform = `translate(calc(-50% + ${currentLeft.x.toFixed(2)}px), calc(-50% + ${currentLeft.y.toFixed(2)}px))`;
      }
      if (rightPupilRef.current) {
        rightPupilRef.current.style.transform = `translate(calc(-50% + ${currentRight.x.toFixed(2)}px), calc(-50% + ${currentRight.y.toFixed(2)}px))`;
      }

      // Check if settled to stop running JavaScript when idle
      const settled =
        Math.abs(targetLeft.x - currentLeft.x) < 0.02 &&
        Math.abs(targetLeft.y - currentLeft.y) < 0.02 &&
        Math.abs(targetRight.x - currentRight.x) < 0.02 &&
        Math.abs(targetRight.y - currentRight.y) < 0.02;

      if (!settled) {
        rafId = requestAnimationFrame(render);
      } else {
        isRunning = false;
      }
    };

    const startLoop = () => {
      if (!isRunning) {
        isRunning = true;
        rafId = requestAnimationFrame(render);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const l = getOffset(leftEyeRef.current, e.clientX, e.clientY);
      const r = getOffset(rightEyeRef.current, e.clientX, e.clientY);
      targetLeft.x = l.x;
      targetLeft.y = l.y;
      targetRight.x = r.x;
      targetRight.y = r.y;
      startLoop();
    };

    const onPointerLeave = () => {
      // Smoothly return to center when pointer leaves the window
      targetLeft.x = 0;
      targetLeft.y = 0;
      targetRight.x = 0;
      targetRight.y = 0;
      startLoop();
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", onPointerLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(e);
      return;
    }
    // Default smooth navigation to target section if hash link
    if (href.startsWith("#")) {
      const targetId = href.slice(1);
      const target = document.getElementById(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
        window.history.pushState(null, "", href);
      }
    }
  };

  return (
    <a
      href={href}
      className={`eye-follow-cta ${className}`.trim()}
      onClick={handleClick}
    >
      <span className="eye-follow-text">{text}</span>
      <div className="eye-follow-eyes" aria-hidden="true">
        <div className="eye-follow-eye" ref={leftEyeRef}>
          <div className="eye-follow-pupil" ref={leftPupilRef} />
        </div>
        <div className="eye-follow-eye" ref={rightEyeRef}>
          <div className="eye-follow-pupil" ref={rightPupilRef} />
        </div>
      </div>
    </a>
  );
}
