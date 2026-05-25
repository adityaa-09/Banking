// ─── EXPORT UTILITIES ─────────────────────────────────────────────────────────
// Excel via SheetJS (xlsx), PDF via jspdf + jspdf-autotable
// Both run entirely in the browser — no server needed.

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { calcCaseRevenue, fmtShort, fmtDate } from "./helpers";

// ── Build report datasets ─────────────────────────────────────────────────────
export function buildReportData(cases, banks, projects) {
  const caseRows = cases.map(c => {
    const bank    = banks.find(b => b.id === c.bankId);
    const project = projects.find(p => p.id === c.projectId);
    const fakBank = bank ? { ...bank, agreementType: c.loanPayoutType || bank.agreementType } : bank;
    const rev     = calcCaseRevenue(c, fakBank, project);
    const isNet   = (c.loanPayoutType || bank?.agreementType) === "Net";
    const disbSlots = isNet ? (c.slots||[]).filter(s=>s.disbursed).length : null;

    return {
      "Client Name":      c.clientName || "",
      "Phone":            c.clientPhone || "",
      "Email":            c.clientEmail || "",
      "Project":          project?.name || "",
      "Developer":        project?.developer || "",
      "Bank":             bank?.name || "",
      "Payout Model":     c.loanPayoutType || bank?.agreementType || "",
      "Bank Comm %":      bank?.agreementPct || 0,
      "Dev Payout %":     project?.developerPayoutPct || 0,
      "Loan Amount":      c.loanAmt || 0,
      "Sanctioned Amt":   c.sanctionedAmt || 0,
      "Disbursed Amt":    c.disbursedAmt || 0,
      "Disbursed":        isNet ? `${disbSlots}/${c.totalSlots||"?"} slots` : (c.disbursed ? "Yes" : "No"),
      "Case Month":       c.month || "",
      "Disbursed Month":  c.disbursedMonth || "",
      "Disbursed Date":   c.disbursedDate || "",
      "Status":           c.status || "",
      "Sales POC":        c.salesPoc || "",
      "Sanction Date":    c.sanctionDate || "",
      "Sanction Doc":     c.sanctionDoc || "",
      "Drive Link":       c.driveLink || "",
      "Bank Income (₹)":  rev.bankIncome,
      "Dev Payout (₹)":   rev.devPayout,
      "Net Profit (₹)":   rev.profit,
      "Created By":       c.createdByName || "",
      "Remarks":          c.remarks || "",
    };
  });

  // Monthly P&L
  const monthMap = {};
  cases.forEach(c => {
    const bank    = banks.find(b => b.id === c.bankId);
    const project = projects.find(p => p.id === c.projectId);
    const fakBank = bank ? { ...bank, agreementType: c.loanPayoutType || bank.agreementType } : bank;
    const rev     = calcCaseRevenue(c, fakBank, project);
    const hasIncome = rev.bankIncome > 0;
    const m = hasIncome
      ? (c.disbursedMonth || c.disbursedDate?.slice(0,7) || c.month)
      : c.month;
    if (!m) return;
    if (!monthMap[m]) monthMap[m] = { Month: m, Cases: 0, "Bank Income": 0, "Dev Payout": 0, "Net Profit": 0 };
    monthMap[m].Cases++;
    if (hasIncome) {
      monthMap[m]["Bank Income"] += rev.bankIncome;
      monthMap[m]["Dev Payout"]  += rev.devPayout;
      monthMap[m]["Net Profit"]  += rev.profit;
    }
  });
  const monthRows = Object.values(monthMap).sort((a,b) => a.Month > b.Month ? 1 : -1);

  // Project P&L
  const projectMap = {};
  cases.forEach(c => {
    const bank    = banks.find(b => b.id === c.bankId);
    const project = projects.find(p => p.id === c.projectId);
    if (!project) return;
    const fakBank = bank ? { ...bank, agreementType: c.loanPayoutType || bank.agreementType } : bank;
    const rev = calcCaseRevenue(c, fakBank, project);
    const k = project.id;
    if (!projectMap[k]) projectMap[k] = {
      "Project": project.name, "Developer": project.developer,
      "Location": project.location, "Dev Payout %": project.developerPayoutPct || 0,
      "Cases": 0, "Bank Income": 0, "Dev Payout": 0, "Net Profit": 0,
    };
    projectMap[k].Cases++;
    projectMap[k]["Bank Income"] += rev.bankIncome;
    projectMap[k]["Dev Payout"]  += rev.devPayout;
    projectMap[k]["Net Profit"]  += rev.profit;
  });
  const projectRows = Object.values(projectMap).sort((a,b) => b["Net Profit"]-a["Net Profit"]);

  // Bank summary
  const bankMap = {};
  cases.forEach(c => {
    const bank    = banks.find(b => b.id === c.bankId);
    const project = projects.find(p => p.id === c.projectId);
    if (!bank) return;
    const fakBank = { ...bank, agreementType: c.loanPayoutType || bank.agreementType };
    const rev = calcCaseRevenue(c, fakBank, project);
    const k = bank.id;
    if (!bankMap[k]) bankMap[k] = {
      "Bank": bank.name, "Model": bank.agreementType,
      "Commission %": bank.agreementPct, "Cases": 0, "Bank Income": 0,
    };
    bankMap[k].Cases++;
    bankMap[k]["Bank Income"] += rev.bankIncome;
  });
  const bankRows = Object.values(bankMap).sort((a,b) => b["Bank Income"]-a["Bank Income"]);

  const totals = cases.reduce((acc, c) => {
    const bank    = banks.find(b => b.id === c.bankId);
    const project = projects.find(p => p.id === c.projectId);
    const fakBank = bank ? { ...bank, agreementType: c.loanPayoutType || bank.agreementType } : bank;
    const rev = calcCaseRevenue(c, fakBank, project);
    acc.bankIncome += rev.bankIncome;
    acc.devPayout  += rev.devPayout;
    acc.profit     += rev.profit;
    return acc;
  }, { bankIncome: 0, devPayout: 0, profit: 0 });

  return { caseRows, monthRows, projectRows, bankRows, totals };
}

