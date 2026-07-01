import { useState } from "react";

type NavTarget = "logbook" | "logSession" | "rank" | "program";
type Props = { onNavigate: (s: NavTarget) => void; version: "v1" | "v2" };

const FILTERS = ["Local", "Regional", "Global"] as const;

const players = [
  { rank: 1,  initials: "JM", name: "J. Martinez",    dupr: 5.8, wins: 47, losses: 8  },
  { rank: 2,  initials: "AC", name: "A. Chen",         dupr: 5.5, wins: 42, losses: 11 },
  { rank: 3,  initials: "TP", name: "T. Park",         dupr: 5.3, wins: 38, losses: 14 },
  { rank: 4,  initials: "KL", name: "K. Liu",          dupr: 5.1, wins: 35, losses: 16 },
  { rank: 5,  initials: "RB", name: "R. Brown",        dupr: 4.9, wins: 31, losses: 18 },
  { rank: 6,  initials: "MH", name: "M. Harris",       dupr: 4.8, wins: 28, losses: 19 },
  { rank: 7,  initials: "SD", name: "S. Davis",        dupr: 4.7, wins: 26, losses: 21 },
  { rank: 8,  initials: "EN", name: "E. Nguyen",       dupr: 4.6, wins: 24, losses: 22 },
  { rank: 9,  initials: "WK", name: "W. Kim",          dupr: 4.5, wins: 22, losses: 23 },
  { rank: 10, initials: "PG", name: "P. Garcia",       dupr: 4.4, wins: 20, losses: 24 },
  { rank: 11, initials: "JT", name: "J. Taylor",       dupr: 4.3, wins: 18, losses: 25 },
  { rank: 12, initials: "LW", name: "L. Wilson",       dupr: 4.2, wins: 17, losses: 26 },
  { rank: 13, initials: "BM", name: "B. Moore",        dupr: 4.0, wins: 15, losses: 27 },
  { rank: 14, initials: "SK", name: "You",             dupr: 3.8, wins: 13, losses: 22, isMe: true },
  { rank: 15, initials: "DL", name: "D. Lee",          dupr: 3.7, wins: 12, losses: 28 },
  { rank: 16, initials: "AF", name: "A. Foster",       dupr: 3.5, wins: 11, losses: 29 },
];

const podiumColors = ["#C5F22A", "#888", "#FF9A3C"]; // 1st lime, 2nd silver, 3rd bronze (V1)
const podiumColorsV2 = ["#B48ACA", "#9B8FA6", "#CF8FAD"];

