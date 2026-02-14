
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
  Repeat,
  Database,
  Copy,
  Check
} from 'lucide-react';

import { Task, TaskStatus, TaskPriority, DirectorRole, AppStats } from './types';
import { DIRECTOR_ROLES_OPTIONS } from './constants';
import { generateActionPlan, generateCommunicationDraft, generateSmartSummary } from './services/geminiService';
import { supabase } from './lib/supabase';

import StatsCards from './components/StatsCards';
import AIResponseModal from './components/AIResponseModal';
import TaskModal from './components/TaskModal';

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [dbHasRecurringCols, setDbHasRecurringCols] = useState<boolean | null>(null);
  const [showSqlTip, setShowSqlTip] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

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

  // Auth & Task State
  const [session, setSession] = useState<any>(null);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [userName, setUserName] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<DirectorRole>(DirectorRole.ALL);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [aiModal, setAiModal] = useState({ isOpen: false, title: '', content: '', isLoading: false });

  // Check Schema
  const checkSchema = useCallback(async () => {
    const { data, error } = await supabase.from('tasks').select('is_recurring').limit(1);
    if (error && error.message.includes('is_recurring')) {
      setDbHasRecurringCols(false);
      setShowSqlTip(true);
    } else {
      setDbHasRecurringCols(true);
      setShowSqlTip(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { if (session) checkSchema(); }, [session, checkSchema]);

  const fetchTasks = useCallback(async () => {
    if (!session) return;
    setIsLoadingTasks(true);
    const columns = dbHasRecurringCols === false 
      ? 'id, status, priority, deadline, assignee, role, task, notes, created_at' 
      : '*';
    
    const { data, error } = await supabase.from('tasks').select(columns).order('deadline', { ascending: true });
    if (!error) setTasks(data || []);
    setIsLoadingTasks(false);
  }, [session, dbHasRecurringCols]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError('');
    try {
      if (authView === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: loginEmail, password: loginPassword, options: { data: { full_name: userName } }
        });
        if (error) throw error;
        if (data.session) setSession(data.session);
        else setAuthError('Verifique seu e-mail.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
        if (error) throw error;
      }
    } catch (err: any) { setAuthError(err.message); } finally { setIsAuthLoading(false); }
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
    // Criamos um payload limpo apenas com o que o banco suporta
    const basePayload: any = {
      task: taskData.task,
      assignee: taskData.assignee,
      role: taskData.role,
      status: taskData.status,
      priority: taskData.priority,
      deadline: taskData.deadline,
      notes: taskData.notes,
      user_id: session?.user?.id
    };

    // Só adiciona campos de recorrência se o banco suportar E a tarefa for recorrente
    if (dbHasRecurringCols && taskData.is_recurring) {
      basePayload.is_recurring = true;
      basePayload.recurring_day = taskData.recurring_day;
      basePayload.lead_days = taskData.lead_days;
    }

    try {
      let error;
      if (taskToEdit) {
        const res = await supabase.from('tasks').update(basePayload).eq('id', taskToEdit.id);
        error = res.error;
      } else {
        const res = await supabase.from('tasks').insert([basePayload]);
        error = res.error;
      }
      if (error) throw error;
      fetchTasks();
    } catch (err: any) {
      alert('Erro ao salvar tarefa: ' + err.message);
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (confirm('Excluir permanentemente?')) {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (!error) fetchTasks();
    }
  };

  // AI Actions
  // Fix: Implement handleSmartSummary to call Gemini AI and update the modal state
  const handleSmartSummary = async () => {
    setAiModal({ isOpen: true, title: 'Resumo Inteligente', content: '', isLoading: true });
    try {
      const summary = await generateSmartSummary(tasks);
      setAiModal(prev => ({ ...prev, content: summary, isLoading: false }));
    } catch (error: any) {
      setAiModal(prev => ({ ...prev, content: error.message, isLoading: false }));
    }
  };

  // Fix: Implement handleGenerateActionPlan to call Gemini AI for a specific task and update the modal state
  const handleGenerateActionPlan = async (task: Task) => {
    setAiModal({ isOpen: true, title: `Plano de Ação: ${task.task}`, content: '', isLoading: true });
    try {
      const plan = await generateActionPlan(task);
      setAiModal(prev => ({ ...prev, content: plan, isLoading: false }));
    } catch (error: any) {
      setAiModal(prev => ({ ...prev, content: error.message, isLoading: false }));
    }
  };

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
      const matchesSearch = t.task.toLowerCase().includes(searchTerm.toLowerCase()) || t.assignee.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === DirectorRole.ALL || t.role === filterRole;
      let isVisible = true;
      if (t.is_recurring && t.recurring_day && t.lead_days !== undefined) {
        isVisible = currentDay >= (t.recurring_day - t.lead_days) && currentDay <= t.recurring_day;
      }
      return matchesSearch && matchesRole && isVisible;
    });
  }, [tasks, searchTerm, filterRole]);

  const copySql = () => {
    const sql = "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;\nALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurring_day INTEGER DEFAULT 1;\nALTER TABLE tasks ADD COLUMN IF NOT EXISTS lead_days INTEGER DEFAULT 0;";
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 transition-colors">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center bg-indigo-600 p-4 rounded-3xl shadow-xl mb-6">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Casa do Estudante</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Gestão de Diretoria</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800">
            <form onSubmit={handleAuthSubmit} className="space-y-5">
              {authError && <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-xs font-bold border border-rose-100 dark:border-rose-900/50 flex items-center gap-2"><AlertCircle className="w-4 h-4"/>{authError}</div>}
              {authView === 'signup' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nome</label>
                  <div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input required type="text" value={userName} onChange={e => setUserName(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"/></div>
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">E-mail</label>
                <div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input required type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"/></div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Senha</label>
                <div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input required type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"/></div>
              </div>
              <button disabled={isAuthLoading} type="submit" className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all">
                {isAuthLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (authView === 'login' ? 'Entrar' : 'Cadastrar')}
              </button>
            </form>
            <button onClick={() => setAuthView(authView === 'login' ? 'signup' : 'login')} className="w-full mt-6 text-sm font-bold text-indigo-600 dark:text-indigo-400">
              {authView === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
      {showSqlTip && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/50 p-3">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 text-sm font-bold">
              <Database className="w-5 h-5" />
              <span>Funcionalidade de Recorrência Pendente: Execute o comando SQL no seu Supabase para ativar.</span>
            </div>
            <button 
              onClick={copySql}
              className="flex items-center gap-2 px-4 py-1.5 bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 rounded-lg text-xs font-black uppercase transition-all hover:scale-105 active:scale-95"
            >
              {copiedSql ? <Check className="w-4 h-4"/> : <Copy className="w-4 h-4"/>}
              {copiedSql ? 'Copiado!' : 'Copiar Comando SQL'}
            </button>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 h-20 flex items-center">
        <div className="max-w-7xl mx-auto px-4 w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg"><Users className="w-6 h-6 text-white" /></div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Casa do Estudante</h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Gestão de Diretoria</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2.5 text-slate-400 hover:text-indigo-600 rounded-xl transition-all">{isDarkMode ? <Sun /> : <Moon />}</button>
            <button onClick={() => { setTaskToEdit(null); setIsTaskModalOpen(true); }} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all">
              <Plus className="w-5 h-5" /><span className="hidden md:inline">Nova Tarefa</span>
            </button>
            <button onClick={() => supabase.auth.signOut()} className="p-2.5 text-slate-400 hover:text-rose-600 rounded-xl transition-all"><LogOut /></button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <StatsCards stats={stats} />
        
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl dark:text-white outline-none"/>
          </div>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value as DirectorRole)} className="bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-2xl border dark:border-slate-700 text-sm font-bold dark:text-white">
            {DIRECTOR_ROLES_OPTIONS.map(r => <option key={r} value={r}>{r === DirectorRole.ALL ? 'Todas Diretorias' : r}</option>)}
          </select>
          <button onClick={handleSmartSummary} className="px-6 py-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-100 transition-all">
            <Sparkles className="w-4 h-4"/> Resumo IA
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          {isLoadingTasks ? (
            <div className="py-20 flex flex-col items-center gap-4 text-slate-400"><Loader2 className="animate-spin w-10 h-10"/><p>Carregando...</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b dark:border-slate-800">
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Prioridade</th>
                    <th className="px-6 py-4">Prazo</th>
                    <th className="px-6 py-4">Responsável</th>
                    <th className="px-6 py-4">Tarefa</th>
                    <th className="px-6 py-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800">
                  {filteredTasks.map(task => (
                    <tr key={task.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg border flex items-center gap-1.5 w-fit
                          ${task.status === TaskStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20' : 
                            task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20' : 
                            'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20'}`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-6 py-4"><span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${task.priority === TaskPriority.HIGH ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'}`}>{task.priority}</span></td>
                      <td className="px-6 py-4">
                        {task.is_recurring ? (
                          <div className="flex items-center gap-1.5 text-indigo-600 font-black text-xs"><Repeat className="w-3.5 h-3.5"/> Dia {task.recurring_day}</div>
                        ) : (
                          <span className="text-xs font-bold dark:text-slate-300">{new Date(task.deadline).toLocaleDateString()}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div className="font-black dark:text-slate-200">{task.assignee}</div>
                        <div className="text-slate-400 font-medium">{task.role}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-sm dark:text-slate-100">{task.task}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleGenerateActionPlan(task)} className="p-2 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-600 transition-all"><ListChecks className="w-4 h-4"/></button>
                          <button onClick={() => { setTaskToEdit(task); setIsTaskModalOpen(true); }} className="p-2 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100"><Edit2 className="w-4 h-4"/></button>
                          <button onClick={() => handleDeleteTask(task.id)} className="p-2 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <AIResponseModal {...aiModal} onClose={() => setAiModal(p => ({...p, isOpen: false}))} />
      <TaskModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} onSave={handleSaveTask} taskToEdit={taskToEdit} dbSupportsRecurring={!!dbHasRecurringCols} />
    </div>
  );
};

export default App;
