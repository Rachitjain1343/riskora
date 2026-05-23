import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  TrendingUp, 
  Coins, 
  Briefcase, 
  User, 
  ArrowRight, 
  ArrowLeft, 
  Download, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Activity, 
  AlertOctagon, 
  CheckCircle2, 
  Clock, 
  HelpCircle,
  LogIn,
  LogOut,
  History,
  Trash2,
  Globe,
  Settings,
  X,
  Plus,
  Sparkles,
  CreditCard,
  Lock
} from "lucide-react";
import { ProfileType, RiskItem, RiskReport, FinancialSummary } from "./types";
import { 
  auth, 
  loginWithGoogle, 
  logoutUser, 
  db, 
  handleFirestoreError, 
  OperationType 
} from "./lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  collection, 
  serverTimestamp, 
  query, 
  orderBy 
} from "firebase/firestore";

export default function App() {
  // Navigation & Wizard State
  const [step, setStep] = useState<number>(1);
  const [profileType, setProfileType] = useState<ProfileType | null>(null);
  const [domain, setDomain] = useState<string>("");
  
  // Geopolitical & Regional Analysis Parameters
  const [region, setRegion] = useState<string>("India");
  const [geopoliticalScenario, setGeopoliticalScenario] = useState<string>("Iran-USA War & Strait of Hormuz Commercial LPG Price Surge");

  // Financial Context Inputs specifically to calculate exact financial impacts
  const [currency, setCurrency] = useState<string>("INR");
  const [scale, setScale] = useState<string>(""); // input scale, e.g. "$150,050 Annual Revenue" or "Freelancer earning 15L/yr"
  
  // Firebase Auth and Multi-User Cloud States
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [userProfileData, setUserProfileData] = useState<any>(null);
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  // Profile Customizer Preferences
  const [prefName, setPrefName] = useState<string>("");
  const [prefRegion, setPrefRegion] = useState<string>("India");
  const [prefIndustry, setPrefIndustry] = useState<string>("Commercial LPG");

  // Active sync state indicators
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Premium analysis & dynamic checkout state parameters
  const [isDeepAnalysis, setIsDeepAnalysis] = useState<boolean>(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [checkoutCardName, setCheckoutCardName] = useState<string>("");
  const [checkoutCardNumber, setCheckoutCardNumber] = useState<string>("");
  const [checkoutIsSubmitting, setCheckoutIsSubmitting] = useState<boolean>(false);

  
  // Automatic currency pairing based on operating region selection
  useEffect(() => {
    const reg = region.trim().toLowerCase();
    if (reg === "india") {
      setCurrency("INR");
    } else if (reg === "european union" || reg === "eu" || reg === "europe") {
      setCurrency("EUR");
    } else if (reg === "united kingdom" || reg === "uk" || reg === "gbp") {
      setCurrency("GBP");
    } else {
      setCurrency("USD");
    }
  }, [region]);

  // Track authentication states
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setPrefName(user.displayName || "");
        await syncUserProfile(user);
        await fetchSavedReports(user.uid);
      } else {
        setUserProfileData(null);
        setSavedReports([]);
      }
      setLoadingUser(false);
    });
    return () => unsubscribe();
  }, []);

  const syncUserProfile = async (user: FirebaseUser) => {
    const userRef = doc(db, "users", user.uid);
    try {
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserProfileData(data);
        if (data.displayName) setPrefName(data.displayName);
        if (data.defaultRegion) {
          setRegion(data.defaultRegion);
          setPrefRegion(data.defaultRegion);
        }
        if (data.defaultIndustry) {
          setDomain(data.defaultIndustry);
          setPrefIndustry(data.defaultIndustry);
        }
        if (data.hasPremium) {
          setIsDeepAnalysis(true);
        } else {
          setIsDeepAnalysis(false);
        }
      } else {
        // Automatically register standard profiles
        const timestamp = serverTimestamp();
        const initialProfile = {
          uid: user.uid,
          displayName: user.displayName || "Anonymous Professional",
          email: user.email || "",
          photoURL: user.photoURL || "",
          defaultRegion: "India",
          defaultIndustry: "Commercial LPG",
          createdAt: timestamp,
          updatedAt: timestamp,
          hasPremium: false
        };
        await setDoc(userRef, initialProfile).catch((err) => {
          handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`);
        });
        setUserProfileData({
          uid: user.uid,
          displayName: user.displayName || "Anonymous Professional",
          email: user.email || "",
          photoURL: user.photoURL || "",
          defaultRegion: "India",
          defaultIndustry: "Commercial LPG",
          hasPremium: false
        });
        setIsDeepAnalysis(false);
      }
    } catch (err) {
      console.error("Failed syncing user profile: ", err);
    }
  };

  const handleUpdateProfile = async () => {
    if (!currentUser) return;
    const userRef = doc(db, "users", currentUser.uid);
    try {
      const updatedProfile = {
        uid: currentUser.uid,
        displayName: prefName.trim() || currentUser.displayName || "Anonymous Analyst",
        email: currentUser.email || "",
        photoURL: currentUser.photoURL || "",
        defaultRegion: prefRegion,
        defaultIndustry: prefIndustry,
        createdAt: userProfileData?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
        hasPremium: !!userProfileData?.hasPremium
      };
      await setDoc(userRef, updatedProfile).catch((err) => {
        handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
      });
      setUserProfileData({
        ...userProfileData,
        displayName: prefName,
        defaultRegion: prefRegion,
        defaultIndustry: prefIndustry,
        hasPremium: !!userProfileData?.hasPremium
      });
      setRegion(prefRegion);
      setDomain(prefIndustry);
      setShowProfileModal(false);
    } catch (err) {
      console.error("Profile updates rejected: ", err);
    }
  };

  const handleUpgradePremium = async () => {
    if (!currentUser) {
      loginWithGoogle();
      return;
    }
    setCheckoutIsSubmitting(true);
    // Simulate real-time merchant payment gateway processing (secure 3D-Secure routing)
    setTimeout(async () => {
      const userRef = doc(db, "users", currentUser.uid);
      try {
        await setDoc(userRef, { hasPremium: true }, { merge: true }).catch((err) => {
          handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
        });
        
        setUserProfileData((prev: any) => ({
          ...prev,
          hasPremium: true
        }));
        
        setIsDeepAnalysis(true);
        setCheckoutIsSubmitting(false);
        setShowCheckoutModal(false);
        setCheckoutCardName("");
        setCheckoutCardNumber("");
      } catch (err) {
        console.error("Upgrade calculation matrix failed: ", err);
        setCheckoutIsSubmitting(false);
      }
    }, 1500);
  };

  const fetchSavedReports = async (uid: string) => {
    setLoadingReports(true);
    const reportsRef = collection(db, "users", uid, "reports");
    const q = query(reportsRef, orderBy("createdAt", "desc"));
    try {
      const snapshot = await getDocs(q).catch((err) => {
        handleFirestoreError(err, OperationType.LIST, `users/${uid}/reports`);
      });
      const reportsList: any[] = [];
      snapshot.forEach((reportDoc) => {
        reportsList.push({ id: reportDoc.id, ...reportDoc.data() });
      });
      setSavedReports(reportsList);
    } catch (err) {
      console.error("Failed querying saved reports hierarchy: ", err);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleSaveReportToFirebase = async (reportToSave: RiskReport) => {
    if (!currentUser) return;
    setSaveStatus("saving");
    const reportId = reportToSave.id || `rep_${Date.now().toString(16)}`;
    const reportRef = doc(db, "users", currentUser.uid, "reports", reportId);
    
    // Schema match validation payload
    const payload = {
      id: reportId,
      userId: currentUser.uid,
      profileType: reportToSave.profileType,
      domain: reportToSave.domain,
      scaleEstimate: reportToSave.scaleEstimate,
      region: reportToSave.region || region,
      geopoliticalScenario: reportToSave.geopoliticalScenario || geopoliticalScenario,
      isDeepAnalysis: !!reportToSave.isDeepAnalysis,
      summary: reportToSave.summary,
      financialSummary: reportToSave.financialSummary,
      risks: reportToSave.risks,
      createdAt: serverTimestamp()
    };

    try {
      await setDoc(reportRef, payload).catch((err) => {
        handleFirestoreError(err, OperationType.CREATE, `users/${currentUser.uid}/reports/${reportId}`);
      });
      await fetchSavedReports(currentUser.uid);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch (err) {
      setSaveStatus("error");
      console.error("Failed creating cloud backup: ", err);
    }
  };

  const handleDeleteReport = async (reportId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // prevent re-loading on list click
    if (!currentUser) return;
    const reportRef = doc(db, "users", currentUser.uid, "reports", reportId);
    try {
      await deleteDoc(reportRef).catch((err) => {
        handleFirestoreError(err, OperationType.DELETE, `users/${currentUser.uid}/reports/${reportId}`);
      });
      await fetchSavedReports(currentUser.uid);
    } catch (err) {
      console.error("Delete report rejected: ", err);
    }
  };

  // Request & Status State
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("Scanning domain risk vectors...");
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Results State
  const [report, setReport] = useState<RiskReport | null>(null);
  const [expandedRiskId, setExpandedRiskId] = useState<string | null>(null);

  // Suggested industry chips
  const suggestedChips = [
    "Restaurant", "Real Estate", "E-commerce", "SaaS Startup", "Fintech", "Logistics",
    "Healthcare", "Retail Shop", "Crypto Trading", "Manufacturing", "Freelancing", "EdTech"
  ];

  // Suggested scales based on profile model to make entering easier
  const businessScales = [
    "Micro business / Bootstrapped startup (under $100k annual budget)",
    "Small-to-medium enterprise (SME) (approx. $500k - $2M annual revenue)",
    "Growth-stage scaleup (approx. $5M - $10M ARR)",
    "Mid-market corporation (approx. $10M+ annual revenue)"
  ];

  const individualScales = [
    "Solo Freelancer / Independent contractor (approx. $40k - $100k annual billing)",
    "Independent Retail Trader / Investor (approx. $10k - $50k capital base)",
    "Solo Creator / Agency Owner (approx. $80k - $250k annual collections)",
    "Working Professional / Sole breadwinner"
  ];

  // Cycling professional diagnostic messages during wait times
  const diagnosticsSteps = [
    "Initializing Monte Carlo risk matrix simulation...",
    "Scanning liquidity & structural cash flow exposure models...",
    "Evaluating regulatory compliance and localized hazard triggers...",
    "Estimating product-market volatility and competitor pricing pressure...",
    "Computing predictive currency & operational overhead stress metrics...",
    "Calibrating geopolitical shock transmission channels...",
    "Rendering executive risk-response framework..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      let index = 0;
      setLoadingMessage(diagnosticsSteps[0]);
      interval = setInterval(() => {
        index = (index + 1) % diagnosticsSteps.length;
        setLoadingMessage(diagnosticsSteps[index]);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handlePickProfile = (profile: ProfileType) => {
    setProfileType(profile);
    // Auto advance to step 2 after brief transition delay
    setTimeout(() => {
      setStep(2);
    }, 380);
  };

  const handlePickChip = (chip: string) => {
    setDomain(chip);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleAnalyze = async () => {
    if (!domain.trim()) {
      // Simple validation trigger
      const input = document.getElementById("domain-input");
      if (input) {
        input.classList.add("border-brand-red");
        setTimeout(() => input.classList.remove("border-brand-red"), 1400);
      }
      return;
    }

    setApiError(null);
    setLoading(true);
    setStep(3);

    try {
      const response = await fetch("/api/analyze-risks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileType,
          domain,
          scaleValue: scale || (profileType === "Business" ? "Average SME" : "Average professional"),
          currency,
          region,
          geopoliticalScenario,
          isDeepAnalysis
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      setReport(data);
      if (auth.currentUser) {
        await handleSaveReportToFirebase(data);
      }
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || "Something went wrong while calculating risks.");
    } finally {
      setLoading(false);
    }
  };

  const loadSavedReport = (savedReport: any) => {
    setProfileType(savedReport.profileType);
    setDomain(savedReport.domain);
    setScale(savedReport.scaleEstimate);
    setRegion(savedReport.region || "India");
    setGeopoliticalScenario(savedReport.geopoliticalScenario || "");
    setIsDeepAnalysis(!!savedReport.isDeepAnalysis);
    setReport(savedReport);
    setStep(3);
  };

  const restart = () => {
    setProfileType(null);
    setDomain("");
    setScale("");
    setRegion("India");
    setGeopoliticalScenario("Iran-USA War & Strait of Hormuz Commercial LPG Price Surge");
    setIsDeepAnalysis(false);
    setReport(null);
    setExpandedRiskId(null);
    setApiError(null);
    setStep(1);
  };

  const getSeverityColor = (level: "high" | "medium" | "low") => {
    switch (level) {
      case "high":
        return {
          border: "border-rose-200 hover:border-rose-300",
          bg: "bg-rose-50/20",
          accent: "text-rose-600",
          glow: "shadow-sm hover:shadow-md",
          badge: "bg-rose-50 text-rose-700 border-rose-200"
        };
      case "medium":
        return {
          border: "border-amber-200 hover:border-amber-300",
          bg: "bg-amber-50/20",
          accent: "text-amber-600",
          glow: "shadow-sm hover:shadow-md",
          badge: "bg-amber-50 text-amber-700 border-amber-200"
        };
      case "low":
        return {
          border: "border-sky-200 hover:border-sky-300",
          bg: "bg-sky-50/20",
          accent: "text-sky-600",
          glow: "shadow-sm hover:shadow-md",
          badge: "bg-sky-50 text-sky-700 border-sky-200"
        };
    }
  };

  const formatMoney = (val: number, symbol: string) => {
    return `${symbol}${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  const downloadReport = () => {
    if (!report) return;
    const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const lc = { high: "#ff3d1f", medium: "#f5a623", low: "#00c2ff" };
    
    const premiumTag = report.isDeepAnalysis ? `
    <div style="background: linear-gradient(90deg, #4f46e5, #818cf8); border-radius: 6px; padding: 10px 16px; margin-bottom: 24px; color: #ffffff; font-family: 'Syne', sans-serif; font-size: 11px; letter-spacing: 0.15em; font-weight: bold; text-transform: uppercase;">
      ✦ Personalised Deep Risk Assessment (Premium 10-Dimension Stress Model)
    </div>
    ` : "";

    const cardsHTML = report.risks.map(r => {
      const lvl = r.level;
      const score = Math.min(100, r.score || 50);
      const symbol = r.financialImpact.currencySymbol || "$";
      return `
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:24px;margin-bottom:18px;border-top:4px solid ${lc[lvl]};box-shadow: 0 1px 3px rgba(0,0,0,0.05)">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:10px;font-family:'DM Mono',monospace;letter-spacing:.18em;text-transform:uppercase;padding:4px 10px;border:1px solid ${lc[lvl]}44;border-radius:4px;color:${lc[lvl]};background:${lc[lvl]}11">
            ${lvl} risk
          </span>
          <span style="font-size:12px;font-family:'DM Mono',monospace;color:#64748b">Severity Index: ${score}/100</span>
        </div>
        <h3 style="font-family:'Syne',sans-serif;font-size:18px;margin:14px 0 8px;color:#1e293b">${r.title}</h3>
        <p style="font-size:12px;color:#475569;line-height:1.75;margin-bottom:14px;font-family:'DM Mono',monospace">${r.description}</p>
        
        <div style="border-top:1px solid #f1f5f9;padding-top:12px;margin-top:12px;">
          <table style="width:100%;font-size:12px;font-family:'DM Mono',monospace;color:#475569;">
            <tr>
              <td style="padding:4px 0;">Estimated Loss Range:</td>
              <td style="text-align:right;color:#0f172a;font-weight:bold;">${formatMoney(r.financialImpact.minLoss, symbol)} - ${formatMoney(r.financialImpact.maxLoss, symbol)}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;">Required Mitigation Budget:</td>
              <td style="text-align:right;color:#0f172a;">${formatMoney(r.financialImpact.mitigationCost, symbol)}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;">Mitigation Protection ROI:</td>
              <td style="text-align:right;color:#4f46e5;font-weight:bold;">${r.financialImpact.roiMultiplier}x Saved per Unit Spent</td>
            </tr>
          </table>
        </div>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px;padding:12px;margin-top:12px;font-size:11px;font-family:'DM Mono',monospace;color:#334155">
          <strong style="color:#4f46e5">Mitigation Strategy:</strong> ${r.mitigationStrategy}
        </div>
      </div>`;
    }).join("");

    const totalExposure = `${formatMoney(report.financialSummary.totalEstimatedLossMin, report.financialSummary.currencySymbol)} - ${formatMoney(report.financialSummary.totalEstimatedLossMax, report.financialSummary.currencySymbol)}`;
    
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>RiskLens Report - ${report.domain}</title>
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@300;400;500;700&display=swap" rel="stylesheet">
  <style>
    body{background:#f8fafc;color:#1e293b;font-family:'DM Mono',monospace;margin:0;padding:40px;max-width:860px;margin:0 auto}
    h1{font-family:'Syne',sans-serif;font-size:36px;font-weight:800;margin-bottom:6px;letter-spacing:-1px;color:#0f172a}
    h2{font-family:'Syne',sans-serif;font-size:20px;color:#4f46e5;border-bottom:1px solid #e2e8f0;padding-bottom:10px;margin-top:40px}
    .meta{color:#64748b;font-size:11px;margin-bottom:30px;letter-spacing:.05em}
    .summary-box{background:rgba(79,70,229,0.04);border:1px solid rgba(79,70,229,0.15);border-radius:8px;padding:24px;margin-bottom:30px}
  </style>
</head>
<body>
  ${premiumTag}
  <p style="font-size:9px;letter-spacing:.25em;text-transform:uppercase;color:#4f46e5;margin-bottom:10px">◈ RiskLens — Quantitative Risk intelligence</p>
  <h1>Risk Intelligence Report</h1>
  <div class="meta">
    <strong>Profile Context:</strong> ${report.profileType} &nbsp;//&nbsp; 
    <strong>Domain Industry:</strong> ${report.domain} &nbsp;//&nbsp; 
    <strong>Operating Region:</strong> ${report.region || region} &nbsp;//&nbsp; 
    <strong>Active Geopolitical Scenario:</strong> ${report.geopoliticalScenario || geopoliticalScenario} &nbsp;//&nbsp; 
    <strong>Assessed Scale:</strong> ${report.scaleEstimate} &nbsp;//&nbsp; 
    <strong>Generated Date:</strong> ${dateStr}
  </div>

  <div class="summary-box">
    <h3 style="font-family:'Syne',sans-serif;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#4f46e5;margin:0 0 10px 0">Executive Summary & Strategic Mandate</h3>
    <p style="font-size:13px;color:#334155;line-height:1.8;margin:0 0 16px 0">${report.summary}</p>
    
    <div style="border-top:1px solid rgba(79,70,229,0.1);padding-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:20px;">
      <div>
        <p style="font-size:10px;color:#64748b;margin:0 0 4px 0;text-transform:uppercase;letter-spacing:1px">Simulated Financial Loss Exposure</p>
        <span style="font-size:22px;color:#f43f5e;font-weight:bold;font-family:'Syne',sans-serif;">${totalExposure}</span>
      </div>
      <div>
        <p style="font-size:10px;color:#64748b;margin:0 0 4px 0;text-transform:uppercase;letter-spacing:1px">Proactive Remediation Budget</p>
        <span style="font-size:22px;color:#0f172a;font-weight:bold;font-family:'Syne',sans-serif;">${formatMoney(report.financialSummary.totalMitigationCost, report.financialSummary.currencySymbol)}</span>
      </div>
    </div>
  </div>

  <h2>Itemized Severity Vectors</h2>
  <div style="margin-top:20px;">
    ${cardsHTML}
  </div>

  <div style="border-top:1px solid #e2e8f0;margin-top:60px;padding-top:20px;text-align:center;font-size:10px;color:#94a3b8;letter-spacing:.05em">
    Disclaimer: This report is a generated algorithmic assessment mapping structural risks & pricing multipliers. Standard validation is recommended prior to implementing capital spend structure.
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `RiskLens_Forecast_${report.domain.toLowerCase().replace(/\s+/g, "_")}.html`;
    a.click();
  };

  return (
    <div className="relative min-h-screen bg-brand-bg text-brand-text font-mono flex flex-col justify-between overflow-x-hidden selection:bg-brand-accent selection:text-white">
      {/* Decorative Grid overlays scaled down to feel elegant */}
      <div className="grid-overlay" id="grid"></div>
      <div className="glow-overlay" id="glow"></div>

      {/* Top Header customized to Geometric Balance layout specification */}
      <header className="sticky top-0 left-0 right-0 z-50 h-16 bg-white border-b border-indigo-100 flex items-center justify-between px-6 sm:px-8 border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-accent rounded flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white rotate-45 shadow-sm"></div>
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800 font-sans">
            RISKLENS <span className="font-light text-slate-400">v4.2</span>
          </span>
        </div>
        
        <div className="flex items-center gap-3.5">
          <div className="hidden lg:flex items-center gap-2 text-[10px] tracking-wider uppercase text-slate-500 border border-slate-200 px-3 py-1.5 rounded bg-slate-50 font-bold">
            <span className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-live"></span>
            Gemini AI Powered
          </div>

          {loadingUser ? (
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent animate-spin rounded-full"></div>
          ) : currentUser ? (
            <div className="flex items-center gap-3">
              {/* Profile Config Settings Dropdown trigger */}
              <button 
                onClick={() => {
                  setPrefName(userProfileData?.displayName || currentUser.displayName || "");
                  setPrefRegion(region);
                  setPrefIndustry(domain);
                  setShowProfileModal(true);
                }}
                className="flex items-center gap-2 hover:bg-slate-50 border hover:border-indigo-300 border-slate-200 bg-white p-1 pr-3 rounded-full cursor-pointer transition-all shrink-0"
              >
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="Avatar" className="w-6 h-6 rounded-full object-cover border border-indigo-150" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-indigo-55 flex items-center justify-center border border-indigo-200 text-indigo-700">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
                <span className="hidden sm:inline text-xs font-semibold font-sans text-slate-600 max-w-[120px] truncate">
                  {userProfileData?.displayName || currentUser.displayName || "Analyst Profile"}
                </span>
                <Settings className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-600" />
              </button>

              <button 
                onClick={logoutUser}
                title="Log Out"
                className="flex items-center gap-1.5 px-3 py-1.5 hover:text-rose-605 hover:border-rose-200 hover:bg-rose-50 border border-slate-200 rounded text-[10px] font-black tracking-wide uppercase font-sans text-slate-500 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={loginWithGoogle}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-md px-3.5 py-1.5 rounded-lg text-xs font-bold font-sans transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Connect Google</span>
            </button>
          )}
        </div>
      </header>

      {/* Progress Track */}
      <div className="w-full h-[1px] bg-slate-200 relative z-40">
        <div 
          className="h-full bg-brand-accent shadow-[0_0_8px_rgba(79,70,229,0.3)] transition-all duration-700 ease-out"
          style={{ width: `${(step / 3) * 100}%` }}
        ></div>
      </div>

      {/* Main Container */}
      <main className="relative z-10 flex-grow flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-4xl">
          
          {/* STEP 1: Profile Selection */}
          {step === 1 && (
            <div className="max-w-2xl mx-auto flex flex-col gap-6 animate-fade-in">
              <div className="bg-white border border-slate-200 p-8 sm:p-10 rounded-2xl shadow-sm">
                <span className="text-[10px] tracking-[0.26em] uppercase text-brand-accent mb-3 flex items-center gap-2 font-bold font-sans">
                  <span className="block w-4 h-[1.5px] bg-brand-accent"></span> Who are you
                </span>
                <h1 className="font-sans font-extrabold text-3xl sm:text-4xl leading-none mb-3 tracking-tight text-slate-900">
                  Select your profile
                </h1>
                <p className="text-xs text-slate-500 mb-8 max-w-md leading-relaxed">
                  We'll tailor your quantitative risks, hazard analysis, and capital preservation formulas to your professional scale.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={() => handlePickProfile("Individual")}
                    className={`relative group bg-white border text-left p-6 rounded-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md ${profileType === "Individual" ? "border-brand-accent bg-indigo-50/20" : "border-slate-200 text-slate-700"}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <User className="w-8 h-8 text-brand-accent mb-4" />
                    <h3 className="font-sans font-bold text-lg text-slate-800 mb-1">Individual</h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Freelancer, independent contractor, professional trader, agency owner, or solo operator.
                    </p>
                    <div className="text-slate-300 group-hover:text-brand-accent font-bold mt-4 text-xs transition-colors self-end flex items-center gap-1 font-sans">
                      Select <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </button>

                  <button 
                    onClick={() => handlePickProfile("Business")}
                    className={`relative group bg-white border text-left p-6 rounded-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md ${profileType === "Business" ? "border-brand-accent bg-indigo-50/20" : "border-slate-200 text-slate-700"}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Briefcase className="w-8 h-8 text-brand-accent mb-4" />
                    <h3 className="font-sans font-bold text-lg text-slate-800 mb-1">Business</h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Small enterprise, startup, retail store, local brand, cooperative, or growing company.
                    </p>
                    <div className="text-slate-300 group-hover:text-brand-accent font-bold mt-4 text-xs transition-colors self-end flex items-center gap-1 font-sans">
                      Select <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </button>
                </div>
              </div>

              {/* CLOUD WORKSPACE INTEGRATION SECTION */}
              {currentUser ? (
                <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-sm text-left">
                  <h3 className="text-xs tracking-widest uppercase font-black text-indigo-700 mb-4 flex items-center gap-2 font-sans">
                    <History className="w-4 h-4 text-indigo-600 animate-spin-slow" /> Your Cloud Cabinet Inventory
                  </h3>
                  {loadingReports ? (
                    <div className="py-6 flex justify-center items-center gap-2 text-slate-450 font-sans text-xs">
                      <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent animate-spin rounded-full"></div>
                      <span>Retrieving backed up dossiers...</span>
                    </div>
                  ) : savedReports.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      <div className="max-h-[320px] overflow-y-auto pr-1 flex flex-col gap-2.5">
                        {savedReports.map((item) => (
                          <div 
                            key={item.id}
                            onClick={() => loadSavedReport(item)}
                            className="group p-4 bg-slate-50 border border-slate-200 hover:border-indigo-400 hover:bg-white rounded-xl flex items-center justify-between gap-4 cursor-pointer transition-all shadow-sm"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1 text-[9px] font-sans font-bold uppercase text-slate-450">
                                <span className="bg-indigo-100/75 border border-indigo-200 px-1.5 py-0.5 rounded text-[8px] tracking-wide text-indigo-700">
                                  {item.profileType}
                                </span>
                                <span className="text-slate-400">{item.region || "Global"}</span>
                                <span className="text-[8px] text-slate-400 font-mono italic">
                                  {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                </span>
                              </div>
                              <h4 className="font-sans font-bold text-sm text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors truncate">
                                {item.domain} exposure model
                              </h4>
                              <p className="text-[10px] text-slate-500 font-mono truncate max-w-md">
                                {item.geopoliticalScenario}
                              </p>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right font-sans hidden sm:block">
                                <span className="text-[8px] text-slate-405 block uppercase tracking-wider font-bold">Health posture</span>
                                <span className="text-xs font-extrabold text-indigo-700 font-mono">
                                  {item.financialSummary?.overallHealthScore || 0}/100
                                </span>
                              </div>
                              <button
                                onClick={(e) => handleDeleteReport(item.id, e)}
                                title="Delete from Cloud"
                                className="p-2 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center">
                      <Globe className="w-8 h-8 text-slate-300 mx-auto mb-2.5" />
                      <p className="text-xs text-slate-700 font-sans font-semibold mb-1">Dossiers cabinet empty</p>
                      <p className="text-[10px] text-slate-400 max-w-sm mx-auto font-mono">
                        Any simulation you generate with active configurations will be automatically compiled, sealed, and synced here.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-indigo-50/50 border border-indigo-100 p-6 sm:p-8 rounded-2xl shadow-sm text-left flex flex-col md:flex-row items-center justify-between gap-5">
                  <div className="flex gap-3 items-start">
                    <History className="w-6 h-6 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs tracking-widest uppercase font-black text-indigo-705 mb-1 font-sans">
                        ✦ Cloud Cabinet Vault Access
                      </h4>
                      <p className="text-[11px] leading-relaxed text-slate-600 font-mono max-w-md">
                        Google integration is natively integrated. Create registration records to isolate historical reports, default industry prefs, and compare analytical metrics in real time.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={loginWithGoogle}
                    className="flex shrink-0 items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-xs px-5 py-3 rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" /> Sign In & Configure
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Domain Context & Financial Parameter Controls */}
          {step === 2 && (
            <div className="max-w-3xl mx-auto animate-fade-in bg-white border border-slate-200 p-8 sm:p-10 rounded-2xl shadow-sm">
              <span className="text-[10px] tracking-[0.26em] uppercase text-brand-accent mb-3 flex items-center gap-2 font-bold font-sans">
                <span className="block w-4 h-[1.5px] bg-brand-accent"></span> Sector & Geopolitical Variables
              </span>
              <h2 className="font-sans font-extrabold text-3xl sm:text-4xl leading-none mb-3 tracking-tight text-slate-900">
                Calibrate your sandbox
              </h2>
              <p className="text-xs text-slate-500 mb-8 leading-relaxed">
                Provide your industry domain, operational region, and the active geopolitical shock situation you want modeled.
              </p>

              {/* Grid split for Sector and Region info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                
                {/* Core Field: Domain Name */}
                <div className="relative">
                  <label className="text-[10px] tracking-wider uppercase text-slate-400 mb-2 block font-bold font-sans" htmlFor="domain-input">
                    Industry / Domain Focus
                  </label>
                  <input 
                    id="domain-input"
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="e.g. Commercial LPG, Farming, Textile, Cafe..."
                    className="w-full bg-white border border-slate-200 focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/20 rounded-xl text-slate-800 outline-none text-sm px-4 py-3 transition-all font-mono shadow-sm"
                    autoComplete="off"
                  />
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {suggestedChips.slice(0, 8).map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => handlePickChip(chip)}
                        className={`text-[9px] px-2 py-1 border rounded-lg transition-all uppercase ${domain.trim().toLowerCase() === chip.toLowerCase() ? "bg-brand-accent border-brand-accent text-white font-semibold" : "border-slate-200 bg-white text-slate-500 hover:border-brand-accent hover:text-brand-accent"}`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* New Operating Region Selector */}
                <div className="relative">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] tracking-wider uppercase text-slate-400 block font-bold font-sans" htmlFor="region-input">
                      Operating Region
                    </label>
                    <span className="text-[9px] text-brand-accent uppercase tracking-widest font-black font-sans">Shock Transmission</span>
                  </div>
                  <input 
                    id="region-input"
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="e.g. India, USA, GCC..."
                    className="w-full bg-white border border-slate-200 focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/20 rounded-xl text-slate-800 outline-none text-sm px-4 py-3 transition-all font-mono shadow-sm"
                    autoComplete="off"
                  />
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {["India", "CC Middle East", "European Union", "USA & Canada", "Southeast Asia"].map((regPreset) => (
                      <button
                        key={regPreset}
                        type="button"
                        onClick={() => setRegion(regPreset)}
                        className={`text-[9px] px-2 py-1 border rounded-lg transition-all uppercase ${region.toLowerCase() === regPreset.toLowerCase() ? "bg-brand-accent border-brand-accent text-white font-semibold" : "border-slate-200 bg-white text-slate-500 hover:border-brand-accent hover:text-brand-accent"}`}
                      >
                        {regPreset}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* New Geopolitical Scenario Selector */}
              <div className="relative mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] tracking-wider uppercase text-slate-400 block font-bold font-sans" htmlFor="geopolitical-input">
                    Active Geopolitical Shock Scenario
                  </label>
                  <span className="text-[9px] text-rose-500 uppercase tracking-widest font-bold">Propagation cascade modeled</span>
                </div>
                <input 
                  id="geopolitical-input"
                  type="text"
                  value={geopoliticalScenario}
                  onChange={(e) => setGeopoliticalScenario(e.target.value)}
                  placeholder="e.g. Iran-USA War, Strait of Hormuz Supply Blockade..."
                  className="w-full bg-white border border-slate-200 focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/20 rounded-xl text-slate-800 outline-none text-sm px-4 py-3 transition-all font-mono shadow-sm mb-2"
                  autoComplete="off"
                />
                
                {/* Geopolitical Presets in card layout */}
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-[10px] font-mono whitespace-normal">
                  <span className="text-[10px] tracking-wider text-brand-accent uppercase block mb-1.5 font-bold font-sans">Active Geopolitical Hostility Presets (Click to track):</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {[
                      "Iran-USA War & Strait of Hormuz Commercial LPG Price Surge",
                      "Red Sea Sea-Lane Congestion & Maritime Container Surcharges",
                      "Global Petroleum Shocks & Domestic Diesel Input Surge",
                      "US-China Trade Wars & Tariff Sanctions Cascade"
                    ].map((geoPreset) => (
                      <button
                        key={geoPreset}
                        type="button"
                        onClick={() => setGeopoliticalScenario(geoPreset)}
                        className={`text-left text-[10px] hover:text-brand-accent transition-colors truncate py-0.5 border-b border-dashed border-slate-200 pb-1 last:border-0 ${geopoliticalScenario === geoPreset ? "text-brand-accent font-semibold" : "text-slate-500"}`}
                      >
                        ▸ {geoPreset.length > 55 ? geoPreset.slice(0, 52) + "..." : geoPreset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Currency Selector */}
              <div className="mb-6">
                <label className="text-[10px] tracking-wider uppercase text-slate-400 mb-2.5 block font-bold font-sans">
                  Billing Currency (Auto-adjusted to region)
                </label>
                <div className="flex gap-2.5">
                  {[
                    { code: "USD", symbol: "$" },
                    { code: "INR", symbol: "₹" },
                    { code: "EUR", symbol: "€" },
                    { code: "GBP", symbol: "£" }
                  ].map((curr) => (
                    <button
                      key={curr.code}
                      type="button"
                      onClick={() => setCurrency(curr.code)}
                      className={`flex-1 max-w-[90px] py-1.5 px-3 border rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm ${currency === curr.code ? "border-brand-accent bg-indigo-50 text-brand-accent font-bold" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`}
                    >
                      <span className="text-[13px]">{curr.symbol}</span>
                      <span>{curr.code}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Financial Scale Assessment */}
              <div className="relative mb-8">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] tracking-wider uppercase text-slate-400 block font-bold font-sans">
                    Estimated Operational Scale / Revenue Context <span className="text-brand-accent">(Encouraged)</span>
                  </label>
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Rescaling Multipliers</span>
                </div>
                <input 
                  type="text"
                  value={scale}
                  onChange={(e) => setScale(e.target.value)}
                  placeholder={profileType === "Business" ? "e.g. $250k annual budget, or Farmer with 10 acres of land" : "e.g. Solo operator earning $90,000 yearly, or Freelance designer"}
                  className="w-full bg-white border border-slate-200 focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/20 rounded-xl text-xs px-4 py-3 outline-none text-slate-805 transition-all font-mono mb-2 shadow-sm text-slate-800"
                  autoComplete="off"
                />
                <p className="text-[10px] text-slate-400 italic leading-relaxed">
                  Provide cash variables, tilling sizes, or cargo weights for realistic micro and macro computations.
                </p>

                {/* Micro selector scale guidelines */}
                <div className="mt-4 bg-slate-50 border border-slate-200 p-4 rounded-xl">
                  <span className="text-[10px] tracking-widest text-brand-accent uppercase block mb-2 font-bold font-sans">Common Scale Templates (Click to apply):</span>
                  <div className="flex flex-col gap-1.5">
                    {(profileType === "Business" ? businessScales : individualScales).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setScale(preset.match(/\(([^)]+)\)/)?.[1] || preset)}
                        className="text-[10px] text-left text-slate-500 hover:text-brand-accent transition-colors truncate py-0.5"
                      >
                        ▸ {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ANALYSIS DEPTH OPTION - Standard vs Personalized Deep Analysis */}
              <div className="mb-8 border-t border-slate-100 pt-6">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[10px] tracking-wider uppercase text-slate-400 block font-bold font-sans">
                    Risk Assessment Complexity Depth
                  </label>
                  <span className="text-[9px] text-indigo-600 uppercase tracking-widest font-black font-sans">99/month Premium option</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Option A: Standard */}
                  <div 
                    onClick={() => setIsDeepAnalysis(false)}
                    className={`p-5 rounded-2xl border text-left cursor-pointer transition-all duration-300 relative overflow-hidden group ${!isDeepAnalysis ? "border-slate-300 bg-slate-50/50" : "border-slate-200 bg-white hover:border-slate-300"}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                        {!isDeepAnalysis && <div className="w-3 h-3 rounded-full bg-brand-accent"></div>}
                      </div>
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 bg-slate-150 px-2 py-0.5 rounded font-mono">Free Tier</span>
                    </div>
                    <h4 className="font-sans font-extrabold text-sm text-slate-800 mt-3 mb-1">Standard Risk Matrix</h4>
                    <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                      Assesses 6 standard itemized quantitative risk dimensions with core macro impact projections.
                    </p>
                  </div>

                  {/* Option B: Personalized Deep Risk Assessment */}
                  <div 
                    onClick={() => {
                      if (userProfileData?.hasPremium) {
                        setIsDeepAnalysis(true);
                      } else {
                        setShowCheckoutModal(true);
                      }
                    }}
                    className={`p-5 rounded-2xl border text-left cursor-pointer transition-all duration-300 relative overflow-hidden group ${isDeepAnalysis ? "border-indigo-400 bg-indigo-50/10 shadow-sm" : "border-slate-200 bg-white hover:border-indigo-400"}`}
                  >
                    <div className="absolute top-0 right-0">
                      <div className="bg-gradient-to-l from-indigo-500 to-indigo-600 text-white uppercase text-[8px] tracking-wider font-extrabold px-3 py-1 rounded-bl-xl font-sans flex items-center gap-1 shadow-sm">
                        <span>✦ DEEP ASSESSMENT</span>
                      </div>
                    </div>

                    <div className="flex items-start justify-between">
                      <div className="w-6 h-6 rounded-full border border-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                        {isDeepAnalysis && <div className="w-3 h-3 rounded-full bg-indigo-600"></div>}
                      </div>
                    </div>
                    
                    <h4 className="font-sans font-extrabold text-sm text-indigo-900 mt-3 mb-1 flex items-center gap-1.5">
                      Personalised Deep Analysis
                    </h4>
                    
                    <p className="text-[11px] text-slate-505 text-slate-500 font-sans leading-relaxed mb-4">
                      Models 10 premium risk vectors with systemic stress scoring and direct remediation ROI multipliers.
                    </p>

                    <div className="border-t border-dashed border-slate-150 pt-2.5 flex items-center justify-between text-[11px] font-mono mt-auto">
                      <span className="text-indigo-600 font-sans font-bold uppercase tracking-wider text-[9px]">Charging Fee:</span>
                      <span className="text-slate-800 font-extrabold text-xs">
                        {currency === "INR" ? "₹" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$"}99 / month
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Directional Action */}
              <div className="flex gap-4 items-center">
                <button 
                  onClick={handleBack}
                  className="text-xs text-slate-400 hover:text-slate-800 transition-colors flex items-center gap-1 py-1.5 font-bold font-sans"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button 
                  onClick={handleAnalyze}
                  className="font-sans font-bold text-xs tracking-widest text-white bg-brand-accent hover:bg-indigo-700 px-6 py-3.5 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  Analyze Risk Outlook →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Results Diagnostics display */}
          {step === 3 && (
            <div className="animate-fade-in w-full">
              
              {/* Loader overlay */}
              {loading && (
                <div className="max-w-md mx-auto py-12 text-center bg-white border border-slate-200 p-8 sm:p-10 rounded-2xl shadow-sm">
                  <span className="text-[10px] tracking-[0.2em] text-brand-accent block mb-3 uppercase animate-pulse font-bold font-sans">
                    Computing Analytical Models
                  </span>
                  <h2 className="font-sans font-bold text-2xl text-slate-850 mb-6 flex justify-center items-center gap-1.5 text-slate-800">
                    Modelling Risk Exposures
                    <span className="inline-flex gap-0.5">
                      <span className="animate-bounce delay-75">.</span>
                      <span className="animate-bounce delay-150">.</span>
                      <span className="animate-bounce delay-300">.</span>
                    </span>
                  </h2>
                  <div className="w-full h-[3px] bg-slate-200 overflow-hidden mb-5 rounded-full">
                    <div className="h-full bg-brand-accent rounded-full animate-[loading-bar_2s_infinite_ease-in-out]"></div>
                  </div>
                  <p className="text-[10px] tracking-wider text-slate-450 uppercase h-10 font-bold text-slate-400 font-sans">
                    {loadingMessage}
                  </p>
                </div>
              )}

              {/* API Configuration/Error Warning Box */}
              {apiError && !loading && (
                <div className="max-w-2xl mx-auto bg-rose-50 border border-rose-200 rounded-xl p-6 my-4 shadow-sm">
                  <h3 className="text-rose-600 font-bold font-sans text-lg mb-2 flex items-center gap-2">
                    <AlertOctagon className="w-5 h-5 flex-shrink-0" /> Risk Intelligence Calibration Failed
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4 font-mono">
                    The backend was unable to generate your granular risk calculation model. This may be due to key parameters or connection hiccups.
                  </p>
                  <div className="bg-slate-900 border border-slate-950 p-4 rounded-lg font-mono text-[10px] text-rose-300 mb-4 overflow-x-auto shadow-inner">
                    {apiError}
                  </div>
                  <button 
                    onClick={restart}
                    className="font-sans font-bold text-xs tracking-wider text-white bg-brand-accent hover:bg-indigo-700 px-5 py-3 rounded-lg shadow-sm transition-all"
                  >
                    ← Reinstate Settings
                  </button>
                </div>
              )}

              {/* Actual Report Output dashboard layout! */}
              {report && !loading && (
                <div className="animate-fade-in">
                  
                  {/* Premium Tier Indicator Header */}
                  {report.isDeepAnalysis && (
                    <div className="mb-4 bg-gradient-to-r from-indigo-500/10 via-indigo-600/5 to-transparent border border-indigo-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                        </span>
                        <div className="text-[10px] font-mono tracking-wider text-indigo-900 uppercase font-extrabold flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-spin-slow" />
                          Personalised Deep Risk Assessment Tier Active
                        </div>
                      </div>
                      <span className="text-[9px] uppercase tracking-widest bg-indigo-600 text-white font-sans font-black px-2 py-0.5 rounded-sm">
                        10 Dimension Stress Forecast
                      </span>
                    </div>
                  )}

                  {/* Dynamic Interactive Metadata Header */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="text-[10px] tracking-wider uppercase border border-indigo-200 px-2.5 py-1 rounded text-brand-accent bg-indigo-50 font-bold font-sans">
                      {report.profileType}
                    </span>
                    <span className="text-[10px] tracking-wider uppercase border border-indigo-200 px-2.5 py-1 rounded text-brand-accent bg-indigo-50 font-bold font-sans">
                      Sector: {report.domain}
                    </span>
                    <span className="text-[10px] tracking-wider uppercase border border-indigo-150 px-2.5 py-1 rounded text-indigo-700 bg-indigo-50 font-bold font-sans">
                      Region: {report.region || region}
                    </span>
                    <span className="text-[10px] tracking-wider uppercase border border-rose-200 px-2.5 py-1 rounded text-rose-700 bg-rose-50/50 font-bold font-sans max-w-[280px] truncate" title={report.geopoliticalScenario || geopoliticalScenario}>
                      Geopolitics: {report.geopoliticalScenario || geopoliticalScenario}
                    </span>
                    <span className="text-[10px] tracking-wider uppercase border border-slate-200 px-2.5 py-1 rounded text-slate-500 bg-white shadow-sm font-bold font-sans">
                      Scale: {report.scaleEstimate}
                    </span>
                    <span className="text-[10px] tracking-wider uppercase border border-slate-200 px-2.5 py-1 rounded text-slate-500 bg-white shadow-sm font-bold flex items-center gap-1.5 font-sans">
                      <Clock className="w-3.5 h-3.5 text-brand-accent" /> FY26 Outlook Q4 Forecast
                    </span>
                  </div>

                  {/* Header Titles */}
                  <h1 className="font-sans font-extrabold text-3xl sm:text-4xl md:text-5xl leading-none mb-1 text-slate-900 tracking-tight">
                    Risk Intelligence Report
                  </h1>
                  <p className="text-[10px] tracking-widest text-slate-400 font-bold uppercase mb-8">
                    Quantitative Financial Forecast & Remediation ROIs
                  </p>

                  {/* Executive Financial Summary Grid Block */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                    
                    <div className="bg-white border border-slate-200 text-left p-6 rounded-xl hover:border-slate-300 transition-all shadow-sm relative overflow-hidden flex flex-col justify-between">
                      <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-500 rounded-full"></div>
                      <div>
                        <span className="text-[9px] font-bold font-sans tracking-widest text-slate-400 uppercase block mb-1">
                          Calculated Financial Loss Exposure
                        </span>
                        <div className="font-sans text-2xl font-extrabold text-rose-600 tracking-tight">
                          {formatMoney(report.financialSummary.totalEstimatedLossMin, report.financialSummary.currencySymbol)} - {formatMoney(report.financialSummary.totalEstimatedLossMax, report.financialSummary.currencySymbol)}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-505 mt-4 text-slate-500 font-mono">
                        Total projected monetary loss across the next 12 months across all active risk vectors without mitigation.
                      </p>
                    </div>

                    <div className="bg-white border border-slate-200 text-left p-6 rounded-xl hover:border-slate-300 transition-all shadow-sm relative overflow-hidden flex flex-col justify-between">
                      <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-indigo-500 rounded-full"></div>
                      <div>
                        <span className="text-[9px] font-bold font-sans tracking-widest text-slate-400 uppercase block mb-1">
                          Mitigation & Remediation Budget
                        </span>
                        <div className="font-sans text-2xl font-extrabold text-slate-900 tracking-tight">
                          {formatMoney(report.financialSummary.totalMitigationCost, report.financialSummary.currencySymbol)}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-4 font-mono">
                        Recommended capital allocation required to fully implement protective guidelines.
                      </p>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-100 text-left p-6 rounded-xl hover:border-indigo-150 transition-all shadow-sm relative overflow-hidden flex flex-col justify-between">
                      <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-brand-accent rounded-full animate-pulse"></div>
                      <div>
                        <span className="text-[10px] tracking-widest text-indigo-700 font-bold uppercase block mb-1 font-sans">
                          Cumulative Security Health Score
                        </span>
                        <div className="font-sans text-2xl font-black text-indigo-700 tracking-semibold flex items-center gap-1.5">
                          <Activity className="w-5 h-5 text-indigo-600" />
                          <span>{report.financialSummary.overallHealthScore} / 100</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-4 font-mono">
                        Synthesized health score assessing resilience and immunity of current capital constraints.
                      </p>
                    </div>
                  </div>

                  {/* Strategic Overview Context */}
                  <div className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-xl mb-8">
                    <h4 className="text-[10px] tracking-widest text-indigo-700 uppercase mb-2 font-black select-none font-sans">
                      Strategic Management Mandate
                    </h4>
                    <p className="text-xs leading-relaxed text-slate-700 font-mono">
                      {report.summary}
                    </p>
                  </div>

                  {/* HEADER LISTING SECTION */}
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-sans font-bold text-lg text-slate-800">
                      Identified Hazard Profiles
                    </h3>
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold font-sans">Click any vector to expand full action mitigation plan</span>
                  </div>

                  {/* Itemized Risks Grid with interactive toggles */}
                  <div className="grid grid-cols-1 gap-3.5 mb-8">
                    {report.risks.map((risk) => {
                      const sev = getSeverityColor(risk.level);
                      const isExpanded = expandedRiskId === risk.id;

                      return (
                        <div
                          key={risk.id}
                          className={`bg-white border rounded-xl transition-all duration-300 overflow-hidden shadow-sm ${sev.border}`}
                        >
                          {/* Card Header clickable to toggle expansion */}
                          <button
                            onClick={() => setExpandedRiskId(isExpanded ? null : risk.id)}
                            className="w-full text-left p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer focus:outline-none"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2.5 mb-2 flex-wrap text-[10px] font-sans">
                                <span className={`text-[9px] font-extrabold tracking-wider uppercase px-2 py-0.5 border rounded-sm ${sev.badge}`}>
                                  {risk.level} severity
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-indigo-500" /> {risk.timeframe}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold">
                                  Severity Index: {risk.score}/100
                                </span>
                              </div>
                              <h4 className="font-sans font-bold text-base text-slate-800 leading-tight group-hover:text-indigo-650 transition-colors">
                                {risk.title}
                              </h4>
                            </div>

                            {/* Brief Impact Overview displayed at the right */}
                            <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-0 border-slate-100 pt-3 md:pt-0">
                              <div className="text-left md:text-right font-sans">
                                <span className="text-[9px] tracking-wider text-slate-400 uppercase block font-bold">Estimated Loss Range</span>
                                <span className="text-sm font-extrabold text-slate-800 font-mono">
                                  {formatMoney(risk.financialImpact.minLoss, risk.financialImpact.currencySymbol)} - {formatMoney(risk.financialImpact.maxLoss, risk.financialImpact.currencySymbol)}
                                </span>
                              </div>
                              <div className="text-slate-400">
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-indigo-600" /> : <ChevronDown className="w-4 h-4 text-slate-400 hover:text-indigo-600" />}
                              </div>
                            </div>
                          </button>

                          {/* Expandable Mitigation and Calculations Action Plan */}
                          {isExpanded && (
                            <div className="px-5 pb-5 border-t border-slate-100 bg-slate-50/50 animate-fade-in">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
                                <div>
                                  <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase block mb-1.5 font-sans">Qualitative Breakdown</span>
                                  <p className="text-xs leading-relaxed text-slate-600 font-mono">
                                    {risk.description}
                                  </p>

                                  <div className="mt-4 bg-white p-4 border border-slate-200 rounded-lg shadow-sm">
                                    <span className="text-[9px] tracking-wider text-slate-400 uppercase block mb-2 font-bold font-sans">Quantitative Financial Impact Formula</span>
                                    <table className="w-full text-xs text-slate-600 font-mono leading-relaxed">
                                      <tbody>
                                        <tr className="border-b border-slate-100">
                                          <td className="py-2">Est. Monetary Cost:</td>
                                          <td className="py-2 text-right text-rose-600 font-bold">
                                            {formatMoney(risk.financialImpact.minLoss, risk.financialImpact.currencySymbol)} - {formatMoney(risk.financialImpact.maxLoss, risk.financialImpact.currencySymbol)}
                                          </td>
                                        </tr>
                                        <tr className="border-b border-slate-100">
                                          <td className="py-2">Mitigation Cost:</td>
                                          <td className="py-2 text-right text-slate-800 font-bold">
                                            {formatMoney(risk.financialImpact.mitigationCost, risk.financialImpact.currencySymbol)}
                                          </td>
                                        </tr>
                                        <tr>
                                          <td className="py-2">Loss Mitigation ROI:</td>
                                          <td className="py-2 text-right text-indigo-600 font-bold text-sm">
                                            {risk.financialImpact.roiMultiplier}x Protected
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                <div className="flex flex-col justify-between">
                                  <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-lg flex-1 shadow-sm">
                                    <span className="text-[10px] tracking-widest text-indigo-700 uppercase block mb-2 font-extrabold flex items-center gap-1.5 font-sans">
                                      <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Corrective Action Plan (Mitigation)
                                    </span>
                                    <p className="text-xs leading-relaxed text-slate-700 font-mono">
                                      {risk.mitigationStrategy}
                                    </p>
                                  </div>
                                  
                                  <div className="text-[9px] text-slate-400 italic mt-3 text-right font-semibold font-sans">
                                    Weighted ROI multiplier estimates optimal preventability before emergency capital allocation.
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions Row */}
                  <div className="flex flex-wrap items-center gap-3">
                    <button 
                      onClick={restart}
                      className="text-xs text-slate-500 hover:text-slate-800 font-bold bg-white border border-slate-200 hover:bg-slate-50 py-2.5 px-4 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm font-sans"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-indigo-600" /> Start New Simulation
                    </button>
                    <button 
                      onClick={downloadReport}
                      className="font-sans font-bold text-xs tracking-widest text-white bg-brand-accent hover:bg-indigo-700 px-6 py-3.5 rounded-lg transition-all hover:scale-[1.01] flex items-center gap-1.5 shadow-sm"
                    >
                      <Download className="w-4 h-4" /> Export Report & Plans ↓
                    </button>
                    <button 
                      onClick={() => setExpandedRiskId(expandedRiskId ? null : report.risks[0]?.id)}
                      className="text-xs text-slate-500 hover:text-slate-800 font-bold bg-white border border-slate-200 px-4 py-3 rounded-lg hover:border-slate-300 transition-all shadow-sm font-sans"
                    >
                      {expandedRiskId ? "Collapse Active Plans" : "Expand All Mitigation Details"}
                    </button>

                    {currentUser && (
                      <div className="flex items-center gap-2 border border-indigo-150 bg-indigo-50/40 px-3.5 py-2.5 rounded-lg text-xs select-none">
                        <span className={`w-2 h-2 rounded-full ${
                          saveStatus === "saving" ? "bg-amber-400 animate-pulse" :
                          saveStatus === "saved" ? "bg-emerald-500" :
                          saveStatus === "error" ? "bg-rose-500" : "bg-emerald-500"
                        }`}></span>
                        <span className="text-[10px] text-indigo-700 font-sans tracking-wide font-bold uppercase">
                          {saveStatus === "saving" ? "Auto-saving dossier..." :
                           saveStatus === "saved" ? "Cabinet Synchronized" :
                           saveStatus === "error" ? "Auto-save failed" : "Cabinet Synchronized"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Profile Configuration Modal */}
      {showProfileModal && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden text-left animate-fade-in">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-sans font-bold text-lg text-slate-800 flex items-center gap-1.5">
                <Settings className="w-5 h-5 text-indigo-600" /> Configure Credentials & Defaults
              </h3>
              <button 
                onClick={() => setShowProfileModal(false)}
                className="p-1 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-[10px] tracking-wider uppercase text-slate-400 mb-1 block font-bold font-sans">
                  Account Email Address
                </label>
                <input 
                  type="text"
                  disabled
                  value={currentUser.email || ""}
                  className="w-full bg-slate-50 border border-slate-150 rounded-xl text-slate-400 outline-none text-xs px-4 py-2.5 font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-[10px] tracking-wider uppercase text-slate-400 mb-1.5 block font-bold font-sans">
                  Your Display Name
                </label>
                <input 
                  type="text"
                  value={prefName}
                  onChange={(e) => setPrefName(e.target.value)}
                  placeholder="e.g. Warren Buffett"
                  className="w-full bg-white border border-slate-200 focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/20 rounded-xl text-slate-800 outline-none text-xs px-4 py-2.5 font-sans"
                />
              </div>

              <div>
                <label className="text-[10px] tracking-wider uppercase text-slate-400 mb-1.5 block font-bold font-sans">
                  Default Operating Region
                </label>
                <input 
                  type="text"
                  value={prefRegion}
                  onChange={(e) => setPrefRegion(e.target.value)}
                  placeholder="e.g. India"
                  className="w-full bg-white border border-slate-200 focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/20 rounded-xl text-slate-805 outline-none text-xs px-4 py-2.5 font-sans"
                />
              </div>

              <div>
                <label className="text-[10px] tracking-wider uppercase text-slate-400 mb-1.5 block font-bold font-sans">
                  Default Target Industry
                </label>
                <input 
                  type="text"
                  value={prefIndustry}
                  onChange={(e) => setPrefIndustry(e.target.value)}
                  placeholder="e.g. Commercial LPG"
                  className="w-full bg-white border border-slate-200 focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/20 rounded-xl text-slate-805 outline-none text-xs px-4 py-2.5 font-sans"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-150 bg-slate-50 flex items-center justify-end gap-3 font-sans">
              <button 
                onClick={() => setShowProfileModal(false)}
                className="text-xs text-slate-500 hover:text-slate-800 bg-white border border-slate-200 py-2 px-4 rounded-lg cursor-pointer font-bold"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateProfile}
                className="text-xs text-white bg-indigo-650 hover:bg-indigo-700 font-bold py-2 px-4 rounded-lg cursor-pointer"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Subscriptions Checkout Gateway Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-left animate-fade-in">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-sans font-bold text-base text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-5 h-5 text-indigo-600" /> Activate Deep Risk Diagnostics
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Secure Premium Subscription Gate</p>
              </div>
              <button 
                onClick={() => setShowCheckoutModal(false)}
                className="p-1 hover:bg-slate-200 border border-transparent rounded text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              {!currentUser ? (
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-3">
                    <Lock className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h4 className="font-sans font-extrabold text-sm text-slate-800 mb-1 font-sans">Authentication Required</h4>
                  <p className="text-[11px] text-slate-505 text-slate-500 font-sans leading-relaxed mb-5">
                    To activate personalized premium features for your industry, please connect your Google identity first.
                  </p>
                  <button
                    onClick={() => {
                      setShowCheckoutModal(false);
                      loginWithGoogle();
                    }}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <LogIn className="w-4 h-4" /> Sign In with Google
                  </button>
                </div>
              ) : (
                <div>
                  <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl mb-5 flex items-start gap-3">
                    <div className="bg-indigo-600 text-white p-2 rounded-lg shrink-0">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[9px] font-mono uppercase tracking-wider text-indigo-600 font-extrabold">Professional Subscription</span>
                      <h4 className="font-sans font-extrabold text-sm text-indigo-950 mt-0.5">Personalised Deep Risk Assessment</h4>
                      <p className="text-[10px] text-indigo-700 font-mono mt-1">
                        Unlocks 10 dimension stress-testing & priority corrective manuals.
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                      <span>Subscription Pricing</span>
                      <span>Verified SSL Secure</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-sans">Monthly Charging Fee (Cancel anytime)</span>
                      <span className="text-lg font-black font-mono text-slate-800">
                        {currency === "INR" ? "₹" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$"}99 / month
                      </span>
                    </div>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); handleUpgradePremium(); }}>
                    <div className="mb-3.5 text-left">
                      <label className="text-[10px] font-bold font-sans tracking-wider uppercase text-slate-400 mb-1 block">
                        Credit Card Number
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={checkoutCardNumber}
                          onChange={(e) => setCheckoutCardNumber(e.target.value)}
                          placeholder="4000 1234 5678 9010"
                          maxLength={19}
                          className="w-full bg-white border border-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20 rounded-xl text-xs px-4 py-2.5 outline-none text-slate-800 font-mono transition-all"
                        />
                        <span className="absolute right-3.5 top-3 text-[10px] font-mono text-slate-400">VISA/MC</span>
                      </div>
                    </div>

                    <div className="mb-5 text-left">
                      <label className="text-[10px] font-bold font-sans tracking-wider uppercase text-slate-400 mb-1 block">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        required
                        value={checkoutCardName}
                        onChange={(e) => setCheckoutCardName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full bg-white border border-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20 rounded-xl text-xs px-4 py-2.5 outline-none text-slate-800 font-mono transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={checkoutIsSubmitting}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-md hover:-translate-y-0.5"
                    >
                      {checkoutIsSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Authorizing Payment Simulation...
                        </>
                      ) : (
                        <>
                          Subscribe & Activate Now ▸
                        </>
                      )}
                    </button>
                    
                    <span className="text-[9px] text-slate-400 italic text-center block mt-3">
                      This is a secure offline-compatible payment portal simulation for the {currency === "INR" ? "₹" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$"}99 per month upgrade.
                    </span>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Footer bar styled according to Geometric Balance specification */}
      <footer className="relative z-10 h-16 border-t border-slate-200 bg-white px-6 sm:px-8 flex items-center justify-between shrink-0 font-sans text-[10px] font-medium text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Risk Systems Operational
          </div>
          <span className="opacity-30">|</span>
          <span>API Engine: Gemini-3.5-Flash</span>
        </div>
        <div className="text-[10px] text-slate-450 font-bold uppercase tracking-widest text-slate-400">
          RiskLens Precision Console &copy; {new Date().getFullYear()}
        </div>
      </footer>

      {/* Embedded Animations style rules in index */}
      <style>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(50%); }
          100% { transform: translateX(110%); }
        }
        .animate-fade-in {
          animation: fadeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
