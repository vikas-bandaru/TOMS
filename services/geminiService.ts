import { GoogleGenAI, Type } from "@google/genai";
import { TrainingSession, TrainerMapping, VenueMapping, CurriculumMapping, TrainingTypeMapping, TimingRule, SectionDetails } from "../types";

const getAiClient = () => {
    // In a real production app, this key should be proxied via backend
    const apiKey = process.env.API_KEY || ''; 
    return new GoogleGenAI({ apiKey });
};

// Meeting Sentinel: Process Audio/Text to extract policies
export const analyzeMeetingMinutes = async (textOrTranscript: string) => {
    const ai = getAiClient();
    
    // Zero-Trust: Use Pro model with Thinking to strictly deduce policies without hallucinating permissions
    const modelId = "gemini-3-pro-preview";
    
    const prompt = `
      You are the 'Meeting Sentinel' for TOMS (Training Operations Management System).
      Analyze the following meeting transcript/notes.
      
      Extract:
      1. Decisions (Firm conclusions).
      2. Deadlines (Dates/Times).
      3. Policy Constraints (e.g., "No classes on Friday").
      4. Urgency Flag: Set true if keywords "Payment", "Dean", or "Urgent" appear.
      
      Input Text:
      ${textOrTranscript}
    `;

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 2048 }, // Moderate thinking for policy extraction
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING },
                        decisions: { type: Type.ARRAY, items: { type: Type.STRING } },
                        deadlines: { type: Type.ARRAY, items: { type: Type.STRING } },
                        policies: { type: Type.ARRAY, items: { type: Type.STRING } },
                        isUrgent: { type: Type.BOOLEAN }
                    }
                }
            }
        });
        return response.text ? JSON.parse(response.text) : null;
    } catch (error) {
        console.error("Gemini Meeting Analysis Failed:", error);
        throw error;
    }
};

// Chatbot Functionality
export const chatWithData = async (query: string, contextData: string) => {
    const ai = getAiClient();
    const modelId = "gemini-3-pro-preview";

    const systemInstruction = `
      You are the AI Assistant for TOMS. You have access to the current system state provided in the context.
      Answer questions based ONLY on this context. 
      If you don't know, say "Data not available in current context."
      Role: Zero-Trust Auditor. Be precise.
    `;

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: `Context: ${contextData}\n\nUser Question: ${query}`,
            config: {
                systemInstruction: systemInstruction,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Chat Error:", error);
        return "System Error: Unable to process request.";
    }
};

// Feedback Sentiment Analysis
export const analyzeFeedback = async (feedbackBatch: string[]) => {
    const ai = getAiClient();
    const modelId = "gemini-3-flash-preview"; // Faster for bulk text

    const prompt = `
      Analyze these student feedback comments for trainers.
      Return a JSON list of flagged trainers who need attention.
      Trigger flags if text contains "Fast", "Voice", "Not Understood".
      
      Feedbacks:
      ${JSON.stringify(feedbackBatch)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });
        return response.text ? JSON.parse(response.text) : [];
    } catch (error) {
        console.error("Feedback Analysis Failed:", error);
        return [];
    }
};

// Transcribe Audio
export const transcribeAudio = async (audioBase64: string, mimeType: string) => {
    const ai = getAiClient();
    const modelId = "gemini-3-flash-preview"; // Good for audio transcription

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: {
                parts: [
                    { inlineData: { mimeType: mimeType, data: audioBase64 } },
                    { text: "Transcribe this meeting audio accurately." }
                ]
            }
        });
        return response.text;
    } catch (error) {
        console.error("Transcription Failed:", error);
        throw error;
    }
};

// --- NEW: Master Schedule Generator ---
export const generateSemesterSchedule = async (
    config: {
        trainers: TrainerMapping[];
        venues: VenueMapping[];
        curriculum: CurriculumMapping[];
        timings: TimingRule[];
        trainingTypes: TrainingTypeMapping[];
        sections: SectionDetails[];
    }
): Promise<TrainingSession[]> => {
    const ai = getAiClient();
    const modelId = "gemini-3-pro-preview";

    const prompt = `
      You are the Master Scheduler for Anurag University's TOMS.
      
      Context Data:
      ${JSON.stringify(config, null, 2)}

      Tasks:
      1. Create a schedule for the 'Upcoming Week' (Monday to Friday).
      2. RULE: Merge Department Sections into Batches of 2 (e.g., CSE-A + CSE-B = CSE-A+B).
      
      3. WEEKLY LOAD RULE (Strict):
         Each Batch MUST have exactly TWO training sessions per week:
         - Session 1: One TECHNICAL Topic (Selected from the Department's Curriculum, e.g., 'Java', 'Python', 'C&DS').
         - Session 2: One NON-TECHNICAL Topic (Either 'Aptitude' OR 'Soft Skills').
         
         Note: Do not schedule generic 'Technical'. You must pick a specific subject from the curriculum list (e.g., if Curriculum has ['Java', 'Aptitude'], the technical session topic must be 'Java').

      4. TRAINER MATCHING RULE (Infinite Capacity):
         - Assign a trainer if their 'courses' list explicitly contains the session topic.
         - ASSUME trainers are available for ALL slots. Do not worry about double-booking trainers across batches for now. Priority is to fill the schedule.
         - Never output 'PENDING_ASSIGNMENT' if a trainer exists in the list who teaches that course.

      5. TIMING RULE (Semester-wise Hybrid):
         - Semester 6 TECHNICAL courses: MUST use 'FULL_DAY' timing (09:00 - 16:00).
         - Semester 6 NON-TECHNICAL courses (Aptitude/Soft Skills): MUST use standard 'FN' (09:55-12:40) OR 'AN' (13:20-16:00) slots.
         - Other Semesters: Use 'FN' or 'AN' slots for all courses.

      6. OUTPUT INTEGRITY:
         - Every session object MUST have 'batch', 'year', 'venue', 'trainerName'.
         - 'year' must be an integer (e.g., 3 for Sem 6).
      
      Output:
      Return a JSON array of TrainingSession objects.
      Format dates as YYYY-MM-DD (assume next Monday is start date).
      Generate sessions covering all sections.
    `;

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 4096 }, // High thinking budget for complex constraint solving
                responseMimeType: "application/json",
                 // We don't enforce strict schema here to allow flexibility in the AI's reasoning for dates/ids
            }
        });
        
        const raw = response.text ? JSON.parse(response.text) : [];
        // Ensure structure matches TrainingSession
        return Array.isArray(raw) ? raw.map((s: any) => ({
            ...s,
            id: s.id || Math.random().toString(),
            status: 'SCHEDULED',
            isPlacementDrive: false
        })) : [];
    } catch (error) {
        console.error("Auto-Schedule Failed:", error);
        throw error;
    }
};