
import { Task, TaskStatus, TaskPriority, DirectorRole } from './types';

export const INITIAL_TASKS: Task[] = [
  { id: 1, status: TaskStatus.PENDING, priority: TaskPriority.HIGH, deadline: '2025-05-15', assignee: 'Ana Silva', role: DirectorRole.PRESIDENCY, task: 'Renovar alvará de funcionamento', notes: 'Precisa ir na prefeitura' },
  { id: 2, status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM, deadline: '2025-05-20', assignee: 'Carlos Souza', role: DirectorRole.TREASURY, task: 'Cobrar mensalidades atrasadas', notes: 'Enviar e-mail para lista de inadimplentes' },
  { id: 3, status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, deadline: '2025-05-10', assignee: 'Marcos Oliveira', role: DirectorRole.PATRIMONY, task: 'Conserto do chuveiro do 2º andar', notes: 'Peça trocada, custou R$ 45,00' },
  { id: 4, status: TaskStatus.PENDING, priority: TaskPriority.LOW, deadline: '2025-06-01', assignee: 'Julia Santos', role: DirectorRole.SOCIAL, task: 'Cotar preços para festa de fim de ano', notes: 'Verificar 3 fornecedores de bebida' },
  { id: 5, status: TaskStatus.PENDING, priority: TaskPriority.MEDIUM, deadline: '2025-05-28', assignee: 'Ana Silva', role: DirectorRole.PRESIDENCY, task: 'Reunião mensal com a reitoria', notes: 'Pauta: segurança do campus' },
  { id: 6, status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, deadline: '2025-05-22', assignee: 'Lucas Mendes', role: DirectorRole.SECRETARIAT, task: 'Atualizar lista de moradores', notes: 'Conferir documentos dos novatos' },
];

export const DIRECTOR_ROLES_OPTIONS = [
  DirectorRole.ALL,
  DirectorRole.PRESIDENCY,
  DirectorRole.TREASURY,
  DirectorRole.PATRIMONY,
  DirectorRole.SOCIAL,
  DirectorRole.SECRETARIAT,
];
