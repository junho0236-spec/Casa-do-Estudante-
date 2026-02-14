
import React from 'react';
import { CheckCircle, Clock, AlertCircle, Calendar } from 'lucide-react';
import { AppStats } from '../types';

interface StatsCardsProps {
  stats: AppStats;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between transition-colors">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total de Tarefas</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{stats.total}</p>
        </div>
        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <Calendar className="w-6 h-6" />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between transition-colors">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pendentes</p>
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-500 mt-1">{stats.pending}</p>
        </div>
        <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/30 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-500">
          <AlertCircle className="w-6 h-6" />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between transition-colors">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Em Andamento</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-500 mt-1">{stats.inProgress}</p>
        </div>
        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-500">
          <Clock className="w-6 h-6" />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between transition-colors">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Concluídas</p>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-500 mt-1">{stats.completed}</p>
        </div>
        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-500">
          <CheckCircle className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
