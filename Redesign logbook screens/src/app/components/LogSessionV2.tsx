import { useState } from "react";
import { ArrowLeft, Minus, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

type Props = { onNavigate: (screen: "logbook" | "logSession") => void };

const SESSION_TYPES = ["Training", "Social", "Class"] as const;
const FORMATS = ["Singles", "Doubles"] as const;

const MOOD_LEVELS = [
  { value: "struggling", label: "Rough",    bg: "#F4A5A5", text: "#8B2E2E" },
  { value: "difficult",  label: "Hard",     bg: "#F4C6A5", text: "#8B5A2E" },
  { value: "neutral",    label: "OK",       bg: "#D0CEEA", text: "#4A4880" },
  { value: "good",       label: "Good",     bg: "#A5D4B8", text: "#27694A" },
  { value: "excellent",  label: "Great",    bg: "#C4A5D4", text: "#5E3080" },
];

const MOOD_COPY: Record<string, string> = {
  struggling: "Every session is progress — you showed up",
  difficult:  "Pushing through the hard days builds real strength",
  neutral:    "Consistency is your superpower right now",
  good:       "Nice work out there today",
  excellent:  "You absolutely owned that session!",
};

const QUICK_SKILLS = ["Dinks", "Drives", "Returns", "Drop Shots", "Volleys", "3rd Shot"];

const SKILL_GROUPS = [
  { label: "Control",  skills: ["Dinks", "Drop Shots", "Volleys", "3rd Shot", "Slices", "Lobs"] },
  { label: "Attack",   skills: ["Drives", "Serves", "Smashes", "Putaways", "Erne"] },
  { label: "Movement", skills: ["Returns", "Footwork", "Positioning", "Transitions"] },
];

function Chip({
  label, active, onToggle, activeColor, activeBg,
}: {
  label: string; active: boolean; onToggle: () => void;
  activeColor: string; activeBg: string;
}) {
  return (
    <button
      onClick={onToggle}
      className="px-3 py-2 rounded-full text-xs font-semibold transition-all duration-100 border leading-none"
      style={
        active
          ? { backgroundColor: activeBg, color: activeColor, borderColor: activeBg }
          : { backgroundColor: "#fff", color: "#BFB3CC", borderColor: "#EDE6F6" }
      }
    >
      {label}
    </button>
  );
}

function ChipSection({
  title, selected, onToggle, activeColor, activeBg,
}: {
  title: string; selected: string[]; onToggle: (v: string) => void;
  activeColor: string; activeBg: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <p className="text-[#BFB3CC] text-[10px] font-semibold tracking-wider uppercase mb-1">{title}</p>
      <p className="text-[#D0C6DA] text-xs mb-3">Tap to select</p>

      {/* Quick picks */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {QUICK_SKILLS.map((s) => (
          <Chip
            key={s} label={s} active={selected.includes(s)}
            onToggle={() => onToggle(s)} activeColor={activeColor} activeBg={activeBg}
          />
        ))}
      </div>

      {expanded ? (
        <div className="mt-2 space-y-3">
          {SKILL_GROUPS.map((g) => (
            <div key={g.label}>
              <p className="text-[10px] text-[#C4B8D0] uppercase tracking-widest mb-1.5">{g.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {g.skills.map((s) => (
                  <Chip
                    key={s} label={s} active={selected.includes(s)}
                    onToggle={() => onToggle(s)} activeColor={activeColor} activeBg={activeBg}
                  />
                ))}
              </div>
            </div>
          ))}
          <button
            onClick={() => setExpanded(false)}
            className="flex items-center gap-1 text-xs mt-1"
            style={{ color: activeBg }}
          >
            <ChevronUp className="size-3" /> Show less
          </button>
        </div>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-1 text-xs mt-1"
          style={{ color: activeBg }}
        >
          <ChevronDown className="size-3" /> + 9 more skills
        </button>
      )}
    </div>
  );
}

export function LogSessionV2({ onNavigate }: Props) {
  const [hours, setHours] = useState(1.5);
  const [sessionType, setSessionType] = useState("Social");
  const [format, setFormat] = useState("Doubles");
  const [mood, setMood] = useState("good");
  const [goodSkills, setGoodSkills] = useState<string[]>(["Dinks"]);
  const [hardSkills, setHardSkills] = useState<string[]>(["Drop Shots"]);
  const [notes, setNotes] = useState("");

  const toggle = (list: string[], setList: (v: string[]) => void, val: string) =>
    setList(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);

  const activeMood = MOOD_LEVELS.find((m) => m.value === mood);

  const handleSave = () => {
    toast.success("Session saved", {
      description: `${hours}h ${sessionType} logged`,
      style: {
        background: "#fff",
        border: "1px solid #EDE6F6",
        color: "#2C2233",
      },
    });
    setTimeout(() => onNavigate("logbook"), 800);
  };

  return (
    <div className="h-full flex flex-col bg-[#FAF7F4]" style={{ fontFamily: "'Nunito', sans-serif" }}>
      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-8 pb-4 flex items-center gap-3 bg-[#FAF7F4]">
        <button
          onClick={() => onNavigate("logbook")}
          className="size-10 flex items-center justify-center rounded-full bg-white hover:bg-[#F0ECF5] transition-colors"
          style={{ boxShadow: "0 2px 8px rgba(168,124,184,0.12)" }}
        >
          <ArrowLeft className="size-4 text-[#9B8FA6]" />
        </button>
        <div>
          <h2 className="text-[#2C2233] font-bold text-lg leading-tight">Log Session</h2>
          <p className="text-[#BFB3CC] text-xs">Tue, Jun 30, 2026</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto min-h-0 px-5 space-y-4 pb-4" style={{ scrollbarWidth: "none" }}>
        {/* Duration */}
        <div className="bg-white rounded-3xl p-4" style={{ boxShadow: "0 2px 12px rgba(168,124,184,0.08)" }}>
          <p className="text-[#BFB3CC] text-[10px] font-semibold tracking-wider uppercase mb-3">How long did you play?</p>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setHours(Math.max(0.5, hours - 0.5))}
              className="size-10 flex items-center justify-center rounded-full border-2 border-[#EDE6F6] hover:border-[#C4A5D4] transition-all"
            >
              <Minus className="size-3.5 text-[#A87CB8]" />
            </button>
            <div className="text-center">
              <div className="flex items-baseline gap-1 justify-center">
                <span className="text-5xl font-bold text-[#2C2233] leading-none" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  {hours}
                </span>
                <span className="text-xl font-semibold text-[#BFB3CC]">h</span>
              </div>
            </div>
            <button
              onClick={() => setHours(hours + 0.5)}
              className="size-10 flex items-center justify-center rounded-full transition-all"
              style={{ backgroundColor: "#EDE6F6" }}
            >
              <Plus className="size-3.5 text-[#A87CB8]" />
            </button>
          </div>
        </div>

        {/* Activity + Format */}
        <div className="bg-white rounded-3xl p-4" style={{ boxShadow: "0 2px 12px rgba(168,124,184,0.08)" }}>
          <p className="text-[#BFB3CC] text-[10px] font-semibold tracking-wider uppercase mb-2.5">Activity</p>
          <div className="flex gap-2 mb-4">
            {SESSION_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setSessionType(t)}
                className="flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all"
                style={
                  sessionType === t
                    ? { background: "linear-gradient(135deg, #B48ACA, #CF8FAD)", color: "#fff", boxShadow: "0 3px 10px rgba(168,124,184,0.28)" }
                    : { backgroundColor: "#FAF7F4", color: "#BFB3CC" }
                }
              >
                {t}
              </button>
            ))}
          </div>
          <p className="text-[#BFB3CC] text-[10px] font-semibold tracking-wider uppercase mb-2.5">Format</p>
          <div className="flex gap-2 bg-[#FAF7F4] rounded-2xl p-1">
            {FORMATS.map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                style={format === f ? { backgroundColor: "#EDE6F6", color: "#2C2233" } : { color: "#BFB3CC" }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Mood */}
        <div className="bg-white rounded-3xl p-4" style={{ boxShadow: "0 2px 12px rgba(168,124,184,0.08)" }}>
          <p className="text-[#BFB3CC] text-[10px] font-semibold tracking-wider uppercase mb-3">How did it feel?</p>
          <div className="flex gap-1.5 mb-2.5">
            {MOOD_LEVELS.map((m) => (
              <button
                key={m.value}
                onClick={() => setMood(m.value)}
                className="flex-1 py-2.5 rounded-2xl text-xs font-bold text-center transition-all"
                style={{
                  backgroundColor: m.bg,
                  color: m.text,
                  opacity: mood === m.value ? 1 : 0.35,
                  transform: mood === m.value ? "scale(1.05)" : "scale(1)",
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
          {activeMood && (
            <p className="text-center text-xs font-medium" style={{ color: activeMood.text, opacity: 0.8 }}>
              {MOOD_COPY[mood]}
            </p>
          )}
        </div>

        {/* What felt strong */}
        <div className="bg-white rounded-3xl p-4" style={{ boxShadow: "0 2px 12px rgba(168,124,184,0.08)" }}>
          <ChipSection
            title="What felt strong today?"
            selected={goodSkills}
            onToggle={(v) => toggle(goodSkills, setGoodSkills, v)}
            activeColor="#fff"
            activeBg="#B48ACA"
          />
        </div>

        {/* What challenged you */}
        <div className="bg-white rounded-3xl p-4" style={{ boxShadow: "0 2px 12px rgba(168,124,184,0.08)" }}>
          <ChipSection
            title="What challenged you?"
            selected={hardSkills}
            onToggle={(v) => toggle(hardSkills, setHardSkills, v)}
            activeColor="#fff"
            activeBg="#CF8FAD"
          />
        </div>

        {/* Notes */}
        <div className="bg-white rounded-3xl p-4" style={{ boxShadow: "0 2px 12px rgba(168,124,184,0.08)" }}>
          <p className="text-[#BFB3CC] text-[10px] font-semibold tracking-wider uppercase mb-2.5">Notes (optional)</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything to remember or work on next time?"
            rows={3}
            className="w-full bg-[#FAF7F4] rounded-2xl px-4 py-3 text-sm text-[#2C2233] placeholder-[#D0C6DA] focus:outline-none resize-none"
          />
        </div>

        <div className="h-2" />
      </div>

      {/* Save */}
      <div className="flex-shrink-0 p-4 bg-[#FAF7F4] border-t border-[#EDE6F6]">
        <button
          onClick={handleSave}
          className="w-full py-3.5 rounded-2xl font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #B48ACA 0%, #CF8FAD 100%)", boxShadow: "0 6px 16px rgba(168,124,184,0.3)" }}
        >
          Save Session
        </button>
      </div>
    </div>
  );
}
