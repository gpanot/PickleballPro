import { useState, useMemo, useRef } from "react";

const TIERS = [
  { name: "Coach (Free)", max: 1, price: 0 },
  { name: "Academy Starter", max: 2, price: 259 },
  { name: "Growth", max: 5, price: 599 },
  { name: "Scale Nationwide", max: 15, price: 2999 },
];

function getTier(coaches) {
  if (coaches <= 1) return TIERS[0];
  if (coaches <= 2) return TIERS[1];
  if (coaches <= 5) return TIERS[2];
  return TIERS[3];
}

function fmt(n) {
  return "$" + Math.round(n).toLocaleString("en-US");
}

function getStaffSavings(coaches) {
  if (coaches <= 1) return 0;
  if (coaches <= 2) return 500;
  if (coaches <= 3) return 1500;
  if (coaches <= 4) return 2000;
  if (coaches <= 5) return 2500;
  return 3000;
}

function InlineEdit({ value, onChange, min, max }) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);

  function handleClick() {
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 30);
  }

  function handleBlur(e) {
    const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(val) && val >= min && val <= max) onChange(val);
    setEditing(false);
  }

  function handleKey(e) {
    if (e.key === "Enter") e.target.blur();
    if (e.key === "Escape") setEditing(false);
  }

  return editing ? (
    <input
      ref={inputRef}
      type="number"
      defaultValue={value}
      min={min} max={max}
      onBlur={handleBlur}
      onKeyDown={handleKey}
      style={{
        width: 56, textAlign: "center", fontWeight: 700, fontSize: 14,
        color: "#334155", border: "1.5px solid #3b82f6", borderRadius: 6,
        padding: "1px 4px", outline: "none", background: "#fff",
      }}
    />
  ) : (
    <span
      onClick={handleClick}
      title="Click to edit"
      onMouseEnter={e => e.currentTarget.style.borderColor = "#93c5fd"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#e2e8f0"}
      style={{
        display: "inline-block", background: "#fff", border: "1px solid #e2e8f0",
        borderRadius: 6, padding: "1px 10px", fontWeight: 700, color: "#334155",
        cursor: "text", minWidth: 28, textAlign: "center", fontSize: 14,
        transition: "border-color 0.15s",
      }}
    >
      {value}
    </span>
  );
}

