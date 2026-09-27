import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, type PointerEvent } from "react";

import photo0 from "../assets/ringview/0.jpg.asset.json";
import video1 from "../assets/ringview/1.mp4.asset.json";
import poster1 from "../assets/ringview/1-poster.jpg.asset.json";
import photo2 from "../assets/ringview/2.jpg.asset.json";
import video3 from "../assets/ringview/3.mp4.asset.json";
import poster3 from "../assets/ringview/3-poster.jpg.asset.json";
import photo4 from "../assets/ringview/4.jpg.asset.json";
import video5 from "../assets/ringview/5.mp4.asset.json";
import poster5 from "../assets/ringview/5-poster.jpg.asset.json";
import photo6 from "../assets/ringview/6.jpg.asset.json";
import video7 from "../assets/ringview/7.mp4.asset.json";
import poster7 from "../assets/ringview/7-poster.jpg.asset.json";

const panelWidth = 300;
const panelGap = 8;
const panelCount = 16;
const radius = (panelCount * (panelWidth + panelGap)) / (2 * Math.PI);
const autoRotateDegreesPerSecond = 12;
const dragSensitivity = 0.25;
const inertiaFrictionPerFrame = 0.94;
const inertiaStopVelocity = 0.05;
const assets = [photo0, video1, photo2, video3, photo4, video5, photo6, video7];
const posters = [poster1, poster3, poster5, poster7];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RingView Carousel" },
      { name: "description", content: "An immersive rotating ring of fashion imagery and film." },
      { property: "og:title", content: "RingView Carousel" },
      { property: "og:description", content: "An immersive rotating ring of fashion imagery and film." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RingView,
});

function RingView() {
  const ringRef = useRef<HTMLDivElement>(null);
  const rotation = useRef(0);
  const velocity = useRef(0);
  const dragging = useRef(false);
  const lastPointer = useRef({ x: 0, time: 0 });

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
            rotation.current += velocity.current * (1 - decay) / (1 - inertiaFrictionPerFrame);
            velocity.current *= decay;
          } else {
            velocity.current = 0;
          }
        }
        if (ringRef.current) ringRef.current.style.transform = `rotateY(${rotation.current}deg)`;
      }

      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

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
    if (ringRef.current) ringRef.current.style.transform = `rotateY(${rotation.current}deg)`;
    lastPointer.current = { x: event.clientX, time: now };
  };

  const onPointerEnd = () => {
    if (performance.now() - lastPointer.current.time > 80) velocity.current = 0;
    dragging.current = false;
  };

  return (
    <>
      <p className="hero-eyebrow">UGC Creator · Beauty · Lifestyle · Food</p>
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
      <main
        id="work"
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
            const asset = assets[index % assets.length] ?? photo0;
            const isVideo = index % 2 === 1;
            return (
              <div
                className={`ringview-panel ringview-panel-${index % assets.length}`}
                style={{ transform: `rotateY(${index * 22.5}deg) translateZ(-${radius}px)` }}
                key={index}
                aria-hidden="true"
              >
                {isVideo ? (
                  <video
                    src={asset.url}
                    poster={(posters[Math.floor((index % assets.length) / 2)] ?? poster1).url}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                  />
                ) : (
                  <img src={asset.url} alt="" draggable={false} />
                )}
              </div>
            );
          })}
        </div>
      </main>
      <section className="about" id="about" aria-labelledby="about-heading">
        <div className="about-inner">
          <div className="about-intro">
            <p className="about-eyebrow">The Collection</p>
            <h2 className="about-heading" id="about-heading">
              Fashion in constant rotation.
            </h2>
          </div>
          <div className="about-detail">
            <p className="about-body">
              Sixteen frames, one continuous loop. The RingView collection brings
              moving image and still photography into a single orbit — draped
              silhouettes, hard light, and colour that shifts as the ring turns.
            </p>
            <p className="about-body">
              Drag to spin. Every pass reveals a different pairing of texture
              and motion, shot for the screen rather than the page.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}