import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Sparkles, 
  Globe, 
  GraduationCap, 
  Search, 
  Trash2, 
  UserPlus, 
  Download, 
  RefreshCw, 
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight
} from 'lucide-react';
import { User } from '../types';
import { deleteCandidate, getAdminOverview, inviteCandidate } from '../services/adminService';

interface Props {
  currentUser: User | null;
  onOpenAuth: () => void;
  onNavigateHome: () => void;
}

const AdminDashboard: React.FC<Props> = ({ currentUser, onOpenAuth, onNavigateHome }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [aiRequestsCount, setAiRequestsCount] = useState(0);
  const [applicationCount, setApplicationCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserCountry, setNewUserCountry] = useState('Singapore');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Check admin access
  const isAdmin = currentUser?.role === 'admin';

  const loadData = async () => {
    setLoading(true);
    try {
      const overview = await getAdminOverview();
      setUsers(overview.users);
      setAiRequestsCount(overview.stats.aiRequests);
      setApplicationCount(overview.stats.applications);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not load admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to remove user "${userName}" from the portal registry?`)) {
      try {
        await deleteCandidate(userId);
        setUsers(current => current.filter(u => u.id !== userId));
        showToast(`User ${userName} has been removed.`);
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Could not remove user.');
      }
    }
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    try {
      await inviteCandidate({ name: newUserName.trim(), email: newUserEmail.trim().toLowerCase(), targetCountry: newUserCountry });
      setShowAddModal(false);
      setNewUserName('');
      setNewUserEmail('');
      await loadData();
      showToast('Candidate invitation sent.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not invite candidate.');
    }
  };

  const exportCSV = () => {
    const headers = ["Name", "Email", "Target Country", "Registered Date", "Role"];
    const rows = users.map(u => [
      `"${u.name}"`,
      `"${u.email}"`,
      `"${u.targetCountry}"`,
      `"${u.registeredAt}"`,
      `"${u.role}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bagdar_asia_users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("User list exported to CSV.");
  };

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-24 px-4 text-center">
        <div className="bg-[#161B22] border border-red-500/20 rounded-[3rem] p-12 shadow-2xl">
          <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-500/20 text-red-400">
            <Lock size={40} />
          </div>
          <h2 className="text-3xl font-black text-white mb-4">Restricted Administrator Area</h2>
          <p className="text-gray-400 text-base mb-8 max-w-md mx-auto">
            This dashboard is strictly protected and accessible only to authorized Bagdar Asia administrative personnel.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onOpenAuth}
              className="w-full sm:w-auto px-8 py-4 bg-emerald-500 text-black font-black rounded-2xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2"
            >
              Sign In with Authorized Account <ArrowRight size={18} />
            </button>
            <button
              onClick={onNavigateHome}
              className="w-full sm:w-auto px-8 py-4 bg-[#21262D] text-gray-300 font-bold rounded-2xl hover:bg-[#30363D] transition-all"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Country stats
  const countryCounts = users.reduce((acc, curr) => {
    acc[curr.targetCountry] = (acc[curr.targetCountry] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedCountries: [string, number][] = (Object.entries(countryCounts) as [string, number][]).sort(
    (a, b) => b[1] - a[1]
  );

  const filteredUsers = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                        u.email.toLowerCase().includes(search.toLowerCase());
    const matchCountry = selectedCountry === 'all' || u.targetCountry === selectedCountry;
    return matchSearch && matchCountry;
  });

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 animate-in fade-in duration-700">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[110] bg-emerald-500 text-black font-black px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4">
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-gray-800 pb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider mb-3">
            <ShieldCheck size={14} /> Certified Secure Area
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white">Bagdar Asia Admin Console</h1>
          <p className="text-gray-400 text-sm md:text-base mt-2">
            Active Administrator: <span className="text-emerald-400 font-bold">{currentUser?.name}</span> ({currentUser?.email})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-3.5 bg-emerald-500 text-black font-black rounded-2xl hover:bg-emerald-400 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/10 text-sm"
          >
            <UserPlus size={18} /> Add User
          </button>
          <button
            onClick={exportCSV}
            className="px-5 py-3.5 bg-[#1F242C] text-gray-200 font-bold rounded-2xl hover:bg-[#2A313C] transition-all flex items-center gap-2 border border-gray-700 text-sm"
          >
            <Download size={18} /> Export CSV
          </button>
        </div>
      </div>

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-[#161B22] p-8 rounded-[2rem] border border-gray-800 shadow-xl flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Users size={32} />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Registered</div>
            <div className="text-3xl font-black text-white mt-1">{users.length}</div>
            <div className="text-[11px] text-emerald-400 font-medium mt-0.5">Active Student Profiles</div>
          </div>
        </div>

        <div className="bg-[#161B22] p-8 rounded-[2rem] border border-gray-800 shadow-xl flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Sparkles size={32} />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Essay AI Scans</div>
            <div className="text-3xl font-black text-white mt-1">{aiRequestsCount}</div>
            <div className="text-[11px] text-purple-400 font-medium mt-0.5">Tracked AI Requests</div>
          </div>
        </div>

        <div className="bg-[#161B22] p-8 rounded-[2rem] border border-gray-800 shadow-xl flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Globe size={32} />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Top Destination</div>
            <div className="text-2xl font-black text-white mt-1 truncate max-w-[140px]">
              {sortedCountries[0] ? sortedCountries[0][0] : '—'}
            </div>
            <div className="text-[11px] text-amber-400 font-medium mt-0.5">
              {sortedCountries[0] ? `${sortedCountries[0][1]} applicants` : 'No applicants yet'}
            </div>
          </div>
        </div>

        <div className="bg-[#161B22] p-8 rounded-[2rem] border border-gray-800 shadow-xl flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <GraduationCap size={32} />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Applications</div>
            <div className="text-3xl font-black text-white mt-1">{applicationCount}</div>
            <div className="text-[11px] text-blue-400 font-medium mt-0.5">Saved Application Records</div>
          </div>
        </div>
      </div>

      {/* Popular Target Countries Bar */}
      {sortedCountries.length > 0 ? (
        <div className="bg-[#161B22] p-8 rounded-[2rem] border border-gray-800 shadow-xl mb-12">
          <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
            <Globe size={20} className="text-emerald-400" /> Target Country Distribution
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {sortedCountries.slice(0, 6).map(([country, count]) => {
              const pct = Math.round((count / (users.length || 1)) * 100);
              return (
                <div key={country} className="p-4 bg-[#0D1117] rounded-2xl border border-gray-800">
                  <div className="text-xs font-bold text-gray-400 truncate">{country}</div>
                  <div className="text-2xl font-black text-white mt-1">{count} <span className="text-xs font-normal text-gray-500">({pct}%)</span></div>
                  <div className="w-full bg-gray-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-[#161B22] p-8 rounded-[2rem] border border-gray-800 shadow-xl mb-12 text-center py-10">
          <Globe size={28} className="mx-auto mb-2 text-gray-600" />
          <p className="text-sm font-semibold text-gray-400">No applicant distribution data yet</p>
          <p className="text-xs text-gray-600 mt-1">Country metrics will populate as applicants register.</p>
        </div>
      )}

      {/* Dynamic Registered Users Table */}
      <div className="bg-[#161B22] rounded-[2.5rem] border border-gray-800 shadow-2xl overflow-hidden">
        {/* Table Filters Header */}
        <div className="p-6 md:p-8 border-b border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white">Registered Candidates Registry</h2>
            <p className="text-gray-400 text-xs mt-1">Secure account data synchronized with Supabase</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search candidates..."
                className="w-full bg-[#0D1117] border border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Country Filter */}
            <select
              value={selectedCountry}
              onChange={e => setSelectedCountry(e.target.value)}
              className="w-full sm:w-auto bg-[#0D1117] border border-gray-800 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Countries</option>
              {Object.keys(countryCounts).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-[#0D1117] text-gray-400 text-xs uppercase tracking-wider border-b border-gray-800 font-bold">
              <tr>
                <th className="py-4 px-6">Candidate Name</th>
                <th className="py-4 px-6">Email Address</th>
                <th className="py-4 px-6">Target Destination</th>
                <th className="py-4 px-6">Registered Date</th>
                <th className="py-4 px-6">Status / Role</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400">
                    <RefreshCw size={28} className="mx-auto mb-3 animate-spin" /> Loading account registry…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Users size={36} className="text-gray-600 mb-3" />
                      <p className="text-base font-bold text-gray-300">No registered applicants yet.</p>
                      <p className="text-xs text-gray-500 mt-1 max-w-sm">
                        Candidates who create an account via the Sign In / Register form will appear here in real-time.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    No registered applicants matching current search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-white">{u.name}</div>
                    </td>
                    <td className="py-4 px-6 text-gray-400">{u.email}</td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                        {u.targetCountry}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-400">{u.registeredAt}</td>
                    <td className="py-4 px-6">
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-bold uppercase">
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-800 text-gray-400 text-[11px] font-semibold">
                          Active User
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                          title="Delete user"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#161B22] border border-gray-800 rounded-3xl p-8 shadow-2xl text-white">
            <h3 className="text-xl font-black mb-4">Add Registered Candidate</h3>
            <form onSubmit={handleAddUserSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  placeholder="Candidate Name"
                  className="w-full bg-[#0D1117] border border-gray-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#0D1117] border border-gray-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Target Country</label>
                <input
                  type="text"
                  required
                  value={newUserCountry}
                  onChange={e => setNewUserCountry(e.target.value)}
                  placeholder="Target Country"
                  className="w-full bg-[#0D1117] border border-gray-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-gray-800 text-gray-300 font-bold rounded-xl hover:bg-gray-700 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-500 text-black font-black rounded-xl hover:bg-emerald-400 transition-colors text-sm"
                >
                  Save Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
