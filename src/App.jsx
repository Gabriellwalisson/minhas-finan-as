import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, ArrowUpCircle, ArrowDownCircle, TrendingUp, Trash2, Edit,
  Wallet, Calendar, ChevronLeft, ChevronRight, PieChart, Lock, LogOut,
  Sparkles, X, Loader2, BarChart2, RefreshCw, Copy, CheckCircle2,
  Download, User, Mail, UserPlus, LogIn, Calculator as CalculatorIcon,
  Search, FileSpreadsheet, CheckCircle, Circle, AlertCircle, CreditCard,
  Settings2, Printer, Settings, ChevronDown, Info
} from 'lucide-react';

const generateSafeId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 10);

const evaluateMath = (expr) => {
  try {
    let tokens = expr.match(/(?:\d+\.?\d*)|[+\-*/]/g);
    if (!tokens) return '';
    let temp = [];
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i] === '*' || tokens[i] === '/') {
        let op = tokens[i];
        let next = parseFloat(tokens[++i]);
        let prev = parseFloat(temp.pop());
        temp.push(op === '*' ? prev * next : prev / next);
      } else {
        temp.push(tokens[i]);
      }
    }
    let res = parseFloat(temp[0] || 0);
    for (let i = 1; i < temp.length; i += 2) {
      let op = temp[i];
      let next = parseFloat(temp[i+1]);
      if (op === '+') res += next;
      if (op === '-') res -= next;
    }
    return Number.isFinite(res) ? (Number.isInteger(res) ? String(res) : String(res.toFixed(2))) : 'Erro';
  } catch (e) {
    return 'Erro';
  }
};

const defaultCategories = {
  income: ['Salário', 'Acerto', 'Rendimento', 'Outros'],
  expense: ['Click', 'MP', 'Digio', 'Inter', 'Neon', 'Ponto', 'Contas Fixas', 'Outros'],
  investment: ['Reserva de Emergência', 'Ações', 'Fundos', 'CDB/Tesouro']
};

const defaultCards = [
  { id: 'MP', name: 'Mercado Pago (MP)', limit: 2400, dueDay: 23, color: 'bg-sky-500' },
  { id: 'Digio', name: 'Digio', limit: 600, dueDay: 15, color: 'bg-blue-800' },
  { id: 'Ponto', name: 'Ponto Frio', limit: 3000, dueDay: 15, color: 'bg-orange-500' },
  { id: 'Click', name: 'Itaú Click', limit: 2500, dueDay: 26, color: 'bg-amber-500' },
  { id: 'Inter', name: 'Banco Inter', limit: 1500, dueDay: 20, color: 'bg-orange-400' },
  { id: 'Neon', name: 'Banco Neon', limit: 1000, dueDay: 1, color: 'bg-teal-400' },
];

const colorOptions = [
  'bg-slate-800', 'bg-red-500', 'bg-orange-500', 'bg-amber-500', 
  'bg-emerald-500', 'bg-teal-400', 'bg-sky-500', 'bg-blue-600', 
  'bg-indigo-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-rose-500'
];

