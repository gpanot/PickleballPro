import { Fragment } from "react";
import { ArrowUpRight } from "lucide-react";
import { PieChart, Pie, Cell } from "recharts";
import {
  SESSIONS, TOTAL_HOURS, TOTAL_SESSIONS, TOTAL_CALORIES,
  SESSION_TYPE_BREAKDOWN, PIE_DATA,
  TOP_STRONG, TOP_CHALLENGING,
  MOOD_TREND, MOOD_COLOR,
  COACH_INSIGHT,
} from "../data/logbook";

type NavTarget = "logbook" | "logSession" | "rank" | "program";
type Props = { onNavigate: (screen: NavTarget) => void };

// V2 pie segment colors
const PIE_COLORS = ["#B48ACA", "#F6E6EE"];

// Mood color for session card dot (same semantic scale as V1)
const SESSION_MOOD_COLOR: Record<string, string> = {
  struggling: "#EF4444",
  difficult:  "#F97316",
  neutral:    "#94A3B8",
  good:       "#22C55E",
  excellent:  "#8B5CF6",
};

export function LogbookV2({ onNavigate }: Props) {
  return (
    <div className="h-full flex flex-col bg-[#FAF7F4]" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className="flex-1 overflow-y-auto min-h-0 pb-6" style={{ scrollbarWidth: "none" }}>

        {/* Header */}
        <div className="px-6 pt-10 pb-3">
          <p className="text-[#C4A8D0] text-sm font-semibold mb-0.5">June 2026</p>
          <h1
            className="text-[2rem] font-semibold leading-tight text-[#2C2233]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic" }}
          >
            Your Logbook
          </h1>
        </div>

        <div className="px-6 space-y-3">

          {/* ── Summary card with donut ── */}
          <div
            className="rounded-3xl p-4"
            style={{ background: "linear-gradient(135deg, #EDE6F6 0%, #F6E6EE 100%)" }}
          >
            <div className="flex items-center gap-4">
              {/* Donut chart */}
              <div className="relative flex-shrink-0" style={{ width: 88, height: 88 }}>
                <PieChart width={88} height={88}>
                  <Pie
                    data={PIE_DATA}
                    cx={44} cy={44}
                    innerRadius={28} outerRadius={43}
                    dataKey="value"
                    startAngle={90} endAngle={-270}
                    strokeWidth={0}
                  >
                    {PIE_DATA.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span
                    className="text-xl font-bold text-[#2C2233] leading-none"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {TOTAL_HOURS}h
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span
                    className="text-3xl font-bold text-[#2C2233] leading-none"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {TOTAL_HOURS}h
                  </span>
                  <span className="text-[#9B8FA6] text-xs">this month</span>
                </div>
                <p className="text-[#9B8FA6] text-xs mb-2.5">≈ {TOTAL_CALORIES.toLocaleString()} cal burned</p>

                {SESSION_TYPE_BREAKDOWN.map((s, i) => (
                  <div key={s.label} className="flex items-center gap-2 mb-1">
                    <div className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i] === "#F6E6EE" ? "#CF8FAD" : PIE_COLORS[i] }} />
                    <span className="text-[#5A4E6E] text-xs flex-1">{s.label}</span>
                    <span className="text-[#2C2233] text-xs font-bold tabular-nums">{s.hours}h</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Session count pill */}
            <div className="mt-3 pt-3 border-t border-white/40">
              <span className="text-[#9B8FA6] text-xs">{TOTAL_SESSIONS} sessions logged</span>
            </div>
          </div>

          {/* ── Skill patterns ── */}
          <div className="bg-white rounded-3xl p-4" style={{ boxShadow: "0 2px 12px rgba(168,124,184,0.08)" }}>
            <p className="text-[#BFB3CC] text-[10px] font-semibold tracking-wider uppercase mb-3">Your Skill Patterns</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] text-[#A87CB8] font-bold mb-3">You&apos;re shining at</p>
                {TOP_STRONG.map((s) => (
                  <div key={s.name} className="flex items-center justify-between mb-2.5">
                    <span className="text-[#2C2233] text-xs font-medium">{s.name}</span>
                    <span className="text-xs font-bold tabular-nums px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#EDE6F6", color: "#A87CB8" }}>
                      ×{s.count}
                    </span>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[11px] text-[#CF8FAD] font-bold mb-3">Room to grow</p>
                {TOP_CHALLENGING.map((s) => (
                  <div key={s.name} className="flex items-center justify-between mb-2.5">
                    <span className="text-[#2C2233] text-xs font-medium">{s.name}</span>
                    <span className="text-xs font-bold tabular-nums px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#F6E6EE", color: "#CF8FAD" }}>
                      ×{s.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Mood trend: dot timeline ── */}
          <div className="bg-white rounded-3xl p-4" style={{ boxShadow: "0 2px 12px rgba(168,124,184,0.08)" }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[#BFB3CC] text-[10px] font-semibold tracking-wider uppercase">How sessions felt</p>
              <span className="text-[#D0C6DA] text-[10px]">last 5</span>
            </div>

            {/* Connected dot timeline */}
            <div className="flex items-center mb-2">
              {MOOD_TREND.map((m, i) => (
                <Fragment key={i}>
                  <div className="flex flex-col items-center" style={{ flex: "0 0 auto" }}>
                    <div
                      className="size-5 rounded-full border-2 border-white"
                      style={{ backgroundColor: MOOD_COLOR[m.mood], boxShadow: `0 0 0 1px ${MOOD_COLOR[m.mood]}40` }}
                    />
                  </div>
                  {i < MOOD_TREND.length - 1 && (
                    <div className="flex-1 h-px" style={{ backgroundColor: "#EDE6F6" }} />
                  )}
                </Fragment>
              ))}
            </div>

            {/* Labels below dots */}
            <div className="flex">
              {MOOD_TREND.map((m, i) => (
                <div key={i} className="flex-1 text-center" style={i === 0 ? { marginLeft: -8 } : i === MOOD_TREND.length - 1 ? { marginRight: -8 } : {}}>
                  <span className="text-[9px] font-bold" style={{ color: MOOD_COLOR[m.mood] }}>
                    {m.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-1.5 mt-3">
              <div className="size-1.5 rounded-full bg-[#22C55E]" />
              <p className="text-[#22C55E] text-xs font-medium">Trending upward — keep the momentum</p>
            </div>
          </div>

          {/* ── Coach insight ── */}
          <div
            className="bg-white rounded-3xl p-4 border-l-[3px]"
            style={{ boxShadow: "0 2px 12px rgba(168,124,184,0.08)", borderLeftColor: "#B48ACA" }}
          >
            <p className="text-[#B48ACA] text-[10px] font-bold tracking-wider uppercase mb-2">Coach Insight</p>
            <p className="text-[#2C2233] text-sm leading-relaxed mb-4">{COACH_INSIGHT.text}</p>
            <button
              onClick={() => onNavigate("program")}
              className="flex items-center gap-2 rounded-2xl px-4 py-2.5 hover:opacity-90 transition-opacity group"
              style={{ background: "linear-gradient(135deg, #B48ACA, #CF8FAD)" }}
            >
              <span className="text-white text-sm font-bold">Explore Coaching</span>
              <ArrowUpRight className="size-4 text-white/80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>

          {/* ── Session list ── */}
          <div>
            <p className="text-[#BFB3CC] text-[10px] font-semibold tracking-wider uppercase mb-2">Recent Sessions</p>
            <div className="space-y-2.5">
              {SESSIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onNavigate("logSession")}
                  className="w-full bg-white rounded-2xl p-4 text-left transition-shadow hover:shadow-md"
                  style={{ boxShadow: "0 2px 8px rgba(168,124,184,0.07)" }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="size-3 rounded-full flex-shrink-0 mt-1.5"
                      style={{ backgroundColor: SESSION_MOOD_COLOR[s.mood] ?? "#EDE6F6" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[#2C2233] font-semibold text-[15px] leading-snug mb-1">
                        {s.day}, {s.date}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {s.strong.slice(0, 2).map((sk) => (
                          <span key={sk} className="text-[10px] font-semibold rounded-full px-2 py-0.5" style={{ backgroundColor: "#EDE6F6", color: "#A87CB8" }}>
                            {sk}
                          </span>
                        ))}
                        {s.challenging.slice(0, 1).map((sk) => (
                          <span key={sk} className="text-[10px] font-semibold rounded-full px-2 py-0.5" style={{ backgroundColor: "#F6E6EE", color: "#CF8FAD" }}>
                            {sk} (hard)
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className="text-[#2C2233] font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {s.hours}h
                      </span>
                      <p className="text-[#BFB3CC] text-[10px] mt-0.5">{s.type}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