export function RankScreen({ version }: Props) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Local");
  const isV1 = version === "v1";

  const bg        = isV1 ? "#0C0C0C"  : "#FAF7F4";
  const cardBg    = isV1 ? "#111"     : "#fff";
  const cardBdr   = isV1 ? "#1E1E1E"  : "transparent";
  const textPri   = isV1 ? "#fff"     : "#2C2233";
  const textMut   = isV1 ? "#888"     : "#9B8FA6";
  const accent    = isV1 ? "#C5F22A"  : "#B48ACA";
  const meBg      = isV1 ? "#C5F22A18" : "#EDE6F6";
  const meBdr     = isV1 ? "#C5F22A40" : "#B48ACA40";
  const meText    = isV1 ? "#C5F22A"   : "#B48ACA";
  const divider   = isV1 ? "#1A1A1A"   : "#F0ECF6";
  const filterAct = isV1 ? "#C5F22A"   : "#B48ACA";
  const filterActText = isV1 ? "#0C0C0C" : "#fff";
  const filterInact   = isV1 ? "#1E1E1E" : "#fff";
  const filterInactText = isV1 ? "#888"  : "#BFB3CC";
  const filterInactBdr  = isV1 ? "#2A2A2A" : "#EDE6F6";
  const podColors = isV1 ? podiumColors : podiumColorsV2;
  const headFont  = isV1 ? "'Barlow Condensed', sans-serif" : "'Playfair Display', serif";
  const bodyFont  = isV1 ? "'DM Sans', sans-serif" : "'Nunito', sans-serif";
  const cardShadow = isV1 ? "none" : "0 2px 8px rgba(168,124,184,0.07)";

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: bg, fontFamily: bodyFont }}>
      <div className="flex-1 overflow-y-auto min-h-0 pb-4" style={{ scrollbarWidth: "none" }}>

        {/* Header */}
        <div className="px-5 pt-10 pb-4">
          {isV1 ? (
            <>
              <p className="text-[10px] tracking-[0.18em] uppercase mb-1" style={{ color: textMut }}>June 2026</p>
              <h1 className="text-5xl font-extrabold uppercase leading-none" style={{ fontFamily: headFont, color: textPri }}>
                Rankings
              </h1>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold mb-0.5" style={{ color: "#C4A8D0" }}>June 2026</p>
              <h1 className="text-[2rem] font-semibold leading-tight" style={{ fontFamily: headFont, fontStyle: "italic", color: textPri }}>
                Your Rankings
              </h1>
            </>
          )}
        </div>

        <div className="px-5 space-y-3">
          {/* Your position card */}
          <div
            className="rounded-2xl p-4 border"
            style={{
              backgroundColor: meBg,
              borderColor: meBdr,
              boxShadow: isV1 ? `0 0 20px ${accent}15` : cardShadow,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: meText }}>
                  {isV1 ? "YOUR POSITION" : "Your position"}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-extrabold leading-none" style={{ fontFamily: headFont, color: meText }}>#14</span>
                  <span className="text-sm" style={{ color: textMut }}>of 63 local</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: textMut }}>DUPR</p>
                <p className="text-3xl font-bold" style={{ fontFamily: headFont, color: textPri }}>3.8</p>
                <p className="text-xs" style={{ color: textMut }}>13W · 22L</p>
              </div>
            </div>
            <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: isV1 ? "#1E1E1E" : "#EDE6F6" }}>
              <div className="h-full rounded-full" style={{ width: "22%", backgroundColor: accent }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px]" style={{ color: textMut }}>Top 22%</span>
              <span className="text-[10px]" style={{ color: textMut }}>+2 this month</span>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all border"
                style={
                  filter === f
                    ? { backgroundColor: filterAct, color: filterActText, borderColor: filterAct }
                    : { backgroundColor: filterInact, color: filterInactText, borderColor: filterInactBdr }
                }
              >
                {f}
              </button>
            ))}
          </div>

          {/* Podium — top 3 */}
          <div
            className="rounded-2xl p-4 border"
            style={{ backgroundColor: cardBg, borderColor: cardBdr, boxShadow: cardShadow }}
          >
            <p className="text-[10px] tracking-widest uppercase mb-3" style={{ color: textMut }}>
              {isV1 ? "TOP 3" : "Top 3"}
            </p>
            <div className="flex items-end justify-around gap-2">
              {/* 2nd */}
              <div className="flex flex-col items-center gap-1.5 pb-0">
                <div
                  className="size-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: isV1 ? "#1E1E1E" : "#F0ECF6", color: podColors[1] }}
                >
                  AC
                </div>
                <p className="text-xs font-semibold" style={{ color: textPri }}>A. Chen</p>
                <p className="text-[10px]" style={{ color: textMut }}>5.5</p>
                <div
                  className="w-full h-12 rounded-t-lg flex items-end justify-center pb-1"
                  style={{ backgroundColor: isV1 ? "#1E1E1E" : "#F0ECF6", minWidth: 64 }}
                >
                  <span className="text-xl font-bold" style={{ fontFamily: headFont, color: podColors[1] }}>2</span>
                </div>
              </div>
              {/* 1st */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className="size-12 rounded-full flex items-center justify-center text-base font-bold ring-2"
                  style={{ backgroundColor: isV1 ? "#1E1E1E" : "#F0ECF6", color: podColors[0], ringColor: podColors[0] }}
                >
                  JM
                </div>
                <p className="text-xs font-semibold" style={{ color: textPri }}>J. Martinez</p>
                <p className="text-[10px]" style={{ color: textMut }}>5.8</p>
                <div
                  className="w-full h-20 rounded-t-lg flex items-end justify-center pb-1"
                  style={{ backgroundColor: isV1 ? "#C5F22A18" : "#EDE6F6", minWidth: 64, border: `1px solid ${podColors[0]}30` }}
                >
                  <span className="text-2xl font-bold" style={{ fontFamily: headFont, color: podColors[0] }}>1</span>
                </div>
              </div>
              {/* 3rd */}
              <div className="flex flex-col items-center gap-1.5 pb-0">
                <div
                  className="size-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: isV1 ? "#1E1E1E" : "#F0ECF6", color: podColors[2] }}
                >
                  TP
                </div>
                <p className="text-xs font-semibold" style={{ color: textPri }}>T. Park</p>
                <p className="text-[10px]" style={{ color: textMut }}>5.3</p>
                <div
                  className="w-full h-8 rounded-t-lg flex items-end justify-center pb-1"
                  style={{ backgroundColor: isV1 ? "#1E1E1E" : "#F0ECF6", minWidth: 64 }}
                >
                  <span className="text-lg font-bold" style={{ fontFamily: headFont, color: podColors[2] }}>3</span>
                </div>
              </div>
            </div>
          </div>

          {/* Full rankings list */}
          <div>
            <p className="text-[10px] tracking-widest uppercase mb-2" style={{ color: textMut }}>
              {isV1 ? "FULL RANKINGS" : "Full Rankings"}
            </p>
            <div className="rounded-2xl overflow-hidden border" style={{ backgroundColor: cardBg, borderColor: cardBdr, boxShadow: cardShadow }}>
              {players.map((p, i) => (
                <div key={p.rank}>
                  {i > 0 && <div className="h-px mx-4" style={{ backgroundColor: divider }} />}
                  <div
                    className="flex items-center gap-3 px-4 py-3"
                    style={p.isMe ? { backgroundColor: meBg } : {}}
                  >
                    {/* Rank number */}
                    <span
                      className="w-6 text-center text-sm font-bold tabular-nums flex-shrink-0"
                      style={{ color: p.isMe ? meText : p.rank <= 3 ? podColors[p.rank - 1] : textMut }}
                    >
                      {p.rank}
                    </span>

                    {/* Avatar */}
                    <div
                      className="size-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        backgroundColor: p.isMe ? (isV1 ? "#C5F22A30" : "#EDE6F6") : isV1 ? "#1E1E1E" : "#F5F2FA",
                        color: p.isMe ? meText : textMut,
                      }}
                    >
                      {p.initials}
                    </div>

                    {/* Name */}
                    <span
                      className="flex-1 text-sm font-semibold"
                      style={{ color: p.isMe ? meText : textPri }}
                    >
                      {p.name}{p.isMe ? " (You)" : ""}
                    </span>

                    {/* DUPR */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold tabular-nums" style={{ color: p.isMe ? meText : textPri }}>
                        {p.dupr}
                      </p>
                      <p className="text-[10px]" style={{ color: textMut }}>
                        {p.wins}W
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
