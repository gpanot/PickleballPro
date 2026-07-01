import { useState } from "react";
import { X, Minus, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

type Props = { onNavigate: (screen: "logbook" | "logSession") => void };

const SESSION_TYPES = ["Training", "Social", "Class"] as const;
const FORMATS = ["Singles", "Doubles"] as const;

const PROGRESS_LEVELS = [
  { value: "struggling", label: "Struggling", n: "1", color: "#FF5A5A" },
  { value: "difficult",  label: "Difficult",  n: "2", color: "#FF9A3C" },
  { value: "neutral",    label: "Neutral",    n: "3", color: "#888" },
  { value: "good",       label: "Good",       n: "4", color: "#7DD87D" },
  { value: "excellent",  label: "Excellent",  n: "5", color: "#C5F22A" },
];

const QUICK_SKILLS = ["Dinks", "Drives", "Returns", "Drop Shots", "Volleys", "3rd Shot"];

const SKILL_GROUPS = [
  { label: "Control",  skills: ["Dinks", "Drop Shots", "Volleys", "3rd Shot", "Slices", "Lobs"] },
  { label: "Attack",   skills: ["Drives", "Serves", "Smashes", "Putaways", "Erne"] },
  { label: "Movement", skills: ["Returns", "Footwork", "Positioning", "Transitions"] },
];

function Chip({
  label, active, onToggle,
}: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="px-3 py-2 rounded-full text-xs font-medium transition-all duration-100 border leading-none"
      style={
        active
          ? { backgroundColor: "#C5F22A", color: "#0C0C0C", borderColor: "#C5F22A" }
          : { backgroundColor: "transparent", color: "#888", borderColor: "#2A2A2A" }
      }
    >
      {label}
    </button>
  );
}

