/**
 * Vanilla port of Website/components/RevenueSimulator.jsx
 * Mounts into #revenue-simulator-root (static HTML landing page).
 */
(function () {
  "use strict";

  var TIERS = [
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

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  var state = {
    coaches: 3,
    studentsPerCoach: 15,
    pricePerHour: 75,
    classesPerMonth: 5,
    programPrice: 300,
    showBreakdown: true,
  };

  function calc() {
    var coaches = state.coaches;
    var studentsPerCoach = state.studentsPerCoach;
    var pricePerHour = state.pricePerHour;
    var classesPerMonth = state.classesPerMonth;
    var programPrice = state.programPrice;

    var tier = getTier(coaches);
    var affiliateCoaches = Math.max(0, coaches - 1);
    var royaltyRate = 0.15;

    var classRevenuePerCoach = studentsPerCoach * pricePerHour * classesPerMonth;
    var programRevenuePerCoach = studentsPerCoach * programPrice;
    var totalPerCoach = classRevenuePerCoach + programRevenuePerCoach;

    var yourDirectRevenue = totalPerCoach;
    var academyRevenue = coaches * totalPerCoach;
    var royaltyPerCoach = totalPerCoach * royaltyRate;
    var totalRoyalties = affiliateCoaches * royaltyPerCoach;
    var staffSavings = getStaffSavings(coaches);
    var totalRevenue = yourDirectRevenue + totalRoyalties;
    var platformCost = tier.price;
    var costPercent = totalRevenue > 0 ? ((platformCost / totalRevenue) * 100).toFixed(1) : 0;
    var totalStudents = coaches * studentsPerCoach;

    return {
      tier: tier,
      affiliateCoaches: affiliateCoaches,
      classRevenuePerCoach: classRevenuePerCoach,
      programRevenuePerCoach: programRevenuePerCoach,
      yourDirectRevenue: yourDirectRevenue,
      academyRevenue: academyRevenue,
      royaltyPerCoach: royaltyPerCoach,
      totalRoyalties: totalRoyalties,
      staffSavings: staffSavings,
      totalRevenue: totalRevenue,
      platformCost: platformCost,
      costPercent: costPercent,
      totalStudents: totalStudents,
    };
  }

  function sliderPct(value, min, max) {
    return ((value - min) / (max - min)) * 100;
  }

  function sliderHtml(id, label, value, min, max, step, display) {
    var pct = sliderPct(value, min, max);
    return (
      '<div>' +
        '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px;">' +
          '<span style="font-size:14px;font-weight:700;color:#1e293b;">' + esc(label) + ':</span>' +
          '<span style="font-size:18px;font-weight:700;color:#3b82f6;margin-left:8px;" data-display="' + id + '">' + esc(display) + '</span>' +
        '</div>' +
        '<input type="range" data-slider="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + value + '"' +
          ' style="width:100%;height:6px;appearance:none;-webkit-appearance:none;border-radius:3px;outline:none;cursor:pointer;' +
          'background:linear-gradient(to right,#3b82f6 0%,#3b82f6 ' + pct + '%,#d1d5db ' + pct + '%,#d1d5db 100%);">' +
      '</div>'
    );
  }

  function inlineEditHtml(key, value) {
    return (
      '<span class="rs-inline-edit" data-edit="' + key + '" title="Click to edit"' +
        ' style="display:inline-block;background:#fff;border:1px solid #e2e8f0;border-radius:6px;padding:1px 10px;' +
        'font-weight:700;color:#334155;cursor:text;min-width:28px;text-align:center;font-size:14px;transition:border-color 0.15s;">' +
        esc(value) +
      '</span>'
    );
  }

  function breakdownRow(label, value, bold, accent) {
    var labelColor = bold ? "#15803d" : "#334155";
    var valueColor = accent ? "#16a34a" : bold ? "#15803d" : "#1e293b";
    return (
      '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;font-size:14px;">' +
        '<span style="color:' + labelColor + ';font-weight:' + (bold ? 700 : 400) + ';">' + esc(label) + '</span>' +
        '<span style="font-weight:' + (bold ? 700 : 600) + ';color:' + valueColor + ';margin-left:16px;white-space:nowrap;">' + esc(value) + '</span>' +
      '</div>'
    );
  }

  function sectionLabel(text, marginTop) {
    return (
      '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#22c55e;margin-bottom:10px;' +
        (marginTop ? "margin-top:" + marginTop + "px;" : "") + '">' +
        esc(text) +
      '</div>'
    );
  }

  function statCard(label, value, sub, bg, border, labelColor, valueColor) {
    return (
      '<div style="background:' + bg + ';border-radius:12px;padding:18px 20px;border:1px solid ' + border + ';text-align:center;">' +
        '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:' + labelColor + ';margin-bottom:6px;">' + esc(label) + '</div>' +
        '<div style="font-size:22px;font-weight:800;color:' + valueColor + ';line-height:1.2;">' + esc(value) + '</div>' +
        (sub ? '<div style="font-size:12px;color:' + labelColor + ';margin-top:5px;opacity:0.8;">' + esc(sub) + '</div>' : '') +
      '</div>'
    );
  }

  function render(root) {
    var c = calc();
    var coaches = state.coaches;
    var studentsPerCoach = state.studentsPerCoach;
    var pricePerHour = state.pricePerHour;
    var classesPerMonth = state.classesPerMonth;
    var programPrice = state.programPrice;

    var breakdownHtml =
      sectionLabel("Your coaching") +
      breakdownRow(
        "Class income (" + studentsPerCoach + " students × $" + pricePerHour + "/hr × " + classesPerMonth + " classes)",
        fmt(c.classRevenuePerCoach)
      ) +
      (programPrice > 0
        ? breakdownRow(
            "Program sales (" + studentsPerCoach + " students × $" + programPrice + ")",
            fmt(c.programRevenuePerCoach)
          )
        : "") +
      breakdownRow("Your direct total", fmt(c.yourDirectRevenue), true) +
      (c.affiliateCoaches > 0
        ? sectionLabel("Affiliate royalties (15%)", 18) +
          breakdownRow(
            c.affiliateCoaches +
              " affiliated coach" +
              (c.affiliateCoaches > 1 ? "es" : "") +
              " × " +
              fmt(c.royaltyPerCoach) +
              " royalty each",
            fmt(c.totalRoyalties)
          )
        : "") +
      (c.staffSavings > 0
        ? sectionLabel("Staff savings vs. traditional", 18) +
          breakdownRow(
            coaches >= 6
              ? "Admin staff replaced by AcademyPro ($3,000/mo)"
              : "Admin workload covered (" +
                  Math.round((c.staffSavings / 3000) * 100) +
                  "% of a $3,000/mo role)",
            "+" + fmt(c.staffSavings),
            false,
            true
          )
        : "") +
      '<div style="border-top:1px dashed #86efac;padding-top:14px;margin-top:10px;display:flex;justify-content:space-between;align-items:center;">' +
        '<span style="font-size:14px;font-weight:700;color:#15803d;">Total potential</span>' +
        '<span style="font-size:18px;font-weight:800;color:#15803d;">' + esc(fmt(c.totalRevenue)) + "/mo</span>" +
      "</div>";

    root.innerHTML =
      '<div style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif;max-width:1060px;margin:0 auto;padding:48px 24px;background:#fff;">' +

        /* ── Header ── */
        '<div style="text-align:center;margin-bottom:36px;">' +
          '<h2 style="font-size:34px;font-weight:800;color:#0f172a;margin:0;line-height:1.2;">See How Much You Could Earn</h2>' +
          '<p style="font-size:16px;color:#64748b;margin-top:10px;max-width:480px;margin-left:auto;margin-right:auto;line-height:1.6;">' +
            "Move the sliders to match your academy. Watch your income grow as you scale." +
          "</p>" +
        "</div>" +

        /* ── Two-column panel ── */
        '<div class="rs-panel" style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;align-items:start;">' +

          /* LEFT — sliders */
          '<div style="background:#f8fafc;border-radius:16px;padding:28px 28px;border:1px solid #e2e8f0;display:flex;flex-direction:column;gap:24px;">' +
            '<div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:-8px;">Adjust your academy</div>' +
            sliderHtml("coaches", "Coaches", coaches, 1, 15, 1, String(coaches)) +
            sliderHtml("studentsPerCoach", "Students per coach", studentsPerCoach, 3, 40, 1, String(studentsPerCoach)) +
            sliderHtml("pricePerHour", "Price per hour", pricePerHour, 25, 200, 5, "$" + pricePerHour) +
            sliderHtml("classesPerMonth", "Classes / student / month", classesPerMonth, 1, 30, 1, String(classesPerMonth)) +
            '<div style="font-size:13px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:14px;display:flex;flex-wrap:wrap;gap:4px 8px;align-items:center;">' +
              '<span>Total students: <strong style="color:#1e293b;">' + c.totalStudents + '</strong></span>' +
              '<span style="color:#cbd5e1;">·</span>' +
              "<span>program price</span>" +
              inlineEditHtml("programPrice", programPrice) +
              "<span>per student</span>" +
            "</div>" +
          "</div>" +

          /* RIGHT — results */
          '<div style="background:linear-gradient(160deg,#f0fdf4 0%,#ecfdf5 60%,#f0f9ff 100%);border-radius:16px;padding:28px 28px;border:1px solid #bbf7d0;display:flex;flex-direction:column;gap:0;">' +
            '<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#16a34a;margin-bottom:6px;">Your monthly revenue potential</div>' +
            '<div style="font-size:52px;font-weight:800;color:#15803d;line-height:1;margin-bottom:4px;">' +
              esc(fmt(c.totalRevenue - c.platformCost)) +
              '<span style="font-size:20px;font-weight:500;color:#22c55e;">/mo</span>' +
            "</div>" +
            '<div style="font-size:13px;color:#4ade80;margin-bottom:20px;font-weight:600;">' +
              "after " + (c.platformCost === 0 ? "free plan" : fmt(c.platformCost) + "/mo platform cost") +
            "</div>" +
            '<div style="font-size:13px;color:#334155;line-height:1.7;">' +
              breakdownHtml +
            "</div>" +
          "</div>" +

        "</div>" +

        /* ── 4 KPI cards ── */
        '<div class="rs-stats" style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;">' +
          statCard(
            "Academy Revenue",
            fmt(c.academyRevenue) + "/mo",
            coaches + " coach" + (coaches > 1 ? "es" : "") + " × " + fmt(c.yourDirectRevenue),
            "#fff7ed", "#fed7aa", "#ea580c", "#c2410c"
          ) +
          statCard(
            "Your Total Revenue",
            fmt(c.totalRevenue) + "/mo",
            null,
            "#f0fdf4", "#bbf7d0", "#16a34a", "#15803d"
          ) +
          statCard(
            "From Royalties",
            c.affiliateCoaches > 0 ? fmt(c.totalRoyalties) + "/mo" : "—",
            c.affiliateCoaches > 0
              ? c.affiliateCoaches + " affiliated coach" + (c.affiliateCoaches > 1 ? "es" : "")
              : "Add coaches to earn royalties",
            "#f0f9ff", "#bae6fd", "#0ea5e9", "#0369a1"
          ) +
          statCard(
            "Academy Size",
            coaches + " coach" + (coaches > 1 ? "es" : ""),
            c.totalStudents + " students · " + c.tier.name,
            "#f8fafc", "#e2e8f0", "#94a3b8", "#334155"
          ) +
        "</div>" +

        '<p style="text-align:center;font-size:14px;color:#94a3b8;line-height:1.6;max-width:600px;margin:0 auto;">' +
          "On the " + esc(c.tier.name) + " plan" +
          (c.platformCost > 0 ? " (" + esc(fmt(c.platformCost)) + "/mo)" : "") +
          ", AcademyPro costs just " + esc(c.costPercent) +
          "% of your monthly revenue to run " + coaches +
          " coach" + (coaches > 1 ? "es" : "") +
          " and " + c.totalStudents + " students." +
        "</p>" +

      "</div>" +
      "<style>" +
        "@media (max-width:760px){" +
          ".rs-panel{grid-template-columns:1fr!important;}" +
          ".rs-stats{grid-template-columns:repeat(2,1fr)!important;}" +
        "}" +
        "input[data-slider]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#3b82f6;cursor:pointer;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.2);}" +
        "input[data-slider]::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:#3b82f6;cursor:pointer;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.2);}" +
      "</style>";

    bind(root);
  }

  function bind(root) {
    root.querySelectorAll("[data-slider]").forEach(function (input) {
      input.addEventListener("input", function () {
        var key = input.getAttribute("data-slider");
        state[key] = Number(input.value);
        render(root);
      });
    });

    var toggle = root.querySelector('[data-action="toggle-breakdown"]');
    if (toggle) {
      toggle.addEventListener("click", function () {
        state.showBreakdown = !state.showBreakdown;
        render(root);
      });
    }

    root.querySelectorAll("[data-edit]").forEach(function (el) {
      el.addEventListener("mouseenter", function () {
        el.style.borderColor = "#93c5fd";
      });
      el.addEventListener("mouseleave", function () {
        el.style.borderColor = "#e2e8f0";
      });
      el.addEventListener("click", function () {
        var key = el.getAttribute("data-edit");
        var min = key === "classesPerMonth" ? 1 : 0;
        var max = key === "classesPerMonth" ? 30 : 5000;
        var input = document.createElement("input");
        input.type = "number";
        input.value = String(state[key]);
        input.min = String(min);
        input.max = String(max);
        input.style.cssText =
          "width:56px;text-align:center;font-weight:700;font-size:14px;color:#334155;" +
          "border:1.5px solid #3b82f6;border-radius:6px;padding:1px 4px;outline:none;background:#fff;";
        el.replaceWith(input);
        input.focus();
        input.select();

        function commit() {
          var val = parseInt(String(input.value).replace(/[^0-9]/g, ""), 10);
          if (!isNaN(val) && val >= min && val <= max) state[key] = val;
          render(root);
        }

        input.addEventListener("blur", commit);
        input.addEventListener("keydown", function (e) {
          if (e.key === "Enter") input.blur();
          if (e.key === "Escape") {
            input.removeEventListener("blur", commit);
            render(root);
          }
        });
      });
    });
  }

  function mount() {
    var root = document.getElementById("revenue-simulator-root");
    if (!root) return;
    render(root);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
