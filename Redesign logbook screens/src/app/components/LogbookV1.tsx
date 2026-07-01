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

// V1 pie segment colors
const PIE_COLORS = ["#C5F22A", "#2A2A2A"];

// Mood color for the vertical accent bar on session cards
const SESSION_MOOD_COLOR: Record<string, string> = {
  struggling: "#EF4444",
  difficult:  "#F97316",
  neutral:    "#94A3B8",
  good:       "#22C55E",
  excellent:  "#8B5CF6",
};

export function LogbookV1({ onNavigate }: Props) {
  return (
    <div className="h-full flex flex-col bg-[#0C0C0C] text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="flex-1 overflow-y-auto min-h-0 pb-6" style={{ scrollbarWidth: "none" }}>

        {/* Header */}
        <div className="px-5 pt-10 pb-3 flex items-end justify-between">
          <div>
            <p className="text-[10px] text-[#888] tracking-[0.18em] uppercase mb-1">June 2026</p>
            <h1 className="text-5xl font-extrabold uppercase leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              Logbook
            </h1>
          </div>
          <span className="text-[11px] text-[#888] bg-[#1A1A1A] border border-[#2A2A2A] rounded-full px-3 py-1.5">
            {TOTAL_SESSIONS} sessions
          </span>
        </div>

        <div className="px-5 space-y-3">

          {/* ── Summary card with donut ── */}
          <div className="bg-[#111] rounded-2xl p-4 border border-[#1E1E1E]">
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
                  <span className="text-xl font-extrabold text-white leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {TOTAL_HOURS}h
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-3xl font-extrabold text-[#C5F22A]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {TOTAL_HOURS}h
                  </span>
                  <span className="text-[#888] text-xs">this month</span>
                </div>
                <p className="text-[#888] text-xs mb-2.5">≈ {TOTAL_CALORIES.toLocaleString()} cal burned</p>

                {SESSION_TYPE_BREAKDOWN.map((s, i) => (
                  <div key={s.label} className="flex items-center gap-2 mb-1">
                    <div className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i] }} />
                    <span className="text-[#CCC] text-xs flex-1">{s.label}</span>
                    <span className="text-white text-xs font-semibold tabular-nums">{s.hours}h</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Skill patterns ── */}
          <div className="bg-[#111] rounded-2xl p-4 border border-[#1E1E1E]">
            <p className="text-[10px] text-[#888] tracking-[0.18em] uppercase mb-3">Skill Patterns</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] text-[#C5F22A] font-semibold mb-3 tracking-wide">Top Skills</p>
                {TOP_STRONG.map((s) => (
                  <div key={s.name} className="flex items-center justify-between mb-2.5">
                    <span className="text-[#CCC] text-xs">{s.name}</span>
                    <span className="text-xs font-bold tabular-nums px-1.5 py-0.5 rounded" style={{ backgroundColor: "#C5F22A18", color: "#C5F22A" }}>
                      ×{s.count}
                    </span>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[11px] text-[#F97316] font-semibold mb-3 tracking-wide">Work On</p>
                {TOP_CHALLENGING.map((s) => (
                  <div key={s.name} className="flex items-center justify-between mb-2.5">
                    <span className="text-[#CCC] text-xs">{s.name}</span>
                    <span className="text-xs font-bold tabular-nums px-1.5 py-0.5 rounded" style={{ backgroundColor: "#F9731618", color: "#F97316" }}>
                      ×{s.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Mood trend: dot timeline ── */}
          <div className="bg-[#111] rounded-2xl p-4 border border-[#1E1E1E]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] text-[#888] tracking-[0.18em] uppercase">How sessions felt</p>
              <span className="text-[10px] text-[#666]">last 5</span>
            </div>

            {/* Connected dot timeline */}
            <div className="flex items-center mb-2">
              {MOOD_TREND.map((m, i) => (
                <Fragment key={i}>
                  <div className="flex flex-col items-center" style={{ flex: "0 0 auto" }}>
                    <div
                      className="size-5 rounded-full border-2 border-[#0C0C0C]"
                      style={{ backgroundColor: MOOD_COLOR[m.mood] }}
                    />
                  </div>
                  {i < MOOD_TREND.length - 1 && (
                    <div className="flex-1 h-px" style={{ backgroundColor: "#2A2A2A" }} />
                  )}
                </Fragment>
              ))}
            </div>

            {/* Labels below dots */}
            <div className="flex">
              {MOOD_TREND.map((m, i) => (
                <div key={i} className="flex-1 text-center" style={i === 0 ? { marginLeft: -8 } : i === MOOD_TREND.length - 1 ? { marginRight: -8 } : {}}>
                  <span className="text-[9px] font-semibold" style={{ color: MOOD_COLOR[m.mood] }}>
                    {m.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-1.5 mt-3">
              <div className="size-1.5 rounded-full bg-[#22C55E]" />
              <p className="text-[#22C55E] text-xs">Trending upward — keep the momentum</p>
            </div>
          </div>

          {/* ── Coach insight ── */}
          <div className="bg-[#111] rounded-2xl p-4 border border-[#1E1E1E]" style={{ borderLeftWidth: 2, borderLeftColor: "#C5F22A" }}>
            <p className="text-[10px] text-[#C5F22A] tracking-[0.18em] uppercase mb-2">Coach Insight</p>
            <p className="text-[#CCC] text-sm leading-relaxed mb-4">{COACH_INSIGHT.text}</p>
            <button
              onClick={() => onNavigate("program")}
              className="flex items-center gap-2 border border-[#C5F22A]/40 rounded-xl px-4 py-2.5 hover:bg-[#C5F22A]/5 transition-colors group"
            >
              <span className="text-[#C5F22A] text-sm font-semibold">Find a Coach</span>
              <ArrowUpRight className="size-4 text-[#C5F22A] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>

          {/* ── Session list ── */}
          <div>
            <p className="text-[10px] text-[#888] tracking-[0.18em] uppercase mb-2">Recent Sessions</p>
            <div className="space-y-2">
              {SESSIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onNavigate("logSession")}
                  className="w-full bg-[#111] border border-[#1E1E1E] hover:border-[#2A2A2A] rounded-2xl p-4 text-left transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-[3px] h-12 rounded-full flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: SESSION_MOOD_COLOR[s.mood] ?? "#555" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5 mb-1.5">
                        <span className="font-semibold text-[15px] text-white">{s.date}</span>
                        <span className="text-[#777] text-xs">{s.day} · {s.type}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {s.strong.slice(0, 2).map((sk) => (
                          <span key={sk} className="text-[10px] text-[#C5F22A] bg-[#C5F22A]/8 border border-[#C5F22A]/20 rounded px-1.5 py-0.5">{sk}</span>
                        ))}
                        {s.challenging.slice(0, 1).map((sk) => (
                          <span key={sk} className="text-[10px] text-[#F97316] bg-[#F97316]/8 border border-[#F97316]/20 rounded px-1.5 py-0.5">{sk} hard</span>
                        ))}
                      </div>
                    </div>
                    <span className="text-white font-bold text-xl flex-shrink-0" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {s.hours}h
                    </span>
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
