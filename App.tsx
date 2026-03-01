import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Fuel, 
  AlertTriangle, 
  Activity, 
  Search, 
  PlusCircle, 
  FileText,
  Bot,
  MapPin,
  Clock,
  Trash2,
  Car
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Transaction, MOCK_CITIZENS, FraudAlert, FraudRuleType } from './types';
import { runDeterministicChecks } from './services/logic';
import { analyzeWithGemini } from './services/geminiService';

// --- Components ---

const Sidebar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'eligibility', label: 'Check Eligibility', icon: Search },
    { id: 'transaction', label: 'New Transaction', icon: PlusCircle },
    { id: 'history', label: 'History & Alerts', icon: FileText },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 flex flex-col shadow-xl z-10">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="bg-indigo-500 p-2 rounded-lg">
           <ShieldCheck size={24} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight">Sentinel</h1>
          <p className="text-xs text-slate-400">Fuel Subsidy Guard</p>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === item.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-lg p-3 text-xs text-slate-400 flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
           System Operational
        </div>
      </div>
    </div>
  );
};

const EligibilityView = () => {
  const [mykad, setMykad] = useState('');
  const [result, setResult] = useState<any>(null);

  const check = () => {
    const found = MOCK_CITIZENS[mykad];
    setResult(found || { error: 'MyKad not found in database.' });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Search className="text-indigo-600" /> Verify Citizen & Vehicle
      </h2>
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <label className="block text-sm font-medium text-slate-600 mb-2">Citizen MyKad Number</label>
        <div className="flex gap-4">
          <input
            type="text"
            value={mykad}
            onChange={(e) => setMykad(e.target.value)}
            placeholder="e.g. 900101081234"
            className="flex-1 border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
          />
          <button 
            onClick={check}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition shadow-lg shadow-indigo-500/30"
          >
            Check Status
          </button>
        </div>

        {result && (
          <div className={`mt-8 p-6 rounded-xl border-l-4 ${result.eligible ? 'bg-green-50 border-green-500' : result.error ? 'bg-orange-50 border-orange-500' : 'bg-red-50 border-red-500'}`}>
            {result.error ? (
               <div className="flex items-center gap-3 text-orange-700">
                 <AlertTriangle size={24} />
                 <span className="font-semibold">{result.error}</span>
               </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`text-lg font-bold ${result.eligible ? 'text-green-800' : 'text-red-800'}`}>
                    {result.eligible ? 'Eligible for Subsidy' : 'Not Eligible'}
                  </h3>
                  {result.eligible ? <ShieldCheck className="text-green-600" size={28} /> : <AlertTriangle className="text-red-600" size={28} />}
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                  <div>
                    <span className="block text-slate-500">Full Name</span>
                    <span className="font-semibold text-slate-800">{result.name}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500">MyKad</span>
                    <span className="font-semibold text-slate-800">{result.mykad}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500">Registered Vehicle</span>
                    <span className="font-semibold text-slate-800">{result.vehicleType}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500">Vehicle Plate</span>
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 inline-block px-2 py-0.5 rounded">{result.vehiclePlate}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                    <Car size={14} />
                    <span>Please verify the vehicle plate matches the physical vehicle.</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const AddTransactionView = ({ onAdd }: { onAdd: (t: Omit<Transaction, 'id'>) => void }) => {
  const [formData, setFormData] = useState({
    mykad: '',
    vehiclePlate: '',
    stationName: '',
    distanceFromPrev: '0',
    liters: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      mykad: formData.mykad,
      vehiclePlate: formData.vehiclePlate.toUpperCase(),
      stationName: formData.stationName,
      distanceFromPrev: parseFloat(formData.distanceFromPrev) || 0,
      liters: parseFloat(formData.liters) || 0,
      timestamp: new Date()
    });
    setFormData({ mykad: '', vehiclePlate: '', stationName: '', distanceFromPrev: '0', liters: '' });
    alert("Transaction logged successfully");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Fuel className="text-indigo-600" /> Log Transaction
      </h2>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-1">
            <label className="block text-sm font-medium text-slate-600 mb-2">Customer MyKad</label>
            <input
              required
              type="text"
              className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="900101..."
              value={formData.mykad}
              onChange={e => setFormData({...formData, mykad: e.target.value})}
            />
          </div>

          <div className="col-span-1">
             <label className="block text-sm font-medium text-slate-600 mb-2">Vehicle Plate Number</label>
             <input
              required
              type="text"
              className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 uppercase font-mono"
              placeholder="ABC 1234"
              value={formData.vehiclePlate}
              onChange={e => setFormData({...formData, vehiclePlate: e.target.value})}
             />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Station Name</label>
            <input
              required
              type="text"
              className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Shell KL Sentral"
              value={formData.stationName}
              onChange={e => setFormData({...formData, stationName: e.target.value})}
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-600 mb-2">Fuel Amount (Liters)</label>
             <input
              required
              type="number"
              step="0.1"
              className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0.00"
              value={formData.liters}
              onChange={e => setFormData({...formData, liters: e.target.value})}
             />
          </div>

          <div className="col-span-2">
             <label className="block text-sm font-medium text-slate-600 mb-2">
                Distance from previous fill (Simulated KM)
                <span className="text-slate-400 font-normal ml-2 text-xs">(Optional for first entry)</span>
             </label>
             <div className="relative">
                <MapPin className="absolute left-3 top-3.5 text-slate-400" size={18} />
                <input
                  type="number"
                  step="0.1"
                  className="w-full pl-10 border border-slate-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0"
                  value={formData.distanceFromPrev}
                  onChange={e => setFormData({...formData, distanceFromPrev: e.target.value})}
                />
             </div>
             <p className="text-xs text-slate-400 mt-1">Defaults to 0 if left empty. Use 0 for the first transaction.</p>
          </div>
        </div>

        <button 
          type="submit"
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-lg transition"
        >
          Confirm Transaction
        </button>
      </form>
    </div>
  );
};

const HistoryAndAlerts = ({ transactions, alerts, onRunAnalysis, isAnalyzing, onReset }: { 
  transactions: Transaction[], 
  alerts: FraudAlert[],
  onRunAnalysis: () => void,
  isAnalyzing: boolean,
  onReset: () => void
}) => {
  return (
    <div className="space-y-8">
      
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
        <div>
           <h3 className="text-lg font-bold text-indigo-900">Fraud Detection Engine</h3>
           <p className="text-indigo-700/80 text-sm">Run deterministic rules (incl. Vehicle ID Check) and AI audits.</p>
        </div>
        <div className="flex gap-3">
          <button 
            type="button"
            onClick={onReset}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition shadow-sm"
          >
            <Trash2 size={20} /> Reset Data
          </button>
          <button 
            onClick={onRunAnalysis}
            disabled={isAnalyzing}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold shadow-lg transition ${isAnalyzing ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/30'}`}
          >
            {isAnalyzing ? (
              <span className="flex items-center gap-2">Analyzing...</span>
            ) : (
              <>
                <Bot size={20} /> Run AI & Rule Check
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Alerts Column */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={20} /> Active Alerts
            <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">{alerts.length}</span>
          </h3>
          
          <div className="space-y-3 h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {alerts.length === 0 ? (
              <div className="text-center p-8 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
                <ShieldCheck size={40} className="mx-auto mb-2 opacity-50" />
                No fraud patterns detected.
              </div>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} className={`p-4 rounded-xl border-l-4 shadow-sm bg-white ${
                  alert.severity === 'high' ? 'border-red-500' : 
                  alert.severity === 'medium' ? 'border-orange-500' : 'border-yellow-500'
                }`}>
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                       alert.ruleType === FraudRuleType.AI_DETECTED ? 'bg-purple-100 text-purple-700' : 
                       alert.ruleType === FraudRuleType.VEHICLE_MISMATCH ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {alert.ruleType.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{alert.mykad}</span>
                  </div>
                  <h4 className="font-semibold text-slate-800 text-sm mb-1 leading-tight">{alert.description}</h4>
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-2">
                     <Clock size={12} /> Detected just now
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="lg:col-span-2">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
             <FileText className="text-slate-500" size={20} /> Transaction Log
          </h3>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <table className="w-full text-sm text-left">
               <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                 <tr>
                   <th className="px-6 py-4">Time</th>
                   <th className="px-6 py-4">Citizen</th>
                   <th className="px-6 py-4">Vehicle</th>
                   <th className="px-6 py-4">Station</th>
                   <th className="px-6 py-4 text-right">Liters</th>
                   <th className="px-6 py-4 text-right">Dist (KM)</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {[...transactions].reverse().map(t => (
                   <tr key={t.id} className="hover:bg-slate-50 transition">
                     <td className="px-6 py-4 text-slate-500">
                       {t.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                       <div className="text-xs text-slate-400">{t.timestamp.toLocaleDateString()}</div>
                     </td>
                     <td className="px-6 py-4 font-mono text-slate-700">{t.mykad}</td>
                     <td className="px-6 py-4 font-mono text-indigo-600 font-medium">{t.vehiclePlate}</td>
                     <td className="px-6 py-4 text-slate-800 font-medium">{t.stationName}</td>
                     <td className="px-6 py-4 text-right text-slate-700">{t.liters.toFixed(2)} L</td>
                     <td className="px-6 py-4 text-right text-slate-500">{t.distanceFromPrev}</td>
                   </tr>
                 ))}
                 {transactions.length === 0 && (
                   <tr>
                     <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                       No transactions recorded yet.
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardHome = ({ transactions, alerts }: { transactions: Transaction[], alerts: FraudAlert[] }) => {
  // Simple data prep for chart
  const data = transactions.slice(-10).map(t => ({
    name: t.timestamp.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
    liters: t.liters
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-500 text-sm font-medium">Total Volume</h3>
              <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><Fuel size={20} /></div>
           </div>
           <p className="text-3xl font-bold text-slate-900">
             {transactions.reduce((acc, t) => acc + t.liters, 0).toFixed(1)} <span className="text-lg font-normal text-slate-500">L</span>
           </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-500 text-sm font-medium">Transactions</h3>
              <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600"><FileText size={20} /></div>
           </div>
           <p className="text-3xl font-bold text-slate-900">{transactions.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-500 text-sm font-medium">Fraud Risks</h3>
              <div className="bg-red-50 p-2 rounded-lg text-red-600"><AlertTriangle size={20} /></div>
           </div>
           <p className="text-3xl font-bold text-slate-900">{alerts.length}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-[400px]">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Recent Fuel Consumption</h3>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              cursor={{fill: '#f1f5f9'}}
              contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
            />
            <Bar dataKey="liters" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAddTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTx = { ...t, id: Math.random().toString(36).substr(2, 9) };
    setTransactions(prev => [...prev, newTx]);
  };

  const handleReset = () => {
    setTransactions([]);
    setAlerts([]);
  };

  const handleAnalysis = async () => {
    setIsAnalyzing(true);
    // 1. Run standard rules
    const ruleAlerts = runDeterministicChecks(transactions);
    
    // 2. Run Gemini AI analysis
    // We append the AI results to the rule results
    const aiAlerts = await analyzeWithGemini(transactions);
    
    setAlerts([...ruleAlerts, ...aiAlerts]);
    setIsAnalyzing(false);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 ml-64 p-8">
        <header className="mb-8 flex justify-between items-center">
           <div>
             <h2 className="text-2xl font-bold text-slate-900 capitalize">{activeTab.replace('-', ' ')}</h2>
             <p className="text-slate-500 text-sm mt-1">
               {activeTab === 'dashboard' && 'Overview of system status.'}
               {activeTab === 'eligibility' && 'Verify citizen subsidy status and vehicle.'}
               {activeTab === 'transaction' && 'Log new fuel disbursement.'}
               {activeTab === 'history' && 'Review logs and detect fraud.'}
             </p>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xs">
               AD
             </div>
             <span className="text-sm font-medium text-slate-700">Admin User</span>
           </div>
        </header>

        {activeTab === 'dashboard' && <DashboardHome transactions={transactions} alerts={alerts} />}
        {activeTab === 'eligibility' && <EligibilityView />}
        {activeTab === 'transaction' && <AddTransactionView onAdd={handleAddTransaction} />}
        {activeTab === 'history' && (
          <HistoryAndAlerts 
            transactions={transactions} 
            alerts={alerts} 
            onRunAnalysis={handleAnalysis}
            isAnalyzing={isAnalyzing}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  );
}