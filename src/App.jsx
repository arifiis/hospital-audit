import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Settings,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  X,
  UserPlus,
  Coins,
  RefreshCw,
  Radio,
  Briefcase,
  Edit2,
  Check
} from 'lucide-react';

// --- INITIAL MOCK DATA ---
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
  { id: 'usr-3', email: 'user_s3@asset.bosh', crewName: 'user S3', assetRole: 'S3', status: 'Active' },
  { id: 'usr-4', email: 'user_s4@asset.bosh', crewName: 'user S4', assetRole: 'S4', status: 'Active' }
];

const INITIAL_ASSETS = [
  {
    id: "AST-001",
    tagId: "RAD-MRI-01",
    name: "3.0T MRI Scanner (Siemens Magnetom)",
    department: "Radiology",
    category: "Medical Equipment",
    condition: "Operational",
    status: "Verified",
    purchaseDate: "2018-12-15",
    currency: "USD",
    purchasePriceOriginal: 350000,
    historicalFxRate: 3.78,
    flag: "Green",
    notes: "Imported from Germany. Originally purchased at 3.78 MYR/USD."
  },
  {
    id: "AST-002",
    tagId: "OR-ANES-04",
    name: "Dräger Apollo Anesthesia Workstation",
    department: "Operating Theater",
    category: "Medical Equipment",
    condition: "Maintenance Required",
    status: "Discrepancy",
    purchaseDate: "2016-05-20",
    currency: "EUR",
    purchasePriceOriginal: 42000,
    historicalFxRate: 4.55,
    flag: "Red",
    notes: "Vaporizer calibration log missing for past 18 months."
  },
  {
    id: "AST-003",
    tagId: "ICU-VENT-12",
    name: "Puritan Bennett 980 ICU Ventilator",
    department: "ICU",
    category: "Medical Equipment",
    condition: "Operational",
    status: "Verified",
    purchaseDate: "2021-03-10",
    currency: "USD",
    purchasePriceOriginal: 28000,
    historicalFxRate: 4.12,
    flag: "Green",
    notes: "Software updated to v4.2."
  }
];

