import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Calendar,
  Grid,
  TrendingDown,
  ArrowRightLeft,
  MapPin,
  Trash2,
  Activity,
  Settings,
  Plus,
  Search,
  ShieldCheck,
  X,
  Coins,
  RefreshCw,
  Radio,
  Briefcase,
  Download,
  LogOut,
  FileText,
  AlertTriangle,
  Building2,
  PieChart,
  CheckCircle2
} from 'lucide-react';

// --- INITIAL SEED DATA ---
const INITIAL_DEPARTMENTS = [
  "Radiology",
  "Operating Theater",
  "ICU",
  "Emergency Room",
  "Pharmacy",
  "IT & Facilities",
  "Oncology",
  "Cardiology"
];

const INITIAL_SITES = [
  "All Sites",
  "KEMAMAN",
  "PFLNG 2",
  "MEDIC HOUSE (PFLNG)",
  "HQ",
  "CMF"
];

const INITIAL_CURRENCIES = [
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', rateToMYR: 1.0, isBase: true },
  { code: 'USD', name: 'US Dollar', symbol: '$', rateToMYR: 4.08, isBase: false },
  { code: 'EUR', name: 'Euro', symbol: '€', rateToMYR: 4.42, isBase: false },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', rateToMYR: 0.11, isBase: false },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rateToMYR: 0.027, isBase: false }
];

const INITIAL_USERS = [
  { id: 'usr-1', email: 'ariff@asset.bosh', crewName: 'Arif', assetRole: 'S2', status: 'Active' },
  { id: 'usr-2', email: 'saiful@asset.bosh', crewName: 'Saifulnizam', assetRole: 'S2', status: 'Active' },
  { id: 'usr-3', email: 'inspector@asset.bosh', crewName: 'Inspector S3', assetRole: 'S3', status: 'Active' },
  { id: 'usr-4', email: 'viewer@asset.bosh', crewName: 'Viewer S4', assetRole: 'S4', status: 'Active' }
];

const INITIAL_ASSETS = [
  {
    id: "AST-001",
    tagId: "RAD-MRI-01",
    name: "3.0T MRI Scanner (Siemens Magnetom)",
    department: "Radiology",
    site: "HQ",
    category: "Diagnostic & Screening",
    condition: "Operational",
    status: "Verified",
    maintStatus: "Safe",
    purchaseDate: "2018-12-15",
    currency: "USD",
    purchasePriceOriginal: 350000,
    historicalFxRate: 3.78,
    flag: "Green"
  },
  {
    id: "AST-002",
    tagId: "OR-ANES-04",
    name: "Dräger Apollo Anesthesia Workstation",
    department: "Operating Theater",
    site: "KEMAMAN",
    category: "Life-Support",
    condition: "Maintenance Required",
    status: "Discrepancy",
    maintStatus: "Warning",
    purchaseDate: "2016-05-20",
    currency: "EUR",
    purchasePriceOriginal: 42000,
    historicalFxRate: 4.55,
    flag: "Red"
  },
  {
    id: "AST-003",
    tagId: "ICU-VENT-12",
    name: "Puritan Bennett 980 ICU Ventilator",
    department: "ICU",
    site: "PFLNG 2",
    category: "Life-Support",
    condition: "Operational",
    status: "Verified",
    maintStatus: "In Progress",
    purchaseDate: "2021-03-10",
    currency: "USD",
    purchasePriceOriginal: 28000,
    historicalFxRate: 4.12,
    flag: "Green"
  }
];