const getStoredUsers = () => {
  const stored = localStorage.getItem('finances_users');
  if (stored) {
    let users = JSON.parse(stored);
    // Garante que o utilizador 'gabriell' existe sempre como principal
    if (!users.find(u => u.email.toLowerCase() === 'gabriell')) {
      const defaultUser = { id: 'admin_gabriell', email: 'gabriell', password: 'f8g4j10', name: 'Gabriell' };
      users.push(defaultUser);
      localStorage.setItem('finances_users', JSON.stringify(users));
    }
    return users;
  }
  // Se for o primeiro acesso à aplicação inteira, cria o utilizador 'gabriell'
  const defaultUser = { id: 'admin_gabriell', email: 'gabriell', password: 'f8g4j10', name: 'Gabriell' };
  localStorage.setItem('finances_users', JSON.stringify([defaultUser]));
  return [defaultUser];
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('finances_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [authMode, setAuthMode] = useState('login');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState(defaultCategories);
  const [cards, setCards] = useState(defaultCards);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Click');
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState(2);
  const [isPaid, setIsPaid] = useState(true);

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');

  const [showAiModal, setShowAiModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState('');
  const [showChartModal, setShowChartModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncTab, setSyncTab] = useState('export'); 
  const [importText, setImportText] = useState('');
  const [copied, setCopied] = useState(false);

  const [showCalculator, setShowCalculator] = useState(false);
  const [calcInput, setCalcInput] = useState('');

  const [showCardsModal, setShowCardsModal] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [editingCardId, setEditingCardId] = useState(null);
  const [cardForm, setCardForm] = useState({ name: '', limit: '', dueDay: '5', color: 'bg-indigo-500' });

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [userSettings, setUserSettings] = useState({ geminiApiKey: '', displayName: '' });

  const [uiModal, setUiModal] = useState({ type: null, title: '', message: '', onConfirm: null, inputValue: '' });
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const showAlert = (title, message) => setUiModal({ type: 'alert', title, message, onConfirm: null, inputValue: '' });
  const showConfirm = (title, message, onConfirm) => setUiModal({ type: 'confirm', title, message, onConfirm, inputValue: '' });
  const showPrompt = (title, message, onConfirm) => setUiModal({ type: 'prompt', title, message, onConfirm, inputValue: '' });
  const closeUiModal = () => setUiModal({ type: null, title: '', message: '', onConfirm: null, inputValue: '' });

  useEffect(() => {
    if (currentUser) {
      setUserSettings({
        geminiApiKey: localStorage.getItem(`finances_gemini_key_${currentUser.id}`) || '',
        displayName: currentUser.name || ''
      });

      const savedCats = localStorage.getItem(`finances_categories_${currentUser.id}`);
      if (savedCats) { setCategories(JSON.parse(savedCats)); } 
      else { setCategories(defaultCategories); localStorage.setItem(`finances_categories_${currentUser.id}`, JSON.stringify(defaultCategories)); }

      const savedCards = localStorage.getItem(`finances_cards_${currentUser.id}`);
      if (savedCards) { setCards(JSON.parse(savedCards)); } 
      else { setCards(defaultCards); localStorage.setItem(`finances_cards_${currentUser.id}`, JSON.stringify(defaultCards)); }

      const userKey = `finances_data_user_${currentUser.id}`;
      const savedData = localStorage.getItem(userKey);
      
      if (savedData) {
        setTransactions(JSON.parse(savedData));
      } else {
        // Apenas o utilizador 'gabriell' recebe os dados pré-configurados
        if (currentUser.email.toLowerCase() === 'gabriell') {
          const initialData = [];
          const baseDate = new Date();
          let currentProcessDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 5);
          const limitSalario = new Date(2027, 11, 5); 
          const limitAcerto = new Date(2027, 1, 5);  

          while (currentProcessDate <= limitSalario) {
            let formattedDate = `${currentProcessDate.getFullYear()}-${String(currentProcessDate.getMonth() + 1).padStart(2, '0')}-${String(currentProcessDate.getDate()).padStart(2, '0')}`;
            initialData.push({ id: generateSafeId(), description: 'Salário', amount: 4500, type: 'income', date: formattedDate, category: 'Salário', status: 'paid' });
            if (currentProcessDate <= limitAcerto) {
              initialData.push({ id: generateSafeId(), description: 'Acerto', amount: 900, type: 'income', date: formattedDate, category: 'Acerto', status: 'paid' });
            }
            currentProcessDate.setMonth(currentProcessDate.getMonth() + 1);
          }
          setTransactions(initialData);
          localStorage.setItem(userKey, JSON.stringify(initialData));
        } else {
          // Outros utilizadores começam completamente zerados
          setTransactions([]);
          localStorage.setItem(userKey, JSON.stringify([]));
        }
      }
      setIsDataLoaded(true);
    } else {
      setIsDataLoaded(false); 
      setTransactions([]);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && isDataLoaded) {
      localStorage.setItem(`finances_data_user_${currentUser.id}`, JSON.stringify(transactions));
    }
  }, [transactions, currentUser, isDataLoaded]);

  useEffect(() => {
    if (!editingId && categories[type] && categories[type].length > 0) {
      setCategory(categories[type][0]);
    }
  }, [type, editingId, categories]);

  const handleAuth = (e) => {
    e.preventDefault(); 
    setAuthError('');
    if (!emailInput || !passwordInput) { setAuthError('Por favor, preencha todos os campos.'); return; }
    
    let users = getStoredUsers();
    if (authMode === 'register') {
      if (users.find(u => u.email.toLowerCase() === emailInput.toLowerCase())) { setAuthError('Esta conta já existe. Tente fazer o login.'); return; }
      const newUser = { id: generateSafeId(), email: emailInput, password: passwordInput, name: emailInput.split('@')[0] };
      users.push(newUser); 
      localStorage.setItem('finances_users', JSON.stringify(users));
      
      // Se estava a migrar de uma versão muito antiga (opcional)
      if (users.length === 2 && users[0].email.toLowerCase() === 'gabriell') {
        const legacyData = localStorage.getItem('finances_data_v3');
        if (legacyData) localStorage.setItem(`finances_data_user_${newUser.id}`, legacyData);
      }
      setCurrentUser(newUser); localStorage.setItem('finances_current_user', JSON.stringify(newUser));
    } else {
      const user = users.find(u => u.email.toLowerCase() === emailInput.toLowerCase() && u.password === passwordInput);
      if (user) { setCurrentUser(user); localStorage.setItem('finances_current_user', JSON.stringify(user)); } 
      else { setAuthError('E-mail ou palavra-passe incorretos.'); }
    }
    setEmailInput(''); setPasswordInput('');
  };

  const handleLogout = () => { setCurrentUser(null); localStorage.removeItem('finances_current_user'); };

  const handleSaveSettings = () => {
    if (currentUser) {
      localStorage.setItem(`finances_gemini_key_${currentUser.id}`, userSettings.geminiApiKey);
      const users = JSON.parse(localStorage.getItem('finances_users') || '[]');
      const updatedUsers = users.map(u => u.id === currentUser.id ? { ...u, name: userSettings.displayName } : u);
      localStorage.setItem('finances_users', JSON.stringify(updatedUsers));
      
      const updatedUser = { ...currentUser, name: userSettings.displayName };
      setCurrentUser(updatedUser);
      localStorage.setItem('finances_current_user', JSON.stringify(updatedUser));
      setShowSettingsModal(false);
    }
  };

  const handleAddCategory = (e) => {
    if (e) e.preventDefault();
    const typeName = type === 'income' ? 'Entrada' : type === 'expense' ? 'Gasto' : 'Investimento';
    showPrompt('Nova Categoria', `Qual o nome da nova categoria de ${typeName}?`, (newCat) => {
      if (newCat && newCat.trim()) {
        const trimmed = newCat.trim();
        if (!categories[type].includes(trimmed)) {
          const updated = { ...categories, [type]: [...categories[type], trimmed] };
          setCategories(updated); setCategory(trimmed);
          if (currentUser) localStorage.setItem(`finances_categories_${currentUser.id}`, JSON.stringify(updated));
        } else { setCategory(trimmed); }
      }
    });
  };

  const openNewCardForm = () => { setEditingCardId(null); setCardForm({ name: '', limit: '', dueDay: '5', color: colorOptions[0] }); setShowCardForm(true); };
  const openEditCardForm = (card) => { setEditingCardId(card.id); setCardForm({ name: card.name, limit: card.limit.toString(), dueDay: card.dueDay.toString(), color: card.color }); setShowCardForm(true); };

  const handleSaveCard = (e) => {
    e.preventDefault();
    if (!cardForm.name || !cardForm.limit || !cardForm.dueDay) return;
    const newId = editingCardId || cardForm.name.trim();
    const updatedCard = { id: newId, name: cardForm.name.trim(), limit: parseFloat(cardForm.limit), dueDay: parseInt(cardForm.dueDay), color: cardForm.color };
    let newCards = editingCardId ? cards.map(c => c.id === editingCardId ? updatedCard : c) : [...cards, updatedCard];
    setCards(newCards);
    if (currentUser) localStorage.setItem(`finances_cards_${currentUser.id}`, JSON.stringify(newCards));

    if (!editingCardId && !categories.expense.includes(updatedCard.id)) {
      const updatedCats = { ...categories, expense: [...categories.expense, updatedCard.id] };
      setCategories(updatedCats);
      if (currentUser) localStorage.setItem(`finances_categories_${currentUser.id}`, JSON.stringify(updatedCats));
    }
    setShowCardForm(false);
  };

  const handleDeleteCard = (id) => {
    showConfirm('Excluir Cartão', 'Tem a certeza que deseja excluir este cartão? As transações registadas nele serão mantidas no extrato.', () => {
      const newCards = cards.filter(c => c.id !== id);
      setCards(newCards);
      if (currentUser) localStorage.setItem(`finances_cards_${currentUser.id}`, JSON.stringify(newCards));
    });
  };

  const handleSaveTransaction = (e) => {
    e.preventDefault();
    if (!description || !amount || isNaN(amount)) return;
    const numAmount = parseFloat(amount);
    const itemStatus = isPaid ? 'paid' : 'pending'; 

    if (editingId) {
      setTransactions(transactions.map(t => t.id === editingId ? { ...t, description, amount: numAmount, type, date, category, status: itemStatus } : t));
    } else {
      if ((type === 'expense' || type === 'income') && isInstallment && installmentsCount > 1) {
        const installmentAmount = numAmount / installmentsCount;
        const newTransactions = [];
        const [year, month, day] = date.split('-');
        let startDate = new Date(year, month - 1, day);

        for (let i = 0; i < installmentsCount; i++) {
          const currentDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, startDate.getDate());
          if (currentDate.getDate() !== parseInt(day)) currentDate.setDate(0); 
          const formattedDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
          newTransactions.push({
            id: generateSafeId(), description: `${description} (${i + 1}/${installmentsCount})`, amount: installmentAmount, type, date: formattedDate, category, status: i > 0 ? 'pending' : itemStatus
          });
        }
        setTransactions([...transactions, ...newTransactions]);
      } else {
        setTransactions([...transactions, { id: generateSafeId(), description, amount: numAmount, type, date, category, status: itemStatus }]);
      }
    }
    resetForm();
  };

  const resetForm = () => { setEditingId(null); setDescription(''); setAmount(''); setIsInstallment(false); setInstallmentsCount(2); setIsPaid(true); };
  const handleEdit = (t) => { setEditingId(t.id); setDescription(t.description); setAmount(t.amount.toString()); setType(t.type); setDate(t.date); setCategory(t.category); setIsPaid(t.status !== 'pending'); setIsInstallment(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleDelete = (id) => { 
    showConfirm('Apagar Registo', 'Deseja mesmo apagar este registo financeiro do seu extrato?', () => {
      setTransactions(prev => prev.filter(t => t.id !== id)); 
      if(editingId === id) resetForm(); 
    });
  };
  const toggleStatus = (id) => { setTransactions(transactions.map(t => t.id === id ? { ...t, status: (t.status || 'paid') === 'paid' ? 'pending' : 'paid' } : t)); };

  const prevMonth = () => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); } else { setCurrentMonth(currentMonth - 1); } };
  const nextMonth = () => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); } else { setCurrentMonth(currentMonth + 1); } };
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const [year, month] = t.date.split('-');
      const isSameMonth = parseInt(year) === currentYear && parseInt(month) === currentMonth + 1;
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase());
      return isSameMonth && matchesSearch;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, currentMonth, currentYear, searchTerm]);

  const { income, expense, investment, realBalance } = useMemo(() => {
    return filteredTransactions.reduce((acc, curr) => {
      const isPaidStatus = (curr.status !== 'pending');
      if (curr.type === 'income') { acc.income += curr.amount; if (isPaidStatus) acc.realBalance += curr.amount; }
      if (curr.type === 'expense') { acc.expense += curr.amount; if (isPaidStatus) acc.realBalance -= curr.amount; }
      if (curr.type === 'investment') { acc.investment += curr.amount; if (isPaidStatus) acc.realBalance -= curr.amount; }
      return acc;
    }, { income: 0, expense: 0, investment: 0, realBalance: 0 });
  }, [filteredTransactions]);

  const expectedBalance = income - expense - investment;
  const budgetPercentage = income > 0 ? Math.min((expense / income) * 100, 100) : (expense > 0 ? 100 : 0);

  const accumulatedInvestment = useMemo(() => {
    let total = 0;
    const currentViewDate = new Date(currentYear, currentMonth, 1);
    transactions.forEach(t => {
      if (t.type === 'investment' && t.status !== 'pending') {
        const [y, m] = t.date.split('-');
        const txDate = new Date(parseInt(y), parseInt(m) - 1, 1);
        if (txDate <= currentViewDate) {
          const monthsElapsed = (currentYear - txDate.getFullYear()) * 12 + (currentMonth - txDate.getMonth());
          total += t.amount * Math.pow(1.008, monthsElapsed);
        }
      }
    });
    return total;
  }, [transactions, currentMonth, currentYear]);

  const chartData = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    const totals = {};
    expenses.forEach(t => { totals[t.category] = (totals[t.category] || 0) + t.amount; });

    const colors = ['#f43f5e', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#64748b', '#ec4899', '#14b8a6', '#0ea5e9', '#d946ef'];
    let currentAngle = 0;
    const data = [];
    Object.keys(totals).sort((a,b) => totals[b] - totals[a]).forEach((cat, index) => {
      const percentage = (totals[cat] / expense) * 100;
      const startAngle = currentAngle;
      currentAngle += percentage;
      data.push({ category: cat, amount: totals[cat], percentage, color: colors[index % colors.length], startAngle, endAngle: currentAngle });
    });
    return data;
  }, [filteredTransactions, expense]);

  const conicGradientString = chartData.map(d => `${d.color} ${d.startAngle}% ${d.endAngle}%`).join(', ');
  const formatCurrency = (value) => { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value); };

  const handleCalcClickWrapper = (val) => {
    if (val === 'C') setCalcInput('');
    else if (val === '=') setCalcInput(evaluateMath(calcInput));
    else setCalcInput(prev => prev === 'Erro' ? val : prev + val);
  };

  // ----------------------------------------------------------------------
  // SISTEMA DE EXPORTAÇÃO EXCEL (XLS DINÂMICO) E PDF
  // ----------------------------------------------------------------------
  const handleExportCSV = () => {
    const monthKeysSet = new Set();
    transactions.forEach(t => monthKeysSet.add(t.date.substring(0, 7)));
    const monthKeys = Array.from(monthKeysSet).sort();
    
    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8" /></head><body>
    <table border="1" style="font-family: Arial, sans-serif; font-size: 13px; text-align: center; border-collapse: collapse;">`;

    html += `<tr><th style="background-color: #1e293b; color: #ffffff; padding: 10px;">Banco</th>`;
    cards.forEach(c => html += `<th style="background-color: #4f46e5; color: #ffffff; padding: 10px;">${c.id}</th>`);
    html += `<th style="background-color: #1e293b; color: #ffffff; padding: 10px;">Total</th></tr>`;

    html += `<tr><td style="background-color: #f1f5f9; font-weight: bold; text-align: left; padding: 5px;">Sobra / Utilizado</td>`;
    let totalCardsUsed = 0;
    cards.forEach(c => {
      const used = transactions.filter(t => t.type === 'expense' && t.category === c.id).reduce((sum, t) => sum + t.amount, 0);
      totalCardsUsed += used;
      html += `<td style="color: #e11d48; font-weight: bold;">${used.toFixed(2)}</td>`;
    });
    html += `<td style="color: #e11d48; font-weight: bold;">${totalCardsUsed.toFixed(2)}</td></tr>`;

    html += `<tr><td style="background-color: #f1f5f9; font-weight: bold; text-align: left; padding: 5px;">Limite</td>`;
    let totalLimit = 0;
    cards.forEach(c => { totalLimit += c.limit; html += `<td>${c.limit.toFixed(2)}</td>`; });
    html += `<td>${totalLimit.toFixed(2)}</td></tr>`;

    html += `<tr><td style="background-color: #f1f5f9; font-weight: bold; text-align: left; padding: 5px;">Data Vencimento</td>`;
    cards.forEach(c => html += `<td>dia ${c.dueDay}</td>`);
    html += `<td></td></tr>`;

    html += `<tr><td colspan="${cards.length + 2}" style="border: none;"></td></tr>`;
    html += `<tr><td colspan="${cards.length + 2}" style="border: none;"></td></tr>`;

    html += `<tr><th style="background-color: #1e293b; color: #ffffff; padding: 10px; text-align: left;">Cartões / Categorias</th>`;
    monthKeys.forEach(m => html += `<th style="background-color: #3b82f6; color: #ffffff; padding: 10px;">${m.split('-').reverse().join('/')}</th>`);
    html += `<th style="background-color: #1e293b; color: #ffffff; padding: 10px;">Total Histórico</th></tr>`;

    let incomeTotalGlobal = 0;
    const incomeMonths = new Array(monthKeys.length).fill(0);
    categories.income.forEach(cat => {
      let rowTotal = 0;
      let rowHtml = `<tr><td style="font-weight: bold; background-color: #d1fae5; color: #065f46; text-align: left; padding: 5px;">${cat}</td>`;
      let hasValue = false;
      monthKeys.forEach((m, i) => {
        const val = transactions.filter(t => t.category === cat && t.type === 'income' && t.date.startsWith(m)).reduce((s, t) => s + t.amount, 0);
        rowTotal += val; incomeMonths[i] += val; if (val > 0) hasValue = true;
        rowHtml += `<td style="background-color: #ecfdf5; color: #059669;">${val > 0 ? val.toFixed(2) : ''}</td>`;
      });
      incomeTotalGlobal += rowTotal;
      rowHtml += `<td style="font-weight: bold; background-color: #d1fae5; color: #065f46;">${rowTotal.toFixed(2)}</td></tr>`;
      if (hasValue) html += rowHtml; 
    });

    html += `<tr><th style="background-color: #059669; color: #fff; text-align: left; padding: 5px;">TOTAL ENTRADAS</th>`;
    incomeMonths.forEach(val => html += `<th style="background-color: #059669; color: #fff;">${val.toFixed(2)}</th>`);
    html += `<th style="background-color: #059669; color: #fff;">${incomeTotalGlobal.toFixed(2)}</th></tr>`;

    let expenseTotalGlobal = 0;
    const expenseMonths = new Array(monthKeys.length).fill(0);
    categories.expense.forEach(cat => {
      let rowTotal = 0;
      let rowHtml = `<tr><td style="font-weight: bold; background-color: #ffe4e6; color: #9f1239; text-align: left; padding: 5px;">${cat}</td>`;
      let hasValue = false;
      monthKeys.forEach((m, i) => {
        const val = transactions.filter(t => t.category === cat && t.type === 'expense' && t.date.startsWith(m)).reduce((s, t) => s + t.amount, 0);
        rowTotal += val; expenseMonths[i] += val; if (val > 0) hasValue = true;
        rowHtml += `<td style="background-color: #fff1f2; color: #e11d48;">${val > 0 ? val.toFixed(2) : ''}</td>`;
      });
      expenseTotalGlobal += rowTotal;
      rowHtml += `<td style="font-weight: bold; background-color: #ffe4e6; color: #9f1239;">${rowTotal.toFixed(2)}</td></tr>`;
      if (hasValue) html += rowHtml;
    });

    html += `<tr><th style="background-color: #e11d48; color: #fff; text-align: left; padding: 5px;">TOTAL GASTOS</th>`;
    expenseMonths.forEach(val => html += `<th style="background-color: #e11d48; color: #fff;">${val.toFixed(2)}</th>`);
    html += `<th style="background-color: #e11d48; color: #fff;">${expenseTotalGlobal.toFixed(2)}</th></tr>`;

    let invTotalGlobal = 0;
    const invMonths = new Array(monthKeys.length).fill(0);
    categories.investment.forEach(cat => {
      let rowTotal = 0;
      let rowHtml = `<tr><td style="font-weight: bold; background-color: #e0e7ff; color: #3730a3; text-align: left; padding: 5px;">${cat}</td>`;
      let hasValue = false;
      monthKeys.forEach((m, i) => {
        const val = transactions.filter(t => t.category === cat && t.type === 'investment' && t.date.startsWith(m)).reduce((s, t) => s + t.amount, 0);
        rowTotal += val; invMonths[i] += val; if (val > 0) hasValue = true;
        rowHtml += `<td style="background-color: #eef2ff; color: #4f46e5;">${val > 0 ? val.toFixed(2) : ''}</td>`;
      });
      invTotalGlobal += rowTotal;
      rowHtml += `<td style="font-weight: bold; background-color: #e0e7ff; color: #3730a3;">${rowTotal.toFixed(2)}</td></tr>`;
      if (hasValue) html += rowHtml;
    });

    html += `<tr><th style="background-color: #4f46e5; color: #fff; text-align: left; padding: 5px;">TOTAL INVESTIMENTOS</th>`;
    invMonths.forEach(val => html += `<th style="background-color: #4f46e5; color: #fff;">${val.toFixed(2)}</th>`);
    html += `<th style="background-color: #4f46e5; color: #fff;">${invTotalGlobal.toFixed(2)}</th></tr>`;

    html += `<tr><th style="background-color: #0f172a; color: #fff; font-size: 14px; text-align: left; padding: 10px;">SOBRA / GUARDAR</th>`;
    monthKeys.forEach((m, i) => {
      const diff = incomeMonths[i] - expenseMonths[i] - invMonths[i];
      html += `<th style="background-color: #0f172a; color: ${diff >= 0 ? '#34d399' : '#f87171'}; font-size: 14px; padding: 10px;">${diff.toFixed(2)}</th>`;
    });
    
    const grandFinalDiff = incomeTotalGlobal - expenseTotalGlobal - invTotalGlobal;
    html += `<th style="background-color: #0f172a; color: ${grandFinalDiff >= 0 ? '#34d399' : '#f87171'}; font-size: 14px; padding: 10px;">${grandFinalDiff.toFixed(2)}</th></tr>`;

    html += `</table></body></html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Controle_Financeiro_${monthNames[currentMonth]}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      if (!window.html2pdf) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const element = document.createElement('div');
      element.innerHTML = `
        <div style="padding: 40px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; background: #fff;">
          <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px;">
            <h1 style="color: #312e81; font-size: 32px; margin: 0 0 10px 0;">Relatório Financeiro</h1>
            <h2 style="color: #64748b; font-size: 18px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">${monthNames[currentMonth]} ${currentYear}</h2>
          </div>
          
          <div style="display: flex; justify-content: space-between; gap: 20px; margin-bottom: 30px;">
            <div style="flex: 1; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; font-weight: bold; color: #64748b;">Saldo Real Atual</p>
              <p style="margin: 0; font-size: 24px; font-weight: 900; color: ${realBalance >= 0 ? '#059669' : '#e11d48'};">${formatCurrency(realBalance)}</p>
            </div>
            <div style="flex: 1; padding: 20px; background: #ecfdf5; border: 1px solid #d1fae5; border-radius: 12px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; font-weight: bold; color: #059669;">Total Entradas</p>
              <p style="margin: 0; font-size: 24px; font-weight: 900; color: #059669;">${formatCurrency(income)}</p>
            </div>
            <div style="flex: 1; padding: 20px; background: #fff1f2; border: 1px solid #ffe4e6; border-radius: 12px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; font-weight: bold; color: #e11d48;">Total Gastos</p>
              <p style="margin: 0; font-size: 24px; font-weight: 900; color: #e11d48;">${formatCurrency(expense)}</p>
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px;">
            <thead>
              <tr>
                <th style="padding: 12px 15px; text-align: left; background: #f1f5f9; border-bottom: 2px solid #cbd5e1; color: #475569; text-transform: uppercase; font-size: 11px;">Data</th>
                <th style="padding: 12px 15px; text-align: left; background: #f1f5f9; border-bottom: 2px solid #cbd5e1; color: #475569; text-transform: uppercase; font-size: 11px;">Descrição</th>
                <th style="padding: 12px 15px; text-align: left; background: #f1f5f9; border-bottom: 2px solid #cbd5e1; color: #475569; text-transform: uppercase; font-size: 11px;">Categoria</th>
                <th style="padding: 12px 15px; text-align: right; background: #f1f5f9; border-bottom: 2px solid #cbd5e1; color: #475569; text-transform: uppercase; font-size: 11px;">Valor</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTransactions.map((t, index) => `
                <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #64748b;">
                    ${t.date.split('-').reverse().join('/')}
                    ${t.status === 'pending' ? '<br><span style="font-size: 9px; color: #d97706; background: #fef3c7; padding: 2px 6px; border-radius: 4px; font-weight: bold; text-transform: uppercase;">Pendente</span>' : ''}
                  </td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; font-weight: 800; color: #0f172a;">${t.description}</td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0;">
                    <span style="background: #e2e8f0; color: #475569; padding: 4px 8px; border-radius: 6px; font-size: 10px; text-transform: uppercase; font-weight: bold;">${t.category}</span>
                  </td>
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 900; color: ${t.type === 'income' ? '#059669' : '#e11d48'}; font-size: 14px;">
                    ${t.type === 'income' ? '+' : '-'} ${formatCurrency(t.amount)}
                  </td>
                </tr>
              `).join('')}
              ${filteredTransactions.length === 0 ? '<tr><td colspan="4" style="text-align: center; padding: 30px; color: #94a3b8; font-weight: bold;">Nenhuma transação registada neste mês.</td></tr>' : ''}
            </tbody>
          </table>
          
          <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">
            Documento gerado pelo sistema Finanças Pro em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
          </div>
        </div>
      `;

      const opt = {
        margin:       0.4,
        filename:     `Relatorio_Financeiro_${monthNames[currentMonth]}_${currentYear}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
      };

      await window.html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      showAlert("Erro", "Não foi possível gerar o PDF. Verifique a sua ligação à internet e tente novamente.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleCopySync = () => { 
    const exportData = { version: 2, transactions, categories, cards };
    navigator.clipboard.writeText(JSON.stringify(exportData)); 
    setCopied(true); setTimeout(() => setCopied(false), 3000); 
  };
  
  const handleImportSync = () => {
    try { 
      const parsed = JSON.parse(importText); 
      if (Array.isArray(parsed)) { 
        setTransactions(parsed); setShowSyncModal(false); setImportText(''); showAlert('Sucesso', 'Transações antigas sincronizadas com sucesso!'); 
      } else if (parsed.version === 2) {
        if (parsed.transactions) setTransactions(parsed.transactions);
        if (parsed.categories) setCategories(parsed.categories);
        if (parsed.cards) setCards(parsed.cards);
        setShowSyncModal(false); setImportText(''); showAlert('Sucesso', 'Dados completos sincronizados com sucesso!');
      } else { showAlert('Erro', 'Código inválido ou não reconhecido.'); }
    } catch (e) { showAlert('Erro', 'Erro ao ler o código. Verifique se copiou o texto integralmente.'); }
  };

  const generateAiInsights = async () => {
    setIsAnalyzing(true); setAiInsight(''); setShowAiModal(true);
    
    const storedKey = currentUser ? localStorage.getItem(`finances_gemini_key_${currentUser.id}`) : "";
    const apiKey = storedKey || ""; 
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const txnsText = filteredTransactions.map(t => `${t.date} - ${t.description} - R$ ${t.amount} (${t.type} / ${t.status || 'paid'})`).join('\n');
    const prompt = `Analise o seguinte resumo e dê um conselho financeiro direto (máx 3 parágrafos curtos) em português. Entradas: R$ ${income}, Gastos: R$ ${expense}, Saldo Previsto: R$ ${expectedBalance}, Transações: ${txnsText || 'Nenhuma.'}`;
    
    try {
      let result; let success = false; let delay = 1000;
      for (let i = 0; i < 3; i++) {
        try {
          const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
          if (!response.ok) throw new Error('API Error');
          result = await response.json(); success = true; break;
        } catch (e) { await new Promise(r => setTimeout(r, delay)); delay *= 2; }
      }
      if (!success) setAiInsight('IA indisponível. Certifique-se de configurar a sua Chave API nas Configurações (⚙️).'); 
      else setAiInsight(result.candidates?.[0]?.content?.parts?.[0]?.text || "Erro na análise.");
    } catch (error) { setAiInsight('Erro ao consultar IA. Verifique a sua Chave API nas configurações.'); } finally { setIsAnalyzing(false); }
  };

  // ----------------------------------------------------------------------
  // ECRÃ DE LOGIN
  // ----------------------------------------------------------------------
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600 rounded-full mix-blend-screen filter blur-[120px] opacity-40 animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-purple-600 rounded-full mix-blend-screen filter blur-[120px] opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[500px] h-[500px] bg-sky-600 rounded-full mix-blend-screen filter blur-[120px] opacity-40 animate-blob animation-delay-4000"></div>

        <div className="bg-white/10 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-white/20 p-8 md:p-10 w-full max-w-md mx-4 relative z-10">
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-tr from-indigo-400 to-purple-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/30 transform -rotate-6 hover:rotate-0 transition-transform duration-500">
              <Wallet className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-center text-white mb-2 tracking-tight">Finanças Pro</h1>
          <p className="text-center text-indigo-200 mb-8 font-medium">{authMode === 'login' ? 'Aceda ao seu painel financeiro.' : 'Crie a sua conta gratuita.'}</p>
          
          <form onSubmit={handleAuth} className="space-y-5">
            {authError && <div className="bg-rose-500/20 text-rose-300 p-4 rounded-2xl text-sm font-medium text-center border border-rose-500/30 backdrop-blur-sm">{authError}</div>}
            
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-indigo-300 group-focus-within:text-white transition-colors" />
              </div>
              <input type="text" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="Nome ou E-mail" className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-white/10 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 rounded-2xl outline-none transition-all font-semibold text-white placeholder-slate-400" />
            </div>
            
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-indigo-300 group-focus-within:text-white transition-colors" />
              </div>
              <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="Palavra-passe" className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-white/10 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 rounded-2xl outline-none transition-all font-semibold text-white placeholder-slate-400" />
            </div>
            
            <button type="submit" className="w-full py-4 mt-4 bg-white text-indigo-900 hover:bg-indigo-50 font-black rounded-2xl shadow-xl shadow-white/10 transform transition-all active:scale-95 flex items-center justify-center gap-2 text-lg">
              {authMode === 'login' ? <LogIn className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
              {authMode === 'login' ? 'Entrar na Conta' : 'Criar Conta'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); setEmailInput(''); setPasswordInput(''); }} className="text-indigo-200 hover:text-white font-semibold text-sm transition-colors">
              {authMode === 'login' ? 'Não tem uma conta? Registe-se aqui.' : 'Já tem uma conta? Entre aqui.'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // ECRÃ PRINCIPAL (DASHBOARD)
  // ----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/70 via-slate-50 to-white text-slate-800 font-sans pb-20 md:pb-12">
      
      {/* CABEÇALHO PREMIUM GLASSMORPHISM */}
      <header className="bg-slate-900/95 backdrop-blur-xl border-b border-white/10 text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          
          <div className="flex justify-between w-full md:w-auto items-center">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/30">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-black tracking-tight">Finanças Pro</h1>
            </div>
            <div className="flex md:hidden items-center gap-2">
              <button onClick={() => setShowCalculator(true)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10"><CalculatorIcon className="w-5 h-5 text-indigo-300" /></button>
              <button onClick={() => setShowSettingsModal(true)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10"><Settings className="w-5 h-5 text-indigo-300" /></button>
            </div>
          </div>
          
          <div className="flex items-center gap-1 bg-black/20 border border-white/5 rounded-2xl p-1 w-full md:w-auto justify-between shadow-inner">
            <button onClick={prevMonth} className="p-2.5 hover:bg-white/10 rounded-xl transition-colors"><ChevronLeft className="w-5 h-5 text-indigo-300" /></button>
            <div className="flex items-center gap-2 font-bold text-lg px-4">
              <Calendar className="w-4 h-4 text-indigo-400 hidden md:block" />
              {monthNames[currentMonth]} {currentYear}
            </div>
            <button onClick={nextMonth} className="p-2.5 hover:bg-white/10 rounded-xl transition-colors"><ChevronRight className="w-5 h-5 text-indigo-300" /></button>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 text-indigo-200 text-sm font-bold mr-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/10">
              <User className="w-4 h-4" /> <span className="max-w-[120px] truncate">{currentUser?.name}</span>
            </div>
            <div className="flex bg-black/20 p-1 rounded-2xl border border-white/5 shadow-inner">
              <button onClick={() => setShowSettingsModal(true)} className="p-2.5 hover:bg-white/10 rounded-xl text-indigo-300 transition-colors" title="Configurações"><Settings className="w-5 h-5" /></button>
              <button onClick={() => setShowCalculator(true)} className="p-2.5 hover:bg-white/10 rounded-xl text-indigo-300 transition-colors" title="Calculadora"><CalculatorIcon className="w-5 h-5" /></button>
              <button onClick={() => setShowSyncModal(true)} className="p-2.5 hover:bg-white/10 rounded-xl text-indigo-300 transition-colors" title="Sincronizar Dados"><RefreshCw className="w-5 h-5" /></button>
              <button onClick={handleLogout} className="p-2.5 hover:bg-rose-500/20 rounded-xl text-rose-400 transition-colors" title="Sair da Conta"><LogOut className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 mb-8">
          
          <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 ring-1 ring-slate-900/5 flex flex-col col-span-2 md:col-span-1 relative overflow-hidden group hover:shadow-indigo-100/50 transition-all duration-300">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-indigo-100 to-transparent rounded-full opacity-60 group-hover:scale-110 transition-transform duration-700"></div>
            <div className="flex justify-between items-start z-10">
              <span className="text-slate-500 font-extrabold text-xs tracking-widest uppercase">Saldo Real</span>
              <span className="bg-slate-100 text-slate-400 text-[9px] px-2 py-1 rounded-lg font-black uppercase tracking-widest border border-slate-200">Mês Atual</span>
            </div>
            <span className={`text-3xl md:text-4xl font-black mt-2 z-10 tracking-tight ${realBalance >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
              {formatCurrency(realBalance)}
            </span>
            <div className="mt-auto pt-4 border-t border-slate-100/80 text-xs font-bold flex justify-between items-center z-10">
              <span className="text-slate-400 uppercase tracking-wider text-[10px]">Previsto</span>
              <span className={expectedBalance >= 0 ? 'text-slate-700' : 'text-rose-500'}>{formatCurrency(expectedBalance)}</span>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 ring-1 ring-slate-900/5 flex flex-col justify-between hover:shadow-emerald-100/50 transition-all duration-300">
            <div className="flex items-center gap-2 text-slate-500 font-extrabold text-xs uppercase tracking-widest">
              <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100"><ArrowUpCircle className="w-5 h-5 text-emerald-500" /></div> Entradas
            </div>
            <span className="text-2xl md:text-3xl font-black text-slate-800 mt-4 tracking-tight">{formatCurrency(income)}</span>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 ring-1 ring-slate-900/5 flex flex-col relative justify-between hover:shadow-rose-100/50 transition-all duration-300">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-slate-500 font-extrabold text-xs uppercase tracking-widest">
                <div className="p-2 bg-rose-50 rounded-xl border border-rose-100"><ArrowDownCircle className="w-5 h-5 text-rose-500" /></div> Gastos
              </div>
              {income > 0 && <span className="text-[9px] font-black text-rose-400 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100 uppercase">{budgetPercentage.toFixed(0)}% Usado</span>}
            </div>
            <span className="text-2xl md:text-3xl font-black text-slate-800 mt-4 tracking-tight">{formatCurrency(expense)}</span>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-5 overflow-hidden shadow-inner">
              <div className={`h-full rounded-full transition-all duration-1000 ${budgetPercentage > 85 ? 'bg-gradient-to-r from-rose-400 to-rose-500' : budgetPercentage > 60 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-emerald-400 to-emerald-500'}`} style={{ width: `${budgetPercentage}%` }}></div>
            </div>
          </div>

          <div className="bg-gradient-to-b from-indigo-50/80 to-white/80 backdrop-blur-md rounded-[2rem] p-6 shadow-xl shadow-indigo-100/60 ring-1 ring-indigo-100 flex flex-col col-span-2 md:col-span-1 justify-between">
            <div className="flex items-center gap-2 text-indigo-700 font-extrabold text-xs uppercase tracking-widest">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-indigo-50"><TrendingUp className="w-5 h-5 text-indigo-600" /></div> Investimentos
            </div>
            <div className="flex flex-col mt-4">
              <div className="flex justify-between items-end mb-3">
                <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest">Neste Mês</span>
                <span className="text-xl font-black text-indigo-900 tracking-tight">{formatCurrency(investment)}</span>
              </div>
              <div className="flex justify-between items-end pt-3 border-t border-indigo-100/50">
                <span className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-widest">Acumulado</span>
                <span className="text-xl md:text-2xl font-black text-indigo-600 tracking-tight">{formatCurrency(accumulatedInvestment)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className={`bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-slate-200/50 p-6 md:p-8 sticky top-28 transition-all duration-300 ${editingId ? 'ring-4 ring-amber-300/50 border-transparent' : 'ring-1 ring-slate-900/5'}`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-lg font-black tracking-tight flex items-center gap-3 ${editingId ? 'text-amber-600' : 'text-slate-800'}`}>
                  <div className={`p-2.5 rounded-xl shadow-sm ${editingId ? 'bg-amber-100' : 'bg-slate-900 text-white'}`}>
                    {editingId ? <Edit className="w-5 h-5 text-amber-600" /> : <Plus className="w-5 h-5" />}
                  </div>
                  {editingId ? 'Editar Registo' : 'Novo Registo'}
                </h2>
                {editingId && <button onClick={resetForm} className="text-[10px] uppercase tracking-widest font-black text-rose-500 bg-rose-50 px-3 py-2 rounded-xl hover:bg-rose-100 transition-colors border border-rose-100">Cancelar</button>}
              </div>
              
              <form onSubmit={handleSaveTransaction} className="space-y-5">
                <div className="flex gap-1.5 p-1.5 bg-slate-100 rounded-2xl shadow-inner border border-slate-200/50">
                  <button type="button" onClick={() => setType('income')} className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${type === 'income' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Entrada</button>
                  <button type="button" onClick={() => setType('expense')} className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${type === 'expense' ? 'bg-white text-rose-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Gasto</button>
                  <button type="button" onClick={() => setType('investment')} className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${type === 'investment' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Investir</button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Valor (R$)</label>
                    <input type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-800" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Data</label>
                    <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-700" />
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-indigo-200 hover:bg-slate-50 transition-colors group" onClick={() => setIsPaid(!isPaid)}>
                  <div className={`p-2 rounded-xl transition-colors shadow-sm ${isPaid ? 'text-white bg-emerald-500' : 'text-slate-400 bg-slate-100'}`}>
                    {isPaid ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-700">{isPaid ? 'Efetivado / Pago' : 'Agendado / Pendente'}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isPaid ? 'Afeta o Saldo Real' : 'Apenas Previsão'}</span>
                  </div>
                </div>

                {(type === 'expense' || type === 'income') && !editingId && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-inner">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={isInstallment} onChange={(e) => setIsInstallment(e.target.checked)} className="w-5 h-5 text-indigo-600 rounded-md focus:ring-indigo-500 border-slate-300" />
                      <span className="text-sm font-bold text-slate-700">{type === 'expense' ? 'Parcelar compra?' : 'Receber parcelado?'}</span>
                    </label>
                    {isInstallment && (
                      <div className="mt-4 pt-4 border-t border-slate-200 animate-in fade-in">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nº de Parcelas</label>
                        <input type="number" min="2" max="72" value={installmentsCount} onChange={(e) => setInstallmentsCount(parseInt(e.target.value) || 2)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm" />
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Descrição</label>
                  <input type="text" required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-800" placeholder="Ex: Conta de Luz..." />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Categoria / Cartão</label>
                  <div className="flex gap-2">
                    <div className="relative w-full">
                      <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-700 appearance-none">
                        {categories[type] && categories[type].map((cat, idx) => <option key={idx} value={cat}>{cat}</option>)}
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none"><ChevronDown className="w-4 h-4 text-slate-400"/></div>
                    </div>
                    <button type="button" onClick={handleAddCategory} className="px-4 py-3 bg-slate-900 hover:bg-black text-white rounded-2xl transition-colors shadow-md active:scale-95 flex items-center justify-center" title="Criar Nova Categoria">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <button type="submit" className={`w-full py-4 mt-2 text-white text-sm uppercase tracking-widest font-black rounded-2xl shadow-xl transform active:scale-95 transition-all ${editingId ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/30 hover:from-amber-600 hover:to-orange-600' : 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-indigo-600/30 hover:from-indigo-700 hover:to-purple-700'}`}>
                  {editingId ? 'Guardar Alterações' : 'Adicionar Registo'}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2 order-1 lg:order-2">
            
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1 group">
                <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Pesquisar transações..." className="w-full pl-14 pr-4 py-4 bg-white/80 backdrop-blur-md border-0 ring-1 ring-slate-900/5 rounded-[1.5rem] shadow-xl shadow-slate-200/30 outline-none focus:ring-2 focus:ring-indigo-400 transition-all font-bold text-slate-700" />
              </div>
              
              <div className="flex gap-2">
                <button onClick={handleGeneratePDF} disabled={isGeneratingPDF} className={`flex-1 md:flex-none flex items-center justify-center p-4 bg-white/80 backdrop-blur-md ring-1 ring-slate-900/5 text-slate-700 rounded-[1.5rem] hover:bg-white transition-all shadow-xl shadow-slate-200/30 active:scale-95 ${isGeneratingPDF ? 'opacity-70 cursor-not-allowed' : ''}`} title="Gerar Relatório PDF">
                  {isGeneratingPDF ? <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" /> : <Printer className="w-5 h-5 text-slate-600" />}
                </button>
                <button onClick={handleExportCSV} className="flex-1 md:flex-none flex items-center justify-center p-4 bg-white/80 backdrop-blur-md ring-1 ring-slate-900/5 text-emerald-600 rounded-[1.5rem] hover:bg-emerald-50 transition-all shadow-xl shadow-slate-200/30 active:scale-95" title="Exportar para Tabela Excel (XLS)">
                  <FileSpreadsheet className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-slate-200/50 ring-1 ring-slate-900/5 overflow-hidden">
              <div className="p-5 md:p-6 border-b border-slate-100/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/50">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-3">
                  <div className="p-2 bg-indigo-100/80 rounded-xl"><PieChart className="w-5 h-5 text-indigo-600" /></div>
                  Extrato do Mês
                </h2>
                
                <div className="flex w-full md:w-auto gap-2">
                  <button onClick={() => setShowCardsModal(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 hover:bg-black">
                    <CreditCard className="w-4 h-4" /> Cartões
                  </button>
                  {expense > 0 && (
                    <button onClick={() => setShowChartModal(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white ring-1 ring-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95">
                      <BarChart2 className="w-4 h-4 text-indigo-600" /> Gráfico
                    </button>
                  )}
                  <button onClick={generateAiInsights} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 active:scale-95 transition-all">
                    <Sparkles className="w-4 h-4" /> IA
                  </button>
                </div>
              </div>
              
              <div className="p-0 max-h-[600px] overflow-y-auto bg-white/40">
                {filteredTransactions.length === 0 ? (
                  <div className="p-16 text-center flex flex-col items-center">
                    <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mb-6 shadow-sm ring-1 ring-slate-100"><Wallet className="w-10 h-10 text-slate-300" /></div>
                    <p className="text-slate-500 font-black text-lg tracking-tight">{searchTerm ? 'Nenhum resultado encontrado.' : 'Tudo limpo por aqui.'}</p>
                    <p className="text-slate-400 text-sm mt-2 font-medium">Os seus registos do mês aparecerão nesta área.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100/80">
                    {filteredTransactions.map((t) => {
                      const isPending = t.status === 'pending';
                      return (
                        <li key={t.id} className={`p-5 md:p-6 hover:bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 ${editingId === t.id ? 'bg-amber-50/50' : ''} ${isPending ? 'opacity-80 border-l-4 border-l-amber-400' : 'border-l-4 border-l-transparent'}`}>
                          <div className="flex items-center gap-4 overflow-hidden w-full">
                            <button onClick={() => toggleStatus(t.id)} className={`p-3 rounded-2xl shrink-0 transition-transform active:scale-90 shadow-sm border ${isPending ? 'bg-white border-amber-200 text-amber-500 hover:bg-amber-50' : 'bg-white border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`} title={isPending ? "Confirmar Pagamento" : "Tornar Pendente"}>
                              {isPending ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                            </button>
                            
                            <div className="min-w-0 flex-1">
                              <p className={`font-black text-base md:text-lg truncate tracking-tight ${isPending ? 'text-slate-400' : 'text-slate-800'}`}>{t.description}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                <span className={`px-2 py-1 rounded-lg uppercase tracking-widest text-[9px] font-black border ${t.type === 'expense' ? 'bg-rose-50 border-rose-100 text-rose-600' : t.type === 'income' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>{t.category}</span>
                                <span className="text-[11px] font-bold text-slate-400">{t.date.split('-').reverse().join('/')}</span>
                                {isPending && <span className="text-[9px] font-black text-amber-500 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100 uppercase tracking-widest">Pendente</span>}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-row items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                            <span className={`font-black tracking-tight text-lg md:text-xl ${t.type === 'income' ? 'text-emerald-600' : t.type === 'expense' ? 'text-rose-600' : 'text-indigo-600'} ${isPending ? 'opacity-60' : ''}`}>
                              {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                            </span>
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleEdit(t)} className="p-2.5 text-slate-400 bg-white ring-1 ring-slate-200 rounded-xl hover:ring-amber-300 hover:text-amber-600 hover:bg-amber-50 transition-all shadow-sm active:scale-95"><Edit className="w-4 h-4" /></button>
                              <button onClick={() => handleDelete(t.id)} className="p-2.5 text-slate-400 bg-white ring-1 ring-slate-200 rounded-xl hover:ring-rose-300 hover:text-rose-600 hover:bg-rose-50 transition-all shadow-sm active:scale-95"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL: GESTÃO DE CARTÕES */}
      {showCardsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col border border-white/20 animate-in zoom-in-95">
            <div className="p-5 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
              <h3 className="font-black flex items-center gap-3 text-lg tracking-tight">
                <div className="p-2 bg-indigo-500/20 rounded-xl"><CreditCard className="w-5 h-5 text-indigo-400" /></div> Meus Cartões
              </h3>
              <div className="flex items-center gap-3">
                {!showCardForm && (
                  <button onClick={openNewCardForm} className="bg-white text-slate-900 hover:bg-slate-200 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-colors shadow-md">
                    <Plus className="w-4 h-4" /> Novo
                  </button>
                )}
                <button onClick={() => { setShowCardsModal(false); setShowCardForm(false); }} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
              </div>
            </div>
            
            <div className="p-5 md:p-8 overflow-y-auto bg-slate-50 flex-1">
              {showCardForm ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl shadow-slate-200/50 animate-in fade-in slide-in-from-bottom-4">
                  <h4 className="font-black text-slate-800 mb-6 flex items-center gap-3 text-xl tracking-tight">
                    <div className="p-2 bg-indigo-50 rounded-xl"><Settings2 className="w-5 h-5 text-indigo-600" /></div>
                    {editingCardId ? 'Editar Cartão' : 'Configurar Novo Cartão'}
                  </h4>
                  <form onSubmit={handleSaveCard} className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nome do Banco / Cartão</label>
                      <input type="text" required value={cardForm.name} onChange={e => setCardForm({...cardForm, name: e.target.value})} placeholder="Ex: Nubank, C6 Bank..." className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-700 transition-all" />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Limite (R$)</label>
                        <input type="number" step="0.01" required value={cardForm.limit} onChange={e => setCardForm({...cardForm, limit: e.target.value})} placeholder="Ex: 1500" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-700 transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Dia Vencimento</label>
                        <input type="number" min="1" max="31" required value={cardForm.dueDay} onChange={e => setCardForm({...cardForm, dueDay: e.target.value})} placeholder="Ex: 5" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-700 transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Cor de Identificação</label>
                      <div className="flex flex-wrap gap-3 p-5 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner">
                        {colorOptions.map(color => (
                          <button key={color} type="button" onClick={() => setCardForm({...cardForm, color})} className={`w-12 h-12 rounded-2xl ${color} ${cardForm.color === color ? 'ring-4 ring-indigo-300 ring-offset-4 scale-110 shadow-lg' : 'hover:scale-110 shadow-sm'} transition-all`}></button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button type="submit" className="flex-1 py-4 bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl transition-all active:scale-95">Salvar Cartão</button>
                      <button type="button" onClick={() => setShowCardForm(false)} className="px-8 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-black uppercase tracking-widest text-xs rounded-2xl shadow-sm transition-all active:scale-95">Cancelar</button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {cards.map(card => {
                    const cardExpenses = filteredTransactions.filter(t => t.type === 'expense' && (t.category === card.id || t.category === card.name)).reduce((acc, curr) => acc + curr.amount, 0);
                    const availableLimit = Math.max(card.limit - cardExpenses, 0);
                    const usagePercentage = card.limit > 0 ? Math.min((cardExpenses / card.limit) * 100, 100) : 100;

                    return (
                      <div key={card.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:border-indigo-200 transition-colors flex flex-col">
                        <div className={`absolute top-0 left-0 w-full h-2 ${card.color}`}></div>
                        
                        <div className="flex justify-between items-start mb-6">
                          <div className="pr-2">
                            <h4 className="font-black text-slate-800 text-xl truncate tracking-tight">{card.name}</h4>
                            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-1.5 bg-slate-50 px-2 py-1 rounded-md inline-flex uppercase tracking-widest border border-slate-100"><Calendar className="w-3 h-3" /> Vence dia {card.dueDay}</p>
                          </div>
                          <div className="flex items-center gap-1.5 bg-white pl-2">
                            <button onClick={() => openEditCardForm(card)} className="p-2.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-colors border border-slate-100 hover:border-amber-200 shadow-sm active:scale-95"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteCard(card.id)} className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors border border-slate-100 hover:border-rose-200 shadow-sm active:scale-95"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>

                        <div className="space-y-5 mt-auto">
                          <div className="flex justify-between text-sm font-bold bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
                            <span className="text-slate-400 uppercase tracking-widest text-[10px]">Limite Total</span>
                            <span className="text-slate-800 font-black">{formatCurrency(card.limit)}</span>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-2 font-bold px-1">
                              <span className="text-slate-400 text-[10px] uppercase tracking-widest">Fatura: <span className="text-rose-500 ml-1">{formatCurrency(cardExpenses)}</span></span>
                              <span className="text-slate-400 text-[10px]">{usagePercentage.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                              <div className={`h-full rounded-full transition-all duration-1000 ${usagePercentage > 90 ? 'bg-gradient-to-r from-rose-400 to-rose-500' : usagePercentage > 60 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : card.color}`} style={{ width: `${usagePercentage}%` }}></div>
                            </div>
                          </div>
                          <div className="pt-4 border-t border-slate-100 flex justify-between items-end px-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Disponível</span>
                            <span className={`font-black text-2xl tracking-tight ${availableLimit < 100 ? 'text-rose-500' : 'text-emerald-500'}`}>{formatCurrency(availableLimit)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURAÇÕES */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-white/20 animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
              <h3 className="font-black flex items-center gap-3 text-lg tracking-tight">
                <div className="p-2 bg-indigo-500/20 rounded-xl"><Settings className="w-5 h-5 text-indigo-400" /></div> Configurações
              </h3>
              <button onClick={() => setShowSettingsModal(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-8 bg-slate-50 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nome de Exibição</label>
                <input type="text" value={userSettings.displayName} onChange={e => setUserSettings({...userSettings, displayName: e.target.value})} className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm transition-all" placeholder="Seu nome..." />
              </div>
              
              <div className="p-5 bg-white border border-indigo-100 shadow-lg shadow-indigo-100/50 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Sparkles className="w-4 h-4"/> IA Gemini API Key</label>
                <p className="text-xs text-slate-500 font-medium mb-4 leading-relaxed">Para a funcionalidade de IA funcionar em alojamentos próprios, tem de inserir aqui a sua chave privada do <strong>Google AI Studio</strong>.</p>
                <input type="password" value={userSettings.geminiApiKey} onChange={e => setUserSettings({...userSettings, geminiApiKey: e.target.value})} placeholder="Colar a API Key aqui..." className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 font-mono text-xs shadow-inner" />
              </div>

              <button onClick={handleSaveSettings} className="w-full py-4 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95 mt-4">Guardar Alterações</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SINCRONIZAÇÃO */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
              <h3 className="font-black flex items-center gap-3 text-lg tracking-tight">
                <div className="p-2 bg-indigo-500/20 rounded-xl"><RefreshCw className="w-5 h-5 text-indigo-400" /></div> Sincronizar
              </h3>
              <button onClick={() => setShowSyncModal(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-8 bg-slate-50">
              <div className="flex gap-1.5 mb-6 p-1.5 bg-slate-200 rounded-2xl shadow-inner">
                <button onClick={() => setSyncTab('export')} className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${syncTab === 'export' ? 'bg-white shadow-md text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>Exportar</button>
                <button onClick={() => setSyncTab('import')} className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${syncTab === 'import' ? 'bg-white shadow-md text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>Importar</button>
              </div>
              {syncTab === 'export' ? (
                <div className="space-y-4">
                  <p className="text-xs font-bold text-slate-500 text-center px-4">Copie o código de segurança para transferir os seus dados.</p>
                  <div className="relative group">
                    <textarea readOnly value={JSON.stringify({ version: 2, transactions, categories, cards })} className="w-full h-36 p-5 bg-white font-mono text-[10px] text-slate-400 border border-slate-200 rounded-2xl resize-none outline-none shadow-inner" />
                    <button onClick={handleCopySync} className="absolute bottom-4 right-4 flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black shadow-lg active:scale-95 transition-all">
                      {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs font-bold text-slate-500 text-center px-4">Cole o código do outro aparelho para substituir os dados atuais.</p>
                  <textarea value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Colar código aqui..." className="w-full h-36 p-5 bg-white font-mono text-[10px] border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl resize-none outline-none shadow-inner" />
                  <button onClick={handleImportSync} className="w-full py-4 bg-indigo-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 active:scale-95 transition-all"><Download className="w-5 h-5" /> Importar Dados</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL GRÁFICO */}
      {showChartModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white"><h3 className="font-black tracking-tight flex items-center gap-3 text-lg"><div className="p-2 bg-indigo-500/20 rounded-xl"><PieChart className="w-5 h-5 text-indigo-400" /></div> Análise Categórica</h3><button onClick={() => setShowChartModal(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl"><X className="w-5 h-5" /></button></div>
            <div className="p-8 flex flex-col items-center bg-slate-50">
              <div className="w-60 h-60 rounded-full shadow-inner mb-10 border-[6px] border-white" style={{ background: `conic-gradient(${conicGradientString})` }}></div>
              <div className="w-full grid grid-cols-2 gap-3">{chartData.map((d, i) => (<div key={i} className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:border-slate-300 transition-colors"><div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: d.color }}></div><div className="flex flex-col"><span className="text-xs font-black text-slate-700 truncate">{d.category}</span><span className="text-[10px] font-bold text-slate-400">{d.percentage.toFixed(0)}%</span></div></div>))}</div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL IA */}
      {showAiModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95">
            <div className="p-6 border-b border-indigo-800 flex justify-between items-center bg-gradient-to-r from-indigo-950 to-purple-950 text-white"><h3 className="font-black tracking-tight flex items-center gap-3 text-lg"><div className="p-2 bg-white/10 rounded-xl shadow-inner"><Sparkles className="w-5 h-5 text-purple-300"/></div> Assistente IA</h3><button onClick={() => setShowAiModal(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl"><X className="w-5 h-5"/></button></div>
            <div className="p-8 overflow-y-auto bg-slate-50 flex-1">{isAnalyzing ? <div className="text-center py-16 flex flex-col items-center"><Loader2 className="w-12 h-12 animate-spin text-purple-600 mb-6"/><span className="font-black text-slate-600 tracking-tight text-lg">A analisar padrões...</span><p className="text-xs text-slate-400 font-medium mt-2">A preparar o seu relatório financeiro.</p></div> : <div className="text-sm font-semibold text-slate-700 leading-relaxed space-y-4">{aiInsight.split('\n').map((l, i) => <p key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">{l.replace(/\*\*(.*?)\*\*/g, (m, c) => c).replace(/\*(.*?)\*/g, (m, c) => c)}</p>)}</div>}</div>
          </div>
        </div>
      )}

      {/* MODAL CALCULADORA */}
      {showCalculator && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-[2rem] shadow-2xl shadow-black/50 w-full max-w-[320px] overflow-hidden flex flex-col border border-slate-700/50 animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <h3 className="font-black text-white flex items-center gap-2 text-xs tracking-widest uppercase">
                <CalculatorIcon className="w-4 h-4 text-indigo-400" /> Calculadora
              </h3>
              <button onClick={() => setShowCalculator(false)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 bg-gradient-to-b from-slate-900 to-slate-950">
              <div className="bg-slate-950 rounded-2xl p-5 mb-6 text-right overflow-hidden break-all min-h-[5rem] flex items-end justify-end border border-slate-800 shadow-inner">
                <span className="text-4xl font-mono text-white tracking-widest font-light">{calcInput || '0'}</span>
              </div>
              <div className="grid grid-cols-4 gap-3 md:gap-4">
                {['7','8','9','/','4','5','6','*','1','2','3','-','C','0','=','+'].map(btn => (
                  <button key={btn} onClick={() => handleCalcClickWrapper(btn)} className={`py-4 rounded-2xl font-black text-xl transition-all active:scale-90 ${btn === 'C' ? 'bg-gradient-to-t from-rose-600 to-rose-500 text-white shadow-lg shadow-rose-900/50 hover:from-rose-500 hover:to-rose-400' : btn === '=' ? 'bg-gradient-to-t from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-900/50 hover:from-indigo-500 hover:to-indigo-400' : ['/','*','-','+'].includes(btn) ? 'bg-slate-800 text-indigo-400 hover:bg-slate-700 hover:text-indigo-300' : 'bg-slate-800/50 text-white hover:bg-slate-700 shadow-sm border border-slate-700/50'}`}>
                    {btn}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL UNIVERSAL PARA CONFIRMAÇÕES E PROMPTS */}
      {uiModal.type && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-black text-slate-800 text-lg tracking-tight flex items-center gap-2">
                {uiModal.type === 'alert' && <Info className="w-5 h-5 text-indigo-500" />}
                {uiModal.type === 'confirm' && <AlertCircle className="w-5 h-5 text-rose-500" />}
                {uiModal.type === 'prompt' && <Plus className="w-5 h-5 text-emerald-500" />}
                {uiModal.title}
              </h3>
              {uiModal.type !== 'alert' && (
                <button onClick={closeUiModal} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
              )}
            </div>
            
            <p className="text-sm font-semibold text-slate-600 mb-6">{uiModal.message}</p>
            
            {uiModal.type === 'prompt' && (
              <input 
                type="text" 
                autoFocus
                value={uiModal.inputValue} 
                onChange={(e) => setUiModal({...uiModal, inputValue: e.target.value})} 
                onKeyDown={(e) => { 
                  if (e.key === 'Enter') { 
                    e.preventDefault(); 
                    uiModal.onConfirm(uiModal.inputValue); 
                    closeUiModal(); 
                  } 
                }}
                placeholder="Escreva aqui..." 
                className="w-full px-4 py-3 mb-6 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-800" 
              />
            )}

            <div className="flex gap-3">
              {uiModal.type !== 'alert' && (
                <button onClick={closeUiModal} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-black uppercase tracking-widest text-[10px] rounded-xl transition-all">Cancelar</button>
              )}
              <button 
                onClick={() => {
                  if (uiModal.onConfirm) {
                    if (uiModal.type === 'prompt') uiModal.onConfirm(uiModal.inputValue);
                    else uiModal.onConfirm();
                  }
                  closeUiModal();
                }} 
                className={`flex-1 py-3 text-white font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-lg ${uiModal.type === 'confirm' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'}`}
              >
                {uiModal.type === 'alert' ? 'Entendi' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}