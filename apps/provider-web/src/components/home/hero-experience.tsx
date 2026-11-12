"use client";

import { useState, type PointerEvent } from "react";
import Image from "next/image";
import {
  Activity, CalendarCheck, HeartPulse, PawPrint, Scissors,
  ShieldCheck, Stethoscope, Syringe,
} from "lucide-react";

export function HeroExperience() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    setTilt({ x: y * -5, y: x * 7 });
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
      aria-label="Interactive PETWO pet-care scene with care features"
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
            width={760}
            height={520}
            priority
            className="h-full w-full object-contain drop-shadow-[0_28px_28px_rgba(22,74,61,0.16)]"
          />
        </div>

        <div className="petwo-care-card petwo-care-card-health">
          <span className="petwo-float-icon petwo-float-icon-green"><HeartPulse size={17} /></span>
          <span><strong>Pet Health</strong><small>Records & reports</small></span>
        </div>
        <div className="petwo-care-card petwo-care-card-vet">
          <span className="petwo-float-icon petwo-float-icon-green"><Stethoscope size={17} /></span>
          <span><strong>Veterinary Care</strong><small>Find trusted vets</small></span>
        </div>
        <div className="petwo-care-card petwo-care-card-appointments">
          <span className="petwo-float-icon petwo-float-icon-orange"><CalendarCheck size={17} /></span>
          <span><strong>Appointments</strong><small>Stay right on time</small></span>
        </div>
        <div className="petwo-care-card petwo-care-card-vaccination">
          <span className="petwo-float-icon petwo-float-icon-green"><Syringe size={17} /></span>
          <span><strong>Vaccination</strong><small>Gentle reminders</small></span>
        </div>
        <div className="petwo-care-card petwo-care-card-grooming">
          <span className="petwo-float-icon petwo-float-icon-orange"><Scissors size={17} /></span>
          <span><strong>Grooming</strong><small>Everyday wellness</small></span>
        </div>

        <div className="petwo-float-orb petwo-float-orb-paw" aria-hidden="true"><PawPrint size={22} /></div>
        <div className="petwo-float-orb petwo-float-orb-activity" aria-hidden="true"><Activity size={20} /></div>
        <div className="petwo-scene-sparkle petwo-scene-sparkle-one" aria-hidden="true">✦</div>
        <div className="petwo-scene-sparkle petwo-scene-sparkle-two" aria-hidden="true"><ShieldCheck size={18} /></div>
      </div>
      <p className="petwo-scene-caption">Thoughtful care for every member of your family</p>
    </div>
  );
}
