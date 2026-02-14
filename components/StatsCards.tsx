
import React from 'react';
import { CheckCircle, Clock, AlertCircle, Calendar } from 'lucide-react';
import { AppStats } from '../types';

interface StatsCardsProps {
  stats: AppStats;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Total de Tarefas</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{stats.total}</p>
        </div>
        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
          <Calendar className="w-6 h-6" />
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Pendentes</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{stats.pending}</p>
        </div>
        <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
          <AlertCircle className="w-6 h-6" />
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Em Andamento</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{stats.inProgress}</p>
        </div>
        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
          <Clock className="w-6 h-6" />
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Concluídas</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.completed}</p>
        </div>
        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
          <CheckCircle className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
