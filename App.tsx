
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Users, 
  FileSpreadsheet, 
  Plus, 
  Search, 
  Filter, 
  Sparkles,
  CheckCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  ListChecks,
  Edit2,
  Trash2,
  LogIn,
  Lock,
  Mail,
  Loader2,
  UserPlus,
  ArrowRight,
  User,
  LogOut,
  Sun,
  Moon,
  Repeat
} from 'lucide-react';

import { Task, TaskStatus, TaskPriority, DirectorRole, AppStats } from './types';
import { DIRECTOR_ROLES_OPTIONS } from './constants';
import { generateActionPlan, generateCommunicationDraft, generateSmartSummary } from './services/geminiService';
import { supabase } from './lib/supabase';

import StatsCards from './components/StatsCards';
import AIResponseModal from './components/AIResponseModal';
import TaskModal from './components/TaskModal';

const App: React.FC = () => {
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Authentication State
  const [session, setSession] = useState<any>(null);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  
  // Auth Form State
  const [userName, setUserName] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Task State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<DirectorRole>(DirectorRole.ALL);
  
  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  
  const [aiModal, setAiModal] = useState({
    isOpen: false,
    title: '',
    content: '',
    isLoading: false
  });

  // Auth Effect
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch Tasks
  const fetchTasks = useCallback(async () => {
    if (!session) return;
    setIsLoadingTasks(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('deadline', { ascending: true });
    
    if (error) {
      console.error('Error fetching tasks:', error);
    } else {
      setTasks(data || []);
    }
    setIsLoadingTasks(false);
  }, [session]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Auth Handlers
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError('');

    try {
      if (authView === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: loginEmail,
          password: loginPassword,
          options: {
            data: { full_name: userName }
          }
        });
        if (error) throw error;
        if (data.session) setSession(data.session);
        else setAuthError('Verifique seu e-mail para confirmar o cadastro.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: loginPassword,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setAuthError(err.message || 'Erro na autenticação.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Stats & Filtering
  const stats = useMemo<AppStats>(() => ({
    total: tasks.length,
    pending: tasks.filter(t => t.status === TaskStatus.PENDING).length,
    completed: tasks.filter(t => t.status === TaskStatus.COMPLETED).length,
    inProgress: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
  }), [tasks]);

  const filteredTasks = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDate();

    return tasks.filter(t => {
      const matchesSearch = t.task.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            t.assignee.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === DirectorRole.ALL || t.role === filterRole;
      
      // Lógica de Recorrência (Visibility)
      let isVisible = true;
      if (t.is_recurring && t.recurring_day && t.lead_days !== undefined) {
        // Se estamos no período de antecedência: (vencimento - antecedencia) <= dia_atual <= vencimento
        const startDay = t.recurring_day - t.lead_days;
        const endDay = t.recurring_day;
        
        // Verifica se o dia atual está na janela (simples, não lida com virada de mês para manter leve)
        isVisible = currentDay >= startDay && currentDay <= endDay;
      }

      return matchesSearch && matchesRole && isVisible;
    });
  }, [tasks, searchTerm, filterRole]);

  // AI Actions
  const handleGenerateActionPlan = async (task: Task) => {
    setAiModal({ isOpen: true, title: '✨ Plano de Ação Sugerido', content: '', isLoading: true });
    try {
      const result = await generateActionPlan(task);
      setAiModal(prev => ({ ...prev, content: result, isLoading: false }));
    } catch (err: any) {
      setAiModal(prev => ({ ...prev, content: err.message, isLoading: false }));
    }
  };

  const handleGenerateCommunication = async (task: Task) => {
    setAiModal({ isOpen: true, title: '✉️ Rascunho de Comunicado', content: '', isLoading: true });
    try {
      const result = await generateCommunicationDraft(task);
      setAiModal(prev => ({ ...prev, content: result, isLoading: false }));
    } catch (err: any) {
      setAiModal(prev => ({ ...prev, content: err.message, isLoading: false }));
    }
  };

  const handleSmartSummary = async () => {
    setAiModal({ isOpen: true, title: '📊 Resumo Inteligente da Gestão', content: '', isLoading: true });
    try {
      const result = await generateSmartSummary(tasks);
      setAiModal(prev => ({ ...prev, content: result, isLoading: false }));
    } catch (err: any) {
      setAiModal(prev => ({ ...prev, content: err.message, isLoading: false }));
    }
  };

  // Task CRUD
  const handleSaveTask = async (taskData: Partial<Task>) => {
    if (taskToEdit) {
      const { error } = await supabase
        .from('tasks')
        .update(taskData)
        .eq('id', taskToEdit.id);
      if (error) alert('Erro ao atualizar tarefa: ' + error.message);
    } else {
      const { error } = await supabase
        .from('tasks')
        .insert([{ ...taskData, user_id: session?.user?.id }]);
      if (error) alert('Erro ao criar tarefa: ' + error.message);
    }
    fetchTasks();
  };

  const handleDeleteTask = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir permanentemente esta tarefa?')) {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      if (error) alert('Erro ao excluir tarefa: ' + error.message);
      fetchTasks();
    }
  };

  // Export CSV
  const exportCSV = () => {
    const headers = ["Status,Prioridade,Recorrente,Prazo,Responsável,Diretoria,Tarefa,Observações"];
    const rows = tasks.map(t => `${t.status},${t.priority},${t.is_recurring ? 'Sim' : 'Não'},${t.is_recurring ? `Todo dia ${t.recurring_day}` : t.deadline},${t.assignee},${t.role},"${t.task.replace(/"/g, '""')}","${t.notes.replace(/"/g, '""')}"`);
    const csv = "\uFEFF" + [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Gestao_Casa_Estudante_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED: return <CheckCircle className="w-4 h-4" />;
      case TaskStatus.IN_PROGRESS: return <Clock className="w-4 h-4" />;
      case TaskStatus.PENDING: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusClass = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED: return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50';
      case TaskStatus.IN_PROGRESS: return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/50';
      case TaskStatus.PENDING: return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50';
    }
  };

  const getPriorityClass = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGH: return 'text-rose-600 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400';
      case TaskPriority.MEDIUM: return 'text-orange-600 bg-orange-50 dark:bg-orange-950/20 dark:text-orange-400';
      case TaskPriority.LOW: return 'text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 font-sans transition-colors">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center bg-indigo-600 p-4 rounded-3xl shadow-xl shadow-indigo-100 dark:shadow-none mb-6 transition-transform hover:scale-110 duration-300">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Casa do Estudante</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
              {authView === 'login' ? 'Bem-vindo de volta à gestão' : 'Crie sua conta de acesso'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800">
            <form onSubmit={handleAuthSubmit} className="space-y-5">
              {authError && (
                <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-xs font-bold flex items-center gap-2 border border-rose-100 dark:border-rose-900/50 animate-shake">
                  <AlertCircle className="w-4 h-4" />
                  {authError}
                </div>
              )}

              {authView === 'signup' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      required
                      type="text"
                      value={userName}
                      onChange={e => setUserName(e.target.value)}
                      placeholder="Seu nome"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    required
                    type="email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="exemplo@email.com"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    required
                    type="password"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                  />
                </div>
              </div>

              <button 
                disabled={isAuthLoading}
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition-all shadow-lg shadow-indigo-100 dark:shadow-none disabled:opacity-70 mt-4"
              >
                {isAuthLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {authView === 'login' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                    {authView === 'login' ? 'Entrar no Sistema' : 'Finalizar Cadastro'}
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-800 text-center">
              <button 
                onClick={() => {
                  setAuthView(authView === 'login' ? 'signup' : 'login');
                  setAuthError('');
                }}
                className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center justify-center gap-2 mx-auto transition-colors"
              >
                {authView === 'login' ? (
                  <>Não tem conta? Cadastre-se <ArrowRight className="w-4 h-4" /></>
                ) : (
                  <>Já possui conta? Faça Login <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-100 dark:shadow-none">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">Casa do Estudante</h1>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Gestão de Diretoria</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
            <button 
              onClick={toggleTheme}
              className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl transition-all"
              title={isDarkMode ? "Tema Claro" : "Tema Escuro"}
            >
              {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button>

            <div className="hidden lg:flex items-center gap-2">
              <button 
                onClick={handleSmartSummary}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-indigo-700 dark:text-indigo-400 font-bold hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Resumo IA
              </button>
              <button 
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Exportar
              </button>
            </div>
            
            <button 
              onClick={() => { setTaskToEdit(null); setIsTaskModalOpen(true); }}
              className="flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden md:inline">Nova Tarefa</span>
            </button>

            <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 mx-1 hidden md:block"></div>

            <button 
              onClick={handleLogout}
              className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all"
              title="Sair"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <StatsCards stats={stats} />

        <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Buscar por tarefa ou nome..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium dark:text-white"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-3 py-1 rounded-2xl">
              <Filter className="w-4 h-4 text-slate-400" />
              <select 
                className="bg-transparent text-sm font-bold text-slate-600 dark:text-slate-400 py-2 outline-none cursor-pointer"
                value={filterRole}
                onChange={e => setFilterRole(e.target.value as DirectorRole)}
              >
                {DIRECTOR_ROLES_OPTIONS.map(role => (
                  <option key={role} value={role} className="dark:bg-slate-800">{role === DirectorRole.ALL ? 'Todas Diretorias' : role}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
             <button 
               onClick={handleSmartSummary}
               className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 rounded-2xl font-bold whitespace-nowrap"
             >
                <Sparkles className="w-4 h-4" /> Resumo IA
             </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          {isLoadingTasks ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-4">
               <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
               <p className="font-medium">Carregando tarefas do Supabase...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-32">Status</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-32">Prioridade</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Prazo</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Responsável</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[30%]">Tarefa</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">IA & Gestão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTasks.length > 0 ? filteredTasks.map(task => (
                    <tr key={task.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${getStatusClass(task.status)}`}>
                          {getStatusIcon(task.status)}
                          {task.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase ${getPriorityClass(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex flex-col">
                          {task.is_recurring ? (
                            <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                              <Repeat className="w-3.5 h-3.5" />
                              <span className="text-sm font-bold">Todo dia {task.recurring_day}</span>
                            </div>
                          ) : (
                            <>
                              <span className="text-sm font-bold text-slate-900 dark:text-slate-200">
                                {new Date(task.deadline).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase">{new Date(task.deadline).getFullYear()}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-300">{task.assignee}</span>
                          <span className="text-[11px] font-medium text-slate-400">{task.role}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">{task.task}</span>
                          {task.notes && (
                            <span className="text-[11px] text-slate-400 italic line-clamp-1">{task.notes}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            <button 
                              onClick={() => handleGenerateActionPlan(task)}
                              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all tooltip"
                              title="Plano de Ação IA"
                            >
                              <ListChecks className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleGenerateCommunication(task)}
                              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                              title="Rascunho Comunicado IA"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1"></div>

                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => { setTaskToEdit(task); setIsTaskModalOpen(true); }}
                              className="p-2 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                               onClick={() => handleDeleteTask(task.id)}
                              className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-all"
                              title="Excluir Permanentemente"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center border border-slate-100 dark:border-slate-700">
                            <Search className="w-6 h-6 opacity-20" />
                          </div>
                          <p className="font-bold">Nenhuma tarefa ativa encontrada.</p>
                          <p className="text-xs">Tarefas recorrentes só aparecem no período de antecedência definido.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <AIResponseModal 
        isOpen={aiModal.isOpen} 
        onClose={() => setAiModal(prev => ({ ...prev, isOpen: false }))}
        title={aiModal.title}
        content={aiModal.content}
        isLoading={aiModal.isLoading}
      />

      <TaskModal 
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
      />

      <footer className="max-w-7xl mx-auto px-4 py-8 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 dark:text-slate-500 text-sm font-medium">
          <p>© {new Date().getFullYear()} Gestão Casa do Estudante AI</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Manual</a>
            <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Privacidade</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
