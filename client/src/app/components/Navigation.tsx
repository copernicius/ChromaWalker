import { Home, Palette, Plus, Sparkles, Target, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';

// How long the passive "attract" animations play before going quiet so they
// don't become wallpaper noise.
const ATTRACT_DURATION_MS = 3000;

// 7 hex stops in rainbow order — burst particles only, not tied to the full
// PALETTE. Angles distribute the particles evenly around the origin.
const BURST_PARTICLES = [
  { hex: '#FF0000', angle: -90 },
  { hex: '#FF7F00', angle: -38.6 },
  { hex: '#FFFF00', angle: 12.9 },
  { hex: '#00FF00', angle: 64.3 },
  { hex: '#0000FF', angle: 115.7 },
  { hex: '#4B0082', angle: 167.1 },
  { hex: '#9400D3', angle: -141.4 },
];

// Fire-and-forget DOM injection — outlives the Navigation unmount that
// happens when the click navigates to /upload (Root.tsx hides Navigation
// there). No React state, no portals, just a self-cleaning <div> on body.
function triggerRainbowBurst(centerX: number, centerY: number) {
  const radius = 80;
  const container = document.createElement('div');
  container.style.cssText = `position:fixed;left:${centerX}px;top:${centerY}px;pointer-events:none;z-index:60;`;
  for (const { hex, angle } of BURST_PARTICLES) {
    const rad = (angle * Math.PI) / 180;
    const tx = Math.cos(rad) * radius;
    const ty = Math.sin(rad) * radius;
    const dot = document.createElement('div');
    dot.className = 'animate-confetti-burst';
    dot.style.cssText = `position:absolute;width:12px;height:12px;border-radius:9999px;left:-6px;top:-6px;background:${hex};box-shadow:0 0 12px ${hex}aa;--tx:${tx}px;--ty:${ty}px;`;
    container.appendChild(dot);
  }
  document.body.appendChild(container);
  window.setTimeout(() => container.remove(), 700);
}

export function Navigation() {
  const location = useLocation();
  // Run the attract effect briefly on mount, then go quiet. Navigation
  // re-mounts when the user leaves /upload (Root.tsx hides it there), so
  // they get a fresh nudge after each upload, but no perpetual loop.
  const [attractActive, setAttractActive] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setAttractActive(false), ATTRACT_DURATION_MS);
    return () => window.clearTimeout(t);
  }, []);

  const navItems = [
    { path: '/home', icon: Home, label: 'Home' },
    { path: '/galleries', icon: Palette, label: 'Gallery' },
    { path: '/upload', icon: Plus, label: '', isUpload: true },
    { path: '/missions', icon: Target, label: 'Missions' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 rounded-t-3xl shadow-lg">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex justify-around items-center h-20 relative">
          {navItems.map(({ path, icon: Icon, label, isUpload }) => {
            const isActive = location.pathname === path;

            // Special styling for upload button (center item) — passive
            // "magic" layers attract the eye even when idle:
            //   • Two staggered halos pulse outward from behind the button.
            //   • A small sparkle twinkles in/out at the top-right.
            //   • Click still fires the existing rainbow burst.
            if (isUpload) {
              return (
                <Link
                  key={path}
                  to={path}
                  onClick={(e) => {
                    const rect = (
                      e.currentTarget as HTMLElement
                    ).getBoundingClientRect();
                    triggerRainbowBurst(
                      rect.left + rect.width / 2,
                      rect.top + rect.height / 2,
                    );
                  }}
                  className="relative flex flex-col items-center justify-center -mt-6"
                >
                  {/* Halo layers + twinkle — only mounted while
                      attractActive is true, so they fully unmount after the
                      brief intro and stop consuming render cycles. */}
                  {attractActive && (
                    <>
                      <span
                        aria-hidden
                        className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-gradient-to-br from-[#FF8A65] to-[#9575CD] opacity-40 animate-attract-halo pointer-events-none"
                      />
                      <span
                        aria-hidden
                        className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-gradient-to-br from-[#FF8A65] to-[#9575CD] opacity-40 animate-attract-halo pointer-events-none"
                        style={{ animationDelay: '1.2s' }}
                      />
                      <Sparkles
                        aria-hidden
                        className="absolute -top-1 -right-1 w-4 h-4 text-[#FFD54F] drop-shadow-[0_0_6px_rgba(255,213,79,0.8)] animate-attract-twinkle pointer-events-none"
                      />
                    </>
                  )}
                  <div className="relative z-10 bg-gradient-to-br from-[#FF8A65] to-[#9575CD] text-white rounded-full p-4 shadow-xl hover:shadow-2xl transition-all hover:scale-110 active:scale-95 ring-4 ring-white">
                    <Icon className="w-7 h-7" strokeWidth={2.5} />
                  </div>
                </Link>
              );
            }

            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all ${
                  isActive ? 'text-[#2D2520]' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon
                  className={`w-6 h-6 ${isActive ? 'fill-[#2D2520]/10' : ''}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
