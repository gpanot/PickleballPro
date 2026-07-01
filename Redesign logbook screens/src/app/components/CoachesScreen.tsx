import { useState } from "react";
import { ArrowLeft, Search, Star, MapPin, CheckSquare } from "lucide-react";

type NavTarget = "logbook" | "logSession" | "rank" | "program";
type Props = { onNavigate: (s: NavTarget) => void; version: "v1" | "v2"; backTo?: NavTarget };

const FILTERS = ["Verified", "Beginners", "Technique", "Strategy", "Mental Game"] as const;
const SORTS = ["Rating", "Price", "Location"] as const;

const coaches = [
  {
    initials: "DP",
    avatarBg: "#E8C9A8",
    avatarText: "#8B5E3C",
    name: "David Park",
    verified: true,
    dupr: 5.5,
    stars: 5.0,
    reviews: 18,
    price: 100,
    bio: "Professional player and certified instructor. Specializes in competitive development.",
    tags: ["Professional Training", "All Levels", "Technique"],
    location: "Seattle, WA",
  },
  {
    initials: "SW",
    avatarBg: "#F0D8B0",
    avatarText: "#8B6A30",
    name: "Sarah Williams",
    verified: true,
    dupr: 4.8,
    stars: 4.9,
    reviews: 32,
    price: 75,
    bio: "Former tennis pro turned pickleball coach. Known for technical precision and mental game coaching.",
    tags: ["Technique", "Mental Game", "Beginners"],
    location: "San Francisco, CA",
  },
  {
    initials: "AT",
    avatarBg: "#B0C8E8",
    avatarText: "#2C4A6E",
    name: "Alex Thompson",
    verified: true,
    dupr: 4.6,
    stars: 4.7,
    reviews: 24,
    price: 85,
    bio: "8 years competitive experience. Focuses on 3rd shot strategy and dink consistency.",
    tags: ["3rd Shot", "Strategy", "All Levels"],
    location: "Portland, OR",
  },
  {
    initials: "MR",
    avatarBg: "#B8E8C8",
    avatarText: "#2A6040",
    name: "Maria Rodriguez",
    verified: true,
    dupr: 4.4,
    stars: 4.8,
    reviews: 41,
    price: 65,
    bio: "Patient, encouraging coach with a focus on beginner foundations and footwork.",
    tags: ["Beginners", "Footwork", "Positioning"],
    location: "Austin, TX",
  },
  {
    initials: "JK",
    avatarBg: "#D8B8E8",
    avatarText: "#5A2A7A",
    name: "James Kim",
    verified: true,
    dupr: 4.2,
    stars: 4.6,
    reviews: 19,
    price: 60,
    bio: "Competitive doubles specialist. Helps intermediate players level up their game.",
    tags: ["Doubles", "Volleys", "Strategy"],
    location: "Denver, CO",
  },
];

