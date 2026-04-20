import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, ArrowUpCircle, ArrowDownCircle, TrendingUp, Trash2, Edit,
  Wallet, Calendar, ChevronLeft, ChevronRight, PieChart, Lock, LogOut,
  Sparkles, X, Loader2, BarChart2, RefreshCw, Copy, CheckCircle2,
  Download, User, Mail, UserPlus, LogIn, Calculator as CalculatorIcon,
  Search, FileSpreadsheet, CheckCircle, Circle, AlertCircle, CreditCard,
  Settings2, Printer, Settings, ChevronDown, Info, Sun, Moon, 
  Target, Trophy, Lightbulb, LayoutDashboard, ListOrdered, ArrowLeft,
  Wand2, ShoppingBag
} from 'lucide-react';

// Importações do Firebase para Nuvem (Sincronização entre dispositivos)
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot, deleteDoc } from 'firebase/firestore';

// ----------------------------------------------------------------------
// CONFIGURAÇÃO DO FIREBASE (NUVEM)
// ----------------------------------------------------------------------
const firebaseConfig = { 
  apiKey: "AIzaSyD3NXIcLLJDOGbfBt0nUOteuhnEcPOJzhw",
  authDomain: "financasbirowjoe.firebaseapp.com",
  projectId: "financasbirowjoe",
  storageBucket: "financasbirowjoe.firebasestorage.app",
  messagingSenderId: "619729852935",
  appId: "1:619729852935:web:935a812ddc616c45a1a8a2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : '100-aperto-app';

const generateSafeId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 10);

const evaluateMath = (expr) => {
  try {
    const standardizedExpr = expr.replace(/,/g, '.');
    const opRegex = new RegExp("(?:\\d+\\.?\\d*)|[+\\-*/]", "g");
    let tokens = standardizedExpr.match(opRegex);
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
    return Number.isFinite(res) ? (Number.isInteger(res) ? String(res) : String(res.toFixed(2))).replace('.', ',') : 'Erro';
  } catch (e) {
    return 'Erro';
  }
};

const formatCurrency = (value) => { 
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value); 
};

