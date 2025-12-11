import { GoogleGenAI } from "@google/genai";

export const generateDischargeSummary = async (
  patientName: string,
  diagnosis: string,
  treatmentNotes: string,
  labResults: string
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.warn("API Key is missing. AI Discharge Summary will use mock response.");
    return "API Key not configured in environment variables. Unable to generate live AI summary.\n\nPlease configure 'API_KEY' in your environment settings to enable Gemini AI features.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
      You are an expert medical assistant at MMC&RI (Mysore Medical College).
      Create a professional hospital Discharge Summary for the following patient.
      
      Patient Name: ${patientName}
      Diagnosis: ${diagnosis}
      Treatment Given: ${treatmentNotes}
      Key Lab Results: ${labResults}
      
      Format the output clearly with sections:
      1. Patient Details
      2. Final Diagnosis
      3. Hospital Course & Treatment
      4. Investigation Summary
      5. Discharge Advice & Medication
      
      Keep it professional, concise, and suitable for medical records.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Failed to generate summary.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating discharge summary. Please check your network connection or API quota.";
  }
};