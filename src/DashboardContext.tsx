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
  sortOption: SortOption;
  setSortOption: (s: SortOption) => void;
  darkMode: boolean;
  setDarkMode: (d: boolean) => void;
  categories: string[];
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
  expensesByCategory: { name: string; value: number }[];
  highestExpenseCategory: { name: string; value: number } | null;
  trendData: { date: string; balance: number }[];
  monthlyComparison: { changePct: number, message: string };
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
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });

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
      
      return matchSearch && matchCategory && matchType;
    });

    result.sort((a, b) => {
      if (sortOption === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortOption === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortOption === 'amount-desc') return b.amount - a.amount;
      if (sortOption === 'amount-asc') return a.amount - b.amount;
      return 0;
    });

    return result;
  }, [transactions, searchQuery, categoryFilter, typeFilter, sortOption]);

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

    if (prevMonthExpenses === 0) return { changePct: 0, message: "No data for previous month." };
    
    const diff = currMonthExpenses - prevMonthExpenses;
    const changePct = (diff / prevMonthExpenses) * 100;
    const message = diff > 0 
      ? `Spending increased by ${Math.abs(changePct).toFixed(1)}% this month.`
      : `Spending decreased by ${Math.abs(changePct).toFixed(1)}% this month.`;

    return { changePct, message };
  }, [transactions]);

  const trendData = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let currentBalance = 0;
    return sorted.map(t => {
      currentBalance += t.type === 'income' ? t.amount : -t.amount;
      return { date: t.date.substring(5), balance: currentBalance }; 
    });
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
    typeFilter, setTypeFilter, sortOption, setSortOption,
    darkMode, setDarkMode, categories,
    totalIncome, totalExpense, totalBalance, expensesByCategory,
    highestExpenseCategory, trendData, monthlyComparison,
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
