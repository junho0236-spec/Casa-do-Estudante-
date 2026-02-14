
import React, { useState, useEffect } from 'react';
import { X, Plus, Save, Repeat, AlertTriangle } from 'lucide-react';
import { Task, TaskStatus, TaskPriority, DirectorRole } from '../types';
import { DIRECTOR_ROLES_OPTIONS } from '../constants';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  taskToEdit?: Task | null;
  dbSupportsRecurring?: boolean;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, taskToEdit, dbSupportsRecurring }) => {
  const [formData, setFormData] = useState<Partial<Task>>({
    task: '',
    assignee: '',
    role: DirectorRole.PRESIDENCY,
    status: TaskStatus.PENDING,
    priority: TaskPriority.MEDIUM,
    deadline: new Date().toISOString().split('T')[0],
    notes: '',
    is_recurring: false,
    recurring_day: 1,
    lead_days: 0
  });

  useEffect(() => {
    if (taskToEdit) {
      setFormData({
        ...taskToEdit,
        is_recurring: taskToEdit.is_recurring || false,
        recurring_day: taskToEdit.recurring_day || 1,
        lead_days: taskToEdit.lead_days || 0
      });
    } else {
      setFormData({
        task: '', assignee: '', role: DirectorRole.PRESIDENCY, status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM, deadline: new Date().toISOString().split('T')[0],
        notes: '', is_recurring: false, recurring_day: 1, lead_days: 0
      });
    }
  }, [taskToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 border dark:border-slate-800">
        <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">{taskToEdit ? 'Editar' : 'Nova Tarefa'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X className="w-6 h-6 text-slate-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {dbSupportsRecurring ? (
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Repeat className={`w-5 h-5 ${formData.is_recurring ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Tarefa Recorrente Mensal?</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={formData.is_recurring} onChange={e => setFormData({ ...formData, is_recurring: e.target.checked })} />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-xl flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-bold leading-tight">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>O recurso de recorrência está desativado pois o banco de dados precisa ser atualizado.</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Tarefa</label>
            <input required type="text" value={formData.task} onChange={e => setFormData({ ...formData, task: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 dark:text-white rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="O que precisa ser feito?" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Quem</label>
              <input required type="text" value={formData.assignee} onChange={e => setFormData({ ...formData, assignee: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 dark:text-white rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Onde</label>
              <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as DirectorRole })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 dark:text-white rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none">
                {DIRECTOR_ROLES_OPTIONS.filter(r => r !== DirectorRole.ALL).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          {formData.is_recurring && dbSupportsRecurring ? (
            <div className="grid grid-cols-2 gap-4 p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl">
              <div>
                <label className="block text-[10px] font-black text-indigo-700 dark:text-indigo-400 uppercase mb-1">Dia do Mês (1-31)</label>
                <input required type="number" min="1" max="31" value={formData.recurring_day} onChange={e => setFormData({ ...formData, recurring_day: parseInt(e.target.value) })} className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-xl outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-indigo-700 dark:text-indigo-400 uppercase mb-1">Aparecer antes (Dias)</label>
                <input required type="number" min="0" max="30" value={formData.lead_days} onChange={e => setFormData({ ...formData, lead_days: parseInt(e.target.value) })} className="w-full px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-xl outline-none" />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Vencimento</label>
              <input required type="date" value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 dark:text-white rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as TaskStatus })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 dark:text-white rounded-2xl outline-none">
              {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value as TaskPriority })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 dark:text-white rounded-2xl outline-none">
              {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-6 py-2.5 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">Cancelar</button>
            <button type="submit" className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none transition-all">
              {taskToEdit ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {taskToEdit ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