export default function RevenueSimulator() {
  const [coaches, setCoaches] = useState(3);
  const [studentsPerCoach, setStudentsPerCoach] = useState(15);
  const [pricePerHour, setPricePerHour] = useState(75);
  const [classesPerMonth, setClassesPerMonth] = useState(5);
  const [programPrice, setProgramPrice] = useState(300);
  const [showBreakdown, setShowBreakdown] = useState(true);

  const calc = useMemo(() => {
    const tier = getTier(coaches);
    const affiliateCoaches = Math.max(0, coaches - 1);
    const royaltyRate = 0.15;

    const classRevenuePerCoach = studentsPerCoach * pricePerHour * classesPerMonth;
    const programRevenuePerCoach = studentsPerCoach * programPrice;
    const totalPerCoach = classRevenuePerCoach + programRevenuePerCoach;

    const yourDirectRevenue = totalPerCoach;
    const royaltyPerCoach = totalPerCoach * royaltyRate;
    const totalRoyalties = affiliateCoaches * royaltyPerCoach;
    const staffSavings = getStaffSavings(coaches);
    const totalRevenue = yourDirectRevenue + totalRoyalties;
    const platformCost = tier.price;
    const costPercent = totalRevenue > 0 ? ((platformCost / totalRevenue) * 100).toFixed(1) : 0;
    const totalStudents = coaches * studentsPerCoach;

    return {
      tier, affiliateCoaches,
      classRevenuePerCoach, programRevenuePerCoach,
      yourDirectRevenue, royaltyPerCoach, totalRoyalties,
      staffSavings, totalRevenue, platformCost, costPercent, totalStudents,
    };
  }, [coaches, studentsPerCoach, pricePerHour, classesPerMonth, programPrice]);

  return (
    <div style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      maxWidth: 860, margin: "0 auto", padding: "48px 24px", background: "#fff",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <h2 style={{ fontSize: 34, fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1.2 }}>
          See How Much You Could Earn
        </h2>
        <p style={{ fontSize: 16, color: "#64748b", marginTop: 10, maxWidth: 480, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
          Move the sliders to match your academy. Watch your income grow as you scale beyond your own schedule.
        </p>
      </div>

      {/* Sliders panel */}
      <div style={{ background: "#f8fafc", borderRadius: 16, padding: "32px 36px", marginBottom: 28, border: "1px solid #e2e8f0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0 40px" }}>
          <SliderControl label="Coaches" value={coaches} min={1} max={15} step={1} format={v => String(v)} onChange={setCoaches} />
          <SliderControl label="Students per coach" value={studentsPerCoach} min={3} max={40} step={1} format={v => String(v)} onChange={setStudentsPerCoach} />
          <SliderControl label="Price per hour" value={pricePerHour} min={25} max={200} step={5} format={v => `$${v}`} onChange={setPricePerHour} />
        </div>

        <div style={{
          textAlign: "center", marginTop: 24, fontSize: 14, color: "#64748b",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6, flexWrap: "wrap",
        }}>
          <span>Total students: <strong style={{ color: "#1e293b" }}>{calc.totalStudents}</strong></span>
          <span style={{ color: "#cbd5e1" }}>·</span>
          <span>assumes</span>
          <InlineEdit value={classesPerMonth} onChange={setClassesPerMonth} min={1} max={30} />
          <span>classes per student per month</span>
          <span style={{ color: "#cbd5e1" }}>·</span>
          <span>program price</span>
          <InlineEdit value={programPrice} onChange={setProgramPrice} min={0} max={5000} />
          <span>per student</span>
        </div>
      </div>

      {/* Revenue hero card */}
      <div style={{
        background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 60%, #f0f9ff 100%)",
        borderRadius: 16, padding: "32px 36px", marginBottom: 20, border: "1px solid #bbf7d0",
      }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: "#16a34a", marginBottom: 8 }}>
            Your monthly revenue potential
          </div>
          <div style={{ fontSize: 58, fontWeight: 800, color: "#15803d", lineHeight: 1 }}>
            {fmt(calc.totalRevenue - calc.platformCost)}
            <span style={{ fontSize: 22, fontWeight: 500, color: "#22c55e" }}>/mo</span>
          </div>
          <div style={{ fontSize: 13, color: "#4ade80", marginTop: 6, fontWeight: 600 }}>
            after {calc.platformCost === 0 ? "free plan" : `${fmt(calc.platformCost)}/mo platform cost`}
          </div>
        </div>

        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            margin: "0 auto", background: "none", border: "none", cursor: "pointer",
            fontSize: 14, fontWeight: 600, color: "#16a34a", padding: "6px 12px",
          }}
        >
          {showBreakdown ? "Hide" : "Show"} breakdown
          <span style={{ transform: showBreakdown ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", display: "inline-block", fontSize: 11 }}>▼</span>
        </button>

        {showBreakdown && (
          <div style={{ marginTop: 20, borderTop: "1px solid #bbf7d0", paddingTop: 22 }}>
            <SectionLabel>Your coaching</SectionLabel>
            <BreakdownRow label={`Class income (${studentsPerCoach} students × $${pricePerHour}/hr × ${classesPerMonth} classes)`} value={fmt(calc.classRevenuePerCoach)} />
            {programPrice > 0 && (
              <BreakdownRow label={`Program sales (${studentsPerCoach} students × $${programPrice})`} value={fmt(calc.programRevenuePerCoach)} />
            )}
            <BreakdownRow label="Your direct total" value={fmt(calc.yourDirectRevenue)} bold />

            {calc.affiliateCoaches > 0 && (
              <>
                <SectionLabel style={{ marginTop: 18 }}>Affiliate royalties (15%)</SectionLabel>
                <BreakdownRow
                  label={`${calc.affiliateCoaches} affiliated coach${calc.affiliateCoaches > 1 ? "es" : ""} × ${fmt(calc.royaltyPerCoach)} royalty each`}
                  value={fmt(calc.totalRoyalties)}
                />
              </>
            )}

            {calc.staffSavings > 0 && (
              <>
                <SectionLabel style={{ marginTop: 18 }}>Staff savings vs. traditional</SectionLabel>
                <BreakdownRow
                  label={coaches >= 6
                    ? "Admin staff replaced by AcademyPro ($3,000/mo)"
                    : `Admin workload covered (${Math.round((calc.staffSavings / 3000) * 100)}% of a $3,000/mo role)`}
                  value={`+${fmt(calc.staffSavings)}`}
                  accent
                />
              </>
            )}

            <div style={{ borderTop: "1px dashed #86efac", paddingTop: 16, marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#15803d" }}>Total potential</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#15803d" }}>{fmt(calc.totalRevenue)}/mo</span>
            </div>
          </div>
        )}
      </div>

      {/* 3-stat bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
        <StatCard
          label="Total Revenue"
          value={`${fmt(calc.totalRevenue)}/mo`}
          bg="#f0fdf4" border="#bbf7d0" labelColor="#16a34a" valueColor="#15803d"
        />
        <StatCard
          label="From Royalties"
          value={calc.affiliateCoaches > 0 ? `${fmt(calc.totalRoyalties)}/mo` : "—"}
          sub={calc.affiliateCoaches > 0 ? `${calc.affiliateCoaches} affiliated coach${calc.affiliateCoaches > 1 ? "es" : ""}` : "Add coaches to earn royalties"}
          bg="#f0f9ff" border="#bae6fd" labelColor="#0ea5e9" valueColor="#0369a1"
        />
        <StatCard
          label="Academy Size"
          value={`${coaches} coach${coaches > 1 ? "es" : ""}`}
          sub={`${calc.totalStudents} students · ${calc.tier.name}`}
          bg="#f8fafc" border="#e2e8f0" labelColor="#94a3b8" valueColor="#334155"
        />
      </div>

      <p style={{ textAlign: "center", fontSize: 14, color: "#94a3b8", lineHeight: 1.6, maxWidth: 600, margin: "0 auto" }}>
        On the {calc.tier.name} plan{calc.platformCost > 0 ? ` (${fmt(calc.platformCost)}/mo)` : ""}, AcademyPro costs just {calc.costPercent}% of your monthly revenue to run {coaches} coach{coaches > 1 ? "es" : ""} and {calc.totalStudents} students.
      </p>
    </div>
  );
}

function StatCard({ label, value, sub, bg, border, labelColor, valueColor }) {
  return (
    <div style={{ background: bg, borderRadius: 12, padding: "18px 20px", border: `1px solid ${border}`, textAlign: "center" }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: labelColor, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: valueColor, lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: labelColor, marginTop: 5, opacity: 0.8 }}>{sub}</div>}
    </div>
  );
}

function SectionLabel({ children, style }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#22c55e", marginBottom: 10, ...style }}>
      {children}
    </div>
  );
}

function BreakdownRow({ label, value, bold, accent }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8, fontSize: 14 }}>
      <span style={{ color: bold ? "#15803d" : "#334155", fontWeight: bold ? 700 : 400 }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 600, color: accent ? "#16a34a" : bold ? "#15803d" : "#1e293b", marginLeft: 16, whiteSpace: "nowrap" }}>{value}</span>
    </div>
  );
}

function SliderControl({ label, value, min, max, step, format, onChange }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{label}:</span>
        <span style={{ fontSize: 18, fontWeight: 700, color: "#3b82f6", marginLeft: 8 }}>{format(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: "100%", height: 6, appearance: "none", WebkitAppearance: "none",
          borderRadius: 3, outline: "none", cursor: "pointer",
          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${pct}%, #d1d5db ${pct}%, #d1d5db 100%)`,
        }}
      />
    </div>
  );
}
