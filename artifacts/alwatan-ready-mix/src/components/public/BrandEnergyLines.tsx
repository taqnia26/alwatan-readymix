import { useRef, type CSSProperties } from 'react';
import { useInView } from 'framer-motion';

const paths = [
  'M -40 72 H 168 L 245 149 H 380',
  'M -40 420 H 190 L 286 324 H 470',
  'M 1480 90 H 1276 L 1185 181 H 1060',
  'M 1480 466 H 1240 L 1138 364 H 966',
];
const pagePaths = [
  'M -40 72 H 60 L 110 122 H 200',
  'M -40 420 H 65 L 130 355 H 210',
  'M 1480 90 H 1375 L 1330 135 H 1240',
  'M 1480 466 H 1380 L 1315 401 H 1230',
];

/** Decorative brand motion only; never intercepts links, swipes, or text. */
export default function BrandEnergyLines({ variant = 'hero' }: { variant?: 'hero' | 'footer' | 'page' }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: '80px' });
  const style = { '--energy-play-state': inView ? 'running' : 'paused' } as CSSProperties;

  return (
    <div ref={ref} aria-hidden="true" className={`brand-energy-lines brand-energy-lines--${variant}`} style={style}>
      <svg viewBox="0 0 1440 520" preserveAspectRatio="none" fill="none">
        {(variant === 'page' ? pagePaths : paths).map((d, index) => (
          <g key={d}>
            <path d={d} className="brand-energy-track" />
            <path d={d} className="brand-energy-beam" style={{ animationDelay: `${index * -3.5}s` }} />
          </g>
        ))}
      </svg>
      <span className="brand-energy-sweep" />
    </div>
  );
}
