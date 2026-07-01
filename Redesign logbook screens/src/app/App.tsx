import { useState } from "react";
import { Dumbbell, GraduationCap, Trophy, BookMarked, Plus } from "lucide-react";
import { Toaster } from "sonner";
import { LogbookV1 } from "./components/LogbookV1";
import { LogSessionV1 } from "./components/LogSessionV1";
import { LogbookV2 } from "./components/LogbookV2";
import { LogSessionV2 } from "./components/LogSessionV2";
import { RankScreen } from "./components/RankScreen";
import { CoachesScreen } from "./components/CoachesScreen";

type Version = "v1" | "v2";
type Screen  = "logbook" | "logSession" | "rank" | "program";

// Which nav tab is active based on current screen
function activeTab(screen: Screen): string {
  if (screen === "logbook" || screen === "logSession") return "logbook";
  if (screen === "rank") return "rank";
  if (screen === "program") return "program";
  return "logbook";
}

const NAV_TABS = [
  { id: "program",     label: "Program",  Icon: Dumbbell      },
  { id: "academy",     label: "Academy",  Icon: GraduationCap },
  { id: "rank",        label: "Rank",     Icon: Trophy        },
  { id: "logbook",     label: "Logbook",  Icon: BookMarked    },
] as const;

const NAV_H = 58; // px — fixed nav height

