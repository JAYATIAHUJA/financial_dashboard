import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';

type Role = 'viewer' | 'admin';
type TransactionType = 'income' | 'expense';
export type Transaction = {
  id: string;
  date: string;
  amount: number;
  category: string;
  type: TransactionType;
  description: string;
};

export type SavingsGoal = {
  id: string;
  name: string;
  target: number;
  current: number;
};

// Seed data simulating 2 months of activity
const initialTransactions: Transaction[] = [
  // Current month (May)
  { id: '1', date: '2024-05-15', amount: 8200, category: 'Salary', type: 'income', description: 'Monthly Salary' },
  { id: '2', date: '2024-05-14', amount: 120, category: 'Software', type: 'expense', description: 'Cloud Hosting' },
  { id: '3', date: '2024-05-12', amount: 850, category: 'Groceries', type: 'expense', description: 'Whole Foods' },
  { id: '4', date: '2024-05-10', amount: 1500, category: 'Rent', type: 'expense', description: 'Apartment Rent' },
  { id: '5', date: '2024-05-08', amount: 340, category: 'Investments', type: 'income', description: 'Dividend Yield' },
  { id: '6', date: '2024-05-05', amount: 60, category: 'Transport', type: 'expense', description: 'Uber Rides' },
  { id: '7', date: '2024-05-02', amount: 200, category: 'Entertainment', type: 'expense', description: 'Concert Tickets' },
  // Previous month (April)
  { id: '8', date: '2024-04-15', amount: 8200, category: 'Salary', type: 'income', description: 'Monthly Salary' },
  { id: '9', date: '2024-04-10', amount: 1500, category: 'Rent', type: 'expense', description: 'Apartment Rent' },
  { id: '10', date: '2024-04-05', amount: 650, category: 'Groceries', type: 'expense', description: 'Whole Foods' },
  { id: '11', date: '2024-04-03', amount: 180, category: 'Software', type: 'expense', description: 'Annual Subscriptions' },
];

const LOCAL_STORAGE_KEY = 'findash_transactions';

type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

interface DashboardContextType {
  loading: boolean;
  role: Role;
  setRole: (r: Role) => void;
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  categoryFilter: string;
  setCategoryFilter: (c: string) => void;
  typeFilter: 'All' | 'income' | 'expense';
  setTypeFilter: (t: 'All' | 'income' | 'expense') => void;
  timeFilter: 'all' | '7days' | '30days';
  setTimeFilter: (t: 'all' | '7days' | '30days') => void;
  sortOption: SortOption;
  setSortOption: (s: SortOption) => void;
  darkMode: boolean;
  setDarkMode: (d: boolean) => void;
  savingsGoals: SavingsGoal[];
  setSavingsGoals: (g: SavingsGoal[]) => void;
  categories: string[];
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
  expensesByCategory: { name: string; value: number }[];
  incomeVsExpenseData: { month: string; income: number; expense: number }[];
  highestExpenseCategory: { name: string; value: number } | null;
  trendData: { date: string; balance: number }[];
  monthlyComparison: { changePct: number, message: string, currentMonthExpenses: number };
  monthlyBudget: number;
  setMonthlyBudget: (b: number) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, tx: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role>('viewer');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'income' | 'expense'>('All');
  const [timeFilter, setTimeFilter] = useState<'all' | '7days' | '30days'>('all');
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([
    { id: '1', name: 'Emergency Fund', current: 150000, target: 500000 },
    { id: '2', name: 'New Laptop', current: 30000, target: 120000 }
  ]);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const [monthlyBudget, setMonthlyBudget] = useState<number>(() => {
    const saved = localStorage.getItem('findash_budget');
    return saved ? parseFloat(saved) : 50000;
  });