export default function App() {
  const [activeScreen, setActiveScreen] = useState('currencies');
  const [isFetchingFx, setIsFetchingFx] = useState(false);
  const [fxStatusMsg, setFxStatusMsg] = useState('');

  // Core Data Stores
  const [departments, setDepartments] = useState(INITIAL_DEPARTMENTS);
  const [currencies, setCurrencies] = useState(INITIAL_CURRENCIES);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [assets, setAssets] = useState(INITIAL_ASSETS);

  // Department Management State
  const [newDeptInput, setNewDeptInput] = useState('');

  // User Management State
  const [currentUserRole, setCurrentUserRole] = useState('S2');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserCrewName, setNewUserCrewName] = useState('');
  const [newUserRole, setNewUserRole] = useState('S3');

  // Currency Engine State
  const [isAddCurrencyModalOpen, setIsAddCurrencyModalOpen] = useState(false);
  const [newCurrCode, setNewCurrCode] = useState('');
  const [newCurrName, setNewCurrName] = useState('');
  const [newCurrSymbol, setNewCurrSymbol] = useState('');
  const [newCurrRate, setNewCurrRate] = useState(1.0);

  // Asset Engine & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');
  const [selectedFlagFilter, setSelectedFlagFilter] = useState('All');
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  const [newAsset, setNewAsset] = useState({
    tagId: '',
    name: '',
    department: INITIAL_DEPARTMENTS[0],
    category: 'Medical Equipment',
    purchaseDate: '2024-01-01',
    currency: 'USD',
    purchasePriceOriginal: 50000,
    historicalFxRate: 4.08,
    flag: 'Green',
    notes: ''
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

  // --- CURRENCY ENGINE ACTIONS ---
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

          setFxStatusMsg(`Successfully updated live FX rates!`);
        }
      }
    } catch (err) {
      setFxStatusMsg('API offline. Using custom entered rates.');
    } finally {
      setIsFetchingFx(false);
      setTimeout(() => setFxStatusMsg(''), 4000);
    }
  };

  const handleAddCurrency = (e) => {
    e.preventDefault();
    if (!newCurrCode || !newCurrName) return;
    const code = newCurrCode.toUpperCase().trim();
    if (currencies.some(c => c.code === code)) return;

    setCurrencies([
      ...currencies,
      {
        code,
        name: newCurrName,
        symbol: newCurrSymbol || code,
        rateToMYR: parseFloat(newCurrRate) || 1.0,
        isBase: false
      }
    ]);
    setNewCurrCode('');
    setNewCurrName('');
    setNewCurrSymbol('');
    setNewCurrRate(1.0);
    setIsAddCurrencyModalOpen(false);
  };

  const handleUpdateFxRate = (code, value) => {
    const val = parseFloat(value) || 0;
    setCurrencies(currencies.map(c => c.code === code ? { ...c, rateToMYR: val } : c));
  };

  const handleDeleteCurrency = (codeToDelete) => {
    setCurrencies(currencies.filter(c => c.code !== codeToDelete && !c.isBase));
  };

  // Department Operations
  const handleAddDepartment = (e) => {
    e.preventDefault();
    const deptName = newDeptInput.trim();
    if (!deptName || departments.includes(deptName)) return;
    setDepartments([...departments, deptName]);
    setNewDeptInput('');
  };

  const handleDeleteDepartment = (deptToDelete) => {
    if (departments.length <= 1) return;
    setDepartments(departments.filter(d => d !== deptToDelete));
  };

  // User Operations
  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUserEmail || !newUserCrewName) return;
    setUsers([...users, {
      id: `usr-${Date.now()}`,
      email: newUserEmail,
      crewName: newUserCrewName,
      assetRole: newUserRole,
      status: 'Active'
    }]);
    setNewUserEmail('');
    setNewUserCrewName('');
    setIsAddUserModalOpen(false);
  };

  const handleUpdateUserRole = (id, newRole) => {
    setUsers(users.map(u => u.id === id ? { ...u, assetRole: newRole } : u));
  };

  const handleToggleUserStatus = (id) => {
    setUsers(users.map(u => u.id === id ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } : u));
  };

  // Asset Operations
  const handleAddAsset = (e) => {
    e.preventDefault();
    setAssets([...assets, {
      ...newAsset,
      id: `AST-${Date.now().toString().slice(-4)}`,
      status: 'Verified',
      condition: 'Operational'
    }]);
    setIsAddAssetModalOpen(false);
  };

  const handleDeleteAsset = (id) => {
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

  return (
    <div className="min-h-screen bg-[#0d151c] text-slate-100 flex font-sans selection:bg-teal-500 selection:text-white">
      {/* --- LEFT NAVIGATION SIDEBAR --- */}
      <aside className="w-64 bg-[#111c24] border-r border-slate-800/80 flex flex-col justify-between shrink-0">
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
              { id: 'register', label: 'Asset Register', icon: FileSpreadsheet },
              { id: 'currencies', label: 'Currency Engine & FX', icon: Coins },
              { id: 'settings', label: 'Settings & Users', icon: Settings },
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveScreen(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-[#1a2b36] text-teal-400 border-l-4 border-teal-400 shadow-xs'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-500 text-center font-mono">
          © 2026 Berkat Group • v1-301026.2229
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER BAR */}
        <header className="h-14 bg-[#111c24] border-b border-slate-800/80 px-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-medium text-slate-400">Malaysia Target Hospital</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
              <Radio className="w-3 h-3 animate-pulse" /> Team Cloud Active
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-xs font-mono bg-slate-800 px-2.5 py-1 rounded-md text-slate-300 border border-slate-700">
              C001
            </span>
            <div className="flex items-center space-x-2 bg-[#1a2b36] px-3 py-1 rounded-lg border border-slate-700">
              <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center text-slate-950 font-bold text-xs">
                A
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-100 leading-none">ariff</p>
                <p className="text-[10px] text-teal-400 leading-none mt-0.5 font-mono">Asset Role: {currentUserRole}</p>
              </div>
            </div>
          </div>
        </header>

        {/* SCREEN ROUTER */}
        <main className="p-8 flex-1 overflow-y-auto space-y-8">
          {/* --- CURRENCY ENGINE SCREEN --- */}
          {activeScreen === 'currencies' && (
            <div className="space-y-6 max-w-6xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-100">Currency Engine & Exchange Rates</h2>
                  <p className="text-xs text-slate-400">Manage rates, sync live market FX values, or configure foreign currency benchmarks.</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleFetchLiveFx}
                    disabled={isFetchingFx}
                    className="px-3.5 py-2 bg-[#1a2b36] hover:bg-slate-800 text-teal-400 border border-teal-500/30 font-semibold rounded-lg text-xs transition flex items-center space-x-1.5"
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
              </div>

              {fxStatusMsg && (
                <div className="p-3 bg-teal-500/10 border border-teal-500/30 text-teal-300 rounded-lg text-xs font-medium">
                  {fxStatusMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {currencies.map(c => (
                  <div key={c.code} className="p-4 bg-[#111c24] border border-slate-800 rounded-xl space-y-3">
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
                        <button
                          onClick={() => handleDeleteCurrency(c.code)}
                          className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition"
                          title="Delete Currency"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
                            value={c.rateToMYR}
                            onChange={(e) => handleUpdateFxRate(c.code, e.target.value)}
                            className="w-24 bg-[#1a2b36] border border-slate-700 rounded px-2 py-1 font-mono text-right font-bold text-teal-400 focus:outline-none focus:border-teal-400 text-xs"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- ASSET REGISTER SCREEN --- */}
          {activeScreen === 'register' && (
            <div className="space-y-6 max-w-6xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-100">Hospital Equipment Register</h2>
                  <p className="text-xs text-slate-400">Real-Time Due Diligence Asset Sheet</p>
                </div>
                <button
                  onClick={() => setIsAddAssetModalOpen(true)}
                  className="px-4 py-2 bg-teal-500 text-slate-950 font-bold rounded-lg text-xs hover:bg-teal-400 transition flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Equipment Record</span>
                </button>
              </div>

              {/* SEARCH & FILTERS */}
              <div className="bg-[#111c24] p-4 rounded-xl border border-slate-800 flex flex-wrap gap-4 items-center justify-between">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by Tag ID, Equipment Name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#1a2b36] border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <select
                    value={selectedDeptFilter}
                    onChange={(e) => setSelectedDeptFilter(e.target.value)}
                    className="bg-[#1a2b36] border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-200"
                  >
                    <option value="All">All Departments</option>
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>

                  <select
                    value={selectedFlagFilter}
                    onChange={(e) => setSelectedFlagFilter(e.target.value)}
                    className="bg-[#1a2b36] border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-200"
                  >
                    <option value="All">All Flags</option>
                    <option value="Green">Green Flag</option>
                    <option value="Red">Red Flag</option>
                  </select>
                </div>
              </div>

              {/* TABLE */}
              <div className="bg-[#111c24] border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#172531] text-slate-400 font-bold uppercase text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">FLAG</th>
                      <th className="py-3 px-4">TAG / EQUIPMENT NAME</th>
                      <th className="py-3 px-4">DEPARTMENT</th>
                      <th className="py-3 px-4">INVOICED COST</th>
                      <th className="py-3 px-4">LIVE FX RATE</th>
                      <th className="py-3 px-4">TODAY MYR</th>
                      <th className="py-3 px-4 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-[#14202b]">
                    {filteredAssets.map(a => {
                      const sym = currencySymbolMap[a.currency] || '$';
                      const acqMYR = a.purchasePriceOriginal * (a.historicalFxRate || 1.0);
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
                            {a.department}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-200">
                            {sym}{a.purchasePriceOriginal?.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">{a.currency}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-teal-400">
                            1 {a.currency} = RM {todayRate}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-100">
                            RM {Math.round(todayMYR).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button onClick={() => handleDeleteAsset(a.id)} className="text-slate-500 hover:text-red-400">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --- SETTINGS SCREEN --- */}
          {activeScreen === 'settings' && (
            <div className="space-y-8 max-w-6xl">
              {/* DEPARTMENT MANAGEMENT SECTION */}
              <div className="bg-[#111c24] border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Briefcase className="w-5 h-5 text-teal-400" />
                    <h3 className="font-bold text-slate-100 text-sm">Hospital Departments</h3>
                    <span className="text-xs text-slate-400 font-mono">{departments.length} configured</span>
                  </div>
                </div>

                <form onSubmit={handleAddDepartment} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    required
                    placeholder="Enter new department name (e.g., Oncology, CSSD)..."
                    value={newDeptInput}
                    onChange={(e) => setNewDeptInput(e.target.value)}
                    className="flex-1 bg-[#1a2b36] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-teal-400"
                  />
                  <button type="submit" className="px-4 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg transition">
                    + Add Dept
                  </button>
                </form>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {departments.map(dept => (
                    <div key={dept} className="flex items-center justify-between p-3 bg-[#182632] border border-slate-800 rounded-lg text-xs">
                      <span className="font-semibold text-slate-200">{dept}</span>
                      <button
                        onClick={() => handleDeleteDepartment(dept)}
                        className="text-slate-500 hover:text-red-400 ml-2"
                        title="Delete Department"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* USER MANAGEMENT MATRIX */}
              <div className="bg-[#111c24] border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-teal-400" />
                    <h3 className="font-bold text-slate-100 text-sm">User Management</h3>
                    <span className="text-xs text-slate-400 font-mono">{users.length} users</span>
                  </div>
                  <button
                    onClick={() => setIsAddUserModalOpen(true)}
                    className="px-3 py-1.5 bg-teal-500 text-slate-950 rounded-lg text-xs font-bold hover:bg-teal-400 transition"
                  >
                    + Create User
                  </button>
                </div>

                <div className="overflow-hidden border border-slate-800 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#172531] text-slate-400 font-semibold uppercase text-[11px] border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">EMAIL</th>
                        <th className="py-3 px-4">CREW NAME</th>
                        <th className="py-3 px-4">ASSET ROLE</th>
                        <th className="py-3 px-4 text-right">EDIT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-[#14202b]">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-800/30">
                          <td className="py-3 px-4 font-mono text-slate-200">{u.email}</td>
                          <td className="py-3 px-4 font-semibold text-slate-300">{u.crewName}</td>
                          <td className="py-3 px-4">
                            <select
                              value={u.assetRole}
                              onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                              className="bg-[#1c2e3c] border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs font-semibold"
                            >
                              <option value="S2">S2 (Admin)</option>
                              <option value="S3">S3 (Inspector)</option>
                              <option value="S4">S4 (Viewer)</option>
                            </select>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleToggleUserStatus(u.id)}
                              className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                                u.status === 'Active' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                              }`}
                            >
                              {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                            </button>
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

      {/* --- ADD CURRENCY MODAL --- */}
      {isAddCurrencyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111c24] border border-slate-800 rounded-xl w-full max-w-md p-6 space-y-4">
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
                    className="w-full bg-[#1a2b36] border border-slate-700 rounded p-2 text-slate-100 font-mono font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Symbol</label>
                  <input
                    type="text"
                    placeholder="e.g. S$"
                    value={newCurrSymbol}
                    onChange={(e) => setNewCurrSymbol(e.target.value)}
                    className="w-full bg-[#1a2b36] border border-slate-700 rounded p-2 text-slate-100"
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
                  className="w-full bg-[#1a2b36] border border-slate-700 rounded p-2 text-slate-100"
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
                  className="w-full bg-[#1a2b36] border border-slate-700 rounded p-2 text-teal-400 font-mono font-bold"
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

      {/* --- ADD ASSET MODAL --- */}
      {isAddAssetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111c24] border border-slate-800 rounded-xl w-full max-w-lg p-6 space-y-4">
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
                    className="w-full bg-[#1a2b36] border border-slate-700 rounded p-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Equipment Name</label>
                  <input
                    type="text"
                    required
                    value={newAsset.name}
                    onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                    className="w-full bg-[#1a2b36] border border-slate-700 rounded p-2 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Department</label>
                  <select
                    value={newAsset.department}
                    onChange={(e) => setNewAsset({ ...newAsset, department: e.target.value })}
                    className="w-full bg-[#1a2b36] border border-slate-700 rounded p-2 text-slate-100 font-semibold"
                  >
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Purchase Date</label>
                  <input
                    type="date"
                    value={newAsset.purchaseDate}
                    onChange={(e) => setNewAsset({ ...newAsset, purchaseDate: e.target.value })}
                    className="w-full bg-[#1a2b36] border border-slate-700 rounded p-2 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Currency</label>
                  <select
                    value={newAsset.currency}
                    onChange={(e) => setNewAsset({ ...newAsset, currency: e.target.value })}
                    className="w-full bg-[#1a2b36] border border-slate-700 rounded p-2 text-teal-400 font-bold"
                  >
                    {currencies.map(c => (
                      <option key={c.code} value={c.code}>{c.code}</option>
                    ))}
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
                    className="w-full bg-[#1a2b36] border border-slate-700 rounded p-2 text-slate-100 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Historical FX Rate (to MYR)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newAsset.historicalFxRate}
                    onChange={(e) => setNewAsset({ ...newAsset, historicalFxRate: parseFloat(e.target.value) || 1 })}
                    className="w-full bg-[#1a2b36] border border-slate-700 rounded p-2 text-teal-400 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button type="button" onClick={() => setIsAddAssetModalOpen(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-teal-500 text-slate-950 font-bold rounded">Save to Live Cloud</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CREATE USER MODAL --- */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111c24] border border-slate-800 rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-sm">Create New User Account</h3>
              <button onClick={() => setIsAddUserModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">User Email</label>
                <input
                  type="email"
                  required
                  placeholder="user@asset.bosh"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full bg-[#1a2b36] border border-slate-700 rounded p-2 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Crew Name</label>
                <input
                  type="text"
                  required
                  placeholder="Crew name..."
                  value={newUserCrewName}
                  onChange={(e) => setNewUserCrewName(e.target.value)}
                  className="w-full bg-[#1a2b36] border border-slate-700 rounded p-2 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Asset Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full bg-[#1a2b36] border border-slate-700 rounded p-2 text-slate-100"
                >
                  <option value="S2">S2 (Admin)</option>
                  <option value="S3">S3 (Inspector)</option>
                  <option value="S4">S4 (Viewer)</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end space-x-2">
                <button type="button" onClick={() => setIsAddUserModalOpen(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-teal-500 text-slate-950 font-bold rounded">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}