function BottomNav({
  version, currentScreen, onTab,
}: {
  version: Version; currentScreen: Screen; onTab: (id: string) => void;
}) {
  const isV1   = version === "v1";
  const active = activeTab(currentScreen);

  return (
    <div
      className="flex-shrink-0 flex items-end pb-2"
      style={{
        height: NAV_H,
        paddingTop: 28, // breathing room below the overlapping FAB (half FAB ≈ 22px + 6 gap)
        backgroundColor: isV1 ? "#0C0C0C" : "#fff",
        borderTop: isV1 ? "1px solid #1A1A1A" : "1px solid #EDE6F6",
        fontFamily: isV1 ? "'DM Sans', sans-serif" : "'Nunito', sans-serif",
      }}
    >
      {NAV_TABS.map(({ id, label, Icon }) => {
        const on = active === id;
        return (
          <button
            key={id}
            onClick={() => onTab(id)}
            className="flex-1 flex flex-col items-center gap-0.5"
          >
            <Icon
              className="size-4"
              style={{ color: on ? (isV1 ? "#C5F22A" : "#B48ACA") : isV1 ? "#555" : "#C8C0D4" }}
            />
            <span
              className="text-[9px]"
              style={{
                color: on ? (isV1 ? "#C5F22A" : "#B48ACA") : isV1 ? "#555" : "#C8C0D4",
                fontWeight: on ? 700 : 400,
                letterSpacing: isV1 && on ? "0.06em" : undefined,
                fontFamily: isV1 && on ? "'Barlow Condensed', sans-serif" : undefined,
              }}
            >
              {isV1 ? label.toUpperCase() : label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function App() {
  const [version, setVersion] = useState<Version>("v1");
  const [screen,  setScreen]  = useState<Screen>("logbook");
  // Track where coaches screen was opened from (logbook insight vs program tab)
  const [coachBackTo, setCoachBackTo] = useState<Screen>("program");

  const navigate = (s: Screen) => setScreen(s);

  const handleTab = (id: string) => {
    if (id === "academy") return; // stub
    if (id === "program") { setCoachBackTo("program"); setScreen("program"); return; }
    setScreen(id as Screen);
  };

  const handleVersionSwitch = (v: Version) => {
    setVersion(v);
    setScreen("logbook");
  };

  // When navigating to program from logbook insight, record the back destination
  const navigateWithContext = (s: Screen) => {
    if (s === "program") setCoachBackTo("logbook");
    setScreen(s);
  };

  const isV1       = version === "v1";
  const phoneBg    = isV1 ? "#0C0C0C" : "#FAF7F4";
  const showFab    = screen === "logbook";
  const showNav    = screen !== "logSession";
  const fabLabel   = isV1 ? "LOG SESSION" : "Log a session";

  function renderScreen() {
    switch (screen) {
      case "logbook":
        return isV1
          ? <LogbookV1 onNavigate={navigateWithContext} />
          : <LogbookV2 onNavigate={navigateWithContext} />;
      case "logSession":
        return isV1
          ? <LogSessionV1 onNavigate={navigate} />
          : <LogSessionV2 onNavigate={navigate} />;
      case "rank":
        return <RankScreen onNavigate={navigate} version={version} />;
      case "program":
        return <CoachesScreen onNavigate={navigate} version={version} backTo={coachBackTo} />;
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start py-6 px-4"
      style={{ backgroundColor: "#EDE9F4" }}
    >
      <Toaster position="top-center" />

      {/* Version picker */}
      <div className="mb-5 flex flex-col items-center gap-2">
        <p className="text-[11px] text-[#9B8FA6] tracking-widest uppercase font-semibold">Design Version</p>
        <div className="flex gap-1 bg-white rounded-full p-1" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          <button
            onClick={() => handleVersionSwitch("v1")}
            className="px-4 py-2 rounded-full text-sm font-bold transition-all duration-200"
            style={
              version === "v1"
                ? { backgroundColor: "#C5F22A", color: "#0C0C0C", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }
                : { color: "#9B8FA6" }
            }
          >
            Sport Dark
          </button>
          <button
            onClick={() => handleVersionSwitch("v2")}
            className="px-4 py-2 rounded-full text-sm font-bold transition-all duration-200"
            style={
              version === "v2"
                ? { background: "linear-gradient(135deg, #B48ACA, #CF8FAD)", color: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }
                : { color: "#9B8FA6" }
            }
          >
            Warm &amp; Friendly
          </button>
        </div>
      </div>

      {/* Phone frame */}
      <div
        className="w-[375px] rounded-[2.8rem] overflow-hidden flex flex-col"
        style={{
          height: "812px",
          backgroundColor: phoneBg,
          boxShadow: "0 32px 80px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)",
        }}
      >
        {/* Dynamic island */}
        <div className="flex-shrink-0 flex justify-center pt-3" style={{ backgroundColor: phoneBg }}>
          <div className="w-24 h-6 rounded-full" style={{ backgroundColor: isV1 ? "#1A1A1A" : "#E8E0F0" }} />
        </div>

        {/* Screen content */}
        <div className="flex-1 min-h-0">
          {renderScreen()}
        </div>

        {/* ─── FAB zone: zero-height div sitting exactly at content/nav boundary ─── */}
        {/* The button extends upward (top: -22px = half FAB height) overlapping content,
            and downward into the nav's padded top region. The ring shadow separates it. */}
        {showFab && (
          <div className="relative h-0 z-20 flex justify-center" style={{ flexShrink: 0 }}>
            <button
              onClick={() => navigate("logSession")}
              className="absolute flex items-center gap-2 rounded-full px-6 font-bold transition-all hover:scale-[1.03] active:scale-[0.97]"
              style={{
                top: "-22px",        // half of button height — centers on boundary
                height: 44,
                ...(isV1
                  ? {
                      backgroundColor: "#C5F22A",
                      color: "#0C0C0C",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: "0.9rem",
                      letterSpacing: "0.07em",
                      // ring in phone background color creates the "punching through" effect
                      boxShadow: `0 0 0 4px ${phoneBg}, 0 6px 20px rgba(197,242,42,0.4)`,
                    }
                  : {
                      background: "linear-gradient(135deg, #B48ACA, #CF8FAD)",
                      color: "#fff",
                      fontFamily: "'Nunito', sans-serif",
                      fontSize: "0.9rem",
                      boxShadow: `0 0 0 4px ${phoneBg}, 0 6px 20px rgba(168,124,184,0.45)`,
                    }),
              }}
            >
              <Plus className="size-4 flex-shrink-0" strokeWidth={2.5} />
              {fabLabel}
            </button>
          </div>
        )}

        {/* Bottom nav */}
        {showNav && (
          <BottomNav version={version} currentScreen={screen} onTab={handleTab} />
        )}
      </div>

      <p className="mt-4 text-[11px] text-[#BFB3CC] tracking-wide">
        Tap the nav tabs or session cards to explore
      </p>
    </div>
  );
}
