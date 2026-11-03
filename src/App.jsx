import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Settings,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  X,
  Coins,
  RefreshCw,
  Radio,
  Briefcase,
  LogOut,
  FileText,
  Lock,
  UserPlus
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
  { id: 'usr-1', email: 'arif@berkat.com', password: 'Berkat@1234', crewName: 'Arif', assetRole: 'Admin', status: 'Active' }
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
    purchaseDate: "2016-05-20",
    currency: "EUR",
    purchasePriceOriginal: 42000,
    historicalFxRate: 4.55,
    flag: "Red"
  }
];

export default function App() {
  // Auth State
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Navigation State
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [selectedSite, setSelectedSite] = useState('All Sites');

  // Core Data Stores
  const [departments, setDepartments] = useState(INITIAL_DEPARTMENTS);
  const [currencies, setCurrencies] = useState(INITIAL_CURRENCIES);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [assets, setAssets] = useState(INITIAL_ASSETS);

  // FX Engine State
  const [isFetchingFx, setIsFetchingFx] = useState(false);
  const [fxStatusMsg, setFxStatusMsg] = useState('');
  const [isAddCurrencyModalOpen, setIsAddCurrencyModalOpen] = useState(false);
  const [newCurrCode, setNewCurrCode] = useState('');
  const [newCurrName, setNewCurrName] = useState('');
  const [newCurrSymbol, setNewCurrSymbol] = useState('');
  const [newCurrRate, setNewCurrRate] = useState(1.0);

  // Department State
  const [newDeptInput, setNewDeptInput] = useState('');

  // User Management State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserCrewName, setNewUserCrewName] = useState('');
  const [newUserRole, setNewUserRole] = useState('User');

  // Asset Engine & Modal State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');
  const [selectedFlagFilter, setSelectedFlagFilter] = useState('All');
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

  // Dynamic Lookup Helpers
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

  // Dashboard Metrics Calculation
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

  // Auth Operations
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError('');
    const foundUser = users.find(u => u.email.toLowerCase() === loginEmail.toLowerCase().trim());
    
    if (!foundUser) {
      setLoginError('User email not found. Contact Admin.');
      return;
    }
    if (foundUser.password !== loginPassword) {
      setLoginError('Incorrect password. Please try again.');
      return;
    }
    if (foundUser.status !== 'Active') {
      setLoginError('This account has been deactivated.');
      return;
    }

    setAuthenticatedUser(foundUser);
  };

  const handleLogout = () => {
    setAuthenticatedUser(null);
    setLoginEmail('');
    setLoginPassword('');
  };

  // PDF Report Exporter
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

  // FX Operations (Admin Only)
  const handleFetchLiveFx = async () => {
    if (authenticatedUser.assetRole !== 'Admin') return;
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

  const handleAddCurrency = (e) => {
    e.preventDefault();
    if (authenticatedUser.assetRole !== 'Admin') return;
    if (!newCurrCode || !newCurrName) return;
    const code = newCurrCode.toUpperCase().trim();
    if (currencies.some(c => c.code === code)) return;
    setCurrencies([...currencies, {
      code,
      name: newCurrName,
      symbol: newCurrSymbol || code,
      rateToMYR: parseFloat(newCurrRate) || 1.0,
      isBase: false
    }]);
    setNewCurrCode('');
    setNewCurrName('');
    setNewCurrSymbol('');
    setNewCurrRate(1.0);
    setIsAddCurrencyModalOpen(false);
  };

  const handleUpdateFxRate = (code, value) => {
    if (authenticatedUser.assetRole !== 'Admin') return;
    const val = parseFloat(value) || 0;
    setCurrencies(currencies.map(c => c.code === code ? { ...c, rateToMYR: val } : c));
  };

  const handleDeleteCurrency = (codeToDelete) => {
    if (authenticatedUser.assetRole !== 'Admin') return;
    setCurrencies(currencies.filter(c => c.code !== codeToDelete && !c.isBase));
  };

  // Department Operations (Admin Only)
  const handleAddDepartment = (e) => {
    e.preventDefault();
    if (authenticatedUser.assetRole !== 'Admin') return;
    const deptName = newDeptInput.trim();
    if (!deptName || departments.includes(deptName)) return;
    setDepartments([...departments, deptName]);
    setNewDeptInput('');
  };

  const handleDeleteDepartment = (deptToDelete) => {
    if (authenticatedUser.assetRole !== 'Admin') return;
    if (departments.length <= 1) return;
    setDepartments(departments.filter(d => d !== deptToDelete));
  };

  // User Management Operations (Admin Only)
  const handleAddUser = (e) => {
    e.preventDefault();
    if (authenticatedUser.assetRole !== 'Admin') return;
    if (!newUserEmail || !newUserPassword || !newUserCrewName) return;
    setUsers([...users, {
      id: `usr-${Date.now()}`,
      email: newUserEmail.trim(),
      password: newUserPassword,
      crewName: newUserCrewName.trim(),
      assetRole: newUserRole,
      status: 'Active'
    }]);
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserCrewName('');
    setIsAddUserModalOpen(false);
  };

  const handleUpdateUserRole = (id, newRole) => {
    if (authenticatedUser.assetRole !== 'Admin') return;
    setUsers(users.map(u => u.id === id ? { ...u, assetRole: newRole } : u));
  };

  const handleToggleUserStatus = (id) => {
    if (authenticatedUser.assetRole !== 'Admin') return;
    setUsers(users.map(u => u.id === id ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } : u));
  };

  const handleDeleteUser = (id) => {
    if (authenticatedUser.assetRole !== 'Admin') return;
    if (users.length <= 1) return;
    setUsers(users.filter(u => u.id !== id));
  };

  // Asset Operations (Admin or User role can add/delete)
  const handleAddAsset = (e) => {
    e.preventDefault();
    if (authenticatedUser.assetRole === 'Viewer') return;
    setAssets([...assets, {
      ...newAsset,
      id: `AST-${Date.now().toString().slice(-4)}`,
      status: 'Verified',
      condition: 'Operational'
    }]);
    setIsAddAssetModalOpen(false);
  };

  const handleDeleteAsset = (id) => {
    if (authenticatedUser.assetRole === 'Viewer') return;
    setAssets(assets.filter(a => a.id !== id));
  };

  const filteredAssets = useMemo(() => {
    return assets.filter(item => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = item.name.toLowerCase().includes(q) || 
                            item.tagId.toLowerCase().includes(q) || 
                            item.department.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (selectedDeptFilter !== "All" && item.department !== selectedDeptFilter) return false;
      if (selectedFlagFilter !== "All" && item.flag !== selectedFlagFilter) return false;
      return true;
    });
  }, [assets, searchQuery, selectedDeptFilter, selectedFlagFilter]);

  // --- RENDER: LOGIN / AUTH SCREEN ---
  if (!authenticatedUser) {
    return (
      <div className="min-h-screen bg-[#080e14] text-slate-100 flex items-center justify-center p-4 font-sans selection:bg-teal-500 selection:text-white">
        <div className="w-full max-w-md bg-[#0f1922] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8 border-b border-slate-800 text-center">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 font-extrabold text-2xl flex items-center justify-center mx-auto mb-3">
              b
            </div>
            <h1 className="text-lg font-bold tracking-wider uppercase">BERKAT GROUP</h1>
            <p className="text-xs text-slate-400 mt-1">Hospital Equipment Audit & Asset Platform</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="p-8 space-y-4 text-xs">
            {loginError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs font-medium">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-slate-400 font-semibold mb-1.5">Email Address</label>
              <input
                type="email"
                required
                placeholder="arif@berkat.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-[#182532] border border-slate-700 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-teal-400 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1.5">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-[#182532] border border-slate-700 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-teal-400 font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold rounded-xl text-xs transition shadow-lg shadow-teal-500/10 mt-2"
            >
              Sign In
            </button>

            <div className="pt-2 text-center text-[11px] text-slate-500">
              Default Admin: <span className="font-mono text-slate-400">arif@berkat.com</span> / <span className="font-mono text-teal-400">Berkat@1234</span>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // --- RENDER: MAIN APPLICATION ---
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
          {/* --- DASHBOARD SCREEN --- */}
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
                {authenticatedUser.assetRole !== 'Viewer' && (
                  <button
                    onClick={() => setIsAddAssetModalOpen(true)}
                    className="px-4 py-2 bg-teal-500 text-slate-950 font-bold rounded-lg text-xs hover:bg-teal-400 transition flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Equipment Record</span>
                  </button>
                )}
              </div>

              <div className="bg-[#111d27] p-4 rounded-xl border border-slate-800 flex flex-wrap gap-4 items-center justify-between">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by Tag ID, Equipment Name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#182633] border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <select
                    value={selectedDeptFilter}
                    onChange={(e) => setSelectedDeptFilter(e.target.value)}
                    className="bg-[#182633] border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-200"
                  >
                    <option value="All">All Departments</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>

                  <select
                    value={selectedFlagFilter}
                    onChange={(e) => setSelectedFlagFilter(e.target.value)}
                    className="bg-[#182633] border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-200"
                  >
                    <option value="All">All Flags</option>
                    <option value="Green">Green Flag</option>
                    <option value="Red">Red Flag</option>
                  </select>
                </div>
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
                    {filteredAssets.map(a => {
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
                            {authenticatedUser.assetRole !== 'Viewer' && (
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
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-100">Currency Engine & Exchange Rates</h2>
                  <p className="text-xs text-slate-400">
                    {authenticatedUser.assetRole === 'Admin' 
                      ? 'Manage rates, sync live market FX values, or add foreign currency benchmarks.'
                      : 'Viewing currency conversion tables (Admin restricted).'}
                  </p>
                </div>

                {authenticatedUser.assetRole === 'Admin' && (
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleFetchLiveFx}
                      disabled={isFetchingFx}
                      className="px-3.5 py-2 bg-[#182633] hover:bg-slate-800 text-teal-400 border border-teal-500/30 font-semibold rounded-lg text-xs transition flex items-center space-x-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isFetchingFx ? 'animate-spin' : ''}`} />
                      <span>Sync Live FX Rates</span>
                    </button>

                    <button
                      onClick={() => setIsAddCurrencyModalOpen(true)}
                      className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs transition flex items-center space-x-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Currency</span>
                    </button>
                  </div>
                )}
              </div>

              {fxStatusMsg && (
                <div className="p-3 bg-teal-500/10 border border-teal-500/30 text-teal-300 rounded-lg text-xs font-medium">
                  {fxStatusMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {currencies.map(c => (
                  <div key={c.code} className="p-4 bg-[#111d27] border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <span className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400 font-extrabold flex items-center justify-center text-sm">
                          {c.symbol}
                        </span>
                        <div>
                          <h4 className="font-bold text-sm text-slate-100">{c.code}</h4>
                          <p className="text-[11px] text-slate-400">{c.name}</p>
                        </div>
                      </div>

                      {c.isBase ? (
                        <span className="text-[10px] bg-teal-500/20 text-teal-300 font-bold px-2 py-0.5 rounded border border-teal-500/30">BASE</span>
                      ) : (
                        authenticatedUser.assetRole === 'Admin' && (
                          <button
                            onClick={() => handleDeleteCurrency(c.code)}
                            className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition"
                            title="Delete Currency"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Rate (to MYR):</span>
                      {c.isBase ? (
                        <span className="font-mono font-bold text-slate-300">1.0000</span>
                      ) : (
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] text-slate-500 font-mono">1 {c.code} =</span>
                          <input
                            type="number"
                            step="0.0001"
                            disabled={authenticatedUser.assetRole !== 'Admin'}
                            value={c.rateToMYR}
                            onChange={(e) => handleUpdateFxRate(c.code, e.target.value)}
                            className="w-24 bg-[#182633] border border-slate-700 rounded px-2 py-1 font-mono text-right font-bold text-teal-400 focus:outline-none focus:border-teal-400 text-xs disabled:opacity-60"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- SETTINGS & USER MATRIX --- */}
          {activeScreen === 'settings' && (
            <div className="space-y-8 max-w-6xl">
              {/* DEPARTMENT MANAGEMENT */}
              <div className="bg-[#111d27] border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Briefcase className="w-5 h-5 text-teal-400" />
                    <h3 className="font-bold text-slate-100 text-sm">Hospital Departments</h3>
                    <span className="text-xs text-slate-400 font-mono">{departments.length} configured</span>
                  </div>
                </div>

                {authenticatedUser.assetRole === 'Admin' && (
                  <form onSubmit={handleAddDepartment} className="flex gap-2 mb-4">
                    <input
                      type="text"
                      required
                      placeholder="Enter new department name..."
                      value={newDeptInput}
                      onChange={(e) => setNewDeptInput(e.target.value)}
                      className="flex-1 bg-[#182633] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-teal-400"
                    />
                    <button type="submit" className="px-4 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg transition">
                      + Add Dept
                    </button>
                  </form>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {departments.map(dept => (
                    <div key={dept} className="flex items-center justify-between p-3 bg-[#182633] border border-slate-800 rounded-lg text-xs">
                      <span className="font-semibold text-slate-200">{dept}</span>
                      {authenticatedUser.assetRole === 'Admin' && (
                        <button
                          onClick={() => handleDeleteDepartment(dept)}
                          className="text-slate-500 hover:text-red-400 ml-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* USER MANAGEMENT & ACCESS MATRIX */}
              <div className="bg-[#111d27] border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-teal-400" />
                    <h3 className="font-bold text-slate-100 text-sm">User Management & Roles</h3>
                    <span className="text-xs text-slate-400 font-mono">{users.length} users</span>
                  </div>
                  {authenticatedUser.assetRole === 'Admin' && (
                    <button
                      onClick={() => setIsAddUserModalOpen(true)}
                      className="px-3.5 py-1.5 bg-teal-500 text-slate-950 rounded-lg text-xs font-bold hover:bg-teal-400 transition flex items-center gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Create User & Password</span>
                    </button>
                  )}
                </div>

                <div className="overflow-hidden border border-slate-800 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#162430] text-slate-400 font-semibold uppercase text-[11px] border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">EMAIL</th>
                        <th className="py-3 px-4">CREW NAME</th>
                        <th className="py-3 px-4">ASSIGNED ROLE</th>
                        <th className="py-3 px-4 text-right">STATUS / ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-[#131f2a]">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-800/30">
                          <td className="py-3 px-4 font-mono text-slate-200">{u.email}</td>
                          <td className="py-3 px-4 font-semibold text-slate-300">{u.crewName}</td>
                          <td className="py-3 px-4">
                            <select
                              disabled={authenticatedUser.assetRole !== 'Admin'}
                              value={u.assetRole}
                              onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                              className="bg-[#1c2e3c] border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs font-semibold disabled:opacity-60"
                            >
                              <option value="Admin">Admin (Can do everything)</option>
                              <option value="User">User (Equipment CRUD only)</option>
                              <option value="Viewer">Viewer (Read only)</option>
                            </select>
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            {authenticatedUser.assetRole === 'Admin' ? (
                              <>
                                <button
                                  onClick={() => handleToggleUserStatus(u.id)}
                                  className={`px-2 py-1 rounded text-[11px] font-semibold ${
                                    u.status === 'Active' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                                  }`}
                                >
                                  {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="text-slate-500 hover:text-red-400 p-1"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-4 h-4 inline" />
                                </button>
                              </>
                            ) : (
                              <span className="text-slate-400">{u.status}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* --- MODAL: ADD EQUIPMENT --- */}
      {isAddAssetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111d27] border border-slate-800 rounded-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-sm">Add Equipment Record</h3>
              <button onClick={() => setIsAddAssetModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddAsset} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Tag / Serial ID</label>
                  <input
                    type="text"
                    required
                    value={newAsset.tagId}
                    onChange={(e) => setNewAsset({ ...newAsset, tagId: e.target.value })}
                    className="w-full bg-[#182633] border border-slate-700 rounded p-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Equipment Name</label>
                  <input
                    type="text"
                    required
                    value={newAsset.name}
                    onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                    className="w-full bg-[#182633] border border-slate-700 rounded p-2 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Department</label>
                  <select
                    value={newAsset.department}
                    onChange={(e) => setNewAsset({ ...newAsset, department: e.target.value })}
                    className="w-full bg-[#182633] border border-slate-700 rounded p-2 text-slate-100 font-semibold"
                  >
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Site Location</label>
                  <select
                    value={newAsset.site}
                    onChange={(e) => setNewAsset({ ...newAsset, site: e.target.value })}
                    className="w-full bg-[#182633] border border-slate-700 rounded p-2 text-slate-100 font-semibold"
                  >
                    {INITIAL_SITES.filter(s => s !== 'All Sites').map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Currency</label>
                  <select
                    value={newAsset.currency}
                    onChange={(e) => setNewAsset({ ...newAsset, currency: e.target.value })}
                    className="w-full bg-[#182633] border border-slate-700 rounded p-2 text-teal-400 font-bold"
                  >
                    {currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Invoiced Cost</label>
                  <input
                    type="number"
                    value={newAsset.purchasePriceOriginal}
                    onChange={(e) => setNewAsset({ ...newAsset, purchasePriceOriginal: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#182633] border border-slate-700 rounded p-2 text-slate-100 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Historical FX Rate (to MYR)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newAsset.historicalFxRate}
                    onChange={(e) => setNewAsset({ ...newAsset, historicalFxRate: parseFloat(e.target.value) || 1 })}
                    className="w-full bg-[#182633] border border-slate-700 rounded p-2 text-teal-400 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button type="button" onClick={() => setIsAddAssetModalOpen(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-teal-500 text-slate-950 font-bold rounded">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: ADD CURRENCY --- */}
      {isAddCurrencyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111d27] border border-slate-800 rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-sm">Add New Currency Engine</h3>
              <button onClick={() => setIsAddCurrencyModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddCurrency} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Currency Code</label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    placeholder="e.g. SGD"
                    value={newCurrCode}
                    onChange={(e) => setNewCurrCode(e.target.value)}
                    className="w-full bg-[#182633] border border-slate-700 rounded p-2 text-slate-100 font-mono font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Symbol</label>
                  <input
                    type="text"
                    placeholder="e.g. S$"
                    value={newCurrSymbol}
                    onChange={(e) => setNewCurrSymbol(e.target.value)}
                    className="w-full bg-[#182633] border border-slate-700 rounded p-2 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Currency Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Singapore Dollar"
                  value={newCurrName}
                  onChange={(e) => setNewCurrName(e.target.value)}
                  className="w-full bg-[#182633] border border-slate-700 rounded p-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Exchange Rate to MYR (1 Currency = ? MYR)</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={newCurrRate}
                  onChange={(e) => setNewCurrRate(e.target.value)}
                  className="w-full bg-[#182633] border border-slate-700 rounded p-2 text-teal-400 font-mono font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button type="button" onClick={() => setIsAddCurrencyModalOpen(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-teal-500 text-slate-950 font-bold rounded">Add Currency</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: CREATE USER & PASSWORD --- */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111d27] border border-slate-800 rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-sm">Create New User Account</h3>
              <button onClick={() => setIsAddUserModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">User Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="staff@berkat.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full bg-[#182633] border border-slate-700 rounded p-2 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Set Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full bg-[#182633] border border-slate-700 rounded p-2 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Crew Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Saiful"
                  value={newUserCrewName}
                  onChange={(e) => setNewUserCrewName(e.target.value)}
                  className="w-full bg-[#182633] border border-slate-700 rounded p-2 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Assign Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full bg-[#182633] border border-slate-700 rounded p-2 text-slate-100 font-semibold"
                >
                  <option value="Admin">Admin (Can do everything)</option>
                  <option value="User">User (Equipment CRUD only)</option>
                  <option value="Viewer">Viewer (Read only)</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end space-x-2">
                <button type="button" onClick={() => setIsAddUserModalOpen(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-teal-500 text-slate-950 font-bold rounded">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}