// ─── FORMATTERS ───────────────────────────────────────────────────────────────
export const fmtCurrency = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

export const fmtShort = (n) => {
  if (!n && n !== 0) return "₹0";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
  if (abs >= 100000)   return `${sign}₹${(abs / 100000).toFixed(2)} L`;
  return `${sign}₹${Math.round(abs).toLocaleString("en-IN")}`;
};

export const fmtDate = (d) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return d; }
};

export const fmtDateTime = (d) => {
  if (!d) return "—";
  try {
    const dt = d?.toDate ? d.toDate() : new Date(d);
    return dt.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return "—"; }
};

// ─── STATUS META ──────────────────────────────────────────────────────────────
export const STATUS_META = {
  Active:             { bg: "#00d4a122", color: "#00d4a1" },
  Completed:          { bg: "#6366f122", color: "#818cf8" },
  "On Hold":          { bg: "#f59e0b22", color: "#fbbf24" },
  "In Process":       { bg: "#f59e0b22", color: "#fbbf24" },
  Sanctioned:         { bg: "#10b98122", color: "#34d399" },
  "Part Disbursed":   { bg: "#0088ff22", color: "#60a5fa" },
  "Disbursed":        { bg: "#00d4a122", color: "#00d4a1" },
  "Fully Disbursed":  { bg: "#00d4a122", color: "#00d4a1" },
  Rejected:           { bg: "#ef444422", color: "#f87171" },
  Expired:            { bg: "#6b728022", color: "#9ca3af" },
  Pending:            { bg: "#f59e0b22", color: "#fbbf24" },
  Paid:               { bg: "#10b98122", color: "#34d399" },
  Unpaid:             { bg: "#ef444422", color: "#f87171" },
};

export const statusTag = (status) => {
  const m = STATUS_META[status] || { bg: "#ffffff11", color: "#e2e8f0" };
  return { background: m.bg, color: m.color };
};

// ─── ID GENERATOR ────────────────────────────────────────────────────────────
export const genId = (prefix, list) =>
  `${prefix}${String(list.length + 1).padStart(3, "0")}`;

// ─── REVENUE MODEL ────────────────────────────────────────────────────────────
/*
  GROSS = lump sum payout when disbursed
  NET   = per disbursement slot (each slot has its own amount + date)

  Bank Income  = disbursed loan amount * bank commission %
  Dev Payout:
    - Gross: total loan amount * developer payout % (payable on total loan amount)
    - Net:   disbursed amount * developer payout % (payable on disbursed amount per slot)
  Net Profit   = Bank Income - Dev Payout (our net earnings)
*/

export const calcSlotAmount  = (totalAmt, totalSlots) => totalSlots > 0 ? totalAmt / totalSlots : totalAmt;
export const calcBankIncome  = (disbursedAmt, bankPct) => (disbursedAmt * (bankPct || 0)) / 100;
export const calcDevPayout   = (baseLoanAmt, devPct)   => (baseLoanAmt * (devPct || 0)) / 100;

// Returns { bankIncome, devPayout, profit } — ONLY from actually disbursed amounts
export const calcCaseRevenue = (c, bank, project) => {
  if (!bank || !project) return { bankIncome: 0, devPayout: 0, profit: 0 };

  let bankIncome = 0;
  let devPayout  = 0;

  const isGross = (c.loanPayoutType || bank.agreementType) === "Gross";

  if (isGross) {
    // Gross: lump sum — only count if actually disbursed
    const isDisbursed = Boolean(c.disbursed || c.status === "Disbursed" || c.status === "Fully Disbursed" || Number(c.disbursedAmt) > 0);
    const disbAmt = Number(c.disbursedAmt) > 0 ? Number(c.disbursedAmt) : Number(c.loanAmt) || 0;
    if (isDisbursed && disbAmt > 0) {
      bankIncome = calcBankIncome(disbAmt, bank.agreementPct);

      // In Gross: we pay developer % on the TOTAL loan amount
      const totalLoanAmt = Number(c.loanAmt) > 0 ? Number(c.loanAmt) : disbAmt;
      devPayout  = calcDevPayout(totalLoanAmt, project.developerPayoutPct || 0);
    }
  } else {
    // Net: per slot — only count slots that are actually disbursed
    const slots = c.slots || [];
    const disbursedSlots = slots.filter(s => s.disbursed);

    disbursedSlots.forEach(s => {
      // Use slot's custom amount if set, else fallback to equal split
      const slotAmt = s.customAmt > 0 ? Number(s.customAmt) : calcSlotAmount(Number(c.loanAmt) || 0, c.totalSlots || 1);
      const slotIncome = calcBankIncome(slotAmt, bank.agreementPct);
      bankIncome += slotIncome;

      // In Net: we pay developer % on the DISBURSED amount
      if (c.devPayoutMode === "per_slot") {
        devPayout += calcDevPayout(slotAmt, project.developerPayoutPct || 0);
      }
    });

    if (c.devPayoutMode === "lump_sum") {
      const allDone = disbursedSlots.length === (c.totalSlots || 1);
      if (allDone) {
        const totalDisbursed = disbursedSlots.reduce((sum, s) => {
          return sum + (s.customAmt > 0 ? Number(s.customAmt) : calcSlotAmount(Number(c.loanAmt) || 0, c.totalSlots || 1));
        }, 0);
        devPayout = calcDevPayout(totalDisbursed, project.developerPayoutPct || 0);
      }
    }
  }

  return { bankIncome, devPayout, profit: bankIncome - devPayout };
};

// Legacy alias — kept for backward compatibility
export const calcCommission = calcBankIncome;

