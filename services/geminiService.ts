import { GoogleGenAI, Type } from "@google/genai";
import { Todo, Category } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelId = "gemini-2.5-flash";

/**
 * Breaks down a complex task into smaller subtasks using Gemini.
 */
export const suggestSubtasks = async (taskText: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Break down the following task into 3 to 5 actionable subtasks: "${taskText}". Keep them concise.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
        },
      },
    });

    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text) as string[];
  } catch (error) {
    console.error("Failed to suggest subtasks:", error);
    return [];
  }
};

/**
 * Suggests a category for a new task based on its content.
 */
export const categorizeTask = async (taskText: string): Promise<Category> => {
    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: `Classify the task "${taskText}" into one of these categories: Work, Personal, Urgent, Learning, Health. Return only the category name.`,
            config: {
                responseMimeType: "text/plain",
            }
        });
        
        const text = response.text?.trim();
        const categories = Object.values(Category);
        
        // Simple matching to ensure valid enum
        const matched = categories.find(c => c.toLowerCase() === text?.toLowerCase());
        return matched || Category.PERSONAL;

    } catch (error) {
        console.error("Categorization failed", error);
        return Category.PERSONAL;
    }
}

/**
 * Reorders tasks based on urgency and importance inferred by AI.
 */
export const prioritizeTasks = async (todos: Todo[]): Promise<string[]> => {
  if (todos.length === 0) return [];

  const simpleTodos = todos.map(t => ({ id: t.id, text: t.text, category: t.category }));

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `You are a productivity expert. Reorder the following tasks by priority (Urgency > Work > Health > Others). Return ONLY an array of IDs in the optimized order.
      Tasks: ${JSON.stringify(simpleTodos)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
        },
      },
    });

    const text = response.text;
    if (!text) return todos.map(t => t.id);

    return JSON.parse(text) as string[];
  } catch (error) {
    console.error("Prioritization failed:", error);
    return todos.map(t => t.id);
  }
};