  useEffect(() => {
    localStorage.setItem('findash_budget', monthlyBudget.toString());
  }, [monthlyBudget]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    setTimeout(() => {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setTransactions(JSON.parse(saved));
      } else {
        setTransactions(initialTransactions);
      }
      setLoading(false);
    }, 800);
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(transactions));
    }
  }, [transactions, loading]);

  const filteredTransactions = useMemo(() => {
    let result = transactions.filter(t => {
      const matchSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = categoryFilter === 'All' || t.category === categoryFilter;
      const matchType = typeFilter === 'All' || t.type === typeFilter;
      
      const txDate = new Date(t.date).getTime();
      const now = new Date('2024-05-15').getTime(); // Using mock "now" to match mock data dates
      const daysDiff = (now - txDate) / (1000 * 3600 * 24);
      let matchTime = true;
      if (timeFilter === '7days') matchTime = daysDiff <= 7 && daysDiff >= 0;
      if (timeFilter === '30days') matchTime = daysDiff <= 30 && daysDiff >= 0;
      
      return matchSearch && matchCategory && matchType && matchTime;
    });

    result.sort((a, b) => {
      if (sortOption === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortOption === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortOption === 'amount-desc') return b.amount - a.amount;
      if (sortOption === 'amount-asc') return a.amount - b.amount;
      return 0;
    });

    return result;
  }, [transactions, searchQuery, categoryFilter, typeFilter, timeFilter, sortOption]);

  const categories = useMemo(() => ['All', ...Array.from(new Set(transactions.map(t => t.category)))], [transactions]);
  const totalIncome = useMemo(() => transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0), [transactions]);
  const totalExpense = useMemo(() => transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0), [transactions]);
  const totalBalance = totalIncome - totalExpense;

  const expensesByCategory = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const map = new Map<string, number>();
    expenses.forEach(t => {
      map.set(t.category, (map.get(t.category) || 0) + t.amount);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const highestExpenseCategory = expensesByCategory.length > 0 ? expensesByCategory[0] : null;

  const incomeVsExpenseData = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();
    
    // Group transactions by month-year string (e.g., '2024-05')
    transactions.forEach(t => {
      const monthYear = t.date.substring(0, 7);
      if (!map.has(monthYear)) {
        map.set(monthYear, { income: 0, expense: 0 });
      }
      const data = map.get(monthYear)!;
      if (t.type === 'income') data.income += t.amount;
      else data.expense += t.amount;
    });

    const result = Array.from(map.entries()).map(([month, data]) => ({
      month,
      income: data.income,
      expense: data.expense
    }));
    
    // Sort array chronologically by month
    return result.sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions]);

  const monthlyComparison = useMemo(() => {
    // Fallback logic for mock dates hardcoded above to ensure demo works
    const mostRecentDate = transactions.length > 0 ? new Date(Math.max(...transactions.map(t => new Date(t.date).getTime()))) : new Date();
    const effectiveMonth = mostRecentDate.getMonth();
    const effectiveYear = mostRecentDate.getFullYear();

    const currMonthExpenses = transactions.filter(t => {
      const d = new Date(t.date);
      return t.type === 'expense' && d.getMonth() === effectiveMonth && d.getFullYear() === effectiveYear;
    }).reduce((acc, t) => acc + t.amount, 0);

    let prevMonth = effectiveMonth - 1;
    let prevYear = effectiveYear;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear--;
    }

    const prevMonthExpenses = transactions.filter(t => {
      const d = new Date(t.date);
      return t.type === 'expense' && d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    }).reduce((acc, t) => acc + t.amount, 0);

    if (prevMonthExpenses === 0) return { changePct: 0, message: "No data for previous month.", currentMonthExpenses: currMonthExpenses };
    
    const diff = currMonthExpenses - prevMonthExpenses;
    const changePct = (diff / prevMonthExpenses) * 100;
    const message = diff > 0 
      ? `Spending increased by ${Math.abs(changePct).toFixed(1)}% this month.`
      : `Spending decreased by ${Math.abs(changePct).toFixed(1)}% this month.`;

    return { changePct, message, currentMonthExpenses: currMonthExpenses };
  }, [transactions]);

  const trendData = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let currentBalance = 0;
    const dailyBalances: Record<string, number> = {};
    const datesInOrder: string[] = [];
    
    sorted.forEach(t => {
      currentBalance += t.type === 'income' ? t.amount : -t.amount;
      const dateKey = t.date.substring(5);
      if (!(dateKey in dailyBalances)) {
        datesInOrder.push(dateKey);
      }
      dailyBalances[dateKey] = currentBalance;
    });

    return datesInOrder.map(date => ({ date, balance: dailyBalances[date] }));
  }, [transactions]);

  const addTransaction = (tx: Omit<Transaction, 'id'>) => {
    if (role !== 'admin') return;
    const newTx: Transaction = {
      ...tx,
      id: Math.random().toString(36).substring(7)
    };
    setTransactions([newTx, ...transactions]);
  };

  const updateTransaction = (id: string, updatedTx: Omit<Transaction, 'id'>) => {
    if (role !== 'admin') return;
    setTransactions(transactions.map(t => t.id === id ? { ...updatedTx, id } : t));
  };

  const deleteTransaction = (id: string) => {
    if (role !== 'admin') return;
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const value = {
    loading, role, setRole, transactions, filteredTransactions,
    searchQuery, setSearchQuery, categoryFilter, setCategoryFilter,
    typeFilter, setTypeFilter, timeFilter, setTimeFilter, sortOption, setSortOption,
    darkMode, setDarkMode, savingsGoals, setSavingsGoals, categories,
    totalIncome, totalExpense, totalBalance, expensesByCategory,
    highestExpenseCategory, trendData, monthlyComparison,
    incomeVsExpenseData,
    monthlyBudget, setMonthlyBudget,
    addTransaction, updateTransaction, deleteTransaction
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