export default function App() {
  const [authenticatedUser, setAuthenticatedUser] = useState(INITIAL_USERS[0]);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginRole, setLoginRole] = useState('S2');

  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [selectedSite, setSelectedSite] = useState('All Sites');

  const [departments, setDepartments] = useState(INITIAL_DEPARTMENTS);
  const [currencies, setCurrencies] = useState(INITIAL_CURRENCIES);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [assets, setAssets] = useState(INITIAL_ASSETS);

  const [isFetchingFx, setIsFetchingFx] = useState(false);
  const [fxStatusMsg, setFxStatusMsg] = useState('');
  const [isAddCurrencyModalOpen, setIsAddCurrencyModalOpen] = useState(false);
  const [newCurrCode, setNewCurrCode] = useState('');
  const [newCurrName, setNewCurrName] = useState('');
  const [newCurrRate, setNewCurrRate] = useState(1.0);

  const [newDeptInput, setNewDeptInput] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  const [newAsset, setNewAsset] = useState({
    tagId: '',
    name: '',
    department: INITIAL_DEPARTMENTS[0],
    site: 'HQ',
    category: 'Diagnostic & Screening',
    purchaseDate: '2024-01-01',
    currency: 'USD',
    purchasePriceOriginal: 50000,
    historicalFxRate: 4.08,
    flag: 'Green'
  });

  const liveFxMap = useMemo(() => {
    const map = {};
    currencies.forEach(c => { map[c.code] = c.rateToMYR; });
    return map;
  }, [currencies]);

  const currencySymbolMap = useMemo(() => {
    const map = {};
    currencies.forEach(c => { map[c.code] = c.symbol; });
    return map;
  }, [currencies]);

  const metrics = useMemo(() => {
    const siteFiltered = selectedSite === 'All Sites' 
      ? assets 
      : assets.filter(a => a.site === selectedSite);

    let totalAcqMYR = 0;
    let totalTodayMYR = 0;
    let redFlags = 0;
    let maintRequired = 0;

    siteFiltered.forEach(a => {
      const acq = a.purchasePriceOriginal * (a.historicalFxRate || 1.0);
      const todayRate = liveFxMap[a.currency] || 1.0;
      const today = a.purchasePriceOriginal * todayRate;
      totalAcqMYR += acq;
      totalTodayMYR += today;

      if (a.flag === 'Red') redFlags++;
      if (a.condition === 'Maintenance Required') maintRequired++;
    });

    return {
      totalAssets: siteFiltered.length,
      redFlags,
      maintRequired,
      totalAcqMYR,
      totalTodayMYR,
      shiftMYR: totalTodayMYR - totalAcqMYR
    };
  }, [assets, selectedSite, liveFxMap]);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const existing = users.find(u => u.email.toLowerCase() === loginEmail.toLowerCase());
    if (existing) {
      setAuthenticatedUser({ ...existing, assetRole: loginRole });
    } else {
      const newUser = {
        id: `usr-${Date.now()}`,
        email: loginEmail || 'user@asset.bosh',
        crewName: loginEmail.split('@')[0] || 'User',
        assetRole: loginRole,
        status: 'Active'
      };
      setUsers([...users, newUser]);
      setAuthenticatedUser(newUser);
    }
  };

  const handleLogout = () => setAuthenticatedUser(null);

  const generatePDFReport = () => {
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) return;

    const tableRows = assets.map(a => {
      const acqMYR = Math.round(a.purchasePriceOriginal * (a.historicalFxRate || 1.0));
      const todayRate = liveFxMap[a.currency] || 1.0;
      const todayMYR = Math.round(a.purchasePriceOriginal * todayRate);
      const diff = todayMYR - acqMYR;
      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${a.tagId}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${a.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${a.department} (${a.site})</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${a.currency} ${a.purchasePriceOriginal.toLocaleString()}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">RM ${acqMYR.toLocaleString()}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">RM ${todayMYR.toLocaleString()}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold; color: ${diff >= 0 ? '#d97706' : '#059669'};">
            ${diff >= 0 ? '+' : ''}RM ${diff.toLocaleString()}
          </td>
        </tr>
      `;
    }).join('');

    reportWindow.document.write(`
      <html>
        <head>
          <title>Berkat Group - Hospital Equipment Audit Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #1e293b; }
            h1 { color: #0f172a; margin-bottom: 4px; }
            .subtitle { color: #64748b; font-size: 13px; margin-bottom: 24px; }
            .metrics { display: flex; gap: 16px; margin-bottom: 24px; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 8px; flex: 1; }
            .card-title { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold; }
            .card-val { font-size: 18px; font-weight: bold; color: #0f172a; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 16px; }
            th { background: #0f172a; color: white; text-align: left; padding: 10px 8px; }
          </style>
        </head>
        <body>
          <h1>BERKAT GROUP — Equipment Audit & FX Summary</h1>
          <div class="subtitle">Generated on ${new Date().toLocaleDateString()} • Hospital Asset Management</div>
          
          <div class="metrics">
            <div class="card">
              <div class="card-title">Audited Equipment</div>
              <div class="card-val">${metrics.totalAssets} Units</div>
            </div>
            <div class="card">
              <div class="card-title">Acquisition Base</div>
              <div class="card-val">RM ${Math.round(metrics.totalAcqMYR).toLocaleString()}</div>
            </div>
            <div class="card">
              <div class="card-title">Live Replacement Value</div>
              <div class="card-val">RM ${Math.round(metrics.totalTodayMYR).toLocaleString()}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>TAG ID</th>
                <th>EQUIPMENT NAME</th>
                <th>DEPT / SITE</th>
                <th>INVOICED FCY</th>
                <th>ACQUISITION MYR</th>
                <th>TODAY MYR</th>
                <th>FX VARIANCE</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    reportWindow.document.close();
  };

  const handleFetchLiveFx = async () => {
    setIsFetchingFx(true);
    setFxStatusMsg('Fetching live market rates...');
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      if (res.ok) {
        const data = await res.json();
        if (data && data.rates && data.rates.MYR) {
          const usdMyr = data.rates.MYR;
          setCurrencies(prev => prev.map(c => {
            if (c.code === 'MYR') return c;
            if (c.code === 'USD') return { ...c, rateToMYR: parseFloat(usdMyr.toFixed(4)) };
            if (data.rates[c.code]) {
              const rateInMyr = usdMyr / data.rates[c.code];
              return { ...c, rateToMYR: parseFloat(rateInMyr.toFixed(4)) };
            }
            return c;
          }));
          setFxStatusMsg('Live rates updated successfully!');
        }
      }
    } catch (err) {
      setFxStatusMsg('API offline. Using custom rates.');
    } finally {
      setIsFetchingFx(false);
      setTimeout(() => setFxStatusMsg(''), 4000);
    }
  };

  const handleAddAsset = (e) => {
    e.preventDefault();
    setAssets([...assets, {
      ...newAsset,
      id: `AST-${Date.now().toString().slice(-4)}`,
      status: 'Verified',
      condition: 'Operational',
      maintStatus: 'Safe'
    }]);
    setIsAddAssetModalOpen(false);
  };

  const handleDeleteAsset = (id) => setAssets(assets.filter(a => a.id !== id));

  if (!authenticatedUser) {
    return (
      <div className="min-h-screen bg-[#080e14] text-slate-100 flex items-center justify-center p-4 font-sans selection:bg-teal-500 selection:text-white">
        <div className="w-full max-w-md bg-[#0f1922] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8 border-b border-slate-800 text-center">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 font-extrabold text-2xl flex items-center justify-center mx-auto mb-3">
              b
            </div>
            <h1 className="text-lg font-bold tracking-wider uppercase">BERKAT GROUP</h1>
            <p className="text-xs text-slate-400 mt-1">Asset & Equipment Management Platform</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="p-8 space-y-5 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1.5">Work Email Address</label>
              <input
                type="email"
                required
                placeholder="ariff@asset.bosh"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-[#182532] border border-slate-700 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-teal-400 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1.5">Select Asset Role</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { role: 'S2', label: 'Admin (S2)' },
                  { role: 'S3', label: 'Inspector (S3)' },
                  { role: 'S4', label: 'Viewer (S4)' }
                ].map(r => (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => setLoginRole(r.role)}
                    className={`py-2.5 rounded-xl font-bold border transition text-center ${
                      loginRole === r.role
                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-xs'
                        : 'bg-[#182532] text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold rounded-xl text-xs transition shadow-lg shadow-teal-500/10"
            >
              Sign In to Asset Platform
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080e14] text-slate-100 flex font-sans selection:bg-teal-500 selection:text-white">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-[#0d161f] border-r border-slate-800/80 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-4 border-b border-slate-800/80 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold text-lg">
              b
            </div>
            <div>
              <h2 className="font-extrabold text-sm tracking-wider uppercase text-slate-100">BERKAT GROUP</h2>
              <p className="text-[10px] text-slate-400 tracking-tight">Asset & Equipment Management</p>
            </div>
          </div>

          <nav className="p-3 space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'register', label: 'Asset Register', icon: FileSpreadsheet },
              { id: 'currencies', label: 'Currency Engine & FX', icon: Coins },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveScreen(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-[#162532] text-teal-400 border-l-4 border-teal-400 shadow-xs'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <span className="font-mono text-[10px]">v1-301026.2229</span>
          <button onClick={handleLogout} className="flex items-center space-x-1 text-slate-400 hover:text-red-400 transition">
            <LogOut className="w-3.5 h-3.5" />
            <span className="text-[11px]">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER BAR */}
        <header className="h-14 bg-[#0d161f] border-b border-slate-800/80 px-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold text-slate-400">Target Hospital Audit</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
              <Radio className="w-3 h-3 animate-pulse" /> Live Team Cloud
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={generatePDFReport}
              className="px-3 py-1.5 bg-[#182633] hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition flex items-center space-x-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-teal-400" />
              <span>Export PDF Report</span>
            </button>

            <div className="flex items-center space-x-2 bg-[#182633] px-3 py-1 rounded-lg border border-slate-700">
              <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center text-slate-950 font-bold text-xs">
                {authenticatedUser.crewName[0]?.toUpperCase()}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-100 leading-none">{authenticatedUser.crewName}</p>
                <p className="text-[10px] text-teal-400 leading-none mt-0.5 font-mono">Role: {authenticatedUser.assetRole}</p>
              </div>
            </div>
          </div>
        </header>

        {/* SCREEN CONTENT */}
        <main className="p-8 flex-1 overflow-y-auto space-y-8">
          {/* --- RECOMMENDED DASHBOARD OVERVIEW --- */}
          {activeScreen === 'dashboard' && (
            <div className="space-y-6 max-w-7xl">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold text-slate-100">Hospital Asset Dashboard</h1>
                  <p className="text-xs text-slate-400 mt-0.5">Real-time equipment lifecycle, maintenance alerts, and live currency exposure.</p>
                </div>

                <div className="w-56">
                  <select
                    value={selectedSite}
                    onChange={(e) => setSelectedSite(e.target.value)}
                    className="w-full bg-[#111d27] border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-200"
                  >
                    {INITIAL_SITES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* 4 CORE KPI METRIC CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-[#111d27] border border-slate-800 rounded-2xl space-y-1">
                  <p className="text-[11px] font-bold text-slate-400 uppercase">AUDITED EQUIPMENT</p>
                  <p className="text-2xl font-extrabold text-slate-100">{metrics.totalAssets} Units</p>
                </div>

                <div className="p-4 bg-[#111d27] border border-slate-800 rounded-2xl space-y-1">
                  <p className="text-[11px] font-bold text-slate-400 uppercase">RED-FLAG DISCREPANCIES</p>
                  <p className="text-2xl font-extrabold text-red-400">{metrics.redFlags}</p>
                </div>

                <div className="p-4 bg-[#111d27] border border-slate-800 rounded-2xl space-y-1">
                  <p className="text-[11px] font-bold text-slate-400 uppercase">MAINTENANCE REQUIRED</p>
                  <p className="text-2xl font-extrabold text-amber-400">{metrics.maintRequired}</p>
                </div>

                <div className="p-4 bg-[#111d27] border border-slate-800 rounded-2xl space-y-1">
                  <p className="text-[11px] font-bold text-slate-400 uppercase">NET FX REPLACEMENT SHIFT</p>
                  <p className={`text-2xl font-extrabold ${metrics.shiftMYR >= 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {metrics.shiftMYR >= 0 ? '+' : ''}RM {Math.round(metrics.shiftMYR).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* DUAL FINANCIAL SUMMARY CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 bg-[#111d27] border border-slate-800 rounded-2xl space-y-2">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">HISTORICAL ACQUISITION BASE</h3>
                  <p className="text-3xl font-extrabold text-slate-100">RM {Math.round(metrics.totalAcqMYR).toLocaleString()}</p>
                  <p className="text-[11px] text-slate-500">Calculated based on FX exchange rates at invoice date.</p>
                </div>

                <div className="p-5 bg-[#111d27] border border-slate-800 rounded-2xl space-y-2">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">LIVE MARKET REPLACEMENT VALUE</h3>
                  <p className="text-3xl font-extrabold text-teal-400">RM {Math.round(metrics.totalTodayMYR).toLocaleString()}</p>
                  <p className="text-[11px] text-slate-500">Recalculated live using real-time foreign currency exchange rates.</p>
                </div>
              </div>
            </div>
          )}

          {/* --- ASSET REGISTER SCREEN --- */}
          {activeScreen === 'register' && (
            <div className="space-y-6 max-w-6xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-100">Hospital Equipment Register</h2>
                  <p className="text-xs text-slate-400">Real-Time Due Diligence Asset Audit Sheet</p>
                </div>
                {authenticatedUser.assetRole === 'S2' && (
                  <button
                    onClick={() => setIsAddAssetModalOpen(true)}
                    className="px-4 py-2 bg-teal-500 text-slate-950 font-bold rounded-lg text-xs hover:bg-teal-400 transition flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Equipment Record</span>
                  </button>
                )}
              </div>

              <div className="bg-[#111d27] border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#162430] text-slate-400 font-bold uppercase text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">FLAG</th>
                      <th className="py-3 px-4">TAG / EQUIPMENT NAME</th>
                      <th className="py-3 px-4">DEPT / SITE</th>
                      <th className="py-3 px-4">INVOICED COST</th>
                      <th className="py-3 px-4">TODAY MYR</th>
                      <th className="py-3 px-4 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-[#131f2a]">
                    {assets.map(a => {
                      const sym = currencySymbolMap[a.currency] || '$';
                      const todayRate = liveFxMap[a.currency] || 1.0;
                      const todayMYR = a.purchasePriceOriginal * todayRate;

                      return (
                        <tr key={a.id} className="hover:bg-slate-800/30">
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              a.flag === 'Red' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}>
                              {a.flag}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-100">{a.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{a.tagId}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-300 font-medium">
                            {a.department} ({a.site})
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-200">
                            {sym}{a.purchasePriceOriginal?.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">{a.currency}</span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-100">
                            RM {Math.round(todayMYR).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {authenticatedUser.assetRole === 'S2' && (
                              <button onClick={() => handleDeleteAsset(a.id)} className="text-slate-500 hover:text-red-400">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --- CURRENCY ENGINE SCREEN --- */}
          {activeScreen === 'currencies' && (
            <div className="space-y-6 max-w-6xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-100">Currency Engine & Exchange Rates</h2>
                  <p className="text-xs text-slate-400">Manage real-time FX rate conversions to MYR base.</p>
                </div>
                <button
                  onClick={handleFetchLiveFx}
                  className="px-4 py-2 bg-teal-500 text-slate-950 font-bold rounded-lg text-xs hover:bg-teal-400 transition"
                >
                  Sync Live FX Rates
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {currencies.map(c => (
                  <div key={c.code} className="p-4 bg-[#111d27] border border-slate-800 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-100">{c.code} - {c.name}</span>
                      <span className="font-mono text-teal-400 font-bold">{c.symbol}</span>
                    </div>
                    <div className="text-xs flex justify-between items-center">
                      <span className="text-slate-400">Rate to MYR:</span>
                      <span className="font-mono text-teal-400 font-bold">{c.rateToMYR}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}