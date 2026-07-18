/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, FormEvent, ChangeEvent } from "react";
import {
  Ship,
  Users,
  Anchor,
  Coins,
  Trash2,
  Edit,
  Plus,
  Search,
  FileSpreadsheet,
  FolderPlus,
  RefreshCw,
  Download,
  Upload,
  TrendingUp,
  Receipt,
  ShieldCheck,
  AlertTriangle,
  Info,
  Calendar,
  X,
  CreditCard,
  DollarSign,
  Briefcase,
  Smartphone,
  ExternalLink
} from "lucide-react";

import { Boat, DailyReturn, BoatExpense, SponsorExpense, MonthlyRecord } from "./types";
import { INITIAL_MONTHLY_RECORDS, EXPENSE_TYPES, SPONSOR_EXPENSE_TYPES } from "./utils/mockData";

export default function App() {

  // --- Boat Specific Management States ---
  const [boats, setBoats] = useState<Boat[]>(() => {
    const saved = localStorage.getItem("boat_accounts_boats_v3");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      { id: "bakri", name: "بكري", licenseNumber: "ب-٢٢٨٩٠", crewCount: 16 }
    ];
  });

  const [selectedBoatId, setSelectedBoatId] = useState<string>(() => {
    const saved = localStorage.getItem("boat_accounts_selected_boat_v3");
    return saved || "bakri";
  });

  const [isNewBoatModalOpen, setIsNewBoatModalOpen] = useState(false);
  const [newBoatName, setNewBoatName] = useState("");
  const [newBoatLicense, setNewBoatLicense] = useState("");
  const [newBoatCrewCount, setNewBoatCrewCount] = useState("");

  // Save boats to localStorage
  useEffect(() => {
    localStorage.setItem("boat_accounts_boats_v3", JSON.stringify(boats));
  }, [boats]);

  // --- Persistent State ---
  const [records, setRecords] = useState<MonthlyRecord[]>(() => {
    const saved = localStorage.getItem("boat_accounts_records_v3");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error reading boat accounts from localStorage", e);
      }
    }
    return INITIAL_MONTHLY_RECORDS.map(rec => ({ ...rec, boatId: "bakri" }));
  });

  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(() => {
    const now = new Date();
    const currentYear = String(now.getFullYear());
    const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
    return `${currentYear}-${currentMonth}`;
  });
  const [currency, setCurrency] = useState<string>("ر.س"); // Default: Saudi Riyal

  // --- Owner Share Factor Configuration (قلاطة المالك) ---
  const [ownerShareFactor, setOwnerShareFactor] = useState<number>(() => {
    const saved = localStorage.getItem("boat_accounts_owner_share_factor_v4");
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= 0) {
        return parsed;
      }
    }
    return 4.5; // Default classic ratio (11.11% of Net closing)
  });

  // Save factor whenever it changes
  useEffect(() => {
    localStorage.setItem("boat_accounts_owner_share_factor_v4", String(ownerShareFactor));
  }, [ownerShareFactor]);

  // --- Dynamic Search & Filter State ---
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"returns" | "boat_expenses" | "sponsor_expenses">("returns");

  // --- Modal States for Creating New Period ---
  const [isNewPeriodModalOpen, setIsNewPeriodModalOpen] = useState(false);
  const [isNewReturnModalOpen, setIsNewReturnModalOpen] = useState(false);
  const [newPeriodYear, setNewPeriodYear] = useState("2026");
  const [newPeriodMonth, setNewPeriodMonth] = useState("07");

  // --- Form States for Quick Addition ---
  // 1- Daily Return Form
  const [newReturnNumber, setNewReturnNumber] = useState("");
  const [newReturnDate, setNewReturnDate] = useState("");
  const [newReturnAmount, setNewReturnAmount] = useState("");
  const [newReturnNotes, setNewReturnNotes] = useState("");

  // 2- Boat Expense Form
  const [newExpenseType, setNewExpenseType] = useState(EXPENSE_TYPES[0]);
  const [newExpenseCustomType, setNewExpenseCustomType] = useState("");
  const [newExpenseDate, setNewExpenseDate] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");
  const [newExpenseNotes, setNewExpenseNotes] = useState("");

  // 3- Sponsor Expense Form
  const [newSponsorType, setNewSponsorType] = useState(SPONSOR_EXPENSE_TYPES[0]);
  const [newSponsorCustomType, setNewSponsorCustomType] = useState("");
  const [newSponsorDate, setNewSponsorDate] = useState("");
  const [newSponsorAmount, setNewSponsorAmount] = useState("");
  const [newSponsorNotes, setNewSponsorNotes] = useState("");

  // --- Edit Modal States ---
  const [editingItem, setEditingItem] = useState<{
    id: string;
    type: "return" | "boat_expense" | "sponsor_expense";
    data: any;
  } | null>(null);

  // --- Notification Message ---
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Save records to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("boat_accounts_records_v3", JSON.stringify(records));
  }, [records]);

  // Toast auto-clear
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Show a message
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
  };

  // Find currently active boat details
  const currentBoat = useMemo(() => {
    return boats.find(b => b.id === selectedBoatId) || boats[0] || { id: "bakri", name: "بكري", licenseNumber: "ب-٢٢٨٩٠" };
  }, [boats, selectedBoatId]);

  // Find currently active period data (scoped under selectedBoatId)
  const currentRecord = useMemo(() => {
    const boatRecords = records.filter(r => (r.boatId === selectedBoatId || (!r.boatId && selectedBoatId === "bakri")));
    let rec = boatRecords.find((r) => r.id === selectedPeriodId);
    if (!rec) {
      if (boatRecords.length > 0) {
        rec = boatRecords[0];
      } else {
        const now = new Date();
        const currentYear = String(now.getFullYear());
        const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
        const monthNamesAr: { [key: string]: string } = {
          "01": "يناير", "02": "فبراير", "03": "مارس", "04": "أبريل",
          "05": "مايو", "06": "يونيو", "07": "يوليو", "08": "أغسطس",
          "09": "سبتمبر", "10": "أكتوبر", "11": "نوفمبر", "12": "ديسمبر"
        };
        rec = {
          id: `${currentYear}-${currentMonth}`,
          name: `${monthNamesAr[currentMonth]} ${currentYear}`,
          boatId: selectedBoatId,
          dailyReturns: [],
          boatExpenses: [],
          sponsorExpenses: []
        };
      }
    }
    return rec;
  }, [records, selectedPeriodId, selectedBoatId]);

  // Synchronize period selection when selected boat changes
  useEffect(() => {
    const boatRecords = records.filter(r => (r.boatId === selectedBoatId || (!r.boatId && selectedBoatId === "bakri")));
    if (boatRecords.length > 0) {
      const hasCurrent = boatRecords.some(r => r.id === selectedPeriodId);
      if (!hasCurrent) {
        setSelectedPeriodId(boatRecords[0].id);
      }
    } else {
      const now = new Date();
      const currentYear = String(now.getFullYear());
      const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
      setSelectedPeriodId(`${currentYear}-${currentMonth}`);
    }
    localStorage.setItem("boat_accounts_selected_boat_v3", selectedBoatId);
  }, [selectedBoatId]);

  // Calculate stats for current record
  const stats = useMemo(() => {
    const totalReturns = currentRecord.dailyReturns.reduce((sum, item) => sum + item.netAmount, 0);
    const totalBoatExpenses = currentRecord.boatExpenses.reduce((sum, item) => sum + item.amount, 0);
    const totalSponsorExpenses = currentRecord.sponsorExpenses.reduce((sum, item) => sum + item.amount, 0);
    const netClosing = totalReturns - totalBoatExpenses;

    // Shares System based on a dynamic divisor setting:
    // نص الصافي = إجمالي صافي الإقفال ÷ 2
    // نص المالك الأساسي = نص الصافي
    // قلاطة المالك = نص الصافي ÷ قاسم_قلاطة_المالك
    // قلاطة العمال النهائية = نص الصافي - قلاطة المالك
    // نص المالك النهائي بعد الخصم = نص المالك الأساسي + قلاطة المالك - إجمالي مصاريف الكفيل
    const halfNet = netClosing > 0 ? (netClosing / 2) : 0;
    const ownerBaseShare = halfNet; 
    // If ownerShareFactor is exactly 0, owner Extra Share (قلاطة المالك) is cancelled completely (0)
    const factorNum = typeof ownerShareFactor === "number" ? ownerShareFactor : parseFloat(ownerShareFactor as string);
    const validFactor = !isNaN(factorNum) ? factorNum : 4.5;
    const ownerExtraShare = (halfNet > 0 && validFactor > 0) ? (halfNet / validFactor) : 0;
    const crewShare = halfNet > 0 ? (halfNet - ownerExtraShare) : 0;
    const ownerFinalShare = ownerBaseShare + ownerExtraShare - totalSponsorExpenses;

    // Percentages of total netClosing
    const crewPercent = netClosing > 0 ? ((crewShare / netClosing) * 100) : 0;
    const ownerExtraPercent = netClosing > 0 ? ((ownerExtraShare / netClosing) * 105) : 0; // Relative visual proportion
    // Actually, let's make it super accurate math percentages out of 100% of Net Closing:
    const mathCrewPercent = netClosing > 0 ? ((crewShare / netClosing) * 100) : 0;
    const mathOwnerExtraPercent = netClosing > 0 ? ((ownerExtraShare / netClosing) * 100) : 0;
    const mathOwnerBasePercent = netClosing > 0 ? 50 : 0; // 50.0% always

    return {
      totalReturns,
      totalBoatExpenses,
      totalSponsorExpenses,
      netClosing,
      halfNet,
      ownerBaseShare,
      ownerExtraShare,
      crewShare,
      ownerFinalShare,
      crewPercent: mathCrewPercent,
      ownerExtraPercent: mathOwnerExtraPercent,
      ownerBasePercent: mathOwnerBasePercent
    };
  }, [currentRecord, ownerShareFactor]);

  // Set default dates inside inputs upon selecting a month
  useEffect(() => {
    if (selectedPeriodId) {
      const todayString = new Date().toISOString().substring(0, 10);
      const parts = selectedPeriodId.split("-");
      const year = parts[0];
      const month = parts[1];
      const defaultDate = `${year}-${month}-15`;
      setNewReturnDate(defaultDate);
      setNewExpenseDate(defaultDate);
      setNewSponsorDate(defaultDate);
      
      // Auto-suggest next return number
      if (currentRecord && currentRecord.dailyReturns.length > 0) {
        const maxNum = Math.max(...currentRecord.dailyReturns.map(r => r.returnNumber));
        setNewReturnNumber(isFinite(maxNum) ? String(maxNum + 1) : "1");
      } else {
        setNewReturnNumber("1");
      }
    }
  }, [selectedPeriodId, currentRecord]);

  // Add Dynamic Period Handler
  const handleAddNewPeriod = () => {
    const monthNamesAr: { [key: string]: string } = {
      "01": "يناير", "02": "فبراير", "03": "مارس", "04": "أبريل",
      "05": "مايو", "06": "يونيو", "07": "يوليو", "08": "أغسطس",
      "09": "سبتمبر", "10": "أكتوبر", "11": "نوفمبر", "12": "ديسمبر"
    };
    
    const periodId = `${newPeriodYear}-${newPeriodMonth}`;
    const periodName = `${monthNamesAr[newPeriodMonth]} ${newPeriodYear}`;

    if (records.some((r) => r.id === periodId && (r.boatId === selectedBoatId || (!r.boatId && selectedBoatId === "bakri")))) {
      showToast("هذه الفترة المحاسبية مضافة بالفعل مسبقاً لهذا المركب!", "error");
      return;
    }

    const newRecord: MonthlyRecord = {
      id: periodId,
      name: periodName,
      boatId: selectedBoatId,
      dailyReturns: [],
      boatExpenses: [],
      sponsorExpenses: []
    };

    const updated = [newRecord, ...records].sort((a, b) => b.id.localeCompare(a.id));
    setRecords(updated);
    setSelectedPeriodId(periodId);
    setIsNewPeriodModalOpen(false);
    showToast(`تم فتح شهر حسابي جديد بنجاح: ${periodName}`, "success");
  };

  // Add New Boat Handler
  const handleAddBoat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoatName.trim()) {
      showToast("يرجى إدخال اسم المركب", "error");
      return;
    }
    const newBoat: Boat = {
      id: "boat_" + Date.now(),
      name: newBoatName.trim(),
      licenseNumber: newBoatLicense.trim() || undefined,
      crewCount: newBoatCrewCount.trim() ? parseInt(newBoatCrewCount) : undefined,
    };
    setBoats([...boats, newBoat]);
    setSelectedBoatId(newBoat.id);
    setNewBoatName("");
    setNewBoatLicense("");
    setNewBoatCrewCount("");
    setIsNewBoatModalOpen(false);
    showToast(`تمت إضافة المركب "${newBoat.name}" بنجاح!`, "success");
  };

  // Add Daily Return
  const handleAddReturn = (e: React.FormEvent) => {
    e.preventDefault();
    const returnNum = parseInt(newReturnNumber);
    const amount = parseFloat(newReturnAmount);

    if (isNaN(returnNum) || returnNum <= 0) {
      showToast("يرجى إدخال رقم رد صحيح", "error");
      return;
    }
    if (isNaN(amount) || amount < 0) {
      showToast("يرجى إدخال مبلغ صحيح لصافي الرد", "error");
      return;
    }
    if (!newReturnDate) {
      showToast("يرجى اختيار تاريخ الرد", "error");
      return;
    }

    const newReturnItem: DailyReturn = {
      id: "r_" + Date.now(),
      returnNumber: returnNum,
      date: newReturnDate,
      netAmount: amount,
      notes: newReturnNotes.trim() || undefined
    };

    setRecords(prev => prev.map(rec => {
      if (rec.id === selectedPeriodId) {
        // Avoid duplicate return numbers in the same month ideally, but allow or warn
        const exists = rec.dailyReturns.some(r => r.returnNumber === returnNum);
        if (exists) {
          showToast(`تنبيه: يوجد مسبقاً رد بالرقم ${returnNum}، تم إضافته لغرض السجلات.`, "info");
        }
        return {
          ...rec,
          dailyReturns: [...rec.dailyReturns, newReturnItem].sort((a, b) => a.returnNumber - b.returnNumber)
        };
      }
      return rec;
    }));

    // Reset inputs
    setNewReturnAmount("");
    setNewReturnNotes("");
    setNewReturnNumber(String(returnNum + 1));
    setIsNewReturnModalOpen(false);
    showToast("تم إضافة الرد اليومي بنجاح");
  };

  // Add Boat Expense
  const handleAddBoatExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newExpenseAmount);

    if (isNaN(amount) || amount <= 0) {
      showToast("يرجى إدخال مبلغ مصروف صحيح", "error");
      return;
    }
    if (!newExpenseDate) {
      showToast("يرجى تحديد تاريخ المصروف", "error");
      return;
    }

    const typeToUse = newExpenseType === "أخرى" ? (newExpenseCustomType.trim() || "مصروف آخر") : newExpenseType;

    const newExpense: BoatExpense = {
      id: "be_" + Date.now(),
      type: typeToUse,
      date: newExpenseDate,
      amount,
      notes: newExpenseNotes.trim() || undefined
    };

    setRecords(prev => prev.map(rec => {
      if (rec.id === selectedPeriodId) {
        return {
          ...rec,
          boatExpenses: [newExpense, ...rec.boatExpenses]
        };
      }
      return rec;
    }));

    setNewExpenseAmount("");
    setNewExpenseNotes("");
    setNewExpenseCustomType("");
    showToast("تم إضافة مصروف المركب بنجاح");
  };

  // Add Sponsor Expense
  const handleAddSponsorExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newSponsorAmount);

    if (isNaN(amount) || amount <= 0) {
      showToast("يرجى إدخال مبلغ مصروف صحيح على الكفيل", "error");
      return;
    }
    if (!newSponsorDate) {
      showToast("يرجى تحديد تاريخ مصروف الكفيل", "error");
      return;
    }

    const typeToUse = newSponsorType === "أخرى" ? (newSponsorCustomType.trim() || "مصروف كفيل آخر") : newSponsorType;

    const newSponsor: SponsorExpense = {
      id: "se_" + Date.now(),
      type: typeToUse,
      date: newSponsorDate,
      amount,
      notes: newSponsorNotes.trim() || undefined
    };

    setRecords(prev => prev.map(rec => {
      if (rec.id === selectedPeriodId) {
        return {
          ...rec,
          sponsorExpenses: [newSponsor, ...rec.sponsorExpenses]
        };
      }
      return rec;
    }));

    setNewSponsorAmount("");
    setNewSponsorNotes("");
    setNewSponsorCustomType("");
    showToast("تم إضافة المصروف على الكفيل بنجاح");
  };

  // Delete Action Generic
  const handleDeleteItem = (id: string, type: "return" | "boat_expense" | "sponsor_expense") => {
    if (!window.confirm("هل أنت متأكد من رغبتك في حذف هذا العنصر نهائياً؟")) {
      return;
    }

    setRecords(prev => prev.map(rec => {
      if (rec.id === selectedPeriodId) {
        if (type === "return") {
          return { ...rec, dailyReturns: rec.dailyReturns.filter(item => item.id !== id) };
        } else if (type === "boat_expense") {
          return { ...rec, boatExpenses: rec.boatExpenses.filter(item => item.id !== id) };
        } else {
          return { ...rec, sponsorExpenses: rec.sponsorExpenses.filter(item => item.id !== id) };
        }
      }
      return rec;
    }));

    showToast("تم الحذف بنجاح", "info");
  };

  // Open Edit Dialog
  const handleStartEdit = (item: any, type: "return" | "boat_expense" | "sponsor_expense") => {
    setEditingItem({ id: item.id, type, data: { ...item } });
  };

  // Save Edits Handler
  const handleSaveEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const { id, type, data } = editingItem;

    if (type === "return") {
      const netAmountNum = parseFloat(data.netAmount);
      const returnNumberNum = parseInt(data.returnNumber);
      if (isNaN(netAmountNum) || netAmountNum < 0 || isNaN(returnNumberNum) || returnNumberNum <= 0) {
        showToast("يرجى التأكد من ملء البيانات بأرقام صالحة", "error");
        return;
      }
    } else {
      const amountNum = parseFloat(data.amount);
      if (isNaN(amountNum) || amountNum <= 0 || !data.type.trim()) {
        showToast("يرجى التأكد من إدخال نوع المصروف ومبلغ صالح", "error");
        return;
      }
    }

    setRecords(prev => prev.map(rec => {
      if (rec.id === selectedPeriodId) {
        if (type === "return") {
          return {
            ...rec,
            dailyReturns: rec.dailyReturns.map(item => item.id === id ? {
              ...item,
              returnNumber: parseInt(data.returnNumber),
              date: data.date,
              netAmount: parseFloat(data.netAmount),
              notes: data.notes
            } : item).sort((a, b) => a.returnNumber - b.returnNumber)
          };
        } else if (type === "boat_expense") {
          return {
            ...rec,
            boatExpenses: rec.boatExpenses.map(item => item.id === id ? {
              ...item,
              type: data.type,
              date: data.date,
              amount: parseFloat(data.amount),
              notes: data.notes
            } : item)
          };
        } else if (type === "sponsor_expense") {
          return {
            ...rec,
            sponsorExpenses: rec.sponsorExpenses.map(item => item.id === id ? {
              ...item,
              type: data.type,
              date: data.date,
              amount: parseFloat(data.amount),
              notes: data.notes
            } : item)
          };
        }
      }
      return rec;
    }));

    setEditingItem(null);
    showToast("تم تعديل السجل بنجاح", "success");
  };

  // Export current period data to Excel CSV format
  const handleExportMonthCSV = () => {
    // Generate beautiful spreadsheet readable encoding UTF-8 (with BOM for MS Excel Arabic display)
    let csvContent = "\uFEFF"; // BOM
    csvContent += "تطبيق حسابات المراكب (لافي)\n";
    csvContent += `تقرير الحسابات لشهر: ,${currentRecord.name}\n`;
    csvContent += `تاريخ التصدير: ,${new Date().toLocaleDateString("ar-EG")}\n`;
    csvContent += `العملة: ,${currency}\n\n`;

    // 1. Summary Statistics
    csvContent += "ملخص الحسابات الإجمالي,المبلغ\n";
    csvContent += `إجمالي الردود اليومية,${stats.totalReturns}\n`;
    csvContent += `إجمالي مصاريف المركب,${stats.totalBoatExpenses}\n`;
    csvContent += `صافي الإقفال (القابل للتوزيع),${stats.netClosing}\n`;
    csvContent += `إجمالي مصاريف الكفيل,${stats.totalSponsorExpenses}\n`;
    csvContent += "توزيع الأنصبة بالتفصيل (النظام الخاص للنصف),\n";
    csvContent += `نصف الصافي القابل للتوزيع,${stats.halfNet.toFixed(2)}\n`;
    csvContent += `نصيب المالك الأساسي (نصف الصافي),${stats.ownerBaseShare.toFixed(2)}\n`;
    const csvFactorText = ownerShareFactor === 0 ? "ملغاة" : `نصف الصافي ÷ ${ownerShareFactor}`;
    csvContent += `قلاطة المالك (${csvFactorText}),${stats.ownerExtraShare.toFixed(2)}\n`;
    csvContent += `قلاطة العمال النهائية (نصف الصافي - قلاطة المالك),${stats.crewShare.toFixed(2)}\n`;
    csvContent += `صافي مستحقات المالك النهائي بعد خصم مصاريف الكفيل,${stats.ownerFinalShare.toFixed(2)}\n\n`;

    // 2. Returns Data Section
    csvContent += "--- أولاً: الردود اليومية ---\n";
    csvContent += "رقم الرد,تاريخ الرد,صافي الرد,الملاحظات\n";
    currentRecord.dailyReturns.forEach(r => {
      csvContent += `${r.returnNumber},${r.date},${r.netAmount},"${r.notes || ''}"\n`;
    });
    csvContent += "\n";

    // 3. Boat Expenses Data Section
    csvContent += "--- ثانياً: مصاريف المركب المعفاة ---\n";
    csvContent += "نوع المصروف,تاريخ المصروف,المبلغ,الملاحظات\n";
    currentRecord.boatExpenses.forEach(e => {
      csvContent += `"${e.type}",${e.date},${e.amount},"${e.notes || ''}"\n`;
    });
    csvContent += "\n";

    // 4. Sponsor Expenses Data Section
    csvContent += "--- ثالثاً: مصاريف على الكفيل ---\n";
    csvContent += "نوع المصروف,تاريخ المصروف,المبلغ,الملاحظات\n";
    currentRecord.sponsorExpenses.forEach(s => {
      csvContent += `"${s.type}",${s.date},${s.amount},"${s.notes || ''}"\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `حسابات_مركب_لافي_${currentRecord.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("تم تحميل ملف الحسابات كجدول إكسل بنجاح!", "success");
  };

  // Full Database Export (JSON Backup)
  const handleExportBackupJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(records, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `نسخة_احتياطية_حسابات_لافي_${Date.now()}.json`);
    dlAnchorElem.click();
    showToast("تم تصدير نسخة احتياطية كاملة للملفات بنجاح!", "success");
  };

  // Database Import (JSON Restore)
  const handleImportBackupJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id) {
            setRecords(parsed);
            if (parsed[0].id) {
              setSelectedPeriodId(parsed[0].id);
            }
            showToast("تم استعادة البيانات والنسخة الاحتياطية بنجاح!", "success");
          } else {
            showToast("بنية هذا الملف غير صحيحة لتطبيق حسابات المراكب", "error");
          }
        } catch (err) {
          showToast("خطأ في قراءة ملف النسخة الاحتياطية الـ JSON", "error");
        }
      };
    }
  };

  // Reset to default data (starts completely empty)
  const handleResetToDefaults = () => {
    if (window.confirm("هل أنت متأكد من رغبتك في تصفير جميع الحسابات والبدء من جديد؟ سيؤدي هذا لمسح جميع السجلات الحالية نهائياً.")) {
      setRecords([]);
      const now = new Date();
      const currentYear = String(now.getFullYear());
      const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
      setSelectedPeriodId(`${currentYear}-${currentMonth}`);
      showToast("تم تصفير جميع السجلات والبدء بحسابات جديدة بنجاح", "success");
    }
  };

  // Delete Current accounting month
  const handleDeleteCurrentMonth = () => {
    if (records.length <= 1) {
      showToast("لا يمكن حذف هذا الشهر المالي الدفعتري المتبقي، يحضر وجود فترة حسابية واحدة على الأقل.", "error");
      return;
    }
    if (window.confirm(`هل أنت متأكد من مسح جميع سجلات الشهر الحسابي (${currentRecord.name}) بالكامل؟ لا يمكن التراجع.`)) {
      const remaining = records.filter(r => r.id !== selectedPeriodId);
      setRecords(remaining);
      setSelectedPeriodId(remaining[0].id);
      showToast(`تم حذف الشهر الحسابي بنجاح`, "info");
    }
  };

  // Dynamically filter lists inside tables according to Search Box input
  const filteredReturns = currentRecord.dailyReturns.filter(
    (r) =>
      r.returnNumber.toString().includes(searchTerm) ||
      r.date.includes(searchTerm) ||
      (r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredBoatExpenses = currentRecord.boatExpenses.filter(
    (e) =>
      e.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.date.includes(searchTerm) ||
      (e.notes && e.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredSponsorExpenses = currentRecord.sponsorExpenses.filter(
    (s) =>
      s.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.date.includes(searchTerm) ||
      (s.notes && s.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen pb-16 bg-[#F3F7FA]" id="main_container">
      {/* Toast Notification */}
      {toast && (
        <div
          id="toast-notification"
          className={`fixed bottom-5 left-5 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 border transition-all duration-300 max-w-sm ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : toast.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-sky-50 border-sky-200 text-sky-800"
          }`}
        >
          <div className="p-1 rounded-lg bg-white shadow-sm">
            {toast.type === "success" ? (
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            ) : toast.type === "error" ? (
              <AlertTriangle className="h-5 w-5 text-rose-600" />
            ) : (
              <Info className="h-5 w-5 text-sky-600" />
            )}
          </div>
          <span className="font-semibold text-sm">{toast.message}</span>
        </div>
      )}

      {/* Hero Header bar inspired by boats, ports, and the sea */}
      <header className="relative bg-gradient-to-r from-cyan-950 via-[#0C243B] to-slate-900 text-white shadow-xl overflow-hidden py-8 px-4" id="app-header">
        {/* Subtle decorative waves/curves */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=2000')] bg-cover opacity-5 pointer-events-none mix-blend-overlay"></div>
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-[#F3F7FA] to-transparent"></div>

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-right">
            {/* STUNNING CUSTOM BAKRI SAILBOAT & ANCHOR SVG LOGO */}
            <div className="p-2 bg-white rounded-2xl shadow-xl flex-shrink-0 cursor-pointer hover:scale-105 duration-300 group transition-all" id="ship-icon-container">
              <svg viewBox="0 0 512 512" className="h-16 w-16" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Glowing background */}
                <circle cx="256" cy="256" r="230" fill="#f8fafc" />

                {/* Terracotta Sail (Wind Swept Background) */}
                <path d="M 270 50 C 240 100, 165 210, 140 335 C 210 380, 310 340, 360 290 C 325 200, 295 100, 270 50 Z" fill="#C2633C" />

                {/* Left Flourished Lettering */}
                <path d="M 150 240 C 100 245, 60 210, 80 150 C 95 110, 140 120, 160 160 C 180 200, 110 270, 60 240 C 40 220, 30 190, 50 160 C 45 180, 50 220, 80 250 C 110 275, 140 260, 150 240 Z" fill="#132247" />
                
                {/* Calligraphy Dots on Left */}
                <circle cx="70" cy="115" r="9" fill="#132247" />
                <circle cx="95" cy="120" r="9" fill="#132247" />
                <circle cx="115" cy="140" r="9" fill="#132247" />

                {/* Center Calligraphy Body */}
                <path d="M 130 210 C 180 170, 280 230, 350 250 C 300 240, 200 180, 130 210 Z" fill="#132247" />
                <path d="M 180 180 C 220 120, 280 150, 310 220 C 260 160, 200 140, 180 180 Z" fill="#132247" />

                {/* Tall Vertical Arab Alif/Lam styles */}
                <path d="M 230 110 C 210 80, 190 60, 220 50 C 240 45, 250 70, 240 110 C 230 150, 280 250, 300 280 C 285 240, 240 150, 230 110 Z" fill="#132247" />
                <path d="M 270 120 C 260 80, 240 60, 260 50 C 280 40, 290 70, 280 120 C 270 180, 340 260, 370 290 C 340 260, 280 180, 270 120 Z" fill="#132247" />

                {/* Right Side Letter curves */}
                <path d="M 330 110 C 360 80, 420 140, 450 180 C 430 160, 380 100, 340 120 Z" fill="#132247" />
                <path d="M 360 180 C 390 140, 445 200, 480 250 C 440 220, 390 190, 360 180 Z" fill="#132247" />
                <path d="M 345 260 C 380 250, 420 280, 450 295 C 410 280, 375 255, 345 260 Z" fill="#132247" />

                {/* Calligraphy Dots on Right */}
                <circle cx="310" cy="275" r="9" fill="#132247" />
                <circle cx="335" cy="280" r="9" fill="#132247" />

                {/* Calligraphy Hull */}
                <path d="M 120 435 C 180 455, 300 455, 410 330 C 420 320, 440 330, 440 340 C 420 400, 350 460, 240 460 C 160 460, 130 450, 120 435 Z" fill="#132247" />

                {/* Terracotta hull stripe */}
                <path d="M 130 440 C 190 450, 290 440, 390 340 C 380 355, 290 450, 130 440 Z" fill="#C2633C" />

                {/* Portholes */}
                <circle cx="240" cy="435" r="7" fill="#132247" />
                <circle cx="280" cy="425" r="7" fill="#132247" />
                <circle cx="320" cy="410" r="7" fill="#132247" />
                <circle cx="360" cy="390" r="7" fill="#132247" />
                <circle cx="395" cy="365" r="7" fill="#132247" />
              </svg>
            </div>
            
            <div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <h1 className="text-2xl font-black tracking-tight font-sans text-transparent bg-clip-text bg-gradient-to-l from-white via-cyan-100 to-amber-200">
                  نظام بكري للحسابات البحرية
                </h1>
              </div>
              <p className="text-sky-200 text-xs mt-1.5 max-w-xl font-medium leading-relaxed">
                برنامج ذكي لإدارة غلات المراكب ورصد الردود والمبيعات اليومية، وحصص البحارة وتقسيم الأرباح إلكترونياً على نظام "قلاطة النصف" الشرعي المعتمد.
              </p>

              {/* DYNAMIC BOAT SELECTOR BAR - RESTORED FOR MULTIPLE BOATS */}
              <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-2 bg-white/5 border border-white/10 p-1.5 rounded-xl backdrop-blur-sm self-start">
                <span className="text-[11px] font-bold text-sky-200 mr-2">المركب النشط حالياً:</span>
                <div className="relative">
                  <select
                    value={selectedBoatId}
                    onChange={(e) => setSelectedBoatId(e.target.value)}
                    className="bg-[#0C243B] text-white text-xs font-black rounded-lg px-3.5 py-1.5 pl-8 outline-none border border-cyan-400/30 focus:border-cyan-400 cursor-pointer min-w-[140px] appearance-none"
                    id="boat-select"
                  >
                    {boats.map((b) => (
                      <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                        ⛵ مركب {b.name} {(b.licenseNumber ? `(${b.licenseNumber})` : '')}
                      </option>
                    ))}
                  </select>
                  <div className="absolute left-2 top-2 pointer-events-none text-cyan-300">
                    <Anchor className="h-3 w-3" />
                  </div>
                </div>

                {/* Button to add boat */}
                <button
                  onClick={() => setIsNewBoatModalOpen(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg py-1 px-3 font-extrabold text-[11px] transition flex items-center gap-1 cursor-pointer"
                  id="add-boat-modal-btn"
                >
                  <Plus className="h-3 w-3" />
                  <span>إضافة مركب جديد</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* Currency settings */}
            <div className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 flex items-center gap-2 backdrop-blur-md">
              <span className="text-xs text-sky-200 font-bold">العملة:</span>
              <select
                className="bg-[#10304C]/80 text-white text-xs font-bold rounded-lg px-2 py-1 outline-none border border-white/10 focus:border-cyan-400 cursor-pointer"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                id="currency-select"
              >
                <option value="ر.س">ريال سعودي (ر.س)</option>
                <option value="د.إ">درهم إماراتي (د.إ)</option>
                <option value="دينار">دينار بحريني (د.ب)</option>
                <option value="ج.م">جنيه مصري (ج.م)</option>
                <option value="$">دولار أمريكي ($)</option>
              </select>
            </div>

            {/* General Action Dropdowns */}
            <button
              onClick={handleExportBackupJSON}
              className="bg-sky-800/60 hover:bg-sky-800 text-white border border-sky-700 rounded-xl py-2 px-3 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
              title="تصدير نسخة احتياطية كاملة بصيغة JSON"
              id="export-backup-btn"
            >
              <Download className="h-4 w-4" />
              <span>تصدير نسخة كاملة</span>
            </button>

            <label className="bg-teal-800/65 hover:bg-teal-800 text-teal-100 border border-teal-700 rounded-xl py-2 px-3 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md">
              <Upload className="h-4 w-4" />
              <span>استيراد نسخة</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackupJSON}
                className="hidden"
                id="import-backup-file"
              />
            </label>
          </div>
        </div>
      </header>

      {/* Main Container Workspace */}
      <main className="max-w-7xl mx-auto px-4 mt-8" id="main-content">

        {/* UPPER NAVIGATION & TIME FRAME BAR */}
        <section className="bg-white rounded-2xl p-5 shadow-md border border-slate-100 mb-8 flex flex-col md:flex-row items-center justify-between gap-5" id="nav-control-bar">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-slate-500 font-bold text-sm flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-cyan-600" />
              <span>الشهر الحسابي النشط:</span>
            </span>

            {/* Month Period Switcher dropdown */}
            <div className="relative shadow-sm">
              <select
                className="appearance-none bg-cyan-50 border-2 border-cyan-200/70 text-cyan-900 font-extrabold rounded-xl px-4 py-2.5 pr-8 focus:outline-none focus:border-cyan-500 text-sm cursor-pointer min-w-[200px]"
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                id="period-select"
              >
                {records.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.dailyReturns.length} رحلات صيد)
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center text-cyan-700">
                <Anchor className="h-4 w-4" />
              </div>
            </div>

            {/* Add active daily return button - Primary Day-to-Day Action! */}
            <button
              onClick={() => setIsNewReturnModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-750 text-white rounded-xl py-2.5 px-4.5 font-extrabold text-sm transition flex items-center gap-2 hover:shadow-lg hover:shadow-emerald-200 cursor-pointer hover:scale-[1.02] duration-200"
              id="add-return-modal-btn"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>فتح رد صيد جديد 🎣</span>
            </button>

            {/* Add monthly period button (Smaller backup secondary action) */}
            <button
              onClick={() => setIsNewPeriodModalOpen(true)}
              className="bg-slate-50 hover:bg-slate-150 text-slate-700 border border-slate-200 rounded-xl py-2.5 px-3.5 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
              id="add-period-btn"
            >
              <FolderPlus className="h-3.5 w-3.5 text-slate-500" />
              <span>فترة حسابية جديدة</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Primary Professional PDF Export action */}
            <button
              onClick={() => window.print()}
              className="bg-cyan-800 hover:bg-cyan-950 text-white rounded-xl py-2.5 px-4 font-black text-sm transition flex items-center gap-2 hover:shadow-lg hover:shadow-cyan-100 cursor-pointer shadow-md hover:scale-[1.02] duration-200"
              id="print-pdf-btn"
              title="تصدير نسخة ورقية أو ملف PDF احترافي للحسابات"
            >
              <Ship className="h-4 w-4 text-cyan-300" />
              <span>طباعة تقرير PDF احترافي 🖨️</span>
            </button>

            <button
              onClick={handleExportMonthCSV}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-250 rounded-xl py-2.5 px-4 font-bold text-xs transition flex items-center gap-1.5 shadow-xs"
              id="export-csv-btn"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-slate-500" />
              <span>تصدير إكسل (CSV)</span>
            </button>

            <button
              onClick={handleDeleteCurrentMonth}
              className="text-rose-600 bg-rose-50/50 hover:bg-rose-100 border border-rose-200 rounded-xl py-2.5 px-4 font-bold text-xs transition"
              title="حذف هذا الشهر الدفتري الحالي بأكمله"
              id="delete-month-btn"
            >
              حذف الشهر الحالي
            </button>
          </div>
        </section>

        {/* STATISTICAL CARDS DASHBOARD (تظهر تلقائياً في لوحة تحكم إحصائية) */}
        <section className="mb-8" id="financial-dashboard">
          <h2 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-cyan-600" />
            <span>لوحة التحكم الإحصائية لمركب {currentBoat.name} ({currentRecord.name})</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1: Total Returns */}
            <div className="bg-gradient-to-br from-white to-cyan-50/25 rounded-2xl p-6 border border-slate-100 shadow-md hover:shadow-lg transition relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-100/10 rounded-full translate-x-6 -translate-y-6 group-hover:scale-125 transition-transform duration-500"></div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-500 tracking-wider">إجمالي الردود اليومية</span>
                <div className="p-2 ml-1.5 rounded-lg bg-cyan-100 text-cyan-700">
                  <Coins className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-cyan-900 font-mono">
                    {stats.totalReturns.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-slate-500">{currency}</span>
                </div>
                <div className="flex items-center gap-2.5 mt-2">
                  <span className="text-xs bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-lg font-bold">
                    {currentRecord.dailyReturns.length} ردود صيد
                  </span>
                  {currentRecord.dailyReturns.length > 0 && (
                    <span className="text-xs font-bold text-slate-400">
                      معدل: {Math.round(stats.totalReturns / currentRecord.dailyReturns.length).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Card 2: Total Boat Expenses */}
            <div className="bg-gradient-to-br from-white to-indigo-50/25 rounded-2xl p-6 border border-slate-100 shadow-md hover:shadow-lg transition relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100/10 rounded-full translate-x-6 -translate-y-6 group-hover:scale-125 transition-transform duration-500"></div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-500 tracking-wider">إجمالي مصاريف المركب</span>
                <div className="p-2 ml-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                  <Receipt className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-indigo-900 font-mono">
                    {stats.totalBoatExpenses.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-slate-500">{currency}</span>
                </div>
                <div className="flex items-center gap-2.5 mt-2">
                  <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-lg font-bold">
                    {currentRecord.boatExpenses.length} بنود مصاريف
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Net Closing (إجمالي صافي الإقفال = إجمالي الردود - إجمالي المصاريف) */}
            <div className="bg-gradient-to-br from-white to-emerald-50/40 rounded-2xl p-6 border-2 border-emerald-100 shadow-lg hover:shadow-xl transition relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/20 rounded-full translate-x-6 -translate-y-6 group-hover:scale-125 transition-transform duration-500"></div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-600 tracking-wider">إجمالي صافي الإقفال</span>
                <div className="p-2 ml-1.5 rounded-lg bg-emerald-150 text-emerald-700">
                  <Anchor className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-3xl font-black font-mono ${stats.netClosing >= 0 ? "text-emerald-700" : "text-rose-600 animate-pulse"}`}>
                    {stats.netClosing.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-slate-500">{currency}</span>
                </div>
                <div className="flex items-center gap-2.5 mt-2">
                  {stats.netClosing >= 0 ? (
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-lg font-extrabold">
                      أرباح قابلة للتوزيع (٢٢ سهم)
                    </span>
                  ) : (
                    <span className="text-xs bg-rose-100 text-rose-800 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      خسارة تشغيلية للمركب
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Card 4: Sponsor Expenses */}
            <div className="bg-gradient-to-br from-white to-amber-50/25 rounded-2xl p-6 border border-slate-100 shadow-md hover:shadow-lg transition relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100/10 rounded-full translate-x-6 -translate-y-6 group-hover:scale-125 transition-transform duration-500"></div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-500 tracking-wider">إجمالي مصاريف الكفيل</span>
                <div className="p-2 ml-1.5 rounded-lg bg-amber-100 text-amber-700">
                  <Briefcase className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-amber-900 font-mono">
                    {stats.totalSponsorExpenses.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-slate-500">{currency}</span>
                </div>
                <div className="flex items-center gap-2.5 mt-2">
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-lg font-semibold">
                    يخصم من نصيب المالك فقط
                  </span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* SHARES SYSTEM DISTRIBUTION IN FOCUS (النظام المعتمد لتوزيع حصص الأرباح والردود) */}
        <section className="bg-gradient-to-b from-[#143D60] to-[#0A243A] rounded-3xl p-6 md:p-8 text-white shadow-xl mb-12 relative overflow-hidden" id="shares-distribution-chart">
          {/* Decorative Sea Pattern */}
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full pointer-events-none mb-[-120px] mr-[-120px]"></div>
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1 bg-cyan-400/20 text-cyan-300 px-3 py-1 rounded-full text-xs font-black border border-cyan-400/40 mb-3">
                <ShieldCheck className="h-3 w-3" />
                <span>النظام المعتمد لتوزيع حصص الردود والأرباح لمركب لافي</span>
              </div>
              <h3 className="text-2xl font-black">تقسيم وتوزيع أنصبة الأرباح شهرياً</h3>
              <p className="text-sky-200 text-sm mt-2">
                يتم تقسيم صافي الإقفال البالغ <span className="text-emerald-300 font-bold font-mono">{stats.netClosing.toLocaleString()}</span> {currency} بالتساوي بين العمال والمالك مع استقطاعات قلاطة المالك ومصاريف الكفيل كالتالي:
              </p>
            </div>

            {/* Quick Chart Visualization using elegant pure Tailwind circles / bars */}
            <div className="flex-1 w-full max-w-md">
              <span className="text-xs text-sky-300 font-semibold mb-2 block text-right">مخطط نسبي مرئي لتوزيـع صافي الإقفال:</span>
              <div className="h-6 w-full bg-slate-850 rounded-full overflow-hidden flex shadow-inner p-1 border border-slate-700" style={{ direction: "rtl" }}>
                <div style={{ width: `${stats.crewPercent}%` }} className="h-full bg-sky-400 rounded-r-md transition-all duration-300" title={`قلاطة العمال النهائية - ${stats.crewPercent.toFixed(1)}%`}></div>
                <div style={{ width: `${stats.ownerExtraPercent}%` }} className="h-full bg-indigo-400 transition-all duration-300" title={`قلاطة المالك - ${stats.ownerExtraPercent.toFixed(1)}%`}></div>
                <div style={{ width: `${stats.ownerBasePercent}%` }} className="h-full bg-emerald-400 rounded-l-md transition-all duration-300" title={`نص المالك الأساسي - ${stats.ownerBasePercent.toFixed(1)}%`}></div>
              </div>
              <div className="flex justify-between text-[11px] text-sky-200 mt-2 font-mono" style={{ direction: "rtl" }}>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block"></span>طاقم العمال ({stats.crewPercent.toFixed(1)}%)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block"></span>قلاطة مالك ({stats.ownerExtraPercent.toFixed(1)}%)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>مالك أساسي ({stats.ownerBasePercent.toFixed(1)}%)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            
            {/* Value 1: نص المالك الأساسي (نصف الصافي) */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition">
              <div className="flex justify-between items-center">
                <span className="text-sm text-emerald-300 font-bold">نص المالك الأساسي</span>
                <div className="bg-emerald-500/10 text-emerald-300 py-1 px-2 rounded-full text-xs font-mono font-bold">
                  50.0% (نصف الصافي)
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-black font-mono text-emerald-100">
                  {stats.ownerBaseShare.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-emerald-300 font-bold">{currency}</span>
              </div>
              <p className="text-xs text-sky-200/80 mt-2">
                المعادلة المعتمدة: [إجمالي صافي الإقفال] ÷ 2. يمثل حصة استثمار السفينة الأساسي.
              </p>
            </div>

            {/* Value 2: قلاطة المالك */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition">
              <div className="flex justify-between items-center gap-2">
                <span className="text-sm text-indigo-300 font-bold">قلاطة المالك</span>
                <div className="flex items-center gap-1.5 bg-slate-900/60 border border-indigo-500/30 rounded-xl px-2 py-0.5 text-xs">
                  <span className="text-[10px] text-slate-400 font-bold">نصف الصافي ÷</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="4.5"
                    value={ownerShareFactor}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val >= 0) {
                        setOwnerShareFactor(val);
                      } else if (e.target.value === "") {
                        // Temp state for editing
                        // @ts-ignore
                        setOwnerShareFactor("");
                      }
                    }}
                    onBlur={(e) => {
                      const val = parseFloat(e.target.value);
                      if (e.target.value === "" || isNaN(val) || val < 0) {
                        setOwnerShareFactor(4.5);
                      }
                    }}
                    className="w-12 text-center bg-slate-800 text-indigo-300 font-extrabold font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded border border-slate-700 py-0.5 shadow-sm"
                  />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-black font-mono text-indigo-150">
                  {stats.ownerExtraShare.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-indigo-250 font-bold">{currency}</span>
                {ownerShareFactor === 0 && (
                  <span className="text-[10px] mr-2 text-amber-400 font-bold bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                    ملغاة
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-200/80 mt-2">
                {ownerShareFactor === 0 ? (
                  <span className="text-amber-300 font-bold">تم إلغاء قلاطة المالك بالكامل لتصبح 0.00 ر.س</span>
                ) : (
                  `المعادلة المعتمدة: [نصف الصافي] ÷ ${ownerShareFactor || "4.5"}. (يمكنك تعديل القيمة مباشرة للرقم المفضل).`
                )}
              </p>
            </div>

            {/* Value 3: قلاطة العمال النهائية */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition">
              <div className="flex justify-between items-center">
                <span className="text-sm text-cyan-300 font-bold">قلاطة العمال النهائية</span>
                <div className="bg-cyan-500/10 text-cyan-300 py-1 px-2 rounded-full text-xs font-mono font-bold">
                  نصف الصافي - قلاطة المالك
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-black font-mono text-cyan-100">
                  {stats.crewShare.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-cyan-300 font-bold">{currency}</span>
              </div>
              <p className="text-xs text-sky-200/80 mt-2">
                المعادلة المعتمدة: [نص الصافي] - [قلاطة المالك]. توزع على البحارة وطاقم الصيد مجتمعين.
              </p>
            </div>

          </div>

          {/* NET FINAL FOR OWNER */}
          <div className="mt-6 pt-6 border-t border-white/15 bg-white/[0.03] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-300 rounded-xl mt-0.5">
                <Coins className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-amber-300">صافي مستحقات المالك النهائي (بعد خصم مصاريف الكفيل)</h4>
                <p className="text-xs text-slate-300 mt-1">
                  المعادلة: [نص المالك الأساسي] + [قلاطة المالك] - [إجمالي مصاريف الكفيل]
                </p>
              </div>
            </div>

            <div className="flex items-baseline gap-1 bg-amber-500/10 border border-amber-500/20 py-2 px-5 rounded-2xl">
              <span className={`text-2xl font-black font-mono ${stats.ownerFinalShare >= 0 ? "text-amber-300" : "text-rose-400"}`}>
                {stats.ownerFinalShare.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-amber-250 font-semibold">{currency}</span>
            </div>
          </div>
        </section>

        {/* INPUT TABS HEADER */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="data-workspace">
          
          {/* RIGHT PANELS (ENTRIES LISTS AND GENERAL SEARCH) */}
          <div className="col-span-1 lg:col-span-8">
            
            <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-100 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Visual tabs switcher */}
                <div className="flex bg-slate-200/60 p-1.5 rounded-xl gap-1 w-full md:w-auto">
                  <button
                    onClick={() => setActiveTab("returns")}
                    className={`flex-1 md:flex-initial py-2 px-4 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === "returns"
                        ? "bg-white text-cyan-950 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Coins className="h-3.5 w-3.5" />
                    <span>الردود اليومية ({currentRecord.dailyReturns.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("boat_expenses")}
                    className={`flex-1 md:flex-initial py-2 px-4 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === "boat_expenses"
                        ? "bg-white text-cyan-950 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Receipt className="h-3.5 w-3.5" />
                    <span>مصاريف المركب ({currentRecord.boatExpenses.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("sponsor_expenses")}
                    className={`flex-1 md:flex-initial py-2 px-4 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === "sponsor_expenses"
                        ? "bg-white text-cyan-950 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Briefcase className="h-3.5 w-3.5" />
                    <span>مصاريف على الكفيل ({currentRecord.sponsorExpenses.length})</span>
                  </button>
                </div>

                {/* Search Term Container */}
                <div className="relative w-full md:w-48 shadow-sm">
                  <input
                    type="text"
                    placeholder="ابحث هنا..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-xs focus:outline-none focus:border-cyan-500 font-bold"
                  />
                  <Search className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute left-2.5 top-2 text-slate-400 hover:text-slate-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* LISTS TABLES AREA */}
              <div className="p-4" id="table-entries-view">
                
                {/* 1. RETURNS TAB */}
                {activeTab === "returns" && (
                  <div>
                    {filteredReturns.length === 0 ? (
                      <div className="py-12 text-center text-slate-400">
                        <Coins className="h-12 w-12 mx-auto stroke-1 mb-2 text-slate-300" />
                        <p className="text-sm font-semibold">لا يوجد أي ردود يومية مسجلة مطابقة للبحث حالياً.</p>
                        <p className="text-xs text-slate-400 mt-1">امسح البحث أو استخدم النموذج الجانبي لإضافة رحلات جديدة.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse text-sm">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-400 font-bold text-xs">
                              <th className="pb-3 pt-1 px-4 text-center">رقم الرد</th>
                              <th className="pb-3 pt-1 px-4">تاريخ الرد</th>
                              <th className="pb-3 pt-1 px-4 text-left">صافي الرد</th>
                              <th className="pb-3 pt-1 px-4">ملاحظات والتفاصيل</th>
                              <th className="pb-3 pt-1 px-4 text-center">إجراءات</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredReturns.map((item) => (
                              <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition group">
                                <td className="py-3.5 px-4 font-mono font-bold text-center">
                                  <span className="inline-block px-2.5 py-1 bg-cyan-50 text-cyan-800 rounded-lg">
                                    رد #{item.returnNumber}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 font-mono text-slate-600">
                                  {item.date}
                                </td>
                                <td className="py-3.5 px-4 font-mono font-extrabold text-left text-cyan-700">
                                  {item.netAmount.toLocaleString()} <span className="text-xs text-slate-400">{currency}</span>
                                </td>
                                <td className="py-3.5 px-4 text-xs text-slate-500 max-w-[200px] truncate" title={item.notes}>
                                  {item.notes || <span className="text-slate-300 italic">بدون ملاحظات</span>}
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => handleStartEdit(item, "return")}
                                      className="p-1.5 text-slate-500 hover:text-cyan-700 hover:bg-slate-100 rounded-lg transition"
                                      title="تعديل هذا الرد"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteItem(item.id, "return")}
                                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                      title="حذف هذا الرد"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. BOAT EXPENSES TAB */}
                {activeTab === "boat_expenses" && (
                  <div>
                    {filteredBoatExpenses.length === 0 ? (
                      <div className="py-12 text-center text-slate-400">
                        <Receipt className="h-12 w-12 mx-auto stroke-1 mb-2 text-slate-300" />
                        <p className="text-sm font-semibold">لا يوجد أي مصروفات للمركب مطابقة للبحث حالياً.</p>
                        <p className="text-xs text-slate-400 mt-1">البنزين والديزل والثلج والطعام تخصم من الإقفال العام.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse text-sm">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-400 font-bold text-xs font-sans">
                              <th className="pb-3 pt-1 px-4">نوع المصروف</th>
                              <th className="pb-3 pt-1 px-4">التاريخ</th>
                              <th className="pb-3 pt-1 px-4 text-left">المبلغ</th>
                              <th className="pb-3 pt-1 px-4">ملاحظات وتفاصيل التكلفة</th>
                              <th className="pb-3 pt-1 px-4 text-center">إجراءات</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredBoatExpenses.map((item) => (
                              <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                <td className="py-3.5 px-4 font-bold text-slate-700">
                                  {item.type}
                                </td>
                                <td className="py-3.5 px-4 font-mono text-slate-600">
                                  {item.date}
                                </td>
                                <td className="py-3.5 px-4 font-mono font-extrabold text-left text-indigo-700">
                                  {item.amount.toLocaleString()} <span className="text-xs text-slate-400">{currency}</span>
                                </td>
                                <td className="py-3.5 px-4 text-xs text-slate-500 max-w-[200px] truncate" title={item.notes}>
                                  {item.notes || <span className="text-slate-300 italic">بدون ملاحظات</span>}
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => handleStartEdit(item, "boat_expense")}
                                      className="p-1.5 text-slate-500 hover:text-cyan-700 hover:bg-slate-100 rounded-lg transition"
                                      title="تعديل هذا المصروف"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteItem(item.id, "boat_expense")}
                                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                      title="حذف هذا المصروف"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. SPONSOR EXPENSES TAB */}
                {activeTab === "sponsor_expenses" && (
                  <div>
                    {filteredSponsorExpenses.length === 0 ? (
                      <div className="py-12 text-center text-slate-400">
                        <Briefcase className="h-12 w-12 mx-auto stroke-1 mb-2 text-slate-300" />
                        <p className="text-sm font-semibold">لم يرصد أي مصروف على الكفيل حتى اللحظة لشهر {currentRecord.name}.</p>
                        <p className="text-xs text-slate-400 mt-1">مصاريف الكفيل كرسوم الرخص وتجديد الإقامة تخصم حصرياً من نصيب المالك النهائي.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse text-sm">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-400 font-bold text-xs">
                              <th className="pb-3 pt-1 px-4">نوع الخدمة / المصروف الحكومي</th>
                              <th className="pb-3 pt-1 px-4">تاريخ تقديم الصرف</th>
                              <th className="pb-3 pt-1 px-4 text-left">المبلغ المخصوم</th>
                              <th className="pb-3 pt-1 px-4">الملاحظات</th>
                              <th className="pb-3 pt-1 px-4 text-center">إجراءات</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredSponsorExpenses.map((item) => (
                              <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                <td className="py-3.5 px-4 font-bold text-slate-700">
                                  {item.type}
                                </td>
                                <td className="py-3.5 px-4 font-mono text-slate-600">
                                  {item.date}
                                </td>
                                <td className="py-3.5 px-4 font-mono font-extrabold text-left text-amber-700">
                                  {item.amount.toLocaleString()} <span className="text-xs text-slate-400">{currency}</span>
                                </td>
                                <td className="py-3.5 px-4 text-xs text-slate-500 max-w-[200px] truncate" title={item.notes}>
                                  {item.notes || <span className="text-slate-300 italic">بدون ملاحظات</span>}
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => handleStartEdit(item, "sponsor_expense")}
                                      className="p-1.5 text-slate-500 hover:text-cyan-700 hover:bg-slate-100 rounded-lg transition"
                                      title="تعديل"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteItem(item.id, "sponsor_expense")}
                                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                      title="حذف"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* CARD FOOTER SUBSTATISTICS */}
              <div className="bg-slate-50/70 p-4 border-t border-slate-100 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-4 font-bold">
                <div>
                  الفترة النشطة: <span className="text-cyan-800 font-extrabold">{currentRecord.name}</span>
                </div>
                <div className="flex gap-4">
                  <span>إجمالي الردود: {stats.totalReturns.toLocaleString()} {currency}</span>
                  <span className="text-slate-300"> | </span>
                  <span>مصاريف الكفيل المقتطعة: {stats.totalSponsorExpenses.toLocaleString()} {currency}</span>
                </div>
              </div>
            </div>

          </div>

          {/* LEFT SIDE QUICK FORM ENTRIES (إدخال البيانات الجديدة) */}
          <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">
            
            {/* 1. INPUT CARD: DAILY RETURN */}
            <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                <div className="bg-cyan-100 text-cyan-800 p-1.5 rounded-lg">
                  <Coins className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-800">١. تسجيل رد يومي جديد</h3>
              </div>

              <form onSubmit={handleAddReturn} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">رقم الرد</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="رقم الرد التسلسلي"
                    value={newReturnNumber}
                    onChange={(e) => setNewReturnNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">تاريخ الرد</label>
                    <input
                      type="date"
                      required
                      value={newReturnDate}
                      onChange={(e) => setNewReturnDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">صافي قيمة الرد</label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min="0"
                        step="any"
                        placeholder="المبلغ نقداً"
                        value={newReturnAmount}
                        onChange={(e) => setNewReturnAmount(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-cyan-500 font-mono font-bold"
                      />
                      <span className="absolute left-2.5 top-2.5 text-[10px] text-slate-400 font-semibold">{currency}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">ملاحظات الصيد (اختياري)</label>
                  <input
                    type="text"
                    placeholder="نوع السمك، حالة البحر..."
                    value={newReturnNotes}
                    onChange={(e) => setNewReturnNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 font-bold"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-cyan-800 hover:bg-cyan-900 text-white rounded-lg py-2.5 px-3 text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow"
                >
                  <Plus className="h-4 w-4" />
                  <span>إضافة للدفتر اليومي</span>
                </button>
              </form>
            </div>

            {/* 2. INPUT CARD: BOAT EXPENSE */}
            <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                <div className="bg-indigo-100 text-indigo-800 p-1.5 rounded-lg">
                  <Receipt className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-800">٢. مصاريف المركب (الدورية)</h3>
              </div>

              <form onSubmit={handleAddBoatExpense} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">نوع المصروف</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-indigo-500 font-bold cursor-pointer"
                      value={newExpenseType}
                      onChange={(e) => setNewExpenseType(e.target.value)}
                    >
                      {EXPENSE_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">تاريخ المصروف</label>
                    <input
                      type="date"
                      required
                      value={newExpenseDate}
                      onChange={(e) => setNewExpenseDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                {newExpenseType === "أخرى" && (
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">اكتب اسم المصروف البديل</label>
                    <input
                      type="text"
                      required
                      placeholder="مثلاً: صيانة ونش الصيد"
                      value={newExpenseCustomType}
                      onChange={(e) => setNewExpenseCustomType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-700 font-bold"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">المبلغ المصروف</label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min="0.1"
                        step="any"
                        placeholder="المبلغ نقداً"
                        value={newExpenseAmount}
                        onChange={(e) => setNewExpenseAmount(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-indigo-500 font-mono font-bold"
                      />
                      <span className="absolute left-2.5 top-2.5 text-[10px] text-slate-400 font-semibold">{currency}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">ملاحظات إيصال الصرف (اختياري)</label>
                  <input
                    type="text"
                    placeholder="رقم الفاتورة، محطة الديزل..."
                    value={newExpenseNotes}
                    onChange={(e) => setNewExpenseNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-800 hover:bg-indigo-900 text-white rounded-lg py-2.5 px-3 text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>تسجيل مصروف تشغيلي</span>
                </button>
              </form>
            </div>

            {/* 3. INPUT CARD: SPONSOR EXPENSE */}
            <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                <div className="bg-amber-100 text-amber-800 p-1.5 rounded-lg">
                  <Briefcase className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-800">٣. تسجيل مصاريف على الكفيل</h3>
              </div>

              <form onSubmit={handleAddSponsorExpense} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">نوع المعاملة</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-amber-500 font-bold cursor-pointer"
                      value={newSponsorType}
                      onChange={(e) => setNewSponsorType(e.target.value)}
                    >
                      {SPONSOR_EXPENSE_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">تاريخ المعاملة</label>
                    <input
                      type="date"
                      required
                      value={newSponsorDate}
                      onChange={(e) => setNewSponsorDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                {newSponsorType === "أخرى" && (
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">تفصيل المصروف الحكومي</label>
                    <input
                      type="text"
                      required
                      placeholder="رسوم بلدية، رائد حماية..."
                      value={newSponsorCustomType}
                      onChange={(e) => setNewSponsorCustomType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500 font-bold"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">مبلغ المصروف الصادر</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0.1"
                      step="any"
                      placeholder="قيمة الرسوم"
                      value={newSponsorAmount}
                      onChange={(e) => setNewSponsorAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-amber-500 font-mono font-bold"
                    />
                    <span className="absolute left-2.5 top-2.5 text-[10px] text-slate-400 font-semibold">{currency}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">اسم الموظف / ملاحظة (اختياري)</label>
                  <input
                    type="text"
                    placeholder="رقم مرجعي، اسم العامل..."
                    value={newSponsorNotes}
                    onChange={(e) => setNewSponsorNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-700 hover:bg-amber-800 text-white rounded-lg py-2.5 px-3 text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>تأكيد صرف على الكفيل</span>
                </button>
              </form>
            </div>

          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="mt-20 border-t border-slate-200 bg-white/70 py-8 text-center text-slate-400 text-xs backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-bold">
          <div className="flex items-center gap-2">
            <Anchor className="h-4 w-4 text-cyan-600" />
            <span className="text-slate-600 font-sans">نظام الصيد لافي لإدارة حسابات المراكب والرد السريع © ٢٠٢٦</span>
          </div>
          <div className="flex gap-4">
            <span className="text-slate-400 font-medium">نظام التوزيع الحسي المعتمد (٢٢ سهماً)</span>
          </div>
        </div>
      </footer>

      {/* POPUP MODAL: REGISTER NEW BOAT */}
      {isNewBoatModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsNewBoatModalOpen(false)}
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer p-1.5 rounded-full hover:bg-slate-100 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <div className="bg-amber-100 text-amber-800 p-2.5 rounded-xl">
                <Ship className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">إضافة مركب جديد للأسطول ⛵</h3>
                <p className="text-xs text-slate-500">سجل بيانات سفينة ثانية أو قارب صيد جديد في الحسابات</p>
              </div>
            </div>

            <form onSubmit={handleAddBoat} className="space-y-4 text-right" style={{ direction: "rtl" }}>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">اسم المركب / السفينة الجديد</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: لافي، بكري، الغزال..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-amber-500"
                  value={newBoatName}
                  onChange={(e) => setNewBoatName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">رقم الترخيص (اختياري)</label>
                  <input
                    type="text"
                    placeholder="مثال: ب-٢٢٨٩٠"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-amber-500"
                    value={newBoatLicense}
                    onChange={(e) => setNewBoatLicense(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">عدد البحارة (اختياري)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="مثال: 16"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-amber-500"
                    value={newBoatCrewCount}
                    onChange={(e) => setNewBoatCrewCount(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewBoatModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg text-xs font-extrabold cursor-pointer transition text-center"
                >
                  إلغاء الأمر
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 py-2.5 rounded-lg text-xs font-extrabold cursor-pointer transition text-center shadow-md active:scale-95"
                >
                  إضافة وإبرام العقد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL: OPEN NEW PERIOD */}
      {isNewPeriodModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative border border-slate-100">
            <button
              onClick={() => setIsNewPeriodModalOpen(false)}
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-full hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <FolderPlus className="h-6 w-6 text-cyan-600" />
              <h3 className="text-base font-extrabold text-slate-900">فتح فترة حسابات جديدة</h3>
            </div>

            <p className="text-xs text-slate-500 mb-4 font-bold">
              اختر السنة والشهر لفتح دفتر مالي جديد لمركب لافي لتسجيل الردود وتوزيعها.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-600 font-bold block mb-1">السنة الحسابية</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-cyan-500 cursor-pointer"
                  value={newPeriodYear}
                  onChange={(e) => setNewPeriodYear(e.target.value)}
                >
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                  <option value="2025">2025</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-600 font-bold block mb-1">الشهر</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-cyan-500 cursor-pointer"
                  value={newPeriodMonth}
                  onChange={(e) => setNewPeriodMonth(e.target.value)}
                >
                  <option value="01">يناير (01)</option>
                  <option value="02">فبراير (02)</option>
                  <option value="03">مارس (03)</option>
                  <option value="04">أبريل (04)</option>
                  <option value="05">مايو (05)</option>
                  <option value="06">يونيو (06)</option>
                  <option value="07">يوليو (07)</option>
                  <option value="08">أغسطس (08)</option>
                  <option value="09">سبتمبر (09)</option>
                  <option value="10">أكتوبر (10)</option>
                  <option value="11">نوفمبر (11)</option>
                  <option value="12">ديسمبر (12)</option>
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewPeriodModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg text-xs font-extrabold cursor-pointer transition text-center"
                >
                  إلغاء التغييرات
                </button>
                <button
                  type="button"
                  onClick={handleAddNewPeriod}
                  className="flex-1 bg-cyan-800 hover:bg-cyan-900 text-white py-2.5 rounded-lg text-xs font-extrabold cursor-pointer transition text-center"
                >
                  فتح الفترة الحسابية
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* POPUP MODAL: EDIT RECORD */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs" id="edit-modal">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100">
            <button
              onClick={() => setEditingItem(null)}
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-full hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Edit className="h-6 w-6 text-cyan-600" />
              <h3 className="text-base font-extrabold text-[#111] pr-2">
                تعديل سجل - {editingItem.type === "return" ? "رد يومي صيد" : editingItem.type === "boat_expense" ? "مصروف مركب" : "مصروف على الكفيل"}
              </h3>
            </div>

            <form onSubmit={handleSaveEdits} className="space-y-4">
              
              {editingItem.type === "return" && (
                <>
                  <div>
                    <label className="text-xs text-slate-600 font-bold block mb-1">رقم الرد</label>
                    <input
                      type="number"
                      required
                      min="1"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-cyan-500"
                      value={editingItem.data.returnNumber}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, returnNumber: e.target.value }
                      })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-600 font-bold block mb-1 font-sans">تاريخ التحرير</label>
                      <input
                        type="date"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-mono outline-none focus:border-cyan-500"
                        value={editingItem.data.date}
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, date: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600 font-bold block mb-1">صافي القيمة</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="any"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold outline-none focus:border-cyan-500"
                        value={editingItem.data.netAmount}
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, netAmount: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Editable values for expenses */}
              {editingItem.type !== "return" && (
                <>
                  <div>
                    <label className="text-xs text-slate-600 font-bold block mb-1">البيان / نوع المصروف</label>
                    <input
                      type="text"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-cyan-500"
                      value={editingItem.data.type}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, type: e.target.value }
                      })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-600 font-bold block mb-1 font-sans">تاريخ المصروف</label>
                      <input
                        type="date"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-mono outline-none focus:border-cyan-500"
                        value={editingItem.data.date}
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, date: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600 font-bold block mb-1">المبلغ المطلوب ({currency})</label>
                      <input
                        type="number"
                        required
                        min="0.1"
                        step="any"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold outline-none focus:border-cyan-500"
                        value={editingItem.data.amount}
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, amount: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="text-xs text-slate-600 font-bold block mb-1">تفاصيل وملاحظات معدلة</label>
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none h-16 focus:border-cyan-500"
                  value={editingItem.data.notes || ""}
                  placeholder="ملاحظات المراجعة..."
                  onChange={(e) => setEditingItem({
                    ...editingItem,
                    data: { ...editingItem.data, notes: e.target.value }
                  })}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg text-xs font-extrabold cursor-pointer transition text-center"
                >
                  إلغاء التعديل
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-cyan-800 hover:bg-cyan-900 text-white py-2.5 rounded-lg text-xs font-extrabold cursor-pointer transition text-center"
                >
                  تأكيد وتحديث الحجم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL: REGISTER NEW DAILY RETURN ("فتح رد صيد جديد") */}
      {isNewReturnModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsNewReturnModalOpen(false)}
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer p-1.5 rounded-full hover:bg-slate-100 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <div className="bg-emerald-100 text-emerald-800 p-2.5 rounded-xl">
                <Coins className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">تسجيل وفتح رد صيد جديد 🎣</h3>
                <p className="text-xs text-slate-500">سجل رحلة صيد جديدة لشهر {currentRecord.name}</p>
              </div>
            </div>

            <form onSubmit={handleAddReturn} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">رقم الرد</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="رقم الرد"
                    value={newReturnNumber}
                    onChange={(e) => setNewReturnNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 font-bold font-mono text-center"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1 font-sans">تاريخ الرد</label>
                  <input
                    type="date"
                    required
                    value={newReturnDate}
                    onChange={(e) => setNewReturnDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">صافي قيمة الرد (المبيعات)</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    placeholder="قيمة المبيعات الإجمالية للرحلة"
                    value={newReturnAmount}
                    onChange={(e) => setNewReturnAmount(e.target.value)}
                    className="w-full bg-slate-100/80 border border-slate-200 rounded-lg pl-8 pr-3 py-2.5 text-xs focus:outline-none focus:border-emerald-500 font-mono font-bold text-emerald-800 text-sm"
                  />
                  <span className="absolute left-3 top-3 text-[11px] text-slate-400 font-black">{currency}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">ملاحظات الصيد والرحلة (اختياري)</label>
                <textarea
                  placeholder="مثال: صيد سمك الباغة، الجو هادئ، طاقم النوخذة..."
                  value={newReturnNotes}
                  onChange={(e) => setNewReturnNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 font-bold h-16 resize-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewReturnModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg text-xs font-extrabold cursor-pointer transition text-center"
                >
                  إلغاء التغييرات
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-xs font-extrabold cursor-pointer transition text-center shadow-md hover:shadow-emerald-200"
                >
                  تأكيد وحفظ الرد 🎣
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- PROFESSIONAL PDF PRINT REPORT SHEET (Hidden on screen, Visible only in PDF Print) ----------------- */}
      <div id="print-report-sheet" className="hidden print:block bg-white text-slate-900 font-sans" style={{ direction: "rtl", width: "100%" }}>
        
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-2 mb-4">
          <div className="space-y-1 text-right">
            <h1 className="text-xl font-black text-slate-950 flex items-center gap-2">
              <span>مركب الصيد البحري المعتمد: {currentBoat.name}</span>
              {currentBoat.licenseNumber && <span className="text-xs text-slate-500 font-bold mr-2">({currentBoat.licenseNumber})</span>}
            </h1>
            <p className="text-[10px] text-slate-600 font-extrabold">لإدارة الحسابات البحرية وجرد الردود والمبيعات اليومية</p>
            <p className="text-[10px] text-slate-500 font-medium">الدفتر المخزني والتقرير الدفتري المعتمد رسمياً</p>
          </div>
          
          <div className="text-left space-y-0.5 font-mono text-[10px] text-slate-600">
            <div className="font-sans font-bold text-slate-900">الكود الحسابي: {currentRecord.id}</div>
            <div>الفترة المالية: {currentRecord.name}</div>
            <div>عدد الردود الصادرة: {currentRecord.dailyReturns.length} رد صيد</div>
            <div>تاريخ تحرير التقرير: {new Date().toLocaleDateString("ar-SA", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
            <div>حالة التقرير: <span className="font-sans font-bold underline">مستند رسمي معتمد</span></div>
          </div>
        </div>

        {/* Section title */}
        <div className="mb-2">
          <h2 className="text-xs font-black bg-slate-150 text-slate-800 px-3 py-1 rounded-md border-r-4 border-slate-800">
            أولاً: ملخص الإقفال الحسابي للفترة المالية ({currentRecord.name})
          </h2>
        </div>

        {/* Basic Balance Sheet Grid */}
        <table className="w-full border-collapse mb-4 text-[11px] text-center">
          <thead>
            <tr className="bg-slate-100 font-bold border border-slate-300">
              <th className="p-2 border border-slate-300">إجمالي الردود (مبيعات السمك)</th>
              <th className="p-2 border border-slate-300">إجمالي مصاريف المركب</th>
              <th className="p-2 border border-slate-300 bg-slate-200">صافي الإقفال (المبلغ القابل للتوزيع)</th>
              <th className="p-2 border border-slate-300 text-[#b45309]">مصاريف الكفيل الحكومية</th>
            </tr>
          </thead>
          <tbody>
            <tr className="font-mono text-xs font-bold border border-slate-300">
              <td className="p-2 border border-slate-300">{stats.totalReturns.toLocaleString()} {currency}</td>
              <td className="p-2 border border-slate-300">{stats.totalBoatExpenses.toLocaleString()} {currency}</td>
              <td className="p-2 border border-slate-300 bg-slate-200 text-slate-950 font-black">{stats.netClosing.toLocaleString()} {currency}</td>
              <td className="p-2 border border-slate-300 text-[#b45309]">{stats.totalSponsorExpenses.toLocaleString()} {currency}</td>
            </tr>
          </tbody>
        </table>

        {/* Profit Distribution Rules table */}
        <div className="mb-2">
          <h2 className="text-xs font-black bg-slate-150 text-slate-800 px-3 py-1 rounded-md border-r-4 border-slate-800">
            ثانياً: تفصيل تقسيم حصص الأرباح والأنصبة (النظام الشرعي والتقليدي للنصف)
          </h2>
        </div>

        <div className="border border-slate-300 rounded overflow-hidden mb-4 text-[11px] text-right">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-950 border-b-2 border-slate-800 font-bold text-center">
                <th className="p-2 border border-slate-300">البيان المالي وحصة الشركاء</th>
                <th className="p-2 border border-slate-300">طريقة احتساب المعادلة الحسابية</th>
                <th className="p-2 border border-slate-300 text-left">القيمة المعتمدة ({currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              <tr>
                <td className="p-2 font-bold text-slate-800 border border-slate-300">نصف مبالغ صافي الإقفال</td>
                <td className="p-2 text-slate-600 border border-slate-300">[إجمالي صافي الإقفال] ÷ ٢</td>
                <td className="p-2 text-left font-mono font-bold text-slate-900 border border-slate-300">{stats.halfNet.toLocaleString()} {currency}</td>
              </tr>
              <tr>
                <td className="p-2 font-bold text-slate-800 border border-slate-300">نصيب المالك الأساسي للنصف</td>
                <td className="p-2 text-slate-600 border border-slate-300">يمثل حصة تمويل وتملك السفينة (٥٠٪ من صافي الإقفال)</td>
                <td className="p-2 text-left font-mono font-bold text-slate-900 border border-slate-300">{stats.ownerBaseShare.toLocaleString()} {currency}</td>
              </tr>
              <tr>
                <td className="p-2 font-bold text-slate-800 border border-slate-300">
                  قلاطة مالك السفينة الإضافية {ownerShareFactor === 0 && <span className="text-[9px] text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200 mr-1.5">(ملغاة)</span>}
                </td>
                <td className="p-2 text-slate-600 border border-slate-300">
                  {ownerShareFactor === 0 ? "ملغاة بطلب المستخدم (0)" : `[نصف الصافي] ÷ ${ownerShareFactor}`}
                </td>
                <td className="p-2 text-left font-mono font-bold text-slate-900 border border-slate-300">
                  {stats.ownerExtraShare.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                </td>
              </tr>
              <tr className="bg-emerald-50/50 font-bold">
                <td className="p-2 text-emerald-950 border border-slate-300 font-extrabold">قلاطة العمال والبحارة النهائية</td>
                <td className="p-2 text-emerald-800 border border-slate-300">[نصف الصافي] - [قلاطة المالك] (توزع بالكامل على طاقم الصيد)</td>
                <td className="p-2 text-left font-mono font-black text-emerald-900 border border-slate-300">{stats.crewShare.toLocaleString()} {currency}</td>
              </tr>
              <tr>
                <td className="p-2 font-bold text-amber-900 border border-slate-355">رسوم ومصاريف الكفيل الرسمية</td>
                <td className="p-2 text-amber-800 border border-slate-355">الرسوم الحكومية وتجديد التراخيص (تخصم بالكامل من المالك)</td>
                <td className="p-2 text-left font-mono font-bold text-amber-700 border border-slate-355">{stats.totalSponsorExpenses.toLocaleString()} {currency}</td>
              </tr>
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-800">
                <td className="p-2 text-slate-950 border border-slate-300 font-black">صافي مستحقات مالك السفينة النهائي</td>
                <td className="p-2 text-slate-700 border border-slate-300">المعادلة: [نص المالك الأساسي] + [قلاطة المالك] - [مصاريف الكفيل]</td>
                <td className="p-2 text-left font-mono font-black text-slate-950 text-xs border border-slate-300 underline">{stats.ownerFinalShare.toLocaleString()} {currency}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Third Section: Daily Returns list */}
        <div className="mb-2">
          <h2 className="text-xs font-black bg-slate-150 text-slate-800 px-3 py-1 rounded-md border-r-4 border-slate-800">
            ثالثاً: كشف الرحلات والردود المفصلة للفترة الحالية
          </h2>
        </div>

        <div className="border border-blue-200 rounded overflow-hidden mb-4 text-[11px]">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-blue-50 text-blue-950 font-bold border-b-2 border-blue-800" style={{ backgroundColor: "#eff6ff", color: "#172554" }}>
                <th className="p-1.5 border border-blue-200 text-center w-24">رقم الرد</th>
                <th className="p-1.5 border border-blue-200 w-32">تاريخ الرحلة</th>
                <th className="p-1.5 border border-blue-200 text-left w-36">صافي القيمة المستلمة</th>
                <th className="p-1.5 border border-blue-200">ملاحظات الصيد والرحلة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {currentRecord.dailyReturns.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-2 text-center text-slate-400 font-bold italic">لا توجد رحلات أو ردود مسجلة لهذا الشهر حالياً.</td>
                </tr>
              ) : (
                currentRecord.dailyReturns.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/20">
                    <td className="p-1.5 border border-blue-200 font-bold text-center text-blue-900 bg-blue-50/10">رد #{item.returnNumber}</td>
                    <td className="p-1.5 border border-blue-200 font-mono text-slate-700">{item.date}</td>
                    <td className="p-1.5 border border-blue-200 font-mono font-bold text-left text-blue-950">{item.netAmount.toLocaleString()} {currency}</td>
                    <td className="p-1.5 border border-blue-200 text-slate-600 font-medium text-[10px]">{item.notes || <span className="text-slate-300">-</span>}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Multi-column layout for Expenses in print */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          
          {/* Boat Expenses Print Ledger */}
          <div>
            <div className="mb-2">
              <h3 className="text-xs font-black text-slate-800 bg-slate-150 py-1 px-2 border-r-2 border-slate-800 rounded">
                رابعاً: مصاريف المركب التشغيلية العامة (الدورية)
              </h3>
            </div>
            <div className="border border-slate-300 rounded overflow-hidden text-[10px]">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold">
                    <th className="p-1 border border-slate-300">المصروف</th>
                    <th className="p-1 border border-slate-300 text-left">المبلغ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {currentRecord.boatExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="p-1 text-center text-slate-400 italic">لا توجد مصاريف تشغيلية لمركب {currentBoat.name}.</td>
                    </tr>
                  ) : (
                    currentRecord.boatExpenses.map((expense) => (
                      <tr key={expense.id}>
                        <td className="p-1 border border-slate-300">
                          <span className="font-bold block">{expense.type}</span>
                          <span className="text-[8px] text-slate-400 block font-mono">{expense.date} {expense.notes ? `| ${expense.notes}` : ''}</span>
                        </td>
                        <td className="p-1 border border-slate-300 font-mono font-bold text-left">{expense.amount.toLocaleString()} {currency}</td>
                      </tr>
                    ))
                  )}
                  <tr className="bg-slate-50 font-bold font-sans">
                    <td className="p-1 border border-slate-300 text-slate-800">إجمالي مصاريف المركب:</td>
                    <td className="p-1 border border-slate-300 font-mono text-left underline">{stats.totalBoatExpenses.toLocaleString()} {currency}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Sponsor Expenses Print Ledger */}
          <div>
            <div className="mb-2">
              <h3 className="text-xs font-black text-slate-800 bg-slate-150 py-1 px-2 border-r-2 border-slate-800 rounded">
                خامساً: مصاريف حكومية وتراخيص (على الكفيل)
              </h3>
            </div>
            <div className="border border-slate-300 rounded overflow-hidden text-[10px]">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold">
                    <th className="p-1 border border-slate-300">البند المخصوم</th>
                    <th className="p-1 border border-slate-300 text-left">المبلغ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {currentRecord.sponsorExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="p-1 text-center text-slate-400 italic">لا تعاملات مسجلة على الكفيل.</td>
                    </tr>
                  ) : (
                    currentRecord.sponsorExpenses.map((expense) => (
                      <tr key={expense.id}>
                        <td className="p-1 border border-slate-300">
                          <span className="font-bold block">{expense.type}</span>
                          <span className="text-[8px] text-slate-400 block font-mono">{expense.date} {expense.notes ? `| ${expense.notes}` : ''}</span>
                        </td>
                        <td className="p-1 border border-slate-300 font-mono font-bold text-left">{expense.amount.toLocaleString()} {currency}</td>
                      </tr>
                    ))
                  )}
                  <tr className="bg-slate-50 font-bold font-sans">
                    <td className="p-1 border border-slate-300 text-slate-800">إجمالي مصاريف الكفيل:</td>
                    <td className="p-1 border border-slate-300 font-mono text-left underline">{stats.totalSponsorExpenses.toLocaleString()} {currency}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer legalities */}
        <div className="text-center text-[8px] text-slate-400 font-medium mt-4 border-t border-slate-100 pt-2">
          تم إنتاج هذا المستند بمقتضى مخرجات نظام محاسبة المركب "{currentBoat.name}". أي شطب، تعديل، أو عدم وضوح في قيم الإقفال والعملة يبطل صحة هذا التقرير الحسابي.
        </div>

      </div>

    </div>
  );
}