const defaultCategories = {
  income: ['Salário', 'Acerto', 'Rendimento', 'Outros'],
  expense: ['Click', 'MP', 'Digio', 'Inter', 'Neon', 'Ponto', 'Contas Fixas', 'Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Outros'],
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

const dailyTips = [
  "Estratégia: Evite compras por impulso. Aplique a regra das 24h antes de adquirir algo não essencial.",
  "Estratégia: A regra 50/30/20 (50% necessidades, 30% desejos, 20% futuro) é a base da estabilidade.",
  "Estratégia: Faça uma auditoria às suas subscrições. Eliminar o que não usa aumenta o seu saldo livre.",
  "Estratégia: Pague-se a si mesmo primeiro. Ao receber, invista imediatamente a sua percentagem definida.",
  "Estratégia: Os juros compostos são o seu maior aliado. O melhor dia para começar a investir foi ontem."
];

export default function App() {
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [firebasePermissionError, setFirebasePermissionError] = useState(false);

  // Utilizador da Aplicação (App User)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('finances_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [authMode, setAuthMode] = useState('login');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Estados Base
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState(defaultCategories);
  const [cards, setCards] = useState(defaultCards);
  const [goals, setGoals] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Estados de Navegação
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  // Estados Modais Metas e Orçamentos
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalForm, setGoalForm] = useState({ id: null, name: '', target: '' });
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ category: '', limit: '' });

  // Estados do formulário de transação
  const [editingId, setEditingId] = useState(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Click');
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState(2);
  const [installmentType, setInstallmentType] = useState('parcela');
  const [isPaid, setIsPaid] = useState(true);

  // Simulador de Investimentos
  const [simInitial, setSimInitial] = useState(1000);
  const [simMonthly, setSimMonthly] = useState(200);
  const [simRate, setSimRate] = useState(0.8);
  const [simYears, setSimYears] = useState(5);

  // Filtros
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');

  // Modais de Ferramentas & IA
  const [showAiModal, setShowAiModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState('');
  
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [isPlanningGoal, setIsPlanningGoal] = useState(false);
  const [aiGoalPlan, setAiGoalPlan] = useState('');
  const [selectedGoalForPlan, setSelectedGoalForPlan] = useState(null);

  const [showAiBudgetModal, setShowAiBudgetModal] = useState(false);
  const [isGeneratingBudget, setIsGeneratingBudget] = useState(false);
  const [aiBudgetPlan, setAiBudgetPlan] = useState('');

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseItemName, setPurchaseItemName] = useState('');
  const [purchaseItemPrice, setPurchaseItemPrice] = useState('');
  const [purchaseAdvice, setPurchaseAdvice] = useState('');
  const [isAdvisingPurchase, setIsAdvisingPurchase] = useState(false);

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
  const [showConfetti, setShowConfetti] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false);

  // MODO ESCURO STATE
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('finances_theme');
    return savedTheme ? savedTheme === 'dark' : false;
  });

  const showAlert = (title, message) => setUiModal({ type: 'alert', title, message, onConfirm: null, inputValue: '' });
  const showConfirm = (title, message, onConfirm) => setUiModal({ type: 'confirm', title, message, onConfirm, inputValue: '' });
  const showPrompt = (title, message, onConfirm) => setUiModal({ type: 'prompt', title, message, onConfirm, inputValue: '' });
  const closeUiModal = () => setUiModal({ type: null, title: '', message: '', onConfirm: null, inputValue: '' });

  useEffect(() => {
    localStorage.setItem('finances_theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // ----------------------------------------------------------------------
  // INICIALIZAÇÃO FIREBASE (Preparar Conexão)
  // ----------------------------------------------------------------------
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.warn("Aviso: Auth nativa falhou. Prosseguindo ligação via Regras de Segurança Públicas.");
      } finally {
        setFirebaseReady(true);
      }
    };
    initAuth();
  }, []);

  // ----------------------------------------------------------------------
  // CARREGAMENTO DE DADOS (CLOUD SYNC ESTRICTO)
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (!firebaseReady || !currentUser) {
      setIsDataLoaded(false);
      return;
    }

    const userId = currentUser.id;
    const isDemoUser = currentUser.email.toLowerCase() === 'gabriell';

    // 1. Ler do localStorage primeiro (Offline First visual)
    const localTxns = localStorage.getItem(`finances_data_user_${userId}`);
    if (localTxns) setTransactions(JSON.parse(localTxns));
    const localGoals = localStorage.getItem(`finances_goals_${userId}`);
    if (localGoals) setGoals(JSON.parse(localGoals));
    const localBudgets = localStorage.getItem(`finances_budgets_${userId}`);
    if (localBudgets) setBudgets(JSON.parse(localBudgets));
    const localCats = localStorage.getItem(`finances_categories_${userId}`);
    if (localCats) setCategories(JSON.parse(localCats));
    const localCards = localStorage.getItem(`finances_cards_${userId}`);
    if (localCards) setCards(JSON.parse(localCards));

    setUserSettings({
      geminiApiKey: localStorage.getItem(`finances_gemini_key_${userId}`) || '',
      displayName: currentUser.name || ''
    });

    setIsDataLoaded(true);

    // 2. Sincronização Estrita da Nuvem (Firestore)
    let unsubTxns;
    let unsubConfig;

    try {
      unsubTxns = onSnapshot(
        collection(db, 'artifacts', appId, 'public', 'data', `txns_${userId}`), 
        (snapshot) => {
          const loadedTxns = snapshot.docs.map(doc => doc.data());
          
          if (loadedTxns.length === 0 && isDemoUser) {
            const initialData = [];
            const baseDate = new Date();
            let currentMonthIter = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
            const limitSalario = new Date(2027, 11, 11); 
            const limitAcerto = new Date(2027, 1, 2);  

            while (currentMonthIter <= limitSalario) {
              let year = currentMonthIter.getFullYear();
              let month = String(currentMonthIter.getMonth() + 1).padStart(2, '0');
              let dateSalario = `${year}-${month}-11`;
              let dateAcerto = `${year}-${month}-02`;

              initialData.push({ id: generateSafeId(), description: 'Salário', amount: 4500, type: 'income', date: dateSalario, category: 'Salário', status: 'paid' });
              
              let acertoDateObj = new Date(year, currentMonthIter.getMonth(), 2);
              if (acertoDateObj <= limitAcerto) {
                initialData.push({ id: generateSafeId(), description: 'Acerto', amount: 900, type: 'income', date: dateAcerto, category: 'Acerto', status: 'paid' });
              }
              currentMonthIter.setMonth(currentMonthIter.getMonth() + 1);
            }
            
            initialData.forEach(t => {
              setDoc(doc(db, 'artifacts', appId, 'public', 'data', `txns_${userId}`, t.id), t).catch(err => {
                if (err.code === 'permission-denied' || err.message?.toLowerCase().includes('permission')) setFirebasePermissionError(true);
              });
            });
            setTransactions(initialData);
          } else {
            setTransactions(loadedTxns);
            localStorage.setItem(`finances_data_user_${userId}`, JSON.stringify(loadedTxns));
          }
        }, 
        (err) => {
          console.error("Erro ao carregar transações da nuvem:", err);
          if (err.code === 'permission-denied' || err.message?.toLowerCase().includes('permission')) setFirebasePermissionError(true);
        }
      );

      unsubConfig = onSnapshot(
        doc(db, 'artifacts', appId, 'public', 'data', 'config', userId),
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data.categories) { setCategories(data.categories); localStorage.setItem(`finances_categories_${userId}`, JSON.stringify(data.categories)); }
            if (data.cards) { setCards(data.cards); localStorage.setItem(`finances_cards_${userId}`, JSON.stringify(data.cards)); }
            if (data.goals) { setGoals(data.goals); localStorage.setItem(`finances_goals_${userId}`, JSON.stringify(data.goals)); }
            if (data.budgets) { setBudgets(data.budgets); localStorage.setItem(`finances_budgets_${userId}`, JSON.stringify(data.budgets)); }
            if (data.userSettings) setUserSettings(data.userSettings);
          } else if (!localCats) {
            setCategories(defaultCategories);
            setCards(defaultCards);
            setGoals([]);
            setBudgets({});
          }
        },
        (err) => {
          console.error("Erro ao carregar configurações da nuvem:", err);
          if (err.code === 'permission-denied' || err.message?.toLowerCase().includes('permission')) setFirebasePermissionError(true);
        }
      );
    } catch(err) {
       console.error("Erro ao iniciar sincronização:", err);
    }

    return () => {
      if (unsubTxns) unsubTxns();
      if (unsubConfig) unsubConfig();
    };
  }, [firebaseReady, currentUser]);

  const saveCloudConfig = async (newConfigObject) => {
    if (!firebaseReady || !currentUser) return;
    try {
      const configRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', currentUser.id);
      await setDoc(configRef, newConfigObject, { merge: true });
    } catch (err) {
      console.error("Erro ao guardar na nuvem:", err);
      if (err.code === 'permission-denied' || err.message?.toLowerCase().includes('permission')) setFirebasePermissionError(true);
    }
  };

  useEffect(() => {
    if (!editingId && categories[type] && categories[type].length > 0) {
      if (!categories[type].includes(category)) {
        setCategory(categories[type][0]);
      }
    }
  }, [type, editingId, categories, category]);

  useEffect(() => {
    const afterPrint = () => setIsPrintMode(false);
    window.addEventListener('afterprint', afterPrint);
    return () => window.removeEventListener('afterprint', afterPrint);
  }, []);

  const handleDescriptionChange = (val) => {
    setDescription(val);
    const lowerVal = val.toLowerCase();
    
    const dictionary = {
      'uber': 'Transporte', '99': 'Transporte', 'gasolina': 'Transporte', 'combustivel': 'Transporte', 'posto': 'Transporte',
      'ifood': 'Alimentação', 'mercado': 'Alimentação', 'padaria': 'Alimentação', 'restaurante': 'Alimentação', 'lanche': 'Alimentação',
      'luz': 'Contas Fixas', 'água': 'Contas Fixas', 'agua': 'Contas Fixas', 'internet': 'Contas Fixas', 'aluguel': 'Contas Fixas', 'celular': 'Contas Fixas',
      'netflix': 'Lazer', 'cinema': 'Lazer', 'spotify': 'Lazer', 'jogos': 'Lazer',
      'farmácia': 'Saúde', 'farmacia': 'Saúde', 'médico': 'Saúde', 'medico': 'Saúde', 'consulta': 'Saúde'
    };

    if (type === 'expense' && !editingId && !isCategorizing) {
      for (let key in dictionary) {
        if (lowerVal.includes(key)) {
          if (categories.expense.includes(dictionary[key])) {
            setCategory(dictionary[key]);
          }
          break;
        }
      }
    }
  };

  const fetchWithRetry = async (prompt) => {
    const apiKey = userSettings.geminiApiKey || ""; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const payload = { contents: [{ parts: [{ text: prompt }] }] };

    let delay = 1000;
    for (let i = 0; i < 5; i++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('API Error');
        const result = await response.json();
        return result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } catch (e) {
        if (i === 4) throw e;
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
      }
    }
    throw new Error('Falha após múltiplas tentativas.');
  };

  // ----------------------------------------------------------------------
  // FUNCIONALIDADES IA (LLM - GEMINI)
  // ----------------------------------------------------------------------

  const generateAiInsights = async () => {
    setIsAnalyzing(true); setAiInsight(''); setShowAiModal(true);
    const txnsText = filteredTransactions.map(t => `${t.date} - ${t.description} - R$ ${t.amount} (${t.type} / ${t.status || 'paid'})`).join('\n');
    const prompt = `Atue como um consultor financeiro especialista. Analise o seguinte resumo mensal e dê conselhos diretos e encorajadores (máx 3 parágrafos curtos) em português de Portugal. 
      Resumo: Entradas: R$ ${income}, Gastos: R$ ${expense}, Saldo Previsto: R$ ${expectedBalance}. 
      Transações do mês: ${txnsText || 'Nenhuma transação registada ainda.'}`;
    
    try {
      const responseText = await fetchWithRetry(prompt);
      setAiInsight(responseText);
    } catch (error) { 
      setAiInsight('Falha de conexão com a IA. Por favor verifique a sua Chave API nas configurações (⚙️).'); 
    } finally { 
      setIsAnalyzing(false); 
    }
  };

  const handleAiCategorize = async () => {
    if (!description) return;
    setIsCategorizing(true);
    
    const contextType = type === 'income' ? 'entrada' : type === 'expense' ? 'gasto' : 'investimento';
    const availableCategories = categories[type].join(', ');
    const prompt = `Estou a registar uma transação financeira do tipo '${contextType}'. A descrição inserida pelo utilizador é '${description}'. 
      A partir da seguinte lista exata de categorias: [${availableCategories}], escolha a categoria que melhor se adapta.
      Responda APENAS com o nome exato da categoria escolhida, sem pontuação, sem aspas e sem explicações adicionais. Se nenhuma for adequada, responda 'Outros'.`;

    try {
      const responseText = await fetchWithRetry(prompt);
      const suggested = responseText.trim();
      
      if (suggested && categories[type].includes(suggested)) {
        setCategory(suggested);
      }
    } catch (error) {
      console.error("Erro na auto-categorização", error);
    } finally {
      setIsCategorizing(false);
    }
  };

  const handleGenerateGoalPlan = async (goal) => {
    setSelectedGoalForPlan(goal);
    setIsPlanningGoal(true);
    setAiGoalPlan('');
    
    const prompt = `Atue como um consultor financeiro otimista e pragmático. 
      O utilizador quer alcançar a meta '${goal.name}' no valor de ${formatCurrency(goal.target)}. 
      Atualmente já tem poupado ${formatCurrency(goal.current)}. 
      A sobra mensal atual prevista dele é de ${formatCurrency(expectedBalance)}. 
      Crie um plano de ação direto, prático e motivacional (máx 3 tópicos curtos com marcadores) para ajudar o utilizador a atingir esta meta de forma eficiente. Responda em português de Portugal.`;

    try {
      const responseText = await fetchWithRetry(prompt);
      setAiGoalPlan(responseText);
    } catch (error) {
      setAiGoalPlan('Falha de conexão com a IA. Por favor verifique a sua Chave API nas configurações (⚙️) ou tente novamente mais tarde.');
    } finally {
      setIsPlanningGoal(false);
    }
  };

  const handleGenerateAiBudget = async () => {
    setIsGeneratingBudget(true);
    setShowAiBudgetModal(true);
    setAiBudgetPlan('');

    const prompt = `Atue como um consultor financeiro experiente. O utilizador tem uma renda mensal total de R$ ${income} e atualmente tem gastos registados de R$ ${expense}.
      As categorias de gastos que ele tem configuradas são: ${categories.expense.join(', ')}.
      Crie um plano de orçamento mensal com limites máximos recomendados para estas categorias, distribuindo a renda de forma inteligente e realista (utilizando, por exemplo, a regra 50/30/20 como base, mas adaptada às categorias dele).
      Se a renda atual registada for R$ 0, baseie-se num salário hipotético de R$ 3000 para dar um exemplo prático.
      Apresente a sugestão de forma direta, com tópicos claros e valores em R$ para cada categoria. Inclua um breve parágrafo motivacional no final. Responda em português de Portugal.`;

    try {
      const responseText = await fetchWithRetry(prompt);
      setAiBudgetPlan(responseText);
    } catch (error) {
      setAiBudgetPlan('Falha ao gerar o orçamento com a IA. Por favor verifique a sua Chave API nas configurações (⚙️).');
    } finally {
      setIsGeneratingBudget(false);
    }
  };

  const handleAnalyzePurchase = async (e) => {
    e.preventDefault();
    if (!purchaseItemName || !purchaseItemPrice) return;
    setIsAdvisingPurchase(true);
    setPurchaseAdvice('');

    const prompt = `O utilizador quer comprar "${purchaseItemName}" que custa R$ ${purchaseItemPrice}.
      Contexto financeiro atual deste mês:
      - Entradas mensais: R$ ${income}
      - Gastos até agora: R$ ${expense}
      - Saldo Previsto no fim do mês: R$ ${expectedBalance}
      - Saldo Real Atual: R$ ${realBalance}

      Atue como um consultor financeiro rigoroso mas amigável. Analise a saúde financeira atual e sugira se ele tem capacidade para fazer esta compra agora. Sugira se deve comprar à vista, evitar a compra, parcelar, ou poupar e esperar mais um pouco.
      Seja direto e honesto. Responda em português de Portugal.`;

    try {
      const responseText = await fetchWithRetry(prompt);
      setPurchaseAdvice(responseText);
    } catch (error) {
      setPurchaseAdvice('Falha ao contactar o consultor IA. Verifique a sua Chave API nas configurações (⚙️).');
    } finally {
      setIsAdvisingPurchase(false);
    }
  };

  // ----------------------------------------------------------------------
  // AUTENTICAÇÃO E GESTÃO DE DADOS (NUVEM RESTRITA)
  // ----------------------------------------------------------------------
  const handleAuth = async (e) => {
    e.preventDefault(); 
    setAuthError('');
    if (!emailInput || !passwordInput) { setAuthError('Por favor, preencha todos os campos.'); return; }
    if (!firebaseReady) { setAuthError('Aguarde a conexão com o servidor em nuvem...'); return; }
    
    setIsAuthLoading(true);
    const isGabriell = emailInput.toLowerCase() === 'gabriell' && passwordInput === 'f8g4j10';
    const internalUserId = isGabriell ? 'admin_gabriell' : emailInput.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'app_users', internalUserId);

    try {
      const userSnap = await getDoc(userRef);
      
      if (authMode === 'register' && !isGabriell) {
        if (userSnap.exists()) {
          setAuthError('Esta conta já existe. Tente fazer o login.');
        } else {
          const newUser = { id: internalUserId, email: emailInput, password: passwordInput, name: emailInput.split('@')[0] };
          await setDoc(userRef, newUser);
          setCurrentUser(newUser);
          localStorage.setItem('finances_current_user', JSON.stringify(newUser));
        }
      } else {
        if (isGabriell) {
          const gabriellUser = { id: internalUserId, email: 'gabriell', password: 'f8g4j10', name: 'Gabriell' };
          await setDoc(userRef, gabriellUser, { merge: true });
          setCurrentUser(gabriellUser);
          localStorage.setItem('finances_current_user', JSON.stringify(gabriellUser));
        } else if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.password === passwordInput) {
            setCurrentUser(userData);
            localStorage.setItem('finances_current_user', JSON.stringify(userData));
          } else {
            setAuthError('Palavra-passe incorreta.');
          }
        } else {
          setAuthError('Conta não encontrada. Crie a sua conta primeiro.');
        }
      }
    } catch (err) {
      console.error("Erro no Auth Firebase:", err);
      if (err.code === 'permission-denied' || err.message?.toLowerCase().includes('permission')) {
        setFirebasePermissionError(true);
        setAuthError('Falha de permissão. Leia as instruções vermelhas no ecrã.');
      } else {
        setAuthError('Erro de ligação ao servidor: ' + err.message);
      }
    }
    
    setIsAuthLoading(false);
    setEmailInput(''); setPasswordInput('');
  };

  const handleLogout = () => { setCurrentUser(null); localStorage.removeItem('finances_current_user'); };

  const handleDeleteAccount = async () => {
    showConfirm('Aviso de Risco Crítico', 'Tem a certeza absoluta? Esta ação apagará TODOS os seus dados, histórico, transações e configurações. É impossível reverter.', async () => {
      try {
        const userId = currentUser.id;
        
        for (const t of transactions) {
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', `txns_${userId}`, t.id)).catch(() => {});
        }
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'config', userId)).catch(() => {});
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'app_users', userId)).catch(() => {});

        localStorage.removeItem('finances_current_user');
        localStorage.removeItem(`finances_data_user_${userId}`);
        localStorage.removeItem(`finances_goals_${userId}`);
        localStorage.removeItem(`finances_budgets_${userId}`);
        localStorage.removeItem(`finances_categories_${userId}`);
        localStorage.removeItem(`finances_cards_${userId}`);
        localStorage.removeItem(`finances_gemini_key_${userId}`);

        setCurrentUser(null);
        setShowSettingsModal(false);
        showAlert('Conta Encerrada', 'A sua conta e todos os dados foram removidos com sucesso. Agradecemos por ter utilizado o nosso sistema.');
      } catch (error) {
        console.error(error);
        showAlert('Erro', 'Ocorreu um erro ao tentar apagar a sua conta.');
      }
    });
  };

  const handleSaveSettings = () => {
    if (currentUser) {
      localStorage.setItem(`finances_gemini_key_${currentUser.id}`, userSettings.geminiApiKey);
      const updatedUser = { ...currentUser, name: userSettings.displayName };
      
      const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'app_users', currentUser.id);
      setDoc(userRef, updatedUser, { merge: true }).catch(err => {
        if (err.code === 'permission-denied' || err.message?.toLowerCase().includes('permission')) setFirebasePermissionError(true);
      });
      
      saveCloudConfig({ userSettings });
      
      setCurrentUser(updatedUser);
      localStorage.setItem('finances_current_user', JSON.stringify(updatedUser));
      setShowSettingsModal(false);
    }
  };

  const handleAddCategory = (e) => {
    if (e) e.preventDefault();
    const typeName = type === 'income' ? 'Entrada' : type === 'expense' ? 'Gasto' : 'Investimento';
    showPrompt('Nova Categoria', `Qual o nome da Nova Categoria de ${typeName}?`, (newCat) => {
      if (newCat && newCat.trim()) {
        const trimmed = newCat.trim();
        if (!categories[type].includes(trimmed)) {
          const updated = { ...categories, [type]: [...categories[type], trimmed] };
          setCategories(updated); 
          setCategory(trimmed);
          saveCloudConfig({ categories: updated });
        } else {
          setCategory(trimmed);
        }
      }
    });
  };

  const openNewCardForm = () => { setEditingCardId(null); setCardForm({ name: '', limit: '', dueDay: '5', color: colorOptions[0] }); setShowCardForm(true); };
  const openEditCardForm = (card) => { setEditingCardId(card.id); setCardForm({ name: card.name, limit: card.limit.toString(), dueDay: card.dueDay.toString(), color: card.color }); setShowCardForm(true); };

  const handleSaveCard = async (e) => {
    e.preventDefault();
    if (!cardForm.name || !cardForm.limit || !cardForm.dueDay) return;
    
    const isEditing = !!editingCardId;
    const oldId = editingCardId;
    const newId = cardForm.name.trim();

    const updatedCard = { 
      id: newId, 
      name: newId, 
      limit: parseFloat(cardForm.limit), 
      dueDay: parseInt(cardForm.dueDay), 
      color: cardForm.color 
    };
    
    let newCards;
    let newCategories = { ...categories };
    let txnsToUpdate = [];

    if (isEditing) {
      newCards = cards.map(c => c.id === oldId ? updatedCard : c);
      
      // Se mudou o nome do cartão, atualizamos a categoria e as transações
      if (oldId !== newId) {
        newCategories.expense = newCategories.expense.map(cat => cat === oldId ? newId : cat);
        txnsToUpdate = transactions.filter(t => t.category === oldId);
      }
    } else {
      newCards = [...cards, updatedCard];
      // Se é um cartão novo, cria a categoria
      if (!newCategories.expense.includes(newId)) {
        newCategories.expense = [...newCategories.expense, newId];
      }
    }

    setCards(newCards);
    setCategories(newCategories);
    
    // Atualizar transações localmente se o nome mudou
    if (isEditing && oldId !== newId) {
       const updatedTxnsState = transactions.map(t => t.category === oldId ? { ...t, category: newId } : t);
       setTransactions(updatedTxnsState);
    }

    saveCloudConfig({ cards: newCards, categories: newCategories });

    // Sincronizar as transações antigas para a Nuvem com a nova categoria
    if (isEditing && oldId !== newId && firebaseReady && currentUser) {
       for (let t of txnsToUpdate) {
         const updatedT = { ...t, category: newId };
         await setDoc(doc(db, 'artifacts', appId, 'public', 'data', `txns_${currentUser.id}`, t.id), updatedT).catch(console.error);
       }
    }

    setShowCardForm(false);
  };

  const handleDeleteCard = (id) => {
    showConfirm('Excluir Cartão', 'Tem a certeza que deseja excluir este cartão?', () => {
      const newCards = cards.filter(c => c.id !== id);
      const newCategories = { ...categories, expense: categories.expense.filter(cat => cat !== id) };
      
      setCards(newCards);
      setCategories(newCategories);
      saveCloudConfig({ cards: newCards, categories: newCategories });
    });
  };

  // ----------------------------------------------------------------------
  // GESTÃO DE METAS (MODAL)
  // ----------------------------------------------------------------------
  const openNewGoal = () => { 
    setGoalForm({ id: null, name: '', target: '' }); 
    setShowGoalModal(true); 
  };
  
  const openEditGoal = (goal) => { 
    setGoalForm({ id: goal.id, name: goal.name, target: goal.target.toString() }); 
    setShowGoalModal(true); 
  };

  const handleSaveGoal = (e) => {
    e.preventDefault();
    const numTarget = parseFloat(goalForm.target.toString().replace(',', '.'));
    if (!goalForm.name || isNaN(numTarget) || numTarget <= 0) return;
    
    let newGoals;
    if (goalForm.id) {
      newGoals = goals.map(g => g.id === goalForm.id ? { ...g, name: goalForm.name, target: numTarget } : g);
    } else {
      newGoals = [...goals, { id: generateSafeId(), name: goalForm.name, target: numTarget, current: 0 }];
    }
    setGoals(newGoals);
    saveCloudConfig({ goals: newGoals });
    setShowGoalModal(false);
  };

  // ----------------------------------------------------------------------
  // GESTÃO DE ORÇAMENTOS (MODAL)
  // ----------------------------------------------------------------------
  const openNewBudget = () => { 
    setBudgetForm({ category: categories.expense[0] || '', limit: '' }); 
    setShowBudgetModal(true); 
  };

  const openEditBudget = (cat, limit) => { 
    setBudgetForm({ category: cat, limit: limit.toString() }); 
    setShowBudgetModal(true); 
  };

  const handleSaveBudget = (e) => {
    e.preventDefault();
    const numLimit = parseFloat(budgetForm.limit.toString().replace(',', '.'));
    if (!budgetForm.category || isNaN(numLimit) || numLimit <= 0) return;
    
    const newBudgets = { ...budgets, [budgetForm.category]: numLimit };
    setBudgets(newBudgets);
    saveCloudConfig({ budgets: newBudgets });
    setShowBudgetModal(false);
  };

  const handleDeleteBudget = (cat) => {
    showConfirm('Excluir Orçamento', `Deseja remover o orçamento para a categoria "${cat}"?`, () => {
      const newBudgets = { ...budgets };
      delete newBudgets[cat];
      setBudgets(newBudgets);
      saveCloudConfig({ budgets: newBudgets });
    });
  };

  // ----------------------------------------------------------------------
  // TRANSAÇÕES
  // ----------------------------------------------------------------------
  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    if (!description || !amount || isNaN(amount)) return;
    const numAmount = parseFloat(amount.toString().replace(',', '.'));
    const itemStatus = isPaid ? 'paid' : 'pending'; 
    const safeInstallmentsCount = parseInt(installmentsCount) > 1 ? parseInt(installmentsCount) : 2;

    if (editingId) {
      const updatedTxn = { id: editingId, description, amount: numAmount, type, date, category, status: itemStatus };
      setTransactions(transactions.map(t => t.id === editingId ? updatedTxn : t));
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', `txns_${currentUser.id}`, editingId), updatedTxn).catch(err => {
        if (err.code === 'permission-denied' || err.message?.toLowerCase().includes('permission')) setFirebasePermissionError(true);
      });
    } else {
      if ((type === 'expense' || type === 'income') && isInstallment && safeInstallmentsCount > 1) {
        const installmentAmount = installmentType === 'total' ? numAmount / safeInstallmentsCount : numAmount;
        const newTransactions = [];
        const [year, month, day] = date.split('-');
        let startDate = new Date(year, month - 1, day);

        for (let i = 0; i < safeInstallmentsCount; i++) {
          const currentDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, startDate.getDate());
          if (currentDate.getDate() !== parseInt(day)) currentDate.setDate(0); 
          const formattedDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
          newTransactions.push({
            id: generateSafeId(), description: `${description} (${i + 1}/${safeInstallmentsCount})`, amount: installmentAmount, type, date: formattedDate, category, status: itemStatus
          });
        }
        
        setTransactions([...transactions, ...newTransactions]);
        
        for (let t of newTransactions) {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', `txns_${currentUser.id}`, t.id), t).catch(err => {
            if (err.code === 'permission-denied' || err.message?.toLowerCase().includes('permission')) setFirebasePermissionError(true);
          });
        }
      } else {
        const newTxn = { id: generateSafeId(), description, amount: numAmount, type, date, category, status: itemStatus };
        setTransactions([...transactions, newTxn]);
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', `txns_${currentUser.id}`, newTxn.id), newTxn).catch(err => {
          if (err.code === 'permission-denied' || err.message?.toLowerCase().includes('permission')) setFirebasePermissionError(true);
        });
      }
    }
    resetForm();
    setShowTransactionModal(false);
  };

  const resetForm = () => { setEditingId(null); setDescription(''); setAmount(''); setIsInstallment(false); setInstallmentsCount(2); setInstallmentType('parcela'); setIsPaid(true); };
  const handleEdit = (t) => { setEditingId(t.id); setDescription(t.description); setAmount(t.amount); setType(t.type); setDate(t.date); setCategory(t.category); setIsPaid(t.status !== 'pending'); setIsInstallment(false); window.scrollTo({ top: 0, behavior: 'smooth' }); setShowTransactionModal(true); };
  
  const handleDelete = async (id) => { 
    showConfirm('Apagar Registo', 'Deseja apagar este registo financeiro?', async () => {
      setTransactions(prev => prev.filter(t => t.id !== id)); 
      if(editingId === id) resetForm(); 
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', `txns_${currentUser.id}`, id)).catch(err => {
        if (err.code === 'permission-denied' || err.message?.toLowerCase().includes('permission')) setFirebasePermissionError(true);
      });
    });
  };
  
  const toggleStatus = async (id) => { 
    const t = transactions.find(tx => tx.id === id);
    if (!t) return;
    const newStatus = (t.status || 'paid') === 'paid' ? 'pending' : 'paid';
    
    setTransactions(transactions.map(tx => tx.id === id ? { ...tx, status: newStatus } : tx)); 
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', `txns_${currentUser.id}`, id), { ...t, status: newStatus }).catch(err => {
      if (err.code === 'permission-denied' || err.message?.toLowerCase().includes('permission')) setFirebasePermissionError(true);
    });
  };

  const prevMonth = () => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); } else { setCurrentMonth(currentMonth - 1); } };
  const nextMonth = () => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); } else { setCurrentMonth(currentMonth + 1); } };
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  // ----------------------------------------------------------------------
  // CÁLCULOS
  // ----------------------------------------------------------------------
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

  const simFutureValue = useMemo(() => {
    const r = simRate / 100;
    const n = simYears * 12;
    const p = simInitial;
    const pmt = simMonthly;
    let total = p * Math.pow(1 + r, n);
    if (r > 0) {
      total += pmt * ((Math.pow(1 + r, n) - 1) / r);
    } else {
      total += pmt * n;
    }
    return total;
  }, [simInitial, simMonthly, simRate, simYears]);

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

  const pieSvgString = useMemo(() => {
    if (chartData.length === 0) return '';
    if (chartData.length === 1) {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%" style="width: 100%; height: 100%; display: block;"><circle cx="50" cy="50" r="50" fill="${chartData[0].color}" /></svg>`;
    }
    let paths = chartData.map(d => {
      if (d.percentage === 100) return `<circle cx="50" cy="50" r="50" fill="${d.color}" />`;
      const startX = 50 + 50 * Math.cos(2 * Math.PI * (d.startAngle / 100 - 0.25));
      const startY = 50 + 50 * Math.sin(2 * Math.PI * (d.startAngle / 100 - 0.25));
      const endX = 50 + 50 * Math.cos(2 * Math.PI * (d.endAngle / 100 - 0.25));
      const endY = 50 + 50 * Math.sin(2 * Math.PI * (d.endAngle / 100 - 0.25));
      const largeArc = d.percentage > 50 ? 1 : 0;
      return `<path d="M 50 50 L ${startX} ${startY} A 50 50 0 ${largeArc} 1 ${endX} ${endY} Z" fill="${d.color}" />`;
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%" style="width: 100%; height: 100%; display: block;">${paths}</svg>`;
  }, [chartData]);

  const handleCalcClickWrapper = (val) => {
    setCalcInput(prev => {
      if (val === 'C') return '';
      if (val === '⌫') return prev === 'Erro' ? '' : prev.slice(0, -1);
      if (val === '%') {
        if (!prev || prev === 'Erro') return '';
        const evaluated = evaluateMath(prev);
        if (evaluated === 'Erro') return 'Erro';
        const num = parseFloat(evaluated.replace(',', '.'));
        return String(num / 100).replace('.', ',');
      }
      if (val === '=') return evaluateMath(prev);
      
      return prev === 'Erro' ? val : prev + val;
    });
  };

  const nativeInsights = useMemo(() => {
    let insights = [];
    const currentDay = new Date().getDate();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    if (currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear()) {
      if (budgetPercentage > 90) insights.push("🚨 Alerta: Já gastou quase todo o seu orçamento previsto para este mês!");
      else if (budgetPercentage < 50 && income > 0 && currentDay > 15) insights.push("✅ Excelente! Os seus gastos estão bem controlados até agora.");
      
      if (currentDay > 5 && expense > 0) {
        const runRate = (expense / currentDay) * daysInMonth;
        if (runRate > income && income > 0) {
           insights.push(`📉 Previsão: Se continuar a gastar neste ritmo, vai acabar o mês no vermelho.`);
        } else if (income > 0) {
           insights.push(`📈 Previsão: Mantendo este ritmo, deverá sobrar dinheiro no fim do mês.`);
        }
      }
    }
    
    let badges = [];
    if (realBalance > 0) badges.push({ icon: <TrendingUp className="w-4 h-4"/>, label: 'Mês no Azul' });
    if (investment > 0) badges.push({ icon: <Target className="w-4 h-4"/>, label: 'Investidor' });
    
    return { insights, badges };
  }, [budgetPercentage, income, expense, investment, currentMonth, currentYear, realBalance]);

  const todayTip = useMemo(() => dailyTips[new Date().getDate() % dailyTips.length], []);

  useEffect(() => {
    if (currentMonth !== new Date().getMonth() && realBalance > 0) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [currentMonth, realBalance]);

  // ----------------------------------------------------------------------
  // SISTEMA EXCEL E PDF
  // ----------------------------------------------------------------------
  const handleExportCSV = () => {
    const yearTransactions = transactions.filter(t => t.date.startsWith(currentYear.toString()));

    const monthKeysSet = new Set();
    yearTransactions.forEach(t => monthKeysSet.add(t.date.substring(0, 7)));
    const monthKeys = Array.from(monthKeysSet).sort();

    const activeCards = cards.filter(c => {
      return yearTransactions.some(t => t.type === 'expense' && (t.category === c.id || t.category === c.name));
    });
    
    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8" />
    <style>
      table { background-color: #ffffff; color: #000000; border-collapse: collapse; font-family: Calibri, sans-serif; font-size: 14px; }
      td, th { border: 1px solid #dddddd; padding: 6px; text-align: center; white-space: nowrap; }
      .hdr { font-weight: bold; text-align: left; background-color: #f3f4f6; }
      .inc { color: #059669; font-weight: bold; }
      .exp { color: #dc2626; font-weight: bold; }
      .total-row { font-weight: bold; background-color: #e5e7eb; }
    </style></head><body>
    <h2 style="color: #1e293b; font-family: Calibri, sans-serif;">Demonstrativo Financeiro - Ano ${currentYear}</h2>
    <table>`;

    html += `<tr><td class="hdr">Banco / Cartão</td>`;
    activeCards.forEach(c => html += `<td class="hdr">${c.id}</td>`);
    html += `<td class="hdr">Total</td></tr>`;

    html += `<tr><td class="hdr">Sobra</td>`;
    let totalSobra = 0;
    activeCards.forEach(c => {
      const used = yearTransactions.filter(t => t.type === 'expense' && (t.category === c.id || t.category === c.name)).reduce((sum, t) => sum + t.amount, 0);
      const sobra = c.limit - used;
      totalSobra += sobra;
      html += `<td>${sobra.toFixed(2)}</td>`;
    });
    html += `<td>${totalSobra.toFixed(2)}</td></tr>`;

    html += `<tr><td class="hdr">Limite</td>`;
    let totalLimite = 0;
    activeCards.forEach(c => { totalLimite += c.limit; html += `<td>${c.limit.toFixed(2)}</td>`; });
    html += `<td>${totalLimite.toFixed(2)}</td></tr>`;

    html += `<tr><td class="hdr">Data Venc.</td>`;
    activeCards.forEach(c => html += `<td>Dia ${c.dueDay}</td>`);
    html += `<td></td></tr>`;

    html += `<tr><td colspan="${activeCards.length + 2}" style="border: none; background-color: #ffffff; height: 20px;"></td></tr>`;

    html += `<tr><td class="hdr">Categorias</td>`;
    monthKeys.forEach(ym => {
      const [y, m] = ym.split('-');
      html += `<td class="hdr">${monthNames[parseInt(m)-1]}</td>`;
    });
    html += `<td class="hdr">Total Anual</td></tr>`;

    let incomeTotalGlobal = 0;
    const incomeMonthsTotal = new Array(monthKeys.length).fill(0);
    categories.income.forEach(cat => {
      let rowTotal = 0;
      let rowHtml = `<tr><td class="hdr">${cat}</td>`;
      let hasValue = false;
      monthKeys.forEach((m, i) => {
        const val = yearTransactions.filter(t => t.category === cat && t.type === 'income' && t.date.startsWith(m)).reduce((s, t) => s + t.amount, 0);
        rowTotal += val; incomeMonthsTotal[i] += val; if (val > 0) hasValue = true;
        rowHtml += `<td class="inc">${val > 0 ? (+val).toFixed(2) : ''}</td>`;
      });
      incomeTotalGlobal += rowTotal;
      rowHtml += `<td class="inc">${rowTotal > 0 ? (+rowTotal).toFixed(2) : ''}</td></tr>`;
      if (hasValue) html += rowHtml; 
    });

    let expenseTotalGlobal = 0;
    const expenseMonthsTotal = new Array(monthKeys.length).fill(0);
    [...categories.expense, ...categories.investment].forEach(cat => {
      let rowTotal = 0;
      let rowHtml = `<tr><td class="hdr">${cat}</td>`;
      let hasValue = false;
      monthKeys.forEach((m, i) => {
        const val = yearTransactions.filter(t => t.category === cat && (t.type === 'expense' || t.type === 'investment') && t.date.startsWith(m)).reduce((s, t) => s + t.amount, 0);
        rowTotal += val; expenseMonthsTotal[i] += val; if (val > 0) hasValue = true;
        rowHtml += `<td class="exp">${val > 0 ? val.toFixed(2) : ''}</td>`;
      });
      expenseTotalGlobal += rowTotal;
      rowHtml += `<td class="exp">${rowTotal > 0 ? rowTotal.toFixed(2) : ''}</td></tr>`;
      if (hasValue) html += rowHtml;
    });

    html += `<tr class="total-row"><td class="hdr">Total de Gastos</td>`;
    expenseMonthsTotal.forEach(val => html += `<td class="exp">${val.toFixed(2)}</td>`);
    html += `<td class="exp">${expenseTotalGlobal.toFixed(2)}</td></tr>`;

    html += `<tr class="total-row"><td class="hdr">Sobra Mensal</td>`;
    let grandSobraGlobal = 0;
    monthKeys.forEach((m, i) => {
      const sobra = incomeMonthsTotal[i] - expenseMonthsTotal[i];
      grandSobraGlobal += sobra;
      html += `<td style="color: ${sobra >= 0 ? '#059669' : '#dc2626'}; font-weight: bold;">${sobra.toFixed(2)}</td>`;
    });
    html += `<td style="color: ${grandSobraGlobal >= 0 ? '#059669' : '#dc2626'}; font-weight: bold;">${grandSobraGlobal.toFixed(2)}</td></tr>`;

    html += `</table></body></html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Controle_Financeiro_${currentYear}.xls`;
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

      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      const centerX = 200;
      const centerY = 200;
      const radius = 200;
      
      if (chartData.length === 0) {
        ctx.fillStyle = '#f1f5f9';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fill();
      } else {
        chartData.forEach(d => {
          ctx.fillStyle = d.color;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          const startRad = (d.startAngle / 100) * 2 * Math.PI - (Math.PI / 2);
          const endRad = (d.endAngle / 100) * 2 * Math.PI - (Math.PI / 2);
          ctx.arc(centerX, centerY, radius, startRad, endRad);
          ctx.fill();
        });
      }
      const pieChartImagePNG = canvas.toDataURL('image/png');

      const element = document.createElement('div');
      element.innerHTML = `
        <div style="padding: 40px; font-family: 'Plus Jakarta Sans', sans-serif; color: #0f172a; background: #fff;">
          <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px;">
            <h1 style="color: #0f172a; font-size: 32px; margin: 0 0 10px 0; font-weight: 900;">Relatório Financeiro</h1>
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
                <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'}; page-break-inside: avoid;">
                  <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: bold;">
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
          
          ${expense > 0 ? `
          <div style="margin-top: 40px; page-break-inside: avoid; background: #fff;">
            <h3 style="color: #0f172a; font-size: 18px; text-align: center; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; font-weight: 900; text-transform: uppercase;">Análise de Gastos</h3>
            <div style="display: flex; justify-content: center; align-items: center; gap: 40px; padding: 20px;">
              <div style="width: 160px; height: 160px; border-radius: 50%; border: 8px solid #f8fafc; overflow: hidden; background: #f1f5f9;">
                <img src="${pieChartImagePNG}" style="width: 100%; height: 100%; display: block; object-fit: contain;" />
              </div>
              <div style="display: flex; flex-direction: column; gap: 8px; flex: 1; max-width: 250px;">
                ${chartData.map(d => `
                  <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${d.color};"></div>
                      <span style="font-size: 12px; font-weight: bold; color: #334155;">${d.category}</span>
                    </div>
                    <span style="font-size: 12px; color: #64748b; font-weight: bold;">${d.percentage.toFixed(0)}%</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>` : ''}

          <div style="margin-top: 30px; text-align: center; font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; page-break-inside: avoid;">
            Documento gerado pelo sistema 100 Aperto em ${new Date().toLocaleDateString('pt-BR')}
          </div>
        </div>
      `;

      const opt = {
        margin:       [0.4, 0.4, 0.4, 0.4],
        filename:     `Relatorio_Financeiro_${monthNames[currentMonth]}_${currentYear}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] },
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

  const permissionModal = firebasePermissionError && (
    <div className="fixed inset-0 z-[200] bg-[#0b0410]/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md text-center shadow-2xl animate-in zoom-in-95">
        <div className="mx-auto w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-rose-600" />
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-3">Permissão Negada (Firebase)</h3>
        <p className="text-sm font-bold text-slate-600 mb-6">
          Para a aplicação conseguir guardar os seus dados, precisa de ir ao painel do Firebase ➔ <b>Firestore Database</b> ➔ <b>Regras (Rules)</b> e definir as permissões como verdadeiras:
        </p>
        <div className="bg-[#1a0b2e] p-4 rounded-xl text-left text-xs font-mono text-emerald-400 mb-6 overflow-auto border border-[#321759]">
          rules_version = '2';<br/>
          service cloud.firestore {'{'}<br/>
          &nbsp;&nbsp;match /databases/{"{database}"}/documents {'{'}<br/>
          &nbsp;&nbsp;&nbsp;&nbsp;match /{"{document=**}"} {'{'}<br/>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;allow read, write: if true;<br/>
          &nbsp;&nbsp;&nbsp;&nbsp;{'}'}<br/>
          &nbsp;&nbsp;{'}'}<br/>
          {'}'}
        </div>
        <button onClick={() => setFirebasePermissionError(false)} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition-all shadow-lg active:scale-95">
          Já corrigi as regras
        </button>
      </div>
    </div>
  );

  // ----------------------------------------------------------------------
  // ECRÃ DE LOGIN E UI GERAL
  // ----------------------------------------------------------------------
  if (!currentUser) {
    return (
      <>
        {permissionModal}
        <style dangerouslySetInnerHTML={{__html: `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');`}} />
        <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden ${isDarkMode ? 'bg-[#0b0410]' : 'bg-slate-50'}`} style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
          
          <div className={`w-full max-w-md mx-4 relative z-10 p-8 md:p-12 rounded-[2.5rem] shadow-2xl transition-all duration-500 ${isDarkMode ? 'bg-[#1a0b2e] border border-[#321759] shadow-purple-900/20' : 'bg-white border border-slate-200 shadow-indigo-900/5'}`}>
            <div className="flex justify-center mb-8">
              {/* Moldura Premium para o novo Ícone */}
              <div className={`w-32 h-32 rounded-[2rem] shadow-xl overflow-hidden shrink-0 flex items-center justify-center p-1 ${isDarkMode ? 'bg-[#2d144d] border-[#441f74] shadow-purple-900/20' : 'bg-white border-slate-100 shadow-indigo-600/10'} border-2 relative group`}>
                <img src="/logo.jpg" alt="100 Aperto" className="w-full h-full object-cover scale-[1.05] rounded-[1.8rem] transition-transform duration-700 group-hover:scale-[1.12]" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                <div style={{ display: 'none' }} className="w-full h-full bg-indigo-600 rounded-[1.8rem] items-center justify-center">
                   <Wallet className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>
            
            <h1 className={`text-4xl md:text-5xl font-black text-center mb-3 tracking-tighter flex justify-center items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <span className="text-amber-500">100</span>
              <span>Aperto</span>
            </h1>
            
            <p className={`text-center mb-8 font-semibold text-sm md:text-base tracking-wide ${isDarkMode ? 'text-purple-300/70' : 'text-slate-500'}`}>
              {authMode === 'login' ? 'Inteligência financeira ao seu alcance.' : 'Transforme o seu futuro financeiro hoje.'}
            </p>
            
            <form onSubmit={handleAuth} className="space-y-5">
              {authError && <div className="bg-rose-500/10 text-rose-500 p-4 rounded-2xl text-sm font-bold text-center border border-rose-500/20">{authError}</div>}
              
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className={`h-5 w-5 ${isDarkMode ? 'text-purple-300/70' : 'text-slate-400'} group-focus-within:text-amber-500 transition-colors`} />
                </div>
                <input type="text" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="Nome ou E-mail" className={`w-full pl-12 pr-4 py-4 rounded-2xl outline-none transition-all font-bold ${isDarkMode ? 'bg-[#0b0410] border border-[#321759] text-white placeholder-purple-300/40 focus:ring-amber-500/20 focus:border-amber-500' : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm'}`} />
              </div>
              
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${isDarkMode ? 'text-purple-300/70' : 'text-slate-400'} group-focus-within:text-amber-500 transition-colors`} />
                </div>
                <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="Palavra-passe" className={`w-full pl-12 pr-4 py-4 rounded-2xl outline-none transition-all font-bold ${isDarkMode ? 'bg-[#0b0410] border border-[#321759] text-white placeholder-purple-300/40 focus:ring-amber-500/20 focus:border-amber-500' : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm'}`} />
              </div>
              
              <button disabled={isAuthLoading} type="submit" className={`w-full py-4 mt-4 font-black uppercase tracking-widest text-sm rounded-2xl transform transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 ${isDarkMode ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/50' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'}`}>
                {isAuthLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (authMode === 'login' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />)}
                {authMode === 'login' ? 'Entrar na Conta' : 'Criar Conta'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); setEmailInput(''); setPasswordInput(''); }} className={`font-bold text-xs uppercase tracking-widest transition-colors ${isDarkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-500'}`}>
                {authMode === 'login' ? 'Não tem uma conta? Registe-se aqui' : 'Já tem uma conta? Entre aqui'}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ----------------------------------------------------------------------
  // ECRÃ PRINCIPAL (DASHBOARD)
  // ----------------------------------------------------------------------
  return (
    <>
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-start justify-center overflow-hidden">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce absolute top-10 left-1/4"></div>
          <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse absolute top-20 right-1/4"></div>
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce absolute top-1/3 left-1/3"></div>
          <div className="w-4 h-4 bg-rose-500 rounded-full animate-pulse absolute top-1/4 right-1/3"></div>
          <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce absolute top-1/2 left-1/2"></div>
        </div>
      )}

      {permissionModal}

      {/* DEFINIÇÕES DE ESTILO E FONTE */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        /* MODO ESCURO */
        .dark-theme { background-color: #0b0410 !important; color: #f8fafc !important; }
        .dark-theme .text-slate-900, .dark-theme .text-slate-800 { color: #f8fafc !important; }
        .dark-theme .text-slate-700, .dark-theme .text-slate-600 { color: #e9d5ff !important; }
        .dark-theme .text-slate-500, .dark-theme .text-slate-400 { color: rgba(216, 180, 254, 0.7) !important; }

        /* UTILITÁRIOS MODO ESCURO */
        .dark-theme .bg-emerald-50 { background-color: rgba(6, 78, 59, 0.3) !important; border-color: rgba(52, 211, 153, 0.2) !important;}
        .dark-theme .bg-rose-50 { background-color: rgba(136, 19, 55, 0.3) !important; border-color: rgba(251, 113, 133, 0.2) !important;}
        .dark-theme .bg-indigo-50 { background-color: rgba(49, 46, 129, 0.3) !important; border-color: rgba(129, 140, 248, 0.2) !important;}
        .dark-theme .bg-amber-50 { background-color: rgba(120, 53, 15, 0.3) !important; border-color: rgba(251, 191, 36, 0.2) !important;}

        .dark-theme .bg-grid-pattern {
          background-image: linear-gradient(to right, rgba(167, 139, 250, 0.05) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(167, 139, 250, 0.05) 1px, transparent 1px);
        }
      `}} />

      <div className={`min-h-screen relative pb-24 md:pb-12 ${isDarkMode ? 'bg-[#0b0410] text-white' : 'bg-slate-50 text-slate-900'}`}>
        
        {/* --- HEADER --- */}
        <header className={`relative z-40 transition-colors duration-500 no-print border-b ${isDarkMode ? 'bg-[#0b0410] border-[#1a0b2e]' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="max-w-7xl mx-auto px-4 py-3 md:py-4 flex flex-col md:flex-row justify-between items-center gap-4">
            
            <div className="flex justify-between w-full md:w-auto items-center">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-[1.2rem] shadow-sm overflow-hidden shrink-0 border flex items-center justify-center ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759]' : 'bg-white border-slate-200'}`}>
                  <img src="/logo.jpg" alt="100 Aperto" className="w-full h-full object-cover scale-[1.05] rounded-[1.1rem]" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                  <div style={{ display: 'none' }} className="w-full h-full bg-indigo-600 rounded-[1.1rem] items-center justify-center">
                     <Wallet className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <h1 className="text-2xl font-black tracking-tight leading-none flex gap-1">
                    <span className="text-amber-500">100</span>
                    <span>Aperto</span>
                  </h1>
                  <span className={`text-[10px] font-bold tracking-widest uppercase mt-0.5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Olá, {currentUser?.name}</span>
                </div>
              </div>
              <div className="flex md:hidden items-center gap-1.5">
                <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'bg-[#1a0b2e] hover:bg-[#2d144d]' : 'bg-slate-100 hover:bg-slate-200'}`}>
                  {isDarkMode ? <Sun className="w-4 h-4 text-white" /> : <Moon className="w-4 h-4 text-slate-700" />}
                </button>
                <button onClick={() => setShowCalculator(true)} className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'bg-[#1a0b2e] hover:bg-[#2d144d]' : 'bg-slate-100 hover:bg-slate-200'}`}>
                  <CalculatorIcon className={`w-4 h-4 ${isDarkMode ? 'text-white' : 'text-slate-700'}`} />
                </button>
                <button onClick={handleLogout} className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'bg-rose-900/20 hover:bg-rose-900/40 text-rose-400' : 'bg-rose-50 hover:bg-rose-100 text-rose-500'}`}>
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className={`flex items-center gap-1 rounded-2xl p-1 w-full md:w-auto justify-between border ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759]' : 'bg-slate-50 border-slate-200'}`}>
              <button onClick={prevMonth} className={`p-2.5 rounded-xl transition-colors shadow-sm ${isDarkMode ? 'hover:bg-[#2d144d]' : 'hover:bg-white'}`}><ChevronLeft className="w-5 h-5" /></button>
              <div className="flex items-center gap-2 font-black text-base md:text-lg px-4">
                <Calendar className="w-4 h-4 opacity-60 hidden md:block" />
                {monthNames[currentMonth]} {currentYear}
              </div>
              <button onClick={nextMonth} className={`p-2.5 rounded-xl transition-colors shadow-sm ${isDarkMode ? 'hover:bg-[#2d144d]' : 'hover:bg-white'}`}><ChevronRight className="w-5 h-5" /></button>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <div className={`flex items-center gap-2 text-sm font-bold mr-2 px-5 py-2.5 rounded-2xl border ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759]' : 'bg-slate-50 border-slate-200'}`}>
                <User className={`w-4 h-4 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} /> <span className="max-w-[120px] truncate">{currentUser?.name}</span>
                {nativeInsights.badges.length > 0 && <div className={`w-px h-4 mx-1 ${isDarkMode ? 'bg-slate-600' : 'bg-slate-300'}`}></div>}
                <div className="flex -space-x-1">
                  {nativeInsights.badges.map((b, i) => <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center shadow-sm border ${isDarkMode ? 'bg-[#2d144d] border-[#441f74] text-indigo-300' : 'bg-white border-slate-200 text-indigo-600'}`} title={b.label}>{b.icon}</div>)}
                </div>
              </div>
              <div className={`flex p-1.5 rounded-2xl gap-1 border ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759]' : 'bg-slate-50 border-slate-200'}`}>
                <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2.5 rounded-xl transition-colors shadow-sm ${isDarkMode ? 'hover:bg-[#2d144d]' : 'hover:bg-white'}`} title="Alternar Tema Escuro">
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5 text-slate-700" />}
                </button>
                <button onClick={() => setShowSettingsModal(true)} className={`p-2.5 rounded-xl transition-colors shadow-sm ${isDarkMode ? 'hover:bg-[#2d144d] text-white' : 'hover:bg-white text-slate-700'}`} title="Configurações"><Settings className="w-5 h-5" /></button>
                <button onClick={() => setShowCalculator(true)} className={`p-2.5 rounded-xl transition-colors shadow-sm ${isDarkMode ? 'hover:bg-[#2d144d] text-white' : 'hover:bg-white text-slate-700'}`} title="Calculadora"><CalculatorIcon className="w-5 h-5" /></button>
                <button onClick={() => setShowSyncModal(true)} className={`p-2.5 rounded-xl transition-colors shadow-sm ${isDarkMode ? 'hover:bg-[#2d144d] text-white' : 'hover:bg-white text-slate-700'}`} title="Sincronizar Dados"><RefreshCw className="w-5 h-5" /></button>
                <button onClick={handleLogout} className={`p-2.5 rounded-xl transition-colors shadow-sm ${isDarkMode ? 'hover:bg-rose-900/30 text-rose-400' : 'hover:bg-rose-50 text-rose-500'}`} title="Sair da Conta"><LogOut className="w-5 h-5" /></button>
              </div>
            </div>
          </div>

          <div className={`px-4 py-2.5 flex items-center justify-center gap-2 text-xs font-bold border-t ${isDarkMode ? 'bg-indigo-900/20 border-[#321759] text-indigo-300' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}`}>
            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="truncate max-w-[90%]">{todayTip}</span>
          </div>
        </header>

        {/* NAVEGAÇÃO DE TABS */}
        <div className="max-w-7xl mx-auto px-4 mt-6 relative z-10 no-print">
          <div className={`flex gap-2 p-1.5 rounded-[1.2rem] shadow-sm border overflow-x-auto hide-scrollbar ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759]' : 'bg-white border-slate-200'}`}>
            <button onClick={() => setActiveTab('dashboard')} className={`flex-1 min-w-[100px] py-3 px-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : (isDarkMode ? 'text-purple-300/70 hover:bg-[#2d144d]' : 'text-slate-500 hover:bg-slate-50')}`}><LayoutDashboard className="w-4 h-4" /> Resumo</button>
            <button onClick={() => setActiveTab('extrato')} className={`flex-1 min-w-[100px] py-3 px-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'extrato' ? 'bg-indigo-600 text-white shadow-md' : (isDarkMode ? 'text-purple-300/70 hover:bg-[#2d144d]' : 'text-slate-500 hover:bg-slate-50')}`}><ListOrdered className="w-4 h-4" /> Extrato</button>
            <button onClick={() => setActiveTab('metas')} className={`flex-1 min-w-[100px] py-3 px-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'metas' ? 'bg-indigo-600 text-white shadow-md' : (isDarkMode ? 'text-purple-300/70 hover:bg-[#2d144d]' : 'text-slate-500 hover:bg-slate-50')}`}><Target className="w-4 h-4" /> Orçamento</button>
            <button onClick={() => setActiveTab('simulador')} className={`flex-1 min-w-[100px] py-3 px-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'simulador' ? 'bg-indigo-600 text-white shadow-md' : (isDarkMode ? 'text-purple-300/70 hover:bg-[#2d144d]' : 'text-slate-500 hover:bg-slate-50')}`}><TrendingUp className="w-4 h-4" /> Evolução</button>
          </div>
        </div>

        {/* CONTEÚDO PRINCIPAL */}
        <main className="max-w-7xl mx-auto px-4 mt-8 relative z-10 no-print">
          {!isDataLoaded && firebaseReady ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
              <p className="text-slate-500 font-bold">A carregar os seus dados...</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  
                  {nativeInsights.insights.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {nativeInsights.insights.map((insight, idx) => (
                        <div key={idx} className={`p-4 sm:p-5 rounded-2xl flex items-start gap-4 shadow-sm border ${isDarkMode ? 'bg-indigo-900/20 border-[#321759]' : 'bg-indigo-50 border-indigo-200'}`}>
                          <div className={`p-2 sm:p-2.5 rounded-full shadow-sm shrink-0 border ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759]' : 'bg-white border-transparent'}`}><Info className={`w-5 h-5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} /></div>
                          <p className={`text-xs sm:text-sm font-black leading-tight mt-1 ${isDarkMode ? 'text-indigo-100' : 'text-indigo-900'}`}>{insight}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
                    <div className={`rounded-[2rem] p-6 sm:p-8 flex flex-col relative overflow-hidden shadow-sm border transition-all duration-300 ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759] hover:border-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
                      <div className="flex justify-between items-start z-10">
                        <span className={`font-black text-xs tracking-widest uppercase ${isDarkMode ? 'text-purple-300/70' : 'text-slate-500'}`}>Saldo Real</span>
                        <span className={`text-[10px] px-2.5 py-1 rounded-lg font-black uppercase tracking-widest border ${isDarkMode ? 'bg-[#2d144d] border-[#441f74] text-purple-200' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>Mês Atual</span>
                      </div>
                      <span className={`text-3xl sm:text-4xl md:text-5xl font-black mt-4 z-10 tracking-tight break-words whitespace-normal leading-none ${realBalance >= 0 ? (isDarkMode ? 'text-white' : 'text-slate-900') : (isDarkMode ? 'text-rose-400' : 'text-rose-600')}`}>
                        {formatCurrency(realBalance)}
                      </span>
                      <div className={`mt-auto pt-5 border-t text-xs font-black flex justify-between items-center z-10 gap-2 ${isDarkMode ? 'border-[#321759]' : 'border-slate-100'}`}>
                        <span className={`uppercase tracking-wider text-[10px] shrink-0 ${isDarkMode ? 'text-purple-300/70' : 'text-slate-500'}`}>Previsto</span>
                        <span className={`break-words ${expectedBalance >= 0 ? (isDarkMode ? 'text-purple-200' : 'text-slate-700') : (isDarkMode ? 'text-rose-400' : 'text-rose-600')}`}>{formatCurrency(expectedBalance)}</span>
                      </div>
                    </div>

                    <div className={`rounded-[2rem] p-6 sm:p-8 flex flex-col justify-between shadow-sm border transition-all duration-300 ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759] hover:border-emerald-500' : 'bg-white border-slate-200 hover:border-emerald-300'}`}>
                      <div className={`flex items-center gap-2 font-black text-xs uppercase tracking-widest ${isDarkMode ? 'text-purple-300/70' : 'text-slate-500'}`}>
                        <div className={`p-2 rounded-xl border ${isDarkMode ? 'bg-emerald-900/30 border-emerald-800/50' : 'bg-emerald-50 border-emerald-100'}`}><ArrowUpCircle className={`w-5 h-5 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} /></div> Entradas
                      </div>
                      <span className={`text-3xl xl:text-4xl font-black mt-5 tracking-tight break-words leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(income)}</span>
                    </div>

                    <div className={`rounded-[2rem] p-6 sm:p-8 flex flex-col relative justify-between shadow-sm border transition-all duration-300 ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759] hover:border-rose-500' : 'bg-white border-slate-200 hover:border-rose-300'}`}>
                      <div className="flex justify-between items-center">
                        <div className={`flex items-center gap-2 font-black text-xs uppercase tracking-widest shrink-0 ${isDarkMode ? 'text-purple-300/70' : 'text-slate-500'}`}>
                          <div className={`p-2 rounded-xl border ${isDarkMode ? 'bg-rose-900/30 border-rose-800/50' : 'bg-rose-50 border-rose-100'}`}><ArrowDownCircle className={`w-5 h-5 ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`} /></div> Gastos
                        </div>
                        {income > 0 && <span className={`text-[10px] font-black px-2 py-1 rounded-lg border uppercase whitespace-nowrap ml-2 ${isDarkMode ? 'text-rose-400 bg-rose-900/30 border-rose-800/50' : 'text-rose-600 bg-rose-50 border-rose-200'}`}>{budgetPercentage.toFixed(0)}% Usado</span>}
                      </div>
                      <span className={`text-3xl xl:text-4xl font-black mt-5 tracking-tight break-words leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(expense)}</span>
                      <div className={`w-full h-2.5 rounded-full mt-6 overflow-hidden shadow-inner shrink-0 ${isDarkMode ? 'bg-[#2d144d]' : 'bg-slate-100'}`}>
                        <div className={`h-full rounded-full transition-all duration-1000 ${budgetPercentage > 85 ? 'bg-rose-500' : budgetPercentage > 60 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${budgetPercentage}%` }}></div>
                      </div>
                    </div>

                    <div className={`rounded-[2rem] p-6 sm:p-8 flex flex-col col-span-1 sm:col-span-2 xl:col-span-1 justify-between shadow-sm border ${isDarkMode ? 'bg-indigo-900/20 border-[#321759]' : 'bg-indigo-50 border-indigo-100'}`}>
                      <div className={`flex items-center gap-2 font-black text-xs uppercase tracking-widest ${isDarkMode ? 'text-indigo-300' : 'text-indigo-800'}`}>
                        <div className={`p-2 rounded-xl shadow-sm border ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759]' : 'bg-white border-indigo-100'}`}><TrendingUp className={`w-5 h-5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} /></div> Investimentos
                      </div>
                      <div className="flex flex-col mt-5 overflow-hidden">
                        <div className="flex justify-between items-end mb-4 gap-2">
                          <span className={`text-xs font-black uppercase tracking-widest shrink-0 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-500'}`}>Neste Mês</span>
                          <span className={`text-2xl font-black tracking-tight break-words text-right ${isDarkMode ? 'text-white' : 'text-indigo-900'}`}>{formatCurrency(investment)}</span>
                        </div>
                        <div className={`flex justify-between items-end pt-4 border-t gap-2 ${isDarkMode ? 'border-[#321759]' : 'border-indigo-200/50'}`}>
                          <span className={`text-xs font-black uppercase tracking-widest shrink-0 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Acumulado</span>
                          <span className={`text-xl lg:text-2xl font-black tracking-tight break-words text-right ${isDarkMode ? 'text-indigo-200' : 'text-indigo-700'}`}>{formatCurrency(accumulatedInvestment)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`rounded-[2rem] p-6 sm:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-sm border ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759]' : 'bg-white border-slate-200'}`}>
                    <div>
                      <h3 className={`font-black text-xl sm:text-2xl mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Acesso Rápido</h3>
                      <p className={`text-sm sm:text-base font-bold ${isDarkMode ? 'text-purple-300/70' : 'text-slate-500'}`}>Faça a gestão dos seus cartões e analise os seus gastos no gráfico.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                      <button onClick={() => setShowCardsModal(true)} className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-md active:scale-95 w-full sm:w-auto ${isDarkMode ? 'bg-[#2d144d] text-white hover:bg-[#3f1d6b]' : 'bg-slate-900 text-white hover:bg-black'}`}>
                        <CreditCard className="w-5 h-5" /> Cartões
                      </button>
                      <button onClick={() => setShowChartModal(true)} className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 w-full sm:w-auto border ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759] text-indigo-400 hover:bg-[#2d144d]' : 'bg-white border-slate-200 text-indigo-700 hover:bg-slate-50'}`}>
                        <PieChart className="w-5 h-5" /> Gráfico
                      </button>
                      <button onClick={() => setShowPurchaseModal(true)} className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 w-full sm:w-auto border ${isDarkMode ? 'bg-purple-900/20 border-purple-800/50 text-purple-300 hover:bg-purple-900/40' : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'}`}>
                        <ShoppingBag className="w-5 h-5" /> ✨ Consultor
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'extrato' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 space-y-5">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 group">
                      <Search className={`absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${isDarkMode ? 'text-purple-300/70 group-focus-within:text-indigo-400' : 'text-slate-500 group-focus-within:text-indigo-600'}`} />
                      <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Pesquisar transações..." className={`w-full pl-14 pr-5 py-4 rounded-[1.5rem] outline-none focus:ring-4 transition-all font-black text-lg shadow-sm border ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759] text-white focus:border-indigo-500 focus:ring-indigo-500/10 placeholder-purple-300/50' : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-400 focus:ring-indigo-500/10 placeholder-slate-400'}`} />
                    </div>
                    
                    <div className="flex gap-3">
                      <button onClick={handleGeneratePDF} disabled={isGeneratingPDF} className={`flex-1 md:flex-none flex items-center justify-center p-4 rounded-[1.5rem] transition-all shadow-sm active:scale-95 border ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759] text-purple-200 hover:bg-[#2d144d]' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'} ${isGeneratingPDF ? 'opacity-50 cursor-not-allowed' : ''}`} title="Gerar Relatório PDF / Imprimir">
                        {isGeneratingPDF ? <Loader2 className="w-6 h-6 animate-spin text-indigo-500" /> : <Printer className="w-6 h-6" />}
                      </button>
                      <button onClick={handleExportCSV} className={`flex-1 md:flex-none flex items-center justify-center p-4 rounded-[1.5rem] transition-all shadow-sm active:scale-95 border ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759] text-emerald-400 hover:bg-[#2d144d]' : 'bg-white border-slate-200 text-emerald-600 hover:bg-emerald-50'}`} title="Exportar para Tabela Excel (XLS)">
                        <FileSpreadsheet className="w-6 h-6" />
                      </button>
                      <button onClick={generateAiInsights} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-[1.5rem] transition-all shadow-md active:scale-95" title="Insights com IA">
                        <Sparkles className="w-6 h-6" />
                      </button>
                    </div>
                  </div>

                  <div className={`rounded-[2rem] overflow-hidden shadow-sm border ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759]' : 'bg-white border-slate-200'}`}>
                    <div className={`p-5 sm:p-6 md:p-8 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-5 ${isDarkMode ? 'bg-[#0b0410]/50 border-[#321759]' : 'bg-slate-50 border-slate-200'}`}>
                      <h2 className={`text-lg sm:text-xl font-black flex items-center gap-3 w-full sm:w-auto ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        <div className={`p-2 sm:p-2.5 rounded-xl shrink-0 ${isDarkMode ? 'bg-indigo-900/50' : 'bg-indigo-100'}`}><ListOrdered className={`w-5 h-5 sm:w-6 sm:h-6 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} /></div>
                        Extrato do Mês
                      </h2>
                      <button onClick={() => setShowCardsModal(true)} className={`flex items-center justify-center w-full md:w-auto gap-2 px-5 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-md active:scale-95 ${isDarkMode ? 'bg-[#2d144d] text-white hover:bg-[#3e1c66]' : 'bg-slate-900 text-white hover:bg-black'}`}>
                        <CreditCard className="w-5 h-5" /> Cartões
                      </button>
                    </div>
                    
                    <div className="p-0 max-h-[600px] overflow-y-auto">
                      {filteredTransactions.length === 0 ? (
                        <div className="p-20 text-center flex flex-col items-center">
                          <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner border ${isDarkMode ? 'bg-[#0b0410] border-[#1a0b2e]' : 'bg-slate-100 border-transparent'}`}><ListOrdered className={`w-12 h-12 ${isDarkMode ? 'text-purple-400/50' : 'text-slate-400'}`} /></div>
                          <p className={`font-black text-xl tracking-tight ${isDarkMode ? 'text-purple-200' : 'text-slate-600'}`}>{searchTerm ? 'Nenhum resultado encontrado.' : 'Tudo limpo por aqui.'}</p>
                        </div>
                      ) : (
                        <ul className={`divide-y ${isDarkMode ? 'divide-[#321759]' : 'divide-slate-200/50'}`}>
                          {filteredTransactions.map((t) => {
                            const isPending = t.status === 'pending';
                            return (
                              <li key={t.id} className={`p-5 sm:p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-5 transition-all duration-200 ${isDarkMode ? 'hover:bg-[#2d144d]/50' : 'hover:bg-black/5'} ${editingId === t.id ? (isDarkMode ? 'bg-amber-900/20' : 'bg-amber-50/80') : ''} ${isPending ? 'opacity-80 border-l-4 border-l-amber-400' : 'border-l-4 border-l-transparent'}`}>
                                <div className="flex items-center gap-4 sm:gap-5 overflow-hidden w-full">
                                  <button onClick={() => toggleStatus(t.id)} className={`p-2.5 sm:p-3 rounded-2xl shrink-0 transition-transform active:scale-90 shadow-sm border ${isPending ? (isDarkMode ? 'bg-[#1a0b2e] border-amber-500 text-amber-500 hover:bg-[#2d144d]' : 'bg-white border-amber-300 text-amber-500 hover:bg-amber-50') : (isDarkMode ? 'bg-[#1a0b2e] border-emerald-500 text-emerald-500 hover:bg-[#2d144d]' : 'bg-white border-emerald-300 text-emerald-600 hover:bg-emerald-50')}`} title={isPending ? "Confirmar Pagamento" : "Tornar Pendente"}>
                                    {isPending ? <AlertCircle className="w-6 h-6 sm:w-7 sm:h-7" /> : <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7" />}
                                  </button>
                                  
                                  <div className="min-w-0 flex-1">
                                    <p className={`font-black text-base sm:text-lg md:text-xl break-words tracking-tight leading-tight ${isPending ? (isDarkMode ? 'text-purple-300/70' : 'text-slate-500') : (isDarkMode ? 'text-white' : 'text-slate-900')}`}>{t.description}</p>
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2">
                                      <span className={`px-2 py-1 rounded-lg uppercase tracking-widest text-[9px] sm:text-[10px] font-black border ${t.type === 'expense' ? (isDarkMode ? 'bg-rose-900/30 border-rose-800/50 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700') : t.type === 'income' ? (isDarkMode ? 'bg-emerald-900/30 border-emerald-800/50 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700') : (isDarkMode ? 'bg-indigo-900/30 border-indigo-800/50 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700')}`}>{t.category}</span>
                                      <span className={`text-[10px] sm:text-xs font-bold ${isDarkMode ? 'text-purple-300/70' : 'text-slate-500'}`}>{t.date.split('-').reverse().join('/')}</span>
                                      {isPending && <span className={`text-[9px] sm:text-[10px] font-black px-2 py-1 rounded-lg border uppercase tracking-widest ${isDarkMode ? 'text-amber-400 bg-amber-900/30 border-amber-800/50' : 'text-amber-600 bg-amber-50 border-amber-200'}`}>Pendente</span>}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className={`flex flex-row items-center justify-between sm:justify-end gap-3 sm:gap-5 w-full sm:w-auto mt-3 sm:mt-0 pt-3 sm:pt-0 sm:border-t-0 border-t ${isDarkMode ? 'border-[#321759]' : 'border-slate-200/50'}`}>
                                  <span className={`font-black tracking-tight text-lg sm:text-xl md:text-2xl break-words max-w-[150px] sm:max-w-[200px] md:max-w-none text-right ${t.type === 'income' ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-600') : t.type === 'expense' ? (isDarkMode ? 'text-rose-400' : 'text-rose-600') : (isDarkMode ? 'text-indigo-400' : 'text-indigo-600')} ${isPending ? 'opacity-60' : ''}`}>
                                    {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                                  </span>
                                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                    <button onClick={() => { handleEdit(t); setShowTransactionModal(true); }} className={`p-2.5 sm:p-3 rounded-xl transition-all shadow-sm active:scale-95 border ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759] text-purple-300/70 hover:bg-amber-900/20 hover:text-amber-400 hover:border-amber-500/50' : 'bg-white border-slate-300 text-slate-500 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-400'}`}><Edit className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                                    <button onClick={() => handleDelete(t.id)} className={`p-2.5 sm:p-3 rounded-xl transition-all shadow-sm active:scale-95 border ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759] text-purple-300/70 hover:bg-rose-900/20 hover:text-rose-400 hover:border-rose-500/50' : 'bg-white border-slate-300 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-400'}`}><Trash2 className="w-4 h-4 sm:w-5 sm:h-5" /></button>
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
              )}

              {activeTab === 'metas' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 animate-in fade-in slide-in-from-bottom-4">
                  
                  {/* ORÇAMENTOS */}
                  <div className={`rounded-[2rem] p-6 sm:p-8 shadow-sm border ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759]' : 'bg-white border-slate-200'}`}>
                    <div className={`flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 pb-5 gap-4 border-b ${isDarkMode ? 'border-[#321759]' : 'border-slate-200/50'}`}>
                      <h3 className={`font-black text-xl sm:text-2xl flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        <div className={`p-2 rounded-xl border shrink-0 ${isDarkMode ? 'bg-rose-900/30 border-rose-800/50' : 'bg-rose-100 border-rose-200'}`}><Target className={`w-5 h-5 sm:w-6 sm:h-6 ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`} /></div>
                        Orçamentos
                      </h3>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button onClick={handleGenerateAiBudget} className={`flex-1 sm:flex-none justify-center text-[10px] font-black uppercase tracking-widest px-3 py-2.5 sm:py-2 rounded-xl transition-colors shadow-sm flex items-center gap-1 border ${isDarkMode ? 'bg-indigo-900/30 border-indigo-800/50 text-indigo-300 hover:bg-indigo-900/50' : 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100'}`}>
                          <Sparkles className="w-3.5 h-3.5"/> ✨ <span className="hidden sm:inline">Orçamento</span> IA
                        </button>
                        <button onClick={openNewBudget} className="flex-1 sm:flex-none justify-center text-xs font-black uppercase tracking-widest text-white bg-rose-600 px-4 py-2.5 sm:py-2 rounded-xl hover:bg-rose-700 transition-colors shadow-md shadow-rose-600/20">
                          + Criar
                        </button>
                      </div>
                    </div>
                    
                    {Object.keys(budgets).filter(c => budgets[c] > 0).length === 0 ? (
                      <div className="text-center py-12">
                        <Target className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-purple-400/40' : 'text-slate-300'}`} />
                        <p className={`text-base font-bold ${isDarkMode ? 'text-purple-300/70' : 'text-slate-500'}`}>Nenhum orçamento definido.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {Object.keys(budgets).filter(cat => budgets[cat] > 0).map(cat => {
                          const catSpent = filteredTransactions.filter(t => t.type === 'expense' && t.category === cat).reduce((s, t) => s + t.amount, 0);
                          const catLimit = budgets[cat];
                          const catPercentage = Math.min((catSpent / catLimit) * 100, 100);
                          const isOver = catSpent > catLimit;

                          return (
                            <div key={cat} className={`space-y-3 p-5 rounded-2xl group relative shadow-sm border ${isDarkMode ? 'bg-[#0b0410]/50 border-[#321759]' : 'bg-slate-50 border-slate-200'}`}>
                              <div className="flex justify-between items-center">
                                <span className={`font-black text-lg ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{cat}</span>
                                <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => openEditBudget(cat, catLimit)} className={`p-1.5 rounded-lg shadow-sm border transition-colors ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759] text-purple-300/70 hover:text-amber-400' : 'bg-white border-slate-200 text-slate-400 hover:text-amber-600'}`}><Edit className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => handleDeleteBudget(cat)} className={`p-1.5 rounded-lg shadow-sm border transition-colors ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759] text-purple-300/70 hover:text-rose-400' : 'bg-white border-slate-200 text-slate-400 hover:text-rose-600'}`}><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between items-end mb-2 gap-2">
                                  <span className={`text-sm font-black break-words ${isOver ? (isDarkMode ? 'text-rose-400' : 'text-rose-600') : (isDarkMode ? 'text-purple-200' : 'text-slate-600')}`}>{formatCurrency(catSpent)} <span className={`font-bold ${isDarkMode ? 'text-purple-300/70' : 'text-slate-400'}`}>/ {formatCurrency(catLimit)}</span></span>
                                  <span className={`text-xs font-black shrink-0 ${isDarkMode ? 'text-purple-300/70' : 'text-slate-500'}`}>{catPercentage.toFixed(0)}%</span>
                                </div>
                                <div className={`w-full h-2.5 rounded-full overflow-hidden shadow-inner border ${isDarkMode ? 'bg-[#321759] border-[#321759]' : 'bg-slate-200 border-slate-200/50'}`}>
                                  <div className={`h-full transition-all duration-500 rounded-full ${isOver ? 'bg-rose-500' : catPercentage > 80 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${catPercentage}%` }}></div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* METAS */}
                  <div className={`rounded-[2rem] p-6 sm:p-8 shadow-sm border ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759]' : 'bg-white border-slate-200'}`}>
                    <div className={`flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 pb-5 gap-4 border-b ${isDarkMode ? 'border-[#321759]' : 'border-slate-200/50'}`}>
                      <h3 className={`font-black text-xl sm:text-2xl flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        <div className={`p-2 rounded-xl border shrink-0 ${isDarkMode ? 'bg-emerald-900/30 border-emerald-800/50' : 'bg-emerald-100 border-emerald-200'}`}><Trophy className={`w-5 h-5 sm:w-6 sm:h-6 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} /></div>
                        Metas & Sonhos
                      </h3>
                      <button onClick={openNewGoal} className="w-full sm:w-auto text-xs font-black uppercase tracking-widest text-white bg-emerald-600 px-4 py-2.5 sm:py-2 rounded-xl hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-600/20">
                        + Criar
                      </button>
                    </div>
                    
                    {goals.length === 0 ? (
                      <div className="text-center py-12">
                        <Trophy className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-purple-400/40' : 'text-slate-300'}`} />
                        <p className={`text-base font-bold ${isDarkMode ? 'text-purple-300/70' : 'text-slate-500'}`}>Nenhuma meta criada. Comece a poupar hoje!</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {goals.map(goal => {
                          const percentage = Math.min((goal.current / goal.target) * 100, 100);
                          const isComplete = goal.current >= goal.target;
                          
                          return (
                            <div key={goal.id} className={`p-6 rounded-2xl relative group shadow-sm border ${isDarkMode ? 'bg-[#0b0410]/50 border-[#321759]' : 'bg-slate-50 border-slate-200'}`}>
                              <div className="absolute top-4 right-4 flex gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEditGoal(goal)} className={`p-2 rounded-lg shadow-sm border transition-colors ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759] text-purple-300/70 hover:text-amber-400' : 'bg-white border-slate-200 text-slate-400 hover:text-amber-600'}`}><Edit className="w-4 h-4"/></button>
                                <button onClick={() => {
                                  showConfirm('Excluir', `Deseja excluir a meta "${goal.name}"?`, () => {
                                    const newGoals = goals.filter(g => g.id !== goal.id);
                                    setGoals(newGoals);
                                    saveCloudConfig({ goals: newGoals });
                                  });
                                }} className={`p-2 rounded-lg shadow-sm border transition-colors ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759] text-purple-300/70 hover:text-rose-400' : 'bg-white border-slate-200 text-slate-400 hover:text-rose-600'}`}><Trash2 className="w-4 h-4"/></button>
                              </div>
                              
                              <h4 className={`font-black text-lg mb-2 flex items-center gap-2 mr-16 sm:mr-0 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                {goal.name} {isComplete && '🎉'}
                                {!isComplete && (
                                  <button onClick={() => handleGenerateGoalPlan(goal)} disabled={isPlanningGoal} className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md transition-colors flex items-center gap-1 border ${isDarkMode ? 'bg-indigo-900/50 border-indigo-800/50 text-indigo-300 hover:bg-indigo-800' : 'bg-indigo-100 border-transparent text-indigo-600 hover:bg-indigo-200'}`}>
                                    {isPlanningGoal && selectedGoalForPlan?.id === goal.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3" />} IA
                                  </button>
                                )}
                              </h4>
                              <div className="flex justify-between items-end mb-3 gap-2">
                                <span className={`text-sm font-black break-words ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{formatCurrency(goal.current)} <span className={`font-bold ${isDarkMode ? 'text-purple-300/70' : 'text-slate-500'}`}>de {formatCurrency(goal.target)}</span></span>
                                <span className={`text-xs font-black shrink-0 ${isDarkMode ? 'text-purple-300/70' : 'text-slate-600'}`}>{percentage.toFixed(1)}%</span>
                              </div>
                              <div className={`w-full h-3 rounded-full overflow-hidden mb-5 shadow-inner border ${isDarkMode ? 'bg-[#321759] border-[#321759]' : 'bg-slate-200 border-slate-200/50'}`}>
                                <div className="h-full bg-emerald-500 transition-all duration-1000 rounded-full" style={{ width: `${percentage}%` }}></div>
                              </div>
                              {!isComplete && (
                                <button onClick={() => {
                                  showPrompt('Adicionar Valor', `Quanto deseja guardar para "${goal.name}" agora?`, (val) => {
                                    if (!val) return;
                                    const num = parseFloat(val.toString().replace(',', '.'));
                                    if (!isNaN(num) && num > 0) {
                                      const newGoals = goals.map(g => g.id === goal.id ? { ...g, current: g.current + num } : g);
                                      setGoals(newGoals);
                                      saveCloudConfig({ goals: newGoals });
                                    }
                                  });
                                }} className={`w-full py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-colors shadow-sm border ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759] text-purple-200 hover:text-emerald-400 hover:border-emerald-800/50' : 'bg-white border-slate-300 text-slate-700 hover:text-emerald-600 hover:border-emerald-300'}`}>
                                  + Adicionar Valor
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'simulador' && (
                <div className={`rounded-[2rem] p-6 sm:p-8 md:p-10 animate-in fade-in slide-in-from-bottom-4 shadow-sm border ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759]' : 'bg-white border-slate-200'}`}>
                  <h3 className={`font-black text-xl sm:text-2xl flex items-center gap-3 mb-8 sm:mb-10 pb-5 border-b ${isDarkMode ? 'text-white border-[#321759]' : 'text-slate-900 border-slate-200/50'}`}>
                    <div className={`p-2 rounded-xl border shrink-0 ${isDarkMode ? 'bg-indigo-900/30 border-indigo-800/50' : 'bg-indigo-100 border-indigo-200'}`}><TrendingUp className={`w-5 h-5 sm:w-6 sm:h-6 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} /></div>
                    Simulador de Investimentos
                  </h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                    <div className="space-y-8">
                      <div>
                        <label className={`block text-xs font-black uppercase tracking-widest mb-3 flex justify-between ${isDarkMode ? 'text-purple-300/70' : 'text-slate-600'}`}>Valor Inicial <span className={isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}>{formatCurrency(simInitial)}</span></label>
                        <input type="range" min="0" max="50000" step="500" value={simInitial} onChange={(e) => setSimInitial(Number(e.target.value))} className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isDarkMode ? 'accent-indigo-500 bg-[#2d144d]' : 'accent-indigo-600 bg-slate-200'}`} />
                      </div>
                      <div>
                        <label className={`block text-xs font-black uppercase tracking-widest mb-3 flex justify-between ${isDarkMode ? 'text-purple-300/70' : 'text-slate-600'}`}>Aporte Mensal <span className={isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}>{formatCurrency(simMonthly)}</span></label>
                        <input type="range" min="0" max="10000" step="100" value={simMonthly} onChange={(e) => setSimMonthly(Number(e.target.value))} className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isDarkMode ? 'accent-indigo-500 bg-[#2d144d]' : 'accent-indigo-600 bg-slate-200'}`} />
                      </div>
                      <div>
                        <label className={`block text-xs font-black uppercase tracking-widest mb-3 flex justify-between ${isDarkMode ? 'text-purple-300/70' : 'text-slate-600'}`}>Taxa de Juro Mensal (%) <span className={isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}>{simRate.toFixed(2)}%</span></label>
                        <input type="range" min="0.1" max="2.0" step="0.1" value={simRate} onChange={(e) => setSimRate(Number(e.target.value))} className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isDarkMode ? 'accent-indigo-500 bg-[#2d144d]' : 'accent-indigo-600 bg-slate-200'}`} />
                        <p className={`text-xs font-bold mt-2 p-2 rounded-lg border ${isDarkMode ? 'text-purple-300/70 bg-[#0b0410]/50 border-[#321759]' : 'text-slate-500 bg-slate-50 border-slate-200/50'}`}>Ex: Poupança ~0.5%, Tesouro/CDB ~0.8%, FIIs ~1.0%</p>
                      </div>
                      <div>
                        <label className={`block text-xs font-black uppercase tracking-widest mb-3 flex justify-between ${isDarkMode ? 'text-purple-300/70' : 'text-slate-600'}`}>Tempo <span className={isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}>{simYears} {simYears === 1 ? 'Ano' : 'Anos'}</span></label>
                        <input type="range" min="1" max="30" step="1" value={simYears} onChange={(e) => setSimYears(Number(e.target.value))} className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isDarkMode ? 'accent-indigo-500 bg-[#2d144d]' : 'accent-indigo-600 bg-slate-200'}`} />
                      </div>
                    </div>

                    <div className="bg-slate-900 dark:bg-[#050108] rounded-[2rem] p-6 sm:p-10 flex flex-col justify-center items-center text-center relative overflow-hidden shadow-xl border border-slate-800 dark:border-[#1a0b2e] mt-6 lg:mt-0">
                      <div className="absolute inset-0 bg-grid-pattern opacity-20 mask-radial"></div>
                      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 pointer-events-none"></div>
                      
                      <h4 className="text-indigo-300 font-black uppercase tracking-widest text-[10px] sm:text-xs mb-3 relative z-10">Valor Final Estimado</h4>
                      <p className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight relative z-10 mb-6 sm:mb-8 drop-shadow-lg break-words px-2 w-full leading-none">{formatCurrency(simFutureValue)}</p>
                      
                      <div className="w-full bg-slate-800/80 dark:bg-[#160a22]/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 relative z-10 border border-slate-700 dark:border-[#321759]">
                        <div>
                          <p className="text-slate-400 text-[9px] sm:text-[10px] uppercase font-black tracking-widest mb-1 sm:mb-2">Total Investido</p>
                          <p className="text-white font-black text-base sm:text-lg break-words">{formatCurrency(simInitial + (simMonthly * simYears * 12))}</p>
                        </div>
                        <div>
                          <p className="text-emerald-400 text-[9px] sm:text-[10px] uppercase font-black tracking-widest mb-1 sm:mb-2">Juros Ganhos</p>
                          <p className="text-emerald-400 font-black text-base sm:text-lg break-words">+{formatCurrency(simFutureValue - (simInitial + (simMonthly * simYears * 12)))}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        {/* BOTÃO ADICIONAR (SÓLIDO E Z-INDEX ALTO) */}
        <button 
          onClick={() => { resetForm(); setShowTransactionModal(true); }}
          className="fixed bottom-6 right-6 md:bottom-10 md:right-10 w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center shadow-xl shadow-indigo-600/40 text-white hover:bg-indigo-700 active:scale-95 transition-all z-[100] group no-print"
          title="Novo Registo"
        >
          <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
        </button>

        {/* MODAL DE ORÇAMENTOS */}
        {showBudgetModal && (
          <div className="fixed inset-0 bg-[#0b0410]/80 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
            <div className={`rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 border ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759]' : 'bg-white border-slate-200'}`}>
              <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? 'bg-[#0b0410]/50 border-[#321759]' : 'bg-slate-50 border-slate-200'}`}>
                <h3 className={`font-black flex items-center gap-3 text-xl tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-rose-900/30' : 'bg-rose-100'}`}><Target className={`w-6 h-6 ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`} /></div> 
                  Orçamento
                </h3>
                <button onClick={() => setShowBudgetModal(false)} className={`p-2 rounded-xl transition-colors border ${isDarkMode ? 'bg-[#1a0b2e] hover:bg-[#2d144d] text-purple-300/70 border-[#321759]' : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'}`}><X className="w-5 h-5" /></button>
              </div>
              <div className="p-8">
                <form onSubmit={handleSaveBudget} className="space-y-6">
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-purple-300/70' : 'text-slate-500'}`}>Categoria</label>
                    <div className="relative">
                      <select required value={budgetForm.category} onChange={e => setBudgetForm({...budgetForm, category: e.target.value})} className={`w-full px-5 py-4 rounded-2xl outline-none focus:ring-4 transition-all font-bold appearance-none border ${isDarkMode ? 'bg-[#0b0410] border-[#321759] text-white focus:border-indigo-500 focus:ring-indigo-500/10' : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500/10 shadow-sm'}`}>
                        <option value="" disabled>Selecione...</option>
                        {categories.expense.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none"><ChevronDown className={`w-5 h-5 ${isDarkMode ? 'text-purple-300/70' : 'text-slate-400'}`}/></div>
                    </div>
                  </div>
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-purple-300/70' : 'text-slate-500'}`}>Limite Máximo (R$)</label>
                    <input type="number" step="0.01" required value={budgetForm.limit} onChange={e => setBudgetForm({...budgetForm, limit: e.target.value})} placeholder="Ex: 500" className={`w-full px-5 py-4 rounded-2xl outline-none focus:ring-4 transition-all font-bold border ${isDarkMode ? 'bg-[#0b0410] border-[#321759] text-white placeholder-purple-300/30 focus:border-indigo-500 focus:ring-indigo-500/10' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500/10 shadow-sm'}`} />
                  </div>
                  <button type="submit" className={`w-full py-4 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl transition-all active:scale-95 ${isDarkMode ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/50' : 'bg-slate-900 hover:bg-black shadow-slate-900/20'}`}>Salvar Orçamento</button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE METAS */}
        {showGoalModal && (
          <div className="fixed inset-0 bg-[#0b0410]/80 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
            <div className={`rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 border ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759]' : 'bg-white border-slate-200'}`}>
              <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? 'bg-[#0b0410]/50 border-[#321759]' : 'bg-slate-50 border-slate-200'}`}>
                <h3 className={`font-black flex items-center gap-3 text-xl tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-emerald-900/30' : 'bg-emerald-100'}`}><Trophy className={`w-6 h-6 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} /></div> 
                  {goalForm.id ? 'Editar Meta' : 'Nova Meta'}
                </h3>
                <button onClick={() => setShowGoalModal(false)} className={`p-2 rounded-xl transition-colors border ${isDarkMode ? 'bg-[#1a0b2e] hover:bg-[#2d144d] text-purple-300/70 border-[#321759]' : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'}`}><X className="w-5 h-5" /></button>
              </div>
              <div className="p-8">
                <form onSubmit={handleSaveGoal} className="space-y-6">
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-purple-300/70' : 'text-slate-500'}`}>Nome do Objetivo</label>
                    <input type="text" required value={goalForm.name} onChange={e => setGoalForm({...goalForm, name: e.target.value})} placeholder="Ex: Viagem à Europa" className={`w-full px-5 py-4 rounded-2xl outline-none focus:ring-4 transition-all font-bold border ${isDarkMode ? 'bg-[#0b0410] border-[#321759] text-white placeholder-purple-300/30 focus:border-indigo-500 focus:ring-indigo-500/10' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500/10 shadow-sm'}`} />
                  </div>
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-purple-300/70' : 'text-slate-500'}`}>Valor Necessário (R$)</label>
                    <input type="number" step="0.01" required value={goalForm.target} onChange={e => setGoalForm({...goalForm, target: e.target.value})} placeholder="Ex: 5000" className={`w-full px-5 py-4 rounded-2xl outline-none focus:ring-4 transition-all font-bold border ${isDarkMode ? 'bg-[#0b0410] border-[#321759] text-white placeholder-purple-300/30 focus:border-indigo-500 focus:ring-indigo-500/10' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500/10 shadow-sm'}`} />
                  </div>
                  <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl transition-all active:scale-95">Salvar Meta</button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE TRANSAÇÃO */}
        {showTransactionModal && (
          <div className="fixed inset-0 bg-[#0b0410]/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-[200]">
            <div className={`w-full sm:rounded-[2rem] rounded-t-[2rem] sm:max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-4 duration-300 flex flex-col max-h-[90vh] border ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759]' : 'bg-white border-slate-200'}`}>
              <div className={`p-5 sm:p-6 border-b flex justify-between items-center sticky top-0 z-10 ${isDarkMode ? 'bg-[#0b0410]/50 border-[#321759]' : 'bg-slate-50 border-slate-200'}`}>
                <h2 className={`text-lg sm:text-xl font-black tracking-tight flex items-center gap-3 ${editingId ? (isDarkMode ? 'text-amber-400' : 'text-amber-600') : (isDarkMode ? 'text-white' : 'text-slate-900')}`}>
                  <div className={`p-2 sm:p-2.5 rounded-xl shadow-sm ${editingId ? (isDarkMode ? 'bg-amber-900/30' : 'bg-amber-100') : (isDarkMode ? 'bg-indigo-900/30' : 'bg-indigo-100')}`}>
                    {editingId ? <Edit className={`w-5 h-5 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} /> : <Plus className={`w-5 h-5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />}
                  </div>
                  {editingId ? 'Editar Registo' : 'Novo Registo'}
                </h2>
                <button onClick={() => { resetForm(); setShowTransactionModal(false); }} className={`p-2 rounded-xl transition-colors border ${isDarkMode ? 'bg-[#1a0b2e] hover:bg-[#2d144d] text-purple-300/70 border-[#321759]' : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'}`}><X className="w-5 h-5" /></button>
              </div>
              
              <div className="p-5 sm:p-6 overflow-y-auto">
                <form onSubmit={handleSaveTransaction} className="space-y-5 sm:space-y-6">
                  <div className={`flex gap-2 p-1.5 rounded-2xl shadow-inner border ${isDarkMode ? 'bg-[#0b0410]/50 border-[#321759]' : 'bg-slate-50 border-slate-200'}`}>
                    <button type="button" onClick={() => setType('income')} className={`flex-1 py-3 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl transition-all ${type === 'income' ? (isDarkMode ? 'bg-[#2d144d] text-emerald-400 shadow-md border border-[#441f74]' : 'bg-white text-emerald-600 shadow-md border border-slate-200') : (isDarkMode ? 'text-purple-300/70 hover:text-purple-200' : 'text-slate-500 hover:text-slate-700')}`}>Entrada</button>
                    <button type="button" onClick={() => setType('expense')} className={`flex-1 py-3 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl transition-all ${type === 'expense' ? (isDarkMode ? 'bg-[#2d144d] text-rose-400 shadow-md border border-[#441f74]' : 'bg-white text-rose-600 shadow-md border border-slate-200') : (isDarkMode ? 'text-purple-300/70 hover:text-purple-200' : 'text-slate-500 hover:text-slate-700')}`}>Gasto</button>
                    <button type="button" onClick={() => setType('investment')} className={`flex-1 py-3 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl transition-all ${type === 'investment' ? (isDarkMode ? 'bg-[#2d144d] text-indigo-400 shadow-md border border-[#441f74]' : 'bg-white text-indigo-600 shadow-md border border-slate-200') : (isDarkMode ? 'text-purple-300/70 hover:text-purple-200' : 'text-slate-500 hover:text-slate-700')}`}>Investir</button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div>
                      <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-purple-300/70' : 'text-slate-500'}`}>Valor (R$)</label>
                      <input type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} className={`w-full px-4 sm:px-5 py-3 sm:py-4 rounded-2xl outline-none focus:ring-4 transition-all font-black text-base sm:text-lg border ${isDarkMode ? 'bg-[#0b0410] border-[#321759] text-white placeholder-purple-300/30 focus:border-indigo-500 focus:ring-indigo-500/10' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500/10 shadow-sm'}`} placeholder="0.00" autoFocus />
                    </div>
                    <div>
                      <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-purple-300/70' : 'text-slate-500'}`}>Data</label>
                      <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={`w-full px-4 sm:px-5 py-3 sm:py-4 rounded-2xl outline-none focus:ring-4 transition-all font-bold text-sm sm:text-base border ${isDarkMode ? 'bg-[#0b0410] border-[#321759] text-white focus:border-indigo-500 focus:ring-indigo-500/10' : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500/10 shadow-sm'}`} />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 flex justify-between items-center ${isDarkMode ? 'text-purple-300/70' : 'text-slate-500'}`}>
                      <span>Descrição</span>
                      <button type="button" onClick={handleAiCategorize} disabled={isCategorizing || !description} className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded transition-colors border ${!description ? 'opacity-50 cursor-not-allowed' : ''} ${isDarkMode ? 'bg-indigo-900/30 border-indigo-800/50 text-indigo-400 hover:bg-indigo-900/50' : 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100'}`} title="Auto-categorizar com IA">
                        {isCategorizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} IA
                      </button>
                    </label>
                    <input type="text" required value={description} onChange={(e) => handleDescriptionChange(e.target.value)} className={`w-full px-4 sm:px-5 py-3 sm:py-4 rounded-2xl outline-none focus:ring-4 transition-all font-bold text-sm sm:text-base border ${isDarkMode ? 'bg-[#0b0410] border-[#321759] text-white placeholder-purple-300/30 focus:border-indigo-500 focus:ring-indigo-500/10' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500/10 shadow-sm'}`} placeholder="Ex: Ifood, Gasolina, Luz..." />
                  </div>

                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-purple-300/70' : 'text-slate-500'}`}>Categoria / Cartão</label>
                    <div className="flex gap-2 sm:gap-3">
                      <div className="relative w-full">
                        <select value={category} onChange={(e) => setCategory(e.target.value)} className={`w-full px-4 sm:px-5 py-3 sm:py-4 rounded-2xl outline-none focus:ring-4 transition-all font-bold appearance-none text-sm sm:text-base border ${isDarkMode ? 'bg-[#0b0410] border-[#321759] text-white focus:border-indigo-500 focus:ring-indigo-500/10' : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500/10 shadow-sm'}`}>
                          {categories[type] && categories[type].map((cat, idx) => <option key={idx} value={cat}>{cat}</option>)}
                        </select>
                        <div className="absolute inset-y-0 right-4 sm:right-5 flex items-center pointer-events-none"><ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 ${isDarkMode ? 'text-purple-300/70' : 'text-slate-400'}`}/></div>
                      </div>
                      <button type="button" onClick={handleAddCategory} className={`px-4 sm:px-5 py-3 sm:py-4 rounded-2xl transition-colors shadow-md active:scale-95 flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-slate-900 hover:bg-black text-white'}`} title="Criar Nova Categoria">
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>

                  <div className={`flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl border shadow-sm cursor-pointer transition-colors group ${isDarkMode ? 'bg-[#0b0410]/50 border-[#321759] hover:border-indigo-500/50' : 'bg-slate-50 border-slate-200/50 hover:border-indigo-300'}`} onClick={() => setIsPaid(!isPaid)}>
                    <div className={`p-2 sm:p-2.5 rounded-xl transition-colors shadow-sm border ${isPaid ? (isDarkMode ? 'bg-emerald-900/30 border-emerald-800 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600') : (isDarkMode ? 'bg-[#1a0b2e] border-[#321759] text-purple-300/70' : 'bg-white border-slate-200 text-slate-400')}`}>
                      {isPaid ? <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" /> : <Circle className="w-5 h-5 sm:w-6 sm:h-6" />}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-sm sm:text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{isPaid ? 'Efetivado / Pago' : 'Agendado / Pendente'}</span>
                      <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-purple-300/70' : 'text-slate-500'}`}>{isPaid ? 'Afeta o Saldo Real' : 'Apenas Previsão'}</span>
                    </div>
                  </div>

                  {(type === 'expense' || type === 'income') && !editingId && (
                    <div className={`p-4 sm:p-5 rounded-2xl shadow-inner border ${isDarkMode ? 'bg-[#0b0410]/50 border-[#321759]' : 'bg-slate-50 border-slate-200/50'}`}>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={isInstallment} onChange={(e) => setIsInstallment(e.target.checked)} className={`w-4 h-4 sm:w-5 sm:h-5 rounded-md focus:ring-indigo-500 border-slate-300 ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759] text-indigo-500' : 'text-indigo-600'}`} />
                        <span className={`text-xs sm:text-sm font-black ${isDarkMode ? 'text-purple-200' : 'text-slate-800'}`}>{type === 'expense' ? 'Parcelar compra?' : 'Receber parcelado?'}</span>
                      </label>
                      {isInstallment && (
                        <div className={`mt-4 pt-4 border-t animate-in fade-in ${isDarkMode ? 'border-[#321759]' : 'border-slate-200/50'}`}>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className={`block text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-purple-300/70' : 'text-slate-500'}`}>Nº de Parcelas</label>
                              <input type="number" min="2" max="72" value={installmentsCount} onChange={(e) => setInstallmentsCount(e.target.value === '' ? '' : parseInt(e.target.value))} onBlur={() => { if (!installmentsCount || installmentsCount < 2) setInstallmentsCount(2); }} className={`w-full px-4 sm:px-5 py-3 sm:py-4 rounded-xl outline-none focus:ring-4 transition-all font-bold shadow-sm border ${isDarkMode ? 'bg-[#0b0410] border-[#321759] text-white focus:border-indigo-500 focus:ring-indigo-500/10' : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500/10'}`} />
                            </div>
                            <div>
                              <label className={`block text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-purple-300/70' : 'text-slate-500'}`}>O valor inserido é o</label>
                              <div className={`flex p-1.5 rounded-xl shadow-inner border h-[46px] sm:h-[54px] ${isDarkMode ? 'bg-[#0b0410] border-[#321759]' : 'bg-slate-100 border-slate-200'}`}>
                                <button type="button" onClick={() => setInstallmentType('parcela')} className={`flex-1 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${installmentType === 'parcela' ? (isDarkMode ? 'bg-[#2d144d] text-white shadow-md border border-[#441f74]' : 'bg-white text-indigo-600 shadow-sm border border-slate-200') : (isDarkMode ? 'text-purple-300/70 hover:text-purple-200' : 'text-slate-500 hover:text-slate-700')}`}>Da Parcela</button>
                                <button type="button" onClick={() => setInstallmentType('total')} className={`flex-1 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${installmentType === 'total' ? (isDarkMode ? 'bg-[#2d144d] text-white shadow-md border border-[#441f74]' : 'bg-white text-indigo-600 shadow-sm border border-slate-200') : (isDarkMode ? 'text-purple-300/70 hover:text-purple-200' : 'text-slate-500 hover:text-slate-700')}`}>Total</button>
                              </div>
                            </div>
                          </div>
                          <p className={`mt-4 text-[10px] sm:text-xs font-bold px-1 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-700'}`}>
                            {installmentType === 'total' 
                              ? `💡 Serão geradas ${installmentsCount || 2} parcelas de ${formatCurrency((parseFloat(amount.toString().replace(',', '.')) || 0) / (installmentsCount || 2))}`
                              : `💡 O total final será de ${formatCurrency((parseFloat(amount.toString().replace(',', '.')) || 0) * (installmentsCount || 2))}`}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <button type="submit" className={`w-full py-4 sm:py-5 mt-4 text-white text-xs sm:text-sm uppercase tracking-widest font-black rounded-2xl shadow-xl transform active:scale-95 transition-all sticky bottom-4 ${editingId ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-indigo-600 to-purple-600'}`}>
                    {editingId ? 'Guardar Alterações' : 'Adicionar Registo'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* MODAL CARTÕES */}
        {showCardsModal && (
          <div className="fixed inset-0 bg-[#0b0410]/80 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
            <div className={`rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 border ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759]' : 'bg-white border-slate-200'}`}>
              <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? 'bg-[#0b0410]/50 border-[#321759]' : 'bg-slate-50 border-slate-200'}`}>
                <h3 className={`font-black flex items-center gap-3 text-xl tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-indigo-900/40' : 'bg-indigo-100'}`}><CreditCard className={`w-6 h-6 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} /></div> Meus Cartões
                </h3>
                <div className="flex items-center gap-3">
                  {!showCardForm && (
                    <button onClick={openNewCardForm} className={`text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-colors shadow-md ${isDarkMode ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-slate-900 hover:bg-black'}`}>
                      <Plus className="w-4 h-4" /> Novo
                    </button>
                  )}
                  <button onClick={() => { setShowCardsModal(false); setShowCardForm(false); }} className={`p-2 rounded-xl transition-colors border ${isDarkMode ? 'bg-[#1a0b2e] hover:bg-[#2d144d] text-purple-300/70 border-[#321759]' : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'}`}><X className="w-5 h-5" /></button>
                </div>
              </div>
              
              <div className="p-6 md:p-8 overflow-y-auto flex-1">
                {showCardForm ? (
                  <div className={`rounded-3xl p-6 sm:p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 border ${isDarkMode ? 'bg-[#0b0410]/50 border-[#321759]' : 'bg-slate-50 border-slate-200/50'}`}>
                    <h4 className={`font-black mb-6 flex items-center gap-3 text-lg sm:text-xl tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                      <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-indigo-900/30' : 'bg-indigo-50'}`}><Settings2 className={`w-5 h-5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} /></div>
                      {editingCardId ? 'Editar Cartão' : 'Configurar Novo Cartão'}
                    </h4>
                    <form onSubmit={handleSaveCard} className="space-y-5 sm:space-y-6">
                      <div>
                        <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-purple-300/70' : 'text-slate-500'}`}>Nome do Banco / Cartão</label>
                        <input type="text" required value={cardForm.name} onChange={e => setCardForm({...cardForm, name: e.target.value})} placeholder="Ex: Nubank, C6 Bank..." className={`w-full px-4 sm:px-5 py-3 sm:py-4 rounded-2xl outline-none focus:ring-4 transition-all font-bold border ${isDarkMode ? 'bg-[#0b0410] border-[#321759] text-white focus:border-indigo-500 focus:ring-indigo-500/10' : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500/10 shadow-sm'}`} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        <div>
                          <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-purple-300/70' : 'text-slate-500'}`}>Limite (R$)</label>
                          <input type="number" step="0.01" required value={cardForm.limit} onChange={e => setCardForm({...cardForm, limit: e.target.value})} placeholder="Ex: 1500" className={`w-full px-4 sm:px-5 py-3 sm:py-4 rounded-2xl outline-none focus:ring-4 transition-all font-bold border ${isDarkMode ? 'bg-[#0b0410] border-[#321759] text-white focus:border-indigo-500 focus:ring-indigo-500/10' : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500/10 shadow-sm'}`} />
                        </div>
                        <div>
                          <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-purple-300/70' : 'text-slate-500'}`}>Dia Vencimento</label>
                          <input type="number" min="1" max="31" required value={cardForm.dueDay} onChange={e => setCardForm({...cardForm, dueDay: e.target.value})} placeholder="Ex: 5" className={`w-full px-4 sm:px-5 py-3 sm:py-4 rounded-2xl outline-none focus:ring-4 transition-all font-bold border ${isDarkMode ? 'bg-[#0b0410] border-[#321759] text-white focus:border-indigo-500 focus:ring-indigo-500/10' : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500/10 shadow-sm'}`} />
                        </div>
                      </div>
                      <div>
                        <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ${isDarkMode ? 'text-purple-300/70' : 'text-slate-500'}`}>Cor de Identificação</label>
                        <div className={`flex flex-wrap gap-2 sm:gap-3 p-4 sm:p-5 rounded-2xl border shadow-sm justify-center sm:justify-start ${isDarkMode ? 'bg-[#0b0410] border-[#321759]' : 'bg-white border-slate-200'}`}>
                          {colorOptions.map(color => (
                            <button key={color} type="button" onClick={() => setCardForm({...cardForm, color})} className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl ${color} ${cardForm.color === color ? `ring-4 ring-indigo-400 ring-offset-2 sm:ring-offset-4 scale-110 shadow-lg ${isDarkMode ? 'ring-offset-[#0b0410]' : 'ring-offset-white'}` : 'hover:scale-110 shadow-sm'} transition-all`}></button>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <button type="submit" className={`w-full sm:flex-1 py-4 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl transition-all active:scale-95 ${isDarkMode ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-slate-900 hover:bg-black'}`}>Salvar Cartão</button>
                        <button type="button" onClick={() => setShowCardForm(false)} className={`w-full sm:w-auto px-8 py-4 font-black uppercase tracking-widest text-xs rounded-2xl shadow-sm transition-all active:scale-95 border ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759] text-purple-300/70 hover:bg-[#2d144d]' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}>Cancelar</button>
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
                        <div key={card.id} className={`p-6 rounded-3xl shadow-sm relative overflow-hidden group transition-colors flex flex-col border ${isDarkMode ? 'bg-[#0b0410] border-[#321759] hover:border-indigo-500' : 'bg-slate-50 border-slate-200 hover:border-indigo-300'}`}>
                          <div className={`absolute top-0 left-0 w-full h-2.5 ${card.color}`}></div>
                          
                          <div className="flex justify-between items-start mb-6 mt-1">
                            <div className="pr-2">
                              <h4 className={`font-black text-xl truncate tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{card.name}</h4>
                              <p className={`text-[10px] font-bold flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-md inline-flex uppercase tracking-widest border ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759] text-purple-300/70' : 'bg-white border-slate-200 text-slate-500'}`}><Calendar className="w-3.5 h-3.5" /> Vence dia {card.dueDay}</p>
                            </div>
                            <div className="flex items-center gap-1.5 pl-2">
                              <button onClick={() => openEditCardForm(card)} className={`p-2.5 rounded-xl transition-colors shadow-sm active:scale-95 border ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759] text-purple-300/70 hover:text-amber-400' : 'bg-white border-slate-200 text-slate-500 hover:text-amber-600'}`}><Edit className="w-4 h-4" /></button>
                              <button onClick={() => handleDeleteCard(card.id)} className={`p-2.5 rounded-xl transition-colors shadow-sm active:scale-95 border ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759] text-purple-300/70 hover:text-rose-400' : 'bg-white border-slate-200 text-slate-500 hover:text-rose-600'}`}><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </div>

                          <div className="space-y-5 mt-auto">
                            <div className={`flex justify-between text-sm font-bold p-4 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759]' : 'bg-white border-slate-200'}`}>
                              <span className={`uppercase tracking-widest text-[10px] ${isDarkMode ? 'text-purple-300/70' : 'text-slate-500'}`}>Limite Total</span>
                              <span className={`font-black break-words ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(card.limit)}</span>
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-2 font-bold px-1">
                                <span className={`text-[10px] uppercase tracking-widest ${isDarkMode ? 'text-purple-300/70' : 'text-slate-500'}`}>Fatura: <span className={`ml-1 break-words ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>{formatCurrency(cardExpenses)}</span></span>
                                <span className={`text-[10px] ${isDarkMode ? 'text-purple-300/70' : 'text-slate-500'}`}>{usagePercentage.toFixed(0)}%</span>
                              </div>
                              <div className={`w-full h-3 rounded-full overflow-hidden shadow-inner border ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759]' : 'bg-slate-200 border-slate-200/50'}`}>
                                <div className={`h-full rounded-full transition-all duration-1000 ${usagePercentage > 90 ? 'bg-rose-500' : usagePercentage > 60 ? 'bg-amber-400' : card.color}`} style={{ width: `${usagePercentage}%` }}></div>
                              </div>
                            </div>
                            <div className={`pt-4 border-t flex justify-between items-end px-1 ${isDarkMode ? 'border-[#321759]' : 'border-slate-200/50'}`}>
                              <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-purple-300/70' : 'text-slate-500'}`}>Disponível</span>
                              <span className={`font-black text-2xl tracking-tight break-words ${availableLimit < 100 ? (isDarkMode ? 'text-rose-400' : 'text-rose-600') : (isDarkMode ? 'text-emerald-400' : 'text-emerald-600')}`}>{formatCurrency(availableLimit)}</span>
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

        {/* MODAL CONFIGURAÇÕES E APAGAR CONTA */}
        {showSettingsModal && (
          <div className="fixed inset-0 bg-[#0b0410]/80 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
            <div className={`rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 border ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759]' : 'bg-white border-slate-200'}`}>
              <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? 'bg-[#0b0410]/50 border-[#321759] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                <h3 className="font-black flex items-center gap-3 text-xl tracking-tight">
                  <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-indigo-900/40' : 'bg-indigo-100'}`}><Settings className={`w-6 h-6 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} /></div> Configurações
                </h3>
                <button onClick={() => setShowSettingsModal(false)} className={`p-2 rounded-xl transition-colors border ${isDarkMode ? 'bg-[#1a0b2e] hover:bg-[#2d144d] text-purple-300/70 border-[#321759]' : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'}`}><X className="w-5 h-5" /></button>
              </div>
              
              <div className="p-8 space-y-6 flex-1 overflow-y-auto">
                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-purple-300/70' : 'text-slate-500'}`}>Nome de Exibição</label>
                  <input type="text" value={userSettings.displayName} onChange={e => setUserSettings({...userSettings, displayName: e.target.value})} className={`w-full px-5 py-4 rounded-2xl outline-none focus:ring-4 transition-all font-bold shadow-sm border ${isDarkMode ? 'bg-[#0b0410] border-[#321759] text-white focus:border-indigo-500 focus:ring-indigo-500/10' : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500/10'}`} placeholder="Seu nome..." />
                </div>
                
                <div className={`p-5 shadow-sm rounded-2xl relative overflow-hidden border ${isDarkMode ? 'bg-indigo-900/20 border-indigo-800/50' : 'bg-indigo-50 border-indigo-200/50'}`}>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5 mt-1 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-700'}`}><Sparkles className="w-4 h-4"/> IA Gemini API Key</label>
                  <p className={`text-xs font-medium mb-4 leading-relaxed ${isDarkMode ? 'text-purple-300/70' : 'text-slate-600'}`}>Para a funcionalidade de IA funcionar em alojamentos próprios, tem de inserir aqui a sua chave privada do <strong>Google AI Studio</strong>.</p>
                  <input type="password" value={userSettings.geminiApiKey} onChange={e => setUserSettings({...userSettings, geminiApiKey: e.target.value})} placeholder="Colar a API Key aqui..." className={`w-full px-4 py-3.5 rounded-xl outline-none focus:ring-4 font-mono text-xs shadow-sm border ${isDarkMode ? 'bg-[#0b0410] border-[#321759] text-white focus:border-indigo-500 focus:ring-indigo-500/10' : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500/10'}`} />
                </div>

                <button onClick={handleSaveSettings} className={`w-full py-4 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95 mt-4 ${isDarkMode ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-slate-900 hover:bg-black'}`}>Guardar Alterações</button>
                
                {/* Zona de Perigo */}
                <div className={`pt-6 mt-6 border-t ${isDarkMode ? 'border-rose-900/50' : 'border-rose-200/50'}`}>
                  <h4 className={`text-[10px] font-black uppercase tracking-widest mb-3 ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>Zona de Perigo</h4>
                  <button onClick={handleDeleteAccount} className={`w-full py-4 font-black text-xs uppercase tracking-widest rounded-2xl border transition-all active:scale-95 flex items-center justify-center gap-2 ${isDarkMode ? 'bg-rose-900/30 hover:bg-rose-900/50 text-rose-400 border-rose-800/50' : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200'}`}>
                    <Trash2 className="w-4 h-4" /> Apagar Minha Conta
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL SINCRONIZAR */}
        {showSyncModal && (
          <div className="fixed inset-0 bg-[#0b0410]/80 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
            <div className={`rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 border ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759]' : 'bg-white border-slate-200'}`}>
               <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? 'bg-[#0b0410]/50 border-[#321759] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                <h3 className="font-black flex items-center gap-3 text-xl tracking-tight">
                  <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-indigo-900/40' : 'bg-indigo-100'}`}><RefreshCw className={`w-6 h-6 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} /></div> Sincronizar
                </h3>
                <button onClick={() => setShowSyncModal(false)} className={`p-2 rounded-xl transition-colors border ${isDarkMode ? 'bg-[#1a0b2e] hover:bg-[#2d144d] text-purple-300/70 border-[#321759]' : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'}`}><X className="w-5 h-5" /></button>
              </div>
              <div className="p-8">
                <div className={`flex gap-1.5 mb-6 p-1.5 rounded-2xl shadow-inner border ${isDarkMode ? 'bg-[#0b0410]/50 border-[#321759]' : 'bg-slate-50 border-slate-200'}`}>
                  <button onClick={() => setSyncTab('export')} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${syncTab === 'export' ? (isDarkMode ? 'bg-[#1a0b2e] shadow-md text-indigo-400 border border-[#321759]' : 'bg-white shadow-md text-indigo-700') : (isDarkMode ? 'text-purple-300/70 hover:text-purple-200' : 'text-slate-500 hover:text-slate-700')}`}>Exportar</button>
                  <button onClick={() => setSyncTab('import')} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${syncTab === 'import' ? (isDarkMode ? 'bg-[#1a0b2e] shadow-md text-indigo-400 border border-[#321759]' : 'bg-white shadow-md text-indigo-700') : (isDarkMode ? 'text-purple-300/70 hover:text-purple-200' : 'text-slate-500 hover:text-slate-700')}`}>Importar</button>
                </div>
                {syncTab === 'export' ? (
                  <div className="space-y-4">
                    <p className={`text-xs font-bold text-center px-4 ${isDarkMode ? 'text-purple-300/70' : 'text-slate-600'}`}>Copie o código de segurança para transferir os seus dados.</p>
                    <div className="relative group">
                      <textarea readOnly value={JSON.stringify({ version: 2, transactions, categories, cards })} className={`w-full h-40 p-5 font-mono text-[10px] rounded-2xl resize-none outline-none shadow-inner border ${isDarkMode ? 'bg-[#0b0410] border-[#321759] text-purple-200' : 'bg-white border-slate-200 text-slate-500'}`} />
                      <button onClick={handleCopySync} className={`absolute bottom-4 right-4 flex items-center gap-2 text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all ${isDarkMode ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-slate-900 hover:bg-black'}`}>
                        {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className={`text-xs font-bold text-center px-4 ${isDarkMode ? 'text-purple-300/70' : 'text-slate-600'}`}>Cole o código do outro aparelho para substituir os dados atuais.</p>
                    <textarea value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Colar código aqui..." className={`w-full h-40 p-5 font-mono text-[10px] rounded-2xl resize-none outline-none shadow-inner focus:ring-4 transition-all border ${isDarkMode ? 'bg-[#0b0410] border-[#321759] text-white focus:border-indigo-500 focus:ring-indigo-500/10' : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500/10'}`} />
                    <button onClick={handleImportSync} className={`w-full py-4 text-white font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all ${isDarkMode ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-indigo-600 hover:bg-indigo-700'}`}><Download className="w-5 h-5" /> Importar Dados</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL GRÁFICOS */}
        {showChartModal && (
          <div className="fixed inset-0 bg-[#0b0410]/80 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
            <div className={`rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 border ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759]' : 'bg-white border-slate-200'}`}>
               <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? 'bg-[#0b0410]/50 border-[#321759] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                 <h3 className="font-black tracking-tight flex items-center gap-3 text-xl">
                   <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-indigo-900/40' : 'bg-indigo-100'}`}><PieChart className={`w-6 h-6 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} /></div> Análise Categórica
                 </h3>
                 <button onClick={() => setShowChartModal(false)} className={`p-2 rounded-xl transition-colors border ${isDarkMode ? 'bg-[#1a0b2e] hover:bg-[#2d144d] text-purple-300/70 border-[#321759]' : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'}`}><X className="w-5 h-5" /></button>
               </div>
              <div className="p-8 flex flex-col items-center">
                <div 
                  className={`w-64 h-64 rounded-full shadow-inner mb-10 border-[8px] overflow-hidden ${isDarkMode ? 'bg-[#0b0410] border-[#1a0b2e]' : 'bg-slate-100 border-slate-50'}`}
                  dangerouslySetInnerHTML={{ __html: pieSvgString }}
                ></div>
                <div className="w-full grid grid-cols-2 gap-4">
                  {chartData.map((d, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3.5 rounded-2xl shadow-sm border ${isDarkMode ? 'bg-[#0b0410]/50 border-[#321759]' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: d.color }}></div>
                      <div className="flex flex-col">
                        <span className={`text-xs font-black truncate ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{d.category}</span>
                        <span className={`text-[10px] font-bold ${isDarkMode ? 'text-purple-300/70' : 'text-slate-500'}`}>{d.percentage.toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAIS IA (PLANO META, ORÇAMENTO, IA GERAL, COMPRAS) */}
        {isPlanningGoal && (
          <div className="fixed inset-0 bg-[#0b0410]/80 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
            <div className={`rounded-[2rem] w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 border ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759]' : 'bg-white border-slate-200'}`}>
              <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? 'bg-indigo-900/30 border-indigo-800/50 text-indigo-100' : 'bg-indigo-50 border-indigo-200/50 text-indigo-900'}`}>
                <h3 className="font-black tracking-tight flex items-center gap-3 text-xl">
                  <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30"><Sparkles className="w-6 h-6 text-white"/></div> 
                  Plano Estratégico
                </h3>
                <button onClick={() => setIsPlanningGoal(false)} className={`p-2 rounded-xl transition-colors border ${isDarkMode ? 'bg-[#1a0b2e] hover:bg-[#2d144d] text-indigo-400 border-indigo-800/50' : 'bg-white hover:bg-slate-100 text-indigo-700 border-indigo-200'}`}><X className="w-5 h-5"/></button>
              </div>
              <div className="p-8 overflow-y-auto flex-1">
                {!aiGoalPlan ? (
                  <div className="text-center py-16 flex flex-col items-center">
                    <Loader2 className={`w-12 h-12 animate-spin mb-6 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}/>
                    <span className={`font-black tracking-tight text-lg ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>A calcular melhor estratégia...</span>
                    <p className={`text-[10px] font-bold mt-1 uppercase ${isDarkMode ? 'text-purple-300/70' : 'text-slate-500'}`}>Para a meta "{selectedGoalForPlan?.name}"</p>
                  </div>
                ) : (
                  <div className={`text-sm font-bold leading-relaxed space-y-4 ${isDarkMode ? 'text-purple-200' : 'text-slate-700'}`}>
                    {aiGoalPlan.split('\n').map((l, i) => l.trim() && <p key={i} className={`p-5 rounded-2xl shadow-sm border ${isDarkMode ? 'bg-[#0b0410]/50 border-[#321759]' : 'bg-slate-50 border-slate-200'}`}>{l}</p>)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showAiBudgetModal && (
          <div className="fixed inset-0 bg-[#0b0410]/80 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
            <div className={`rounded-[2rem] w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 border ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759]' : 'bg-white border-slate-200'}`}>
              <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? 'bg-indigo-900/30 border-indigo-800/50 text-indigo-100' : 'bg-indigo-50 border-indigo-200/50 text-indigo-900'}`}>
                <h3 className="font-black tracking-tight flex items-center gap-3 text-xl">
                  <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30"><Sparkles className="w-6 h-6 text-white"/></div> 
                  Orçamento Inteligente
                </h3>
                <button onClick={() => setShowAiBudgetModal(false)} className={`p-2 rounded-xl transition-colors border ${isDarkMode ? 'bg-[#1a0b2e] hover:bg-[#2d144d] text-indigo-400 border-indigo-800/50' : 'bg-white hover:bg-slate-100 text-indigo-700 border-indigo-200'}`}><X className="w-5 h-5"/></button>
              </div>
              <div className="p-8 overflow-y-auto flex-1">
                {isGeneratingBudget ? (
                  <div className="text-center py-16 flex flex-col items-center">
                    <Loader2 className={`w-12 h-12 animate-spin mb-6 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}/>
                    <span className={`font-black tracking-tight text-lg ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>A desenhar o orçamento ideal...</span>
                    <p className={`text-[10px] font-bold mt-1 uppercase ${isDarkMode ? 'text-purple-300/70' : 'text-slate-500'}`}>A analisar o seu rendimento e categorias.</p>
                  </div>
                ) : (
                  <div className={`text-sm font-bold leading-relaxed space-y-4 ${isDarkMode ? 'text-purple-200' : 'text-slate-700'}`}>
                    {aiBudgetPlan.split('\n').map((l, i) => l.trim() && <p key={i} className={`p-5 rounded-2xl shadow-sm border ${isDarkMode ? 'bg-[#0b0410]/50 border-[#321759]' : 'bg-slate-50 border-slate-200'}`}>{l}</p>)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showAiModal && (
          <div className="fixed inset-0 bg-[#0b0410]/80 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
            <div className={`rounded-[2rem] w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 border ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759]' : 'bg-white border-slate-200'}`}>
              <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? 'bg-indigo-900/30 border-indigo-800/50 text-indigo-100' : 'bg-indigo-50 border-indigo-200/50 text-indigo-900'}`}><h3 className="font-black tracking-tight flex items-center gap-3 text-xl"><div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30"><Sparkles className="w-6 h-6 text-white"/></div> Assistente IA</h3>
              <button onClick={() => setShowAiModal(false)} className={`p-2 rounded-xl transition-colors border ${isDarkMode ? 'bg-[#1a0b2e] hover:bg-[#2d144d] text-indigo-400 border-indigo-800/50' : 'bg-white hover:bg-slate-100 text-indigo-700 border-indigo-200'}`}><X className="w-5 h-5"/></button></div>
              <div className="p-8 overflow-y-auto flex-1">
                {isAnalyzing ? (
                  <div className="text-center py-16 flex flex-col items-center">
                    <Loader2 className={`w-12 h-12 animate-spin mb-6 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}/>
                    <span className={`font-black tracking-tight text-lg ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>A analisar padrões...</span>
                    <p className={`text-[10px] font-bold mt-1 uppercase ${isDarkMode ? 'text-purple-300/70' : 'text-slate-500'}`}>A preparar o seu relatório.</p>
                  </div>
                ) : (
                  <div className={`text-sm font-bold leading-relaxed space-y-4 ${isDarkMode ? 'text-purple-200' : 'text-slate-700'}`}>
                    {aiInsight.split('\n').map((l, i) => l.trim() && <p key={i} className={`p-5 rounded-2xl shadow-sm border ${isDarkMode ? 'bg-[#0b0410]/50 border-[#321759]' : 'bg-slate-50 border-slate-200'}`}>{l}</p>)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showCalculator && (
          <div className="fixed inset-0 bg-[#0b0410]/80 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
            <div className={`rounded-[2rem] shadow-2xl w-full max-w-[320px] overflow-hidden flex flex-col animate-in zoom-in-95 border ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759]' : 'bg-white border-slate-200'}`}>
              <div className={`p-5 border-b flex justify-between items-center ${isDarkMode ? 'bg-[#0b0410]/50 border-[#321759]' : 'bg-slate-50 border-slate-200'}`}>
                <h3 className={`font-black flex items-center gap-2 text-xs tracking-widest uppercase ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  <CalculatorIcon className={`w-4 h-4 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} /> Calculadora
                </h3>
                <button onClick={() => setShowCalculator(false)} className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'bg-[#0b0410] hover:bg-[#2d144d] text-purple-300/70' : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'}`}><X className="w-4 h-4" /></button>
              </div>
              <div className="p-6">
                <div className={`rounded-2xl p-5 mb-6 text-right overflow-hidden break-all min-h-[5rem] flex items-end justify-end shadow-inner border ${isDarkMode ? 'bg-[#0b0410] border-[#321759]' : 'bg-slate-100 border-slate-200'}`}>
                  <span className={`text-4xl font-mono tracking-widest font-light ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{calcInput || '0'}</span>
                </div>
                <div className="grid grid-cols-4 gap-3 md:gap-4">
                  {['C','⌫','%','/','7','8','9','*','4','5','6','-','1','2','3','+','0',',','='].map(btn => (
                    <button key={btn} onClick={() => handleCalcClickWrapper(btn)} className={`py-4 rounded-2xl font-black text-xl transition-all active:scale-90 shadow-sm border ${btn === '0' ? 'col-span-2' : ''} ${btn === 'C' ? 'bg-rose-500 hover:bg-rose-600 text-white border-transparent' : btn === '=' ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent' : ['/','*','-','+'].includes(btn) ? (isDarkMode ? 'bg-[#0b0410] text-indigo-400 hover:bg-[#2d144d] border-[#321759]' : 'bg-slate-100 text-indigo-600 hover:bg-slate-200 border-slate-200') : ['⌫','%'].includes(btn) ? (isDarkMode ? 'bg-[#2d144d] text-purple-200 hover:bg-[#3e1c66] border-[#441f74]' : 'bg-slate-200 text-slate-700 hover:bg-slate-300 border-slate-300') : (isDarkMode ? 'bg-[#1a0b2e] text-white hover:bg-[#2d144d] border-[#321759]' : 'bg-white text-slate-900 hover:bg-slate-50 border-slate-200')}`}>
                      {btn}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL CONSULTOR DE COMPRAS IA */}
        {showPurchaseModal && (
          <div className="fixed inset-0 bg-[#0b0410]/80 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
            <div className={`rounded-[2rem] w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 border ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759]' : 'bg-white border-slate-200'}`}>
              <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? 'bg-purple-900/30 border-purple-800/50 text-purple-100' : 'bg-purple-50 border-purple-200/50 text-purple-900'}`}>
                <h3 className="font-black tracking-tight flex items-center gap-3 text-xl">
                  <div className="p-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/30"><ShoppingBag className="w-6 h-6 text-white"/></div>
                  Consultor de Compras
                </h3>
                <button onClick={() => setShowPurchaseModal(false)} className={`p-2 rounded-xl transition-colors border ${isDarkMode ? 'bg-[#1a0b2e] hover:bg-[#2d144d] text-purple-400 border-[#321759]' : 'bg-white hover:bg-slate-100 text-purple-700 border-slate-200'}`}><X className="w-5 h-5"/></button>
              </div>
              <div className="p-8 overflow-y-auto flex-1">
                <p className={`text-xs font-bold mb-6 ${isDarkMode ? 'text-purple-300/70' : 'text-slate-500'}`}>A IA analisa o seu saldo atual, entradas e gastos do mês para aconselhar se deve avançar com a compra.</p>
                <form onSubmit={handleAnalyzePurchase} className="space-y-5 mb-6">
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-purple-300/70' : 'text-slate-500'}`}>O que deseja comprar?</label>
                    <input type="text" required value={purchaseItemName} onChange={(e) => setPurchaseItemName(e.target.value)} placeholder="Ex: Novo Smartphone" className={`w-full px-5 py-4 rounded-2xl outline-none focus:ring-4 transition-all font-bold shadow-sm border ${isDarkMode ? 'bg-[#0b0410] border-[#321759] text-white focus:border-purple-500 focus:ring-purple-500/10' : 'bg-white border-slate-300 text-slate-900 focus:border-purple-500 focus:ring-purple-500/10'}`} />
                  </div>
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-purple-300/70' : 'text-slate-500'}`}>Qual o valor (R$)?</label>
                    <input type="number" step="0.01" required value={purchaseItemPrice} onChange={(e) => setPurchaseItemPrice(e.target.value)} placeholder="Ex: 3500.00" className={`w-full px-5 py-4 rounded-2xl outline-none focus:ring-4 transition-all font-bold shadow-sm border ${isDarkMode ? 'bg-[#0b0410] border-[#321759] text-white focus:border-purple-500 focus:ring-purple-500/10' : 'bg-white border-slate-300 text-slate-900 focus:border-purple-500 focus:ring-purple-500/10'}`} />
                  </div>
                  <button disabled={isAdvisingPurchase} type="submit" className={`w-full py-4 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 ${isDarkMode ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500' : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'}`}>
                    {isAdvisingPurchase ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    ✨ Analisar Viabilidade
                  </button>
                </form>

                {purchaseAdvice && (
                  <div className={`pt-6 border-t animate-in fade-in ${isDarkMode ? 'border-[#321759]' : 'border-slate-200/50'}`}>
                    <h4 className={`text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}><Wand2 className="w-4 h-4"/> Veredicto da IA:</h4>
                    <div className={`text-sm font-bold leading-relaxed space-y-3 ${isDarkMode ? 'text-purple-200' : 'text-slate-700'}`}>
                       {purchaseAdvice.split('\n').map((l, i) => l.trim() && <p key={i} className={`p-4 rounded-xl shadow-sm border ${isDarkMode ? 'bg-[#0b0410]/50 border-[#321759]' : 'bg-slate-50 border-slate-200'}`}>{l}</p>)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL UNIVERSAL PARA CONFIRMAÇÕES E PROMPTS */}
        {uiModal.type && (
          <div className="fixed inset-0 bg-[#0b0410]/80 backdrop-blur-sm flex items-center justify-center p-4 z-[300] no-print">
            <div className={`rounded-[2rem] shadow-2xl w-full max-w-sm p-8 animate-in zoom-in-95 border ${isDarkMode ? 'bg-[#1a0b2e] border-[#321759]' : 'bg-white border-slate-200'}`}>
              <div className="flex justify-between items-start mb-5">
                <h3 className={`font-black text-xl tracking-tight flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {uiModal.type === 'alert' && <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-indigo-900/30' : 'bg-indigo-100'}`}><Info className={`w-6 h-6 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} /></div>}
                  {uiModal.type === 'confirm' && <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-rose-900/30' : 'bg-rose-100'}`}><AlertCircle className={`w-6 h-6 ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`} /></div>}
                  {uiModal.type === 'prompt' && <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-emerald-900/30' : 'bg-emerald-100'}`}><Plus className={`w-6 h-6 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} /></div>}
                  {uiModal.title}
                </h3>
                {uiModal.type !== 'alert' && (
                  <button onClick={closeUiModal} className={`p-2 rounded-xl transition-colors border border-transparent ${isDarkMode ? 'text-slate-400 hover:bg-slate-700 hover:border-slate-600' : 'text-slate-400 hover:bg-slate-100 hover:border-slate-200'}`}><X className="w-5 h-5" /></button>
                )}
              </div>
              
              <p className={`text-sm font-bold mb-6 leading-relaxed ${isDarkMode ? 'text-purple-200' : 'text-slate-600'}`}>{uiModal.message}</p>
              
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
                  className={`w-full px-5 py-4 mb-6 rounded-xl outline-none focus:ring-4 transition-all font-black text-lg shadow-sm border ${isDarkMode ? 'bg-[#0b0410] border-[#321759] text-white focus:border-indigo-500 focus:ring-indigo-500/10' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500/10'}`} 
                />
              )}

              <div className="flex gap-3 mt-2">
                {uiModal.type !== 'alert' && (
                  <button onClick={closeUiModal} className={`flex-1 py-4 font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-sm border ${isDarkMode ? 'bg-[#0b0410]/50 border-[#321759] text-purple-300/70 hover:bg-[#2d144d]' : 'bg-slate-50 border-slate-200/50 text-slate-700 hover:bg-slate-100'}`}>Cancelar</button>
                )}
                <button 
                  onClick={() => {
                    if (uiModal.onConfirm) {
                      if (uiModal.type === 'prompt') uiModal.onConfirm(uiModal.inputValue);
                      else uiModal.onConfirm();
                    }
                    closeUiModal();
                  }} 
                  className={`flex-1 py-4 text-white font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-xl active:scale-95 ${uiModal.type === 'confirm' ? (isDarkMode ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/30' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30') : (isDarkMode ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/30' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30')}`}
                >
                  {uiModal.type === 'alert' ? 'Entendi' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
