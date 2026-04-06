import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, BarChart2, 
  CreditCard, FileText, Settings, LogOut,
  Search, Bell, Plus, TrendingDown, TrendingUp, DollarSign, 
  Download, Activity, Trash2, Edit2
} from 'lucide-react';
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import './App.css';
import { ShaderBackground } from './ShaderBackground';
import { DashboardProvider, useDashboard } from './DashboardContext';
import type { Transaction } from './DashboardContext';

const COLORS = ['#eed163', '#f2a6cd', '#9cbd80', '#9fb4d4', '#d49fae', '#9fd4cc'];

function Dashboard() {
  const {
    loading, role, setRole, filteredTransactions,
    searchQuery, setSearchQuery, categoryFilter, setCategoryFilter,
    typeFilter, setTypeFilter, sortOption, setSortOption, 
    darkMode, setDarkMode, categories,
    totalIncome, totalExpense, totalBalance, expensesByCategory,
    highestExpenseCategory, trendData, monthlyComparison,
    addTransaction, updateTransaction, deleteTransaction
  } = useDashboard();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [newAmount, setNewAmount] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newType, setNewType] = useState<'income'|'expense'>('expense');

  const openAddModal = () => {
    setEditingId(null);
    setNewAmount('');
    setNewDesc('');
    setNewCategory('');
    setNewType('expense');
    setIsModalOpen(true);
  };

  const openEditModal = (tx: Transaction) => {
    setEditingId(tx.id);
    setNewAmount(tx.amount.toString());
    setNewDesc(tx.description);
    setNewCategory(tx.category);
    setNewType(tx.type);
    setIsModalOpen(true);
  };

  const handleTransactionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role !== 'admin') return;
    if (!newAmount || !newDesc || !newCategory) return;

    if (editingId) {
      updateTransaction(editingId, {
        date: new Date().toISOString().split('T')[0], // Retains today strictly for demo simplicity
        amount: parseFloat(newAmount),
        category: newCategory,
        type: newType,
        description: newDesc
      });
    } else {
      addTransaction({
        date: new Date().toISOString().split('T')[0],
        amount: parseFloat(newAmount),
        category: newCategory,
        type: newType,
        description: newDesc
      });
    }
    
    setIsModalOpen(false);
  };

  const exportCSV = () => {
    const header = ['ID', 'Date', 'Amount', 'Category', 'Type', 'Description'];
    const rows = filteredTransactions.map(t => [t.id, t.date, t.amount, t.category, t.type, t.description]);
    const csvContent = [header, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "financial_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <h4>Loading your financials...</h4>
      </div>
    );
  }

  return (
    <>
      <ShaderBackground darkMode={darkMode} />
      
      <div className="dashboard-container fade-in">
        {/* SIDEBAR */}
        <div className="sidebar slide-in-left">
          <div className="logo-container">
            <div className="logo-icon-bg">
              <DollarSign size={24} color="#1a1a1a" />
            </div>
            <span>FinDash</span>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-title">General</div>
            <a href="#" className="nav-item active"><LayoutDashboard size={18} /> Dashboard</a>
            <a href="#" className="nav-item"><BarChart2 size={18} /> Analytics</a>
            <a href="#" className="nav-item"><CreditCard size={18} /> Cards</a>
            <a href="#" className="nav-item"><Users size={18} /> Recipients</a>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-title">Settings</div>
            <a href="#" className="nav-item"><Settings size={18} /> Preferences</a>
            <a href="#" className="nav-item"><FileText size={18} /> Statements</a>
          </div>

          <div className="logout-container">
            <a href="#" className="nav-item"><LogOut size={18} /> Log out</a>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="main-content">
          <div className="header fade-in">
            <div className="search-bar">
              <Search size={18} color="#888" />
              <input 
                type="text" 
                placeholder="Search transactions..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="top-icons">
              <div className="role-selector">
                <span style={{ fontSize: '0.8rem', marginRight: '0.5rem', color: "inherit" }}>Role:</span>
                <select value={role} onChange={e => setRole(e.target.value as 'viewer'|'admin')} className="role-dropdown">
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <input 
                type="checkbox" 
                className="l" 
                checked={darkMode}
                onChange={() => setDarkMode(!darkMode)}
                title="Toggle Dark Mode"
              />

              <button className="icon-btn" style={{marginLeft: '0.5rem'}}><Bell size={18} /></button>
            </div>
          </div>

          <div className="greeting-section fade-in" style={{animationDelay: '0.1s'}}>
            <h1>Overview</h1>
            <p>Here is your financial summary and recent transaction history.</p>
          </div>

          {/* TOP METRICS GRID */}
          <div className="top-metrics-grid">
            <div className="card yellow balance-card fade-in-up" style={{animationDelay: '0.2s'}}>
              <h3>Total Balance</h3>
              <div className="card-value large-val">${totalBalance.toLocaleString()}</div>
              
              <div className="mini-insight">
                <div className="mini-insight-label">Monthly Observation</div>
                <div className="mini-insight-val">
                  {monthlyComparison.changePct > 0 
                      ? <span style={{color: '#a12d2d'}}>{monthlyComparison.message}</span> 
                      : <span style={{color: '#2c7a51'}}>{monthlyComparison.message}</span>}
                </div>
              </div>
            </div>

            <div className="card pink trend-card fade-in-up" style={{animationDelay: '0.3s'}}>
              <div className="trend-header">
                <div>
                  <h3>Balance Trend</h3>
                  <div className="trend-sub">
                    <span className="trend-income"><TrendingUp size={14}/> {totalIncome.toLocaleString()} Income</span>
                    <span className="trend-expense"><TrendingDown size={14}/> {totalExpense.toLocaleString()} Expense</span>
                  </div>
                </div>
              </div>
              <div className="trend-chart-mini">
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1a1a1a" stopOpacity={0.6}/>
                          <stop offset="95%" stopColor="#1a1a1a" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Tooltip 
                        contentStyle={{ borderRadius: '10px', border: 'none', background: '#fff', color: '#1a1a1a', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                        formatter={(value: number) => [`$${value}`, 'Balance']}
                      />
                      <Area type="monotone" dataKey="balance" stroke="#1a1a1a" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state" style={{color: '#1a1a1a'}}>No data available</div>
                )}
              </div>
            </div>
          </div>

          <div className="transactions-section fade-in-up" style={{animationDelay: '0.4s'}}>
            <div className="tx-header">
              <h3 className="section-title" style={{margin:0}}>Transactions</h3>
              <div className="tx-actions">
                <select value={sortOption} onChange={e => setSortOption(e.target.value as any)} className="category-dropdown">
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="amount-desc">Highest Amount</option>
                  <option value="amount-asc">Lowest Amount</option>
                </select>
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as 'All' | 'income' | 'expense')} className="category-dropdown">
                  <option value="All">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="category-dropdown">
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button className="btn-export" onClick={exportCSV}>
                  <Download size={14} /> Export
                </button>
                {role === 'admin' && (
                  <button className="btn-add pulse-anim" onClick={openAddModal}>
                    <Plus size={16} /> Add 
                  </button>
                )}
              </div>
            </div>

            <div className="transaction-list">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map(t => (
                  <div key={t.id} className="transaction-item">
                    <div className="tx-main">
                      <div className="tx-icon">
                        {t.type === 'income' ? <TrendingUp size={16} color="#38a169"/> : <TrendingDown size={16} color="#e53e3e"/>}
                      </div>
                      <div>
                        <div className="tx-desc">{t.description}</div>
                        <div className="tx-meta">{t.date} • {t.category}</div>
                      </div>
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                      <div className={`tx-amount ${t.type}`}>
                        {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                      </div>
                      {role === 'admin' && (
                        <div className="tx-admin-actions">
                          <button onClick={() => openEditModal(t)} className="action-btn" title="Edit"><Edit2 size={14}/></button>
                          <button onClick={() => deleteTransaction(t.id)} className="action-btn del" title="Delete"><Trash2 size={14}/></button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">No transactions match your filters.</div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="right-panel slide-in-right">
          <h3 className="panel-title">Spending Insights</h3>
          
          <div className="insight-card mb-2">
            <div className="insight-icon yellow-bg"><PieChartIcon size={20} /></div>
            <div>
              <div className="insight-label">Highest Expense</div>
              <div className="insight-value">
                {highestExpenseCategory ? `${highestExpenseCategory.name} ($${highestExpenseCategory.value})` : 'N/A'}
              </div>
            </div>
          </div>

          <div className="insight-card mb-2">
            <div className="insight-icon green-bg"><Activity size={20} /></div>
            <div>
              <div className="insight-label">Net vs Gross Analysis</div>
              <div className="insight-value" style={{ fontSize: '0.8rem', fontWeight: 400, marginTop: '2px', lineHeight: 1.4 }}>
                Your income is currently {(totalIncome > totalExpense ? 'higher' : 'lower')} than your expenses. 
                {totalIncome > totalExpense ? ' Great job saving!' : ' Try reducing non-essential spending.'}
              </div>
            </div>
          </div>

          <h3 className="panel-title" style={{ marginTop: '2rem' }}>Spending Breakdown</h3>
          <div className="pie-chart-container">
            {expensesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {expensesByCategory.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `$${value}`} 
                    contentStyle={{ borderRadius: '8px', border: 'none', background: 'var(--card-bg)', color: 'var(--text-main)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">No expenses to analyze.</div>
            )}
          </div>
          
          <div className="pie-legend">
            {expensesByCategory.map((entry, index) => (
              <div key={entry.name} className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                <span className="legend-text">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingId ? 'Edit Transaction' : 'Add Transaction'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleTransactionSubmit}>
              <div className="form-group">
                <label>Type</label>
                <select className="form-control" value={newType} onChange={e => setNewType(e.target.value as 'income'|'expense')}>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div className="form-group">
                <label>Amount ($)</label>
                <input required type="number" step="0.01" min="0.01" className="form-control" value={newAmount} onChange={e => setNewAmount(e.target.value)} placeholder="e.g. 50.00" />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input required type="text" className="form-control" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="e.g. Groceries" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input required type="text" className="form-control" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="e.g. Weekly shop at Whole Foods" />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-submit">
                  {editingId ? 'Save Changes' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <DashboardProvider>
      <Dashboard />
    </DashboardProvider>
  );
}
