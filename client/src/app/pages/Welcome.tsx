import { GoogleLogin } from "@react-oauth/google";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { UserProfile } from "../data";
import { apiCall, queryClient } from "../lib";
import { useAppStore } from "../store";

export function Welcome() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const { isAuthenticated, login } = useAppStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/home");
    }
  }, [isAuthenticated, navigate]);

  const loginMutation = useMutation({
    mutationFn: (credential: string) =>
      apiCall<{ user: UserProfile; token: string }>("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      }),
    onSuccess: (data) => {
      setError("");
      login(data.user, data.token);
      queryClient.setQueryData(["auth", "me"], data.user);
      navigate("/home");
    },
    onError: () => {
      setError("Login failed. Please try again.");
    },
  });

  const handleGoogleSuccess = (credentialResponse: { credential?: string }) => {
    if (loginMutation.isPending) return;
    if (!credentialResponse.credential) return;
    loginMutation.mutate(credentialResponse.credential);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated coast scene as the entire background */}
      <WalkingCoastScene />

      {/* Foreground content layered on top */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-between p-8 py-12">
        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-md w-full">
          {/* Brand */}
          <h1 className="text-5xl mb-6 text-center text-[#2D2520] drop-shadow-sm">
            <span className="font-semibold">Chroma</span>
            <span
              className="italic"
              style={{ fontFamily: "var(--font-brand-serif)" }}
            >
              Walk
            </span>
          </h1>

          {/* Tagline */}
          <div className="text-center mb-4 px-4">
            <p className="text-2xl mb-1 text-[#2D2520]">
              It's ok to{" "}
              <span
                className="italic"
                style={{
                  fontFamily: "var(--font-brand-serif)",
                  color: "#7A4E1F",
                }}
              >
                explore
              </span>{" "}
              your
            </p>
            <p className="text-2xl text-[#2D2520]">world in color</p>
          </div>

        </div>

        {/* Google Login */}
        <div className="w-full max-w-md flex flex-col items-center gap-4">
          <div
            className={
              loginMutation.isPending ? "pointer-events-none opacity-50" : ""
            }
            aria-busy={loginMutation.isPending}
          >
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Login failed. Please try again.")}
              size="large"
              width="300"
              text="continue_with"
              shape="pill"
            />
          </div>
          {loginMutation.isPending && (
            <p className="text-[#2D2520]/70 text-sm">Signing in…</p>
          )}
          {error && !loginMutation.isPending && (
            <p className="text-red-700 text-sm font-medium">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Full-bleed flat scene: sky → rainbow sea → sand, occupying the whole
// viewport behind the welcome content. No mask, no shadows, no rounded
// corners — flat shapes with bold solid bands.
function WalkingCoastScene() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden"
      style={{
        // Two-stop sky gradient — flat-design style, just enough warmth.
        background: 'linear-gradient(180deg, #FFD9A8 0%, #F5B0B5 100%)',
      }}
    >
      {/* Sun — solid disc with a soft glowing halo and a slow pulse */}
      <div
        className="absolute top-[8%] right-[12%] w-20 h-20 rounded-full bg-[#FFE89C] animate-pulse"
        style={{
          boxShadow:
            '0 0 40px 10px rgba(255, 232, 156, 0.55), 0 0 80px 20px rgba(255, 200, 130, 0.35)',
          animationDuration: '4s',
        }}
      />

      {/* Drifting clouds — staggered for parallax */}
      <Cloud className="top-[10%] w-32 h-7" delay="-2s" duration="36s" />
      <Cloud className="top-[20%] w-24 h-5" delay="-15s" duration="44s" />
      <Cloud className="top-[32%] w-40 h-8" delay="-26s" duration="40s" />

      {/* Rainbow sea — placed at ~58% from the top so the sky dominates */}
      <div className="absolute left-0 right-0 animate-sea-shimmer" style={{ top: '58%' }}>
        {[
          '#E53935',
          '#FB8C00',
          '#FDD835',
          '#43A047',
          '#1E88E5',
          '#5E35B1',
          '#8E24AA',
        ].map((hex) => (
          <div key={hex} className="h-2" style={{ backgroundColor: hex }} />
        ))}
      </div>

      {/* Sand — warmer, more saturated golden so it contrasts with the
          fair / yellow skin tones in the walking group. */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-[#D4A55F]"
        style={{ height: '30%' }}
      />

      {/* Walking group — four figures, varied skin tones and shirts.
          Positioned along the sand band; bob phases offset so they don't
          move in lockstep. */}
      <Person
        className="left-[20%] bottom-[10%]"
        size={64}
        skin="#F0CB95" /* warm yellow / East Asian */
        shirt="#FF8A65"
        delay="0ms"
      />
      <Person
        className="left-[40%] bottom-[8%]"
        size={72}
        skin="#F8E1D2" /* pale / fair */
        shirt="#FFD54F"
        delay="-120ms"
      />
      <Person
        className="left-[60%] bottom-[8%]"
        size={72}
        skin="#BC7A4F" /* medium tan */
        shirt="#4DB6AC"
        delay="-240ms"
      />
      <Person
        className="left-[80%] bottom-[10%]"
        size={64}
        skin="#6B4423" /* deep brown */
        shirt="#9575CD"
        delay="-360ms"
      />
    </div>
  );
}

function Cloud({
  className,
  delay,
  duration,
}: {
  className: string;
  delay: string;
  duration: string;
}) {
  return (
    <div
      className={`absolute rounded-full bg-white/70 animate-cloud-drift ${className}`}
      style={{ animationDelay: delay, animationDuration: duration }}
    />
  );
}

interface PersonProps {
  className: string;
  size: number;
  skin: string;
  shirt: string;
  delay: string;
}

function Person({ className, size, skin, shirt, delay }: PersonProps) {
  const height = Math.round(size * 1.5);
  return (
    <div
      className={`absolute -translate-x-1/2 animate-walk-bob ${className}`}
      style={{ width: size, height, animationDelay: delay }}
    >
      <svg viewBox="0 0 48 72" className="w-full h-full">
        {/* Head */}
        <circle cx="24" cy="10" r="8" fill={skin} />
        {/* Torso (shirt) */}
        <rect x="16" y="20" width="16" height="22" rx="4" fill={shirt} />
        {/* Arms (skin) */}
        <rect
          x="8"
          y="22"
          width="6"
          height="16"
          rx="3"
          fill={skin}
          transform="rotate(15 11 22)"
        />
        <rect
          x="34"
          y="22"
          width="6"
          height="16"
          rx="3"
          fill={skin}
          transform="rotate(-15 37 22)"
        />
        {/* Legs — counter-swinging via two keyframes; share the figure's
            delay so each person's whole body stays in phase with itself. */}
        <g
          className="animate-leg-a"
          style={{ transformOrigin: '20px 42px', animationDelay: delay }}
        >
          <rect x="17" y="42" width="6" height="22" rx="3" fill="#2D2520" />
        </g>
        <g
          className="animate-leg-b"
          style={{ transformOrigin: '28px 42px', animationDelay: delay }}
        >
          <rect x="25" y="42" width="6" height="22" rx="3" fill="#2D2520" />
        </g>
      </svg>
    </div>
  );
}
