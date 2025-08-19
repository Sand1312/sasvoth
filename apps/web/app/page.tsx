import Image, { type ImageProps } from "next/image";
import { Button } from "@sasvoth/ui/button";

export default function Home() {
  return (
    <>
      <div className="flex flex-col items-center justify-center">
        <Image
          src="/lg-logo.svg"
          alt="Logo"
          width={300}
          height={100}
          className="object-contain"
        />
      </div>
      <div className="w-full flex justify-center">
        <div className="relative" style={{ width: 250, height: 250 }}>
          {/* Ballot box */}
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              width: 120,
              height: 80,
              background: "#fff",
              border: "3px solid #e5e7eb",
              borderRadius: "0 0 16px 16px",
              boxShadow: "0 8px 32px 0 rgba(0,0,0,0.10)",
              transform: "translate(-50%, -20%)",
              zIndex: 2,
            }}
          >
            {/* Slot */}
            <div
              style={{
                width: 48,
                height: 8,
                background: "#d1d5db",
                borderRadius: 4,
                position: "absolute",
                left: "50%",
                top: -10,
                transform: "translateX(-50%)",
              }}
            />
          </div>
          {/* Ballot paper animation */}
          <div
            className="absolute left-1/2"
            style={{
              width: 64,
              height: 90,
              background: "#f9fafb",
              border: "2px solid #cbd5e1",
              borderRadius: 8,
              boxShadow: "0 2px 12px 0 rgba(0,0,0,0.08)",
              transform: "translate(-50%, 0)",
              zIndex: 3,
              animation: "vote-drop 2.2s cubic-bezier(.6,1.5,.6,1) infinite",
            }}
          >
            {/* Checkmark */}
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              <polyline
                points="8,18 14,24 24,10"
                fill="none"
                stroke="#22c55e"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          {/* Ballot box shadow */}
          <div
            className="absolute left-1/2"
            style={{
              width: 100,
              height: 20,
              background: "rgba(0,0,0,0.08)",
              borderRadius: "50%",
              bottom: 32,
              transform: "translateX(-50%)",
              filter: "blur(2px)",
              zIndex: 1,
            }}
          />
          <style>{`
            @keyframes vote-drop {
              0% {
                top: 0px;
                opacity: 0;
              }
              10% {
                opacity: 1;
              }
              60% {
                top: 60px;
                opacity: 1;
              }
              80% {
                top: 80px;
                opacity: 1;
              }
              100% {
                top: 80px;
                opacity: 0;
              }
            }
          `}</style>
        </div>
      </div>
      <div className="w-full flex justify-center py-4">
        <div
          className="relative overflow-hidden"
          style={{ width: 640, height: 100 }}
        >
          <div
            className="flex animate-scroll-small gap-4 absolute left-0 top-0"
            style={{
              width: 1280, // 2x 6*100px + 2x 5*gap(16px)
              height: 100,
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-md"
                style={{
                  width: 100,
                  height: 100,
                  display: "inline-block",
                  backgroundColor: [
                    "#f87171",
                    "#fbbf24",
                    "#34d399",
                    "#60a5fa",
                    "#a78bfa",
                    "#f472b6",
                  ][i % 6],
                }}
              />
            ))}
            {/* Duplicate for seamless looping */}
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`dup-${i}`}
                className="rounded-md"
                style={{
                  width: 100,
                  height: 100,
                  display: "inline-block",
                  backgroundColor: [
                    "#f87171",
                    "#fbbf24",
                    "#34d399",
                    "#60a5fa",
                    "#a78bfa",
                    "#f472b6",
                  ][i % 6],
                }}
              />
            ))}
          </div>
        </div>
        <style>{`
          .animate-scroll-small {
        animation: scroll-small 10s linear infinite;
          }
          @keyframes scroll-small {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
          }
        `}</style>
      </div>
      <div className="w-full flex justify-center py-12">
        <div className="relative" style={{ width: 600, height: 340 }}>
          {[
            { label: "Accessibility", top: 10, left: 220, rotate: -6 },
            { label: "Equity", top: 50, left: 60, rotate: -12 },
            { label: "Security", top: 50, left: 440, rotate: 10 },
            { label: "Transparency", top: 110, left: 140, rotate: 4 },
            {
              label: "Professionalism & Public Service",
              top: 110,
              left: 340,
              rotate: -8,
            },
            { label: "Accountability", top: 180, left: 40, rotate: 8 },
            { label: "Secrecy of Voting", top: 180, left: 460, rotate: -10 },
            { label: "Sustainability", top: 240, left: 120, rotate: 6 },
            { label: "Readiness", top: 240, left: 380, rotate: -6 },
            { label: "Cost-effectiveness", top: 300, left: 230, rotate: 2 },
          ].map(({ label, top, left, rotate }, idx) => (
            <div
              key={label}
              className="absolute shadow-lg rounded-xl px-4 py-3 flex items-center justify-center text-center font-semibold text-sm border border-gray-200 backdrop-blur-md animate-float"
              style={{
                minWidth: 120,
                minHeight: 60,
                borderRadius: "1.25rem",
                boxShadow: "0 4px 24px 0 rgba(0,0,0,0.08)",
                background: "transparent",
                top,
                left,
                transform: `rotate(${rotate}deg)`,
                animationDelay: `${idx * 0.2}s`,
              }}
            >
              {label}
            </div>
          ))}
        </div>
        <style>{`
          @keyframes float {
        0% { transform: translateY(0) scale(1) rotate(var(--rotate, 0deg)); }
        50% { transform: translateY(-16px) scale(1.03) rotate(var(--rotate, 0deg)); }
        100% { transform: translateY(0) scale(1) rotate(var(--rotate, 0deg)); }
          }
          .animate-float {
        animation: float 3.2s ease-in-out infinite;
          }
        `}</style>
      </div>
      <div className="w-full flex flex-col items-center gap-8 py-8">
        {[
          {
            title:
              "Secure, Transparent, and Fair Voting — Powered by Next-Gen Technology",
            desc: "Rebuild trust in democracy with a decentralized, tamper-proof voting system.",
          },
          {
            title: "Blockchain-Backed Integrity",
            desc: "Every vote is immutably recorded on the blockchain — eliminating tampering and ensuring full transparency for auditors and voters alike.",
          },
          {
            title: "Smart Contracts for Automation",
            desc: "Smart contracts securely handle vote logic and counting, reducing human error and guaranteeing that results reflect real inputs — no backdoors, no bias.",
          },
          {
            title: "Zero-Knowledge Privacy",
            desc: "Using zero-knowledge proofs (ZKPs), voters can prove they've voted legitimately — without revealing their identity or vote contents.",
          },
          {
            title: "Quadratic Voting for True Representation",
            desc: "Quadratic voting empowers citizens to express how strongly they feel about issues — balancing majority rule with minority voices for more democratic outcomes.",
          },
        ].map((item, idx) => (
          <div
            key={item.title}
            className={`flex w-full max-w-3xl items-center gap-8 ${
              idx % 2 === 0 ? "flex-row" : "flex-row-reverse"
            }`}
          >
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2">{item.title}</h2>
              <p className="text-gray-600">{item.desc}</p>
            </div>
            <div className="flex-1" />
          </div>
        ))}
      </div>
    </>
  );
}