export function CoachesScreen({ onNavigate, version, backTo = "program" }: Props) {
  const [activeFilters, setActiveFilters] = useState<string[]>(["Verified"]);
  const [sort, setSort] = useState<(typeof SORTS)[number]>("Rating");
  const isV1 = version === "v1";

  const bg           = isV1 ? "#0C0C0C" : "#FAF7F4";
  const cardBg       = isV1 ? "#111"    : "#fff";
  const cardBdr      = isV1 ? "#1E1E1E" : "transparent";
  const textPri      = isV1 ? "#FFF"    : "#2C2233";
  const textMut      = isV1 ? "#888"    : "#9B8FA6";
  const textSub      = isV1 ? "#CCC"    : "#5A5060";
  const accent       = isV1 ? "#C5F22A" : "#B48ACA";
  const filterActBg  = isV1 ? "#C5F22A" : "#B48ACA";
  const filterActTx  = isV1 ? "#0C0C0C" : "#fff";
  const filterInBg   = isV1 ? "#1A1A1A" : "#fff";
  const filterInBdr  = isV1 ? "#2A2A2A" : "#EDE6F6";
  const filterInTx   = isV1 ? "#888"    : "#BFB3CC";
  const sortActBg    = isV1 ? "#C5F22A" : "#2C2233";
  const sortActTx    = isV1 ? "#0C0C0C" : "#fff";
  const sortInTx     = isV1 ? "#666"    : "#BFB3CC";
  const headerBdr    = isV1 ? "#1A1A1A" : "#EDE6F6";
  const cardShadow   = isV1 ? "none"    : "0 2px 12px rgba(168,124,184,0.08)";
  const ctaBg        = isV1 ? "#C5F22A" : "linear-gradient(135deg, #B48ACA, #CF8FAD)";
  const ctaTx        = isV1 ? "#0C0C0C" : "#fff";
  const headFont     = isV1 ? "'Barlow Condensed', sans-serif" : "'Playfair Display', serif";
  const bodyFont     = isV1 ? "'DM Sans', sans-serif" : "'Nunito', sans-serif";
  const starColor    = "#F5C842";
  const priceColor   = isV1 ? "#C5F22A" : "#27A060";
  const tagBg        = isV1 ? "#1E1E1E" : "#F5F2FA";
  const tagTx        = isV1 ? "#AAA"    : "#7A6A8A";

  const toggleFilter = (f: string) =>
    setActiveFilters((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: bg, fontFamily: bodyFont }}>
      {/* Sticky header */}
      <div
        className="flex-shrink-0 border-b px-5 pt-10 pb-3"
        style={{ backgroundColor: bg, borderColor: headerBdr }}
      >
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => onNavigate(backTo)}
            className="size-9 flex items-center justify-center rounded-full border"
            style={{ borderColor: isV1 ? "#2A2A2A" : "#EDE6F6", backgroundColor: isV1 ? "transparent" : "#fff" }}
          >
            <ArrowLeft className="size-4" style={{ color: textMut }} />
          </button>
          <h2
            className="font-bold"
            style={
              isV1
                ? { fontFamily: headFont, fontSize: "1.4rem", letterSpacing: "0.05em", color: textPri }
                : { fontFamily: headFont, fontSize: "1.25rem", fontStyle: "italic", color: textPri }
            }
          >
            {isV1 ? "COACHES" : "Certified Coaches"}
          </h2>
          <button
            className="size-9 flex items-center justify-center rounded-full border"
            style={{ borderColor: isV1 ? "#2A2A2A" : "#EDE6F6", backgroundColor: isV1 ? "transparent" : "#fff" }}
          >
            <Search className="size-4" style={{ color: textMut }} />
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {FILTERS.map((f) => {
            const active = activeFilters.includes(f);
            return (
              <button
                key={f}
                onClick={() => toggleFilter(f)}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                style={
                  active
                    ? { backgroundColor: filterActBg, color: filterActTx, borderColor: filterActBg }
                    : { backgroundColor: filterInBg, color: filterInTx, borderColor: filterInBdr }
                }
              >
                {active && f === "Verified" && <CheckSquare className="size-3" />}
                {f}
              </button>
            );
          })}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 mt-2.5">
          <span className="text-[10px] uppercase tracking-widest" style={{ color: textMut }}>Sort</span>
          <div className="flex gap-1.5">
            {SORTS.map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                style={
                  sort === s
                    ? { backgroundColor: sortActBg, color: sortActTx }
                    : { color: sortInTx }
                }
              >
                {s}
              </button>
            ))}
          </div>
          <span className="ml-auto text-[10px]" style={{ color: textMut }}>13 coaches</span>
        </div>
      </div>

      {/* Coaches list */}
      <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 space-y-3" style={{ scrollbarWidth: "none" }}>
        {coaches.map((c) => (
          <div
            key={c.name}
            className="rounded-2xl border p-4"
            style={{ backgroundColor: cardBg, borderColor: cardBdr, boxShadow: cardShadow }}
          >
            {/* Top row: avatar + name + price */}
            <div className="flex items-start gap-3 mb-3">
              <div
                className="size-12 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: c.avatarBg, color: c.avatarText }}
              >
                {c.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-bold text-[15px]" style={{ color: textPri }}>{c.name}</span>
                  {c.verified && <CheckSquare className="size-3.5 flex-shrink-0" style={{ color: accent }} />}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold" style={{ color: textMut }}>
                    DUPR {c.dupr}
                  </span>
                  <span style={{ color: isV1 ? "#333" : "#DDD" }}>·</span>
                  <div className="flex items-center gap-0.5">
                    <Star className="size-3" style={{ color: starColor, fill: starColor }} />
                    <span className="text-xs font-semibold" style={{ color: textMut }}>
                      {c.stars} ({c.reviews})
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-bold" style={{ color: priceColor, fontFamily: headFont }}>${c.price}</p>
                <p className="text-[10px]" style={{ color: textMut }}>per hour</p>
              </div>
            </div>

            {/* Bio */}
            <p className="text-sm leading-relaxed mb-3" style={{ color: textSub }}>{c.bio}</p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {c.tags.map((t) => (
                <span key={t} className="text-[10px] font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: tagBg, color: tagTx }}>
                  {t}
                </span>
              ))}
            </div>

            {/* Location */}
            <div className="flex items-center gap-1 mb-3">
              <MapPin className="size-3 flex-shrink-0" style={{ color: "#EF5350" }} />
              <span className="text-xs" style={{ color: textMut }}>{c.location}</span>
            </div>

            {/* CTA */}
            <button
              className="w-full py-3 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
              style={
                isV1
                  ? { backgroundColor: ctaBg as string, color: ctaTx }
                  : { background: ctaBg, color: ctaTx }
              }
            >
              Contact Coach
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
