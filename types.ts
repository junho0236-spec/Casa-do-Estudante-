
export enum TaskStatus {
  PENDING = 'Pendente',
  IN_PROGRESS = 'Em Andamento',
  COMPLETED = 'Concluído'
}

export enum TaskPriority {
  LOW = 'Baixa',
  MEDIUM = 'Média',
  HIGH = 'Alta'
}

export enum DirectorRole {
  ALL = 'Todos',
  PRESIDENCY = 'Presidência',
  TREASURY = 'Tesouraria',
  PATRIMONY = 'Patrimônio',
  SOCIAL = 'Social/Eventos',
  SECRETARIAT = 'Secretaria'
}

export interface Task {
  id: number;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string;
  assignee: string;
  role: DirectorRole;
  task: string;
  notes: string;
  // Campos recorrentes
  is_recurring?: boolean;
  recurring_day?: number;
  lead_days?: number;
}

export interface AppStats {
  total: number;
  pending: number;
  completed: number;
  inProgress: number;
}