// ── EXCEL EXPORT ──────────────────────────────────────────────────────────────
export function exportToExcel(cases, banks, projects, filename = "BW_Loans_Report") {
  const { caseRows, monthRows, projectRows, bankRows, totals } = buildReportData(cases, banks, projects);
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    ["BW Loan's — Banking Business Management Report"],
    ["Generated:", new Date().toLocaleString("en-IN")],
    [],
    ["SUMMARY"],
    ["Total Cases",       cases.length],
    ["Bank Income",       totals.bankIncome],
    ["Developer Payout",  totals.devPayout],
    ["Net Profit",        totals.profit],
    [],
    ["Gross Model Cases", cases.filter(c => (c.loanPayoutType || banks.find(b=>b.id===c.bankId)?.agreementType) === "Gross").length],
    ["Net Model Cases",   cases.filter(c => (c.loanPayoutType || banks.find(b=>b.id===c.bankId)?.agreementType) === "Net").length],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet["!cols"] = [{ wch: 28 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

  // All Cases
  const casesSheet = XLSX.utils.json_to_sheet(caseRows);
  casesSheet["!cols"] = Object.keys(caseRows[0] || {}).map(() => ({ wch: 18 }));
  XLSX.utils.book_append_sheet(wb, casesSheet, "All Cases");

  // Monthly P&L
  const monthSheet = XLSX.utils.json_to_sheet(monthRows);
  monthSheet["!cols"] = [{ wch:12 },{ wch:8 },{ wch:18 },{ wch:16 },{ wch:16 }];
  XLSX.utils.book_append_sheet(wb, monthSheet, "Monthly P&L");

  // Project P&L
  const projectSheet = XLSX.utils.json_to_sheet(projectRows);
  projectSheet["!cols"] = [{ wch:28 },{ wch:20 },{ wch:16 },{ wch:12 },{ wch:8 },{ wch:16 },{ wch:16 },{ wch:16 }];
  XLSX.utils.book_append_sheet(wb, projectSheet, "Project P&L");

  // Bank Summary
  const bankSheet = XLSX.utils.json_to_sheet(bankRows);
  bankSheet["!cols"] = [{ wch:20 },{ wch:10 },{ wch:14 },{ wch:8 },{ wch:16 }];
  XLSX.utils.book_append_sheet(wb, bankSheet, "Bank Summary");

  const date = new Date().toISOString().split("T")[0];
  XLSX.writeFile(wb, `${filename}_${date}.xlsx`);
}

// ── PDF EXPORT ────────────────────────────────────────────────────────────────
export function exportToPDF(cases, banks, projects, filename = "BW_Loans_Report") {
  const { caseRows, monthRows, projectRows, bankRows, totals } = buildReportData(cases, banks, projects);
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const DARK  = [6, 12, 24];
  const GREEN = [0, 212, 161];
  const RED   = [239, 68, 68];
  const WHITE = [255, 255, 255];
  const GREY  = [148, 163, 184];
  const pageW = doc.internal.pageSize.getWidth();
  const date  = new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });

  const addHeader = (title, pageNum) => {
    doc.setFillColor(...DARK);
    doc.rect(0, 0, pageW, 18, "F");
    doc.setTextColor(...GREEN); doc.setFontSize(13); doc.setFont("helvetica","bold");
    doc.text("BW Loan's", 10, 12);
    doc.setTextColor(...GREY); doc.setFontSize(9); doc.setFont("helvetica","normal");
    doc.text(`Banking Management Report  ·  ${date}`, 50, 12);
    doc.setTextColor(...WHITE); doc.setFontSize(10); doc.setFont("helvetica","bold");
    doc.text(title, pageW/2, 12, { align:"center" });
    doc.setTextColor(...GREY); doc.setFontSize(8);
    doc.text(`Page ${pageNum}`, pageW-10, 12, { align:"right" });
  };

  const tableStyles = {
    styles:         { fontSize:8, cellPadding:3, textColor:[226,232,240], fillColor:[10,20,45] },
    headStyles:     { fillColor:[15,30,70], textColor:GREEN, fontStyle:"bold", fontSize:8 },
    alternateRowStyles: { fillColor:[12,22,50] },
    margin:         { left:10, right:10 },
  };

  // Page 1: Summary + Monthly
  addHeader("Executive Summary", 1);
  const kpis = [
    { label:"Total Cases",   value:String(cases.length),         color:[99,102,241] },
    { label:"Bank Income",   value:fmtShort(totals.bankIncome),  color:GREEN },
    { label:"Dev Payout",    value:fmtShort(totals.devPayout),   color:RED   },
    { label:"Net Profit",    value:fmtShort(totals.profit),      color:[16,185,129] },
  ];
  const boxW = (pageW-20)/4;
  kpis.forEach((k,i) => {
    const x = 10 + i*(boxW+2);
    doc.setFillColor(20,30,60); doc.roundedRect(x,22,boxW-2,22,3,3,"F");
    doc.setTextColor(...k.color); doc.setFontSize(14); doc.setFont("helvetica","bold");
    doc.text(k.value, x+(boxW-2)/2, 33, { align:"center" });
    doc.setTextColor(...GREY); doc.setFontSize(7); doc.setFont("helvetica","normal");
    doc.text(k.label, x+(boxW-2)/2, 39, { align:"center" });
  });

  doc.setTextColor(...WHITE); doc.setFontSize(10); doc.setFont("helvetica","bold");
  doc.text("Monthly P&L Breakdown", 10, 52);

  autoTable(doc, {
    startY: 56,
    head: [["Month","Cases","Bank Income","Dev Payout","Net Profit"]],
    body: [
      ...monthRows.map(r => [r.Month, r.Cases, fmtShort(r["Bank Income"]), fmtShort(r["Dev Payout"]), fmtShort(r["Net Profit"])]),
      ["TOTAL", cases.length, fmtShort(totals.bankIncome), fmtShort(totals.devPayout), fmtShort(totals.profit)],
    ],
    ...tableStyles,
    columnStyles: { 2:{textColor:GREEN}, 3:{textColor:RED}, 4:{textColor:[16,185,129]} },
  });

  // Page 2: Project P&L + Bank summary
  doc.addPage();
  addHeader("Project P&L & Bank Summary", 2);

  doc.setTextColor(...WHITE); doc.setFontSize(10); doc.setFont("helvetica","bold");
  doc.text("Project-wise P&L", 10, 26);
  autoTable(doc, {
    startY: 30,
    head: [["Project","Developer","Location","Dev %","Cases","Bank Income","Dev Payout","Net Profit"]],
    body: projectRows.map(r => [r.Project, r.Developer, r.Location, `${r["Dev Payout %"]}%`, r.Cases, fmtShort(r["Bank Income"]), fmtShort(r["Dev Payout"]), fmtShort(r["Net Profit"])]),
    ...tableStyles,
    columnStyles: { 5:{textColor:GREEN}, 6:{textColor:RED}, 7:{textColor:[16,185,129]} },
  });

  const afterY = (doc.lastAutoTable?.finalY || 80) + 10;
  doc.setTextColor(...WHITE); doc.setFontSize(10); doc.setFont("helvetica","bold");
  doc.text("Bank-wise Income", 10, afterY);
  autoTable(doc, {
    startY: afterY + 4,
    head: [["Bank","Model","Commission %","Cases","Income Earned"]],
    body: bankRows.map((r,i) => [`#${i+1} ${r.Bank}`, r.Model, `${r["Commission %"]}%`, r.Cases, fmtShort(r["Bank Income"])]),
    ...tableStyles,
    columnStyles: { 4:{textColor:GREEN} },
  });

  // Page 3: All Cases
  doc.addPage();
  addHeader("All Cases Detail", 3);
  autoTable(doc, {
    startY: 24,
    head: [["Client","Phone","Project","Bank","Model","Loan Amt","Status","Disbursed","Month","Bank Income","Dev Payout","Profit","Sales POC","Created By"]],
    body: caseRows.map(r => [
      r["Client Name"], r.Phone, r.Project, r.Bank, r["Payout Model"],
      fmtShort(r["Loan Amount"]), r.Status, r.Disbursed, r["Case Month"],
      fmtShort(r["Bank Income (₹)"]), fmtShort(r["Dev Payout (₹)"]), fmtShort(r["Net Profit (₹)"]),
      r["Sales POC"], r["Created By"],
    ]),
    ...tableStyles,
    styles: { fontSize:6.5, cellPadding:2, textColor:[226,232,240], fillColor:[10,20,45] },
    headStyles: { fillColor:[15,30,70], textColor:GREEN, fontStyle:"bold", fontSize:6.5 },
    columnStyles: { 9:{textColor:GREEN}, 10:{textColor:RED}, 11:{textColor:[16,185,129]} },
  });

  const dateStr = new Date().toISOString().split("T")[0];
  doc.save(`${filename}_${dateStr}.pdf`);
}
