"use client";

import { useState, type PointerEvent } from "react";
import Image from "next/image";
import { Activity, Bone, HeartPulse, PawPrint, ShieldCheck, Sparkles } from "lucide-react";

export function HeroExperience() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    setTilt({ x: y * -7, y: x * 9 });
  }

  function resetTilt() {
    setTilt({ x: 0, y: 0 });
  }

  return (
    <div
      className="petwo-hero-scene"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
      onBlur={resetTilt}
      aria-label="Interactive illustration of a dog and cat surrounded by pet-care essentials"
    >
      <div className="petwo-scene-glow petwo-scene-glow-one" />
      <div className="petwo-scene-glow petwo-scene-glow-two" />
      <div
        className="petwo-scene-stage"
        style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
      >
        <div className="petwo-scene-orbit petwo-scene-orbit-one" />
        <div className="petwo-scene-orbit petwo-scene-orbit-two" />
        <div className="petwo-scene-pet">
          <Image
            src="/pet-care-illustration.svg"
            alt="Friendly dog and cat with pet-care essentials"
            width={720}
            height={540}
            priority
            className="h-full w-full object-contain drop-shadow-[0_28px_28px_rgba(22,74,61,0.16)]"
          />
        </div>

        <div className="petwo-float-card petwo-float-card-top" aria-hidden="true">
          <span className="petwo-float-icon petwo-float-icon-green"><HeartPulse size={18} /></span>
          <span><strong>Health first</strong><small>Care at every stage</small></span>
        </div>
        <div className="petwo-float-card petwo-float-card-side" aria-hidden="true">
          <span className="petwo-float-icon petwo-float-icon-orange"><Bone size={18} /></span>
          <span><strong>Happy moments</strong><small>More tail wags ahead</small></span>
        </div>
        <div className="petwo-float-orb petwo-float-orb-paw" aria-hidden="true"><PawPrint size={24} /></div>
        <div className="petwo-float-orb petwo-float-orb-activity" aria-hidden="true"><Activity size={22} /></div>
        <div className="petwo-scene-sparkle petwo-scene-sparkle-one" aria-hidden="true"><Sparkles size={20} /></div>
        <div className="petwo-scene-sparkle petwo-scene-sparkle-two" aria-hidden="true"><ShieldCheck size={18} /></div>
      </div>
      <p className="petwo-scene-caption">Thoughtful care for every member of your family</p>
    </div>
  );
}
