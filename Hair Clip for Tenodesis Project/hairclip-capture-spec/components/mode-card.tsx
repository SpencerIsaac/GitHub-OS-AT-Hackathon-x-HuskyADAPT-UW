"use client";

import Link from "next/link";
import { CaptureMode } from "@/lib/types";

type Props = {
  mode: CaptureMode;
  title: string;
  badge: string;
  description: string;
  bullets: string[];
};

export function ModeCard({ mode, title, badge, description, bullets }: Props) {
  return (
    <div className="panel modeCard">
      <div className="modeHeader">
        <div>
          <span className="pill">{badge}</span>
          <h2>{title}</h2>
        </div>
        <Link className="button accent" href={`/capture/top?mode=${mode}`}>
          Start
        </Link>
      </div>
      <p className="subtle">{description}</p>
      <div className="modeBullets">
        {bullets.map((bullet, index) => (
          <div className="modeBullet" key={bullet}>
            <span>{index + 1}</span>
            <div>{bullet}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
