
import { GoogleGenAI } from "@google/genai";
import { Task } from "../types";

const MODEL_NAME = 'gemini-3-flash-preview';

export async function generateActionPlan(task: Task): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const prompt = `Atue como um assistente de gestão eficiente para uma Casa do Estudante.
    Tarefa: "${task.task}"
    Responsável: ${task.assignee} (${task.role})
    Observações: ${task.notes}
    
    Crie um checklist prático e detalhado com 4 a 6 passos para concluir essa tarefa com sucesso. Seja direto, use bullet points e linguagem profissional em português.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text || "Não foi possível gerar o plano de ação.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Falha ao conectar com a inteligência artificial.");
  }
}

export async function generateCommunicationDraft(task: Task): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const prompt = `Atue como um assistente de comunicação profissional.
    Tarefa: "${task.task}"
    Responsável: ${task.assignee} (${task.role})
    Contexto/Obs: ${task.notes}
    
    Escreva um rascunho de e-mail ou comunicado formal (curto e educado) que o responsável possa usar para tratar dessa tarefa. 
    Inclua uma linha de Assunto clara. Use linguagem profissional em português.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text || "Não foi possível gerar o rascunho de comunicado.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Falha ao conectar com a inteligência artificial.");
  }
}

export async function generateSmartSummary(tasks: Task[]): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const taskSummary = tasks.map(t => `- [${t.status}] ${t.task} (${t.role})`).join('\n');
    const prompt = `Resuma o status atual da gestão da Casa do Estudante baseado nestas tarefas:
    ${taskSummary}
    
    Destaque os principais desafios e sugira uma prioridade máxima para a semana. Seja conciso.`;

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
      });
      return response.text || "Não foi possível gerar o resumo inteligente.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw new Error("Falha ao conectar com a inteligência artificial.");
    }
}
