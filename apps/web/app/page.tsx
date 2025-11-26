import Image from "next/image";

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
        <div className="relative w-[250px] h-[250px]">
          {/* Ballot box */}
          <div className="absolute left-1/2 top-1/2 w-[120px] h-[80px] bg-white border-[3px] border-gray-200 rounded-b-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.10)] -translate-x-1/2 -translate-y-[20%] z-20">
            {/* Slot */}
            <div className="absolute w-12 h-2 bg-gray-300 rounded-full left-1/2 -top-2.5 -translate-x-1/2" />
          </div>
          {/* Ballot paper animation */}
          <div className="absolute left-1/2 w-16 h-[90px] bg-gray-50 border-2 border-slate-300 rounded-lg shadow-[0_2px_12px_0_rgba(0,0,0,0.08)] -translate-x-1/2 z-30 animate-vote-drop">
            {/* Checkmark */}
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
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
          <div className="absolute left-1/2 w-[100px] h-5 bg-black/8 rounded-full bottom-8 -translate-x-1/2 blur-[2px] z-10" />
        </div>
      </div>
      <div className="w-full flex justify-center py-4">
        <div className="relative overflow-hidden w-[640px] h-[100px]">
          <div className="flex gap-4 absolute left-0 top-0 w-[1280px] h-[100px] animate-scroll-small">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`rounded-md w-[100px] h-[100px] inline-block ${
                  [
                    "bg-red-400",
                    "bg-amber-400",
                    "bg-emerald-400",
                    "bg-blue-400",
                    "bg-violet-400",
                    "bg-pink-400",
                  ][i % 6]
                }`}
              />
            ))}
            {/* Duplicate for seamless looping */}
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`dup-${i}`}
                className={`rounded-md w-[100px] h-[100px] inline-block ${
                  [
                    "bg-red-400",
                    "bg-amber-400",
                    "bg-emerald-400",
                    "bg-blue-400",
                    "bg-violet-400",
                    "bg-pink-400",
                  ][i % 6]
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="w-full flex justify-center py-12">
        <div className="relative w-[600px] h-[340px]">
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
              className="absolute shadow-lg rounded-xl px-4 py-3 flex items-center justify-center text-center font-semibold text-sm border border-gray-200 backdrop-blur-md animate-float min-w-[120px] min-h-[60px] rounded-[1.25rem] shadow-[0_4px_24px_0_rgba(0,0,0,0.08)] bg-transparent"
              style={
                {
                  top,
                  left,
                  "--rotate": `${rotate}deg`,
                  animationDelay: `${idx * 0.2}s`,
                } as React.CSSProperties
              }
            >
              {label}
            </div>
          ))}
        </div>
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