function ChipSection({
  title, selected, onToggle,
}: { title: string; selected: string[]; onToggle: (v: string) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <p className="text-[10px] text-[#888] tracking-[0.18em] uppercase mb-1">{title}</p>
      <p className="text-[#555] text-xs mb-3">Tap to select</p>

      {/* Quick picks */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {QUICK_SKILLS.map((s) => (
          <Chip key={s} label={s} active={selected.includes(s)} onToggle={() => onToggle(s)} />
        ))}
      </div>

      {/* Expandable full list */}
      {expanded ? (
        <div className="mt-2 space-y-3">
          {SKILL_GROUPS.map((g) => (
            <div key={g.label}>
              <p className="text-[10px] text-[#555] uppercase tracking-widest mb-1.5">{g.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {g.skills.map((s) => (
                  <Chip key={s} label={s} active={selected.includes(s)} onToggle={() => onToggle(s)} />
                ))}
              </div>
            </div>
          ))}
          <button
            onClick={() => setExpanded(false)}
            className="flex items-center gap-1 text-xs text-[#555] mt-1"
          >
            <ChevronUp className="size-3" /> Show less
          </button>
        </div>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-1 text-xs text-[#C5F22A] mt-1"
        >
          <ChevronDown className="size-3" /> + 9 more skills
        </button>
      )}
    </div>
  );
}

export function LogSessionV1({ onNavigate }: Props) {
  const [hours, setHours] = useState(1.5);
  const [sessionType, setSessionType] = useState("Social");
  const [format, setFormat] = useState("Doubles");
  const [progress, setProgress] = useState("good");
  const [goodSkills, setGoodSkills] = useState<string[]>(["Dinks"]);
  const [hardSkills, setHardSkills] = useState<string[]>(["Drop Shots"]);
  const [notes, setNotes] = useState("");

  const toggle = (list: string[], setList: (v: string[]) => void, val: string) =>
    setList(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);

  const activeProgress = PROGRESS_LEVELS.find((p) => p.value === progress);

  const handleSave = () => {
    toast.success("Session saved", {
      description: `${hours}h ${sessionType} logged`,
      style: { background: "#161616", border: "1px solid #2A2A2A", color: "#F5F5F5" },
    });
    setTimeout(() => onNavigate("logbook"), 800);
  };

  return (
    <div className="h-full flex flex-col bg-[#0C0C0C] text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="flex-shrink-0 bg-[#0C0C0C] border-b border-[#1A1A1A] px-5 py-4 flex items-center justify-between">
        <button
          onClick={() => onNavigate("logbook")}
          className="size-9 flex items-center justify-center rounded-full border border-[#2A2A2A] hover:border-[#444] transition-colors"
        >
          <X className="size-4 text-[#888]" />
        </button>
        <h2
          className="text-sm font-bold tracking-widest uppercase text-[#888]"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.15em" }}
        >
          Log Session
        </h2>
        <div className="w-9" />
      </div>

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto min-h-0 px-5 py-5 space-y-6" style={{ scrollbarWidth: "none" }}>
        {/* Duration + Date */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-4">
            <p className="text-[10px] text-[#888] tracking-[0.18em] uppercase mb-3">Duration</p>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setHours(Math.max(0.5, hours - 0.5))}
                className="size-8 flex items-center justify-center rounded-full border border-[#2A2A2A] hover:border-[#555] transition-colors"
              >
                <Minus className="size-3 text-[#888]" />
              </button>
              <span className="text-3xl font-extrabold" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                {hours}h
              </span>
              <button
                onClick={() => setHours(hours + 0.5)}
                className="size-8 flex items-center justify-center rounded-full border border-[#2A2A2A] hover:border-[#555] transition-colors"
              >
                <Plus className="size-3 text-[#888]" />
              </button>
            </div>
          </div>
          <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-4">
            <p className="text-[10px] text-[#888] tracking-[0.18em] uppercase mb-3">Date</p>
            <p className="text-[#CCC] text-sm leading-snug">Tue<br />Jun 30, 2026</p>
          </div>
        </div>

        {/* Activity */}
        <div>
          <p className="text-[10px] text-[#888] tracking-[0.18em] uppercase mb-2.5">Activity</p>
          <div className="flex gap-2">
            {SESSION_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setSessionType(t)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border"
                style={
                  sessionType === t
                    ? { backgroundColor: "#C5F22A", color: "#0C0C0C", borderColor: "#C5F22A", fontWeight: 700 }
                    : { backgroundColor: "transparent", color: "#888", borderColor: "#1E1E1E" }
                }
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Format */}
        <div>
          <p className="text-[10px] text-[#888] tracking-[0.18em] uppercase mb-2.5">Format</p>
          <div className="flex gap-2 bg-[#111] border border-[#1E1E1E] rounded-xl p-1">
            {FORMATS.map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                style={format === f ? { backgroundColor: "#1E1E1E", color: "#FFF" } : { color: "#666" }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-[#1A1A1A]" />

        {/* Progress */}
        <div>
          <p className="text-[10px] text-[#888] tracking-[0.18em] uppercase mb-2.5">How did you feel about your progress?</p>
          <div className="flex gap-1.5">
            {PROGRESS_LEVELS.map((p) => (
              <button
                key={p.value}
                onClick={() => setProgress(p.value)}
                className="flex-1 rounded-xl py-3 flex flex-col items-center gap-1 transition-all border"
                style={
                  progress === p.value
                    ? { backgroundColor: `${p.color}18`, borderColor: `${p.color}50` }
                    : { backgroundColor: "#111", borderColor: "#1E1E1E" }
                }
              >
                <span
                  className="text-xl font-extrabold leading-none"
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    color: progress === p.value ? p.color : "#444",
                  }}
                >
                  {p.n}
                </span>
              </button>
            ))}
          </div>
          {activeProgress && (
            <p className="text-center text-xs mt-2" style={{ color: activeProgress.color }}>
              {activeProgress.label}
            </p>
          )}
        </div>

        <div className="h-px bg-[#1A1A1A]" />

        {/* What went well */}
        <ChipSection
          title="What was good this session?"
          selected={goodSkills}
          onToggle={(v) => toggle(goodSkills, setGoodSkills, v)}
        />

        <div className="h-px bg-[#1A1A1A]" />

        {/* What was difficult */}
        <ChipSection
          title="What was most difficult?"
          selected={hardSkills}
          onToggle={(v) => toggle(hardSkills, setHardSkills, v)}
        />

        <div className="h-px bg-[#1A1A1A]" />

        {/* Notes */}
        <div>
          <p className="text-[10px] text-[#888] tracking-[0.18em] uppercase mb-2.5">Notes (optional)</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What clicked today? Any goals for next time?"
            rows={3}
            className="w-full bg-[#111] border border-[#1E1E1E] rounded-xl px-4 py-3 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#C5F22A]/30 resize-none transition-colors"
          />
        </div>

        <div className="h-2" />
      </div>

      {/* Save */}
      <div className="flex-shrink-0 bg-[#0C0C0C] border-t border-[#1A1A1A] p-4">
        <button
          onClick={handleSave}
          className="w-full bg-[#C5F22A] text-[#0C0C0C] font-bold py-3.5 rounded-2xl hover:opacity-90 transition-opacity"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1rem", letterSpacing: "0.1em" }}
        >
          SAVE SESSION
        </button>
      </div>
    </div>
  );
}
