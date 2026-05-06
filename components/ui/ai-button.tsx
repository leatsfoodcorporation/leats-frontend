import { useEffect, useMemo, useState } from "react";
import { Sparkle } from "lucide-react";
import { loadFull } from "tsparticles";

import type { ISourceOptions } from "@tsparticles/engine";
import Particles, { initParticlesEngine } from "@tsparticles/react";

const options: ISourceOptions = {
  key: "star",
  name: "Star",
  particles: {
    number: {
      value: 20,
      density: {
        enable: false,
      },
    },
    color: {
      value: [
        "#7c3aed",
        "#bae6fd",
        "#a78bfa",
        "#93c5fd",
        "#0284c7",
        "#fafafa",
        "#38bdf8",
      ],
    },
    shape: {
      type: "star",
      options: {
        star: {
          sides: 4,
        },
      },
    },
    opacity: {
      value: 0.8,
    },
    size: {
      value: { min: 1, max: 4 },
    },
    rotate: {
      value: {
        min: 0,
        max: 360,
      },
      enable: true,
      direction: "clockwise",
      animation: {
        enable: true,
        speed: 10,
        sync: false,
      },
    },
    links: {
      enable: false,
    },
    reduceDuplicates: true,
    move: {
      enable: true,
      center: {
        x: 120,
        y: 45,
      },
    },
  },
  interactivity: {
    events: {},
  },
  smooth: true,
  fpsLimit: 120,
  background: {
    color: "transparent",
    size: "cover",
  },
  fullScreen: {
    enable: false,
  },
  detectRetina: true,
  absorbers: [
    {
      enable: true,
      opacity: 0,
      size: {
        value: 1,
        density: 1,
        limit: {
          radius: 5,
          mass: 5,
        },
      },
      position: {
        x: 110,
        y: 45,
      },
    },
  ],
  emitters: [
    {
      autoPlay: true,
      fill: true,
      life: {
        wait: true,
      },
      rate: {
        quantity: 5,
        delay: 0.5,
      },
      position: {
        x: 110,
        y: 45,
      },
    },
  ],
};

interface AiButtonProps {
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  text?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

export default function AiButton({
  onClick,
  text = "Generate",
  size = "md",
  disabled = false,
}: AiButtonProps) {
  const [particleState, setParticlesReady] = useState<"loaded" | "ready">();
  const [isHovering, setIsHovering] = useState(false);
  const [uniqueId] = useState(
    () => `particles-${Math.random().toString(36).substr(2, 9)}`
  );

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadFull(engine);
    }).then(() => {
      setParticlesReady("loaded");
    });
  }, []);

  const modifiedOptions = useMemo(() => {
    options.autoPlay = isHovering;
    return options;
  }, [isHovering]);

  const sizeClasses = {
    sm: {
      button: "my-2 p-0.5",
      content: "px-3 py-1.5 text-sm",
      sparkle: "size-4",
      smallSparkles: "size-1.5",
    },
    md: {
      button: "my-8 p-1",
      content: "px-4 py-2 text-base",
      sparkle: "size-6",
      smallSparkles: "size-2",
    },
    lg: {
      button: "my-10 p-1.5",
      content: "px-6 py-3 text-lg",
      sparkle: "size-8",
      smallSparkles: "size-3",
    },
  };

  const currentSize = sizeClasses[size];

  return (
    <div className="relative">
      <style jsx>{`
        @keyframes sparkle {
          0%,
          100% {
            opacity: 0;
            transform: scale(0) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1) rotate(180deg);
          }
        }
        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }
      `}</style>

      <button
        className={`group relative ${
          currentSize.button
        } cursor-pointer rounded-full bg-gradient-to-r from-blue-300/30 via-blue-500/30 via-40% to-purple-500/30 text-white transition-transform hover:scale-110 active:scale-105 ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onMouseEnter={() => !disabled && setIsHovering(true)}
        onMouseLeave={() => !disabled && setIsHovering(false)}
        onClick={(e) => !disabled && onClick?.(e)}
        disabled={disabled}
      >
        <div
          className={`relative flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-300 via-blue-500 via-40% to-purple-500 ${currentSize.content} text-white overflow-hidden`}
        >
          <Sparkle
            className={`${currentSize.sparkle} -translate-y-0.5 animate-sparkle fill-white`}
          />

          {/* Small decorative sparkles */}
          <Sparkle
            style={{
              animationDelay: "1s",
            }}
            className={`absolute ${
              size === "sm" ? "bottom-1 left-2" : "bottom-2.5 left-3.5"
            } z-20 ${
              size === "sm" ? "size-1.5" : "size-2"
            } rotate-12 animate-sparkle fill-white`}
          />
          <Sparkle
            style={{
              animationDelay: "1.5s",
              animationDuration: "2.5s",
            }}
            className={`absolute ${
              size === "sm" ? "left-3 top-1" : "left-5 top-2.5"
            } size-1 -rotate-12 animate-sparkle fill-white`}
          />
          <Sparkle
            style={{
              animationDelay: "0.5s",
              animationDuration: "2.5s",
            }}
            className={`absolute ${
              size === "sm" ? "left-2 top-1.5" : "left-3 top-3"
            } ${
              size === "sm" ? "size-1" : "size-1.5"
            } animate-sparkle fill-white`}
          />

          <span className="font-semibold relative z-10">{text}</span>
        </div>
        {!!particleState && (
          <Particles
            id={uniqueId}
            className={`pointer-events-none absolute -bottom-4 -left-4 -right-4 -top-4 z-0 opacity-0 transition-opacity ${
              particleState === "ready" ? "group-hover:opacity-100" : ""
            }`}
            particlesLoaded={async () => {
              setParticlesReady("ready");
            }}
            options={modifiedOptions}
          />
        )}
      </button>
    </div>
  );
}
