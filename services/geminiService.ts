import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

if (process.env.API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export const getSongInsight = async (filename: string): Promise<string> => {
  if (!ai) {
    return "Vui lòng cấu hình API Key để sử dụng tính năng AI.";
  }

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `Bạn là một chuyên gia âm nhạc vui tính. Hãy phân tích tên bài hát/tập tin này: "${filename}". 
    Hãy đoán thể loại, tâm trạng (mood), và viết một nhận xét ngắn gọn (dưới 40 từ) bằng Tiếng Việt về bài hát này hoặc nghệ sĩ có thể liên quan. 
    Nếu tên file không rõ ràng, hãy sáng tạo một câu đùa về âm nhạc.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Không thể phân tích bài hát này.";
  } catch (error) {
    return "Đã xảy ra lỗi khi kết nối với AI.";
  }
};