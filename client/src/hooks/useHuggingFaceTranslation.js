import { useState, useEffect } from "react";

// Map i18n language codes to Hugging Face model codes
const LANG_MAP = {
  en: "en",
  hi: "hi",
  te: "te",
};

const HF_API_URL =
  "https://api-inference.huggingface.co/models/ai4bharat/indictrans2-en-indic";
const HF_API_TOKEN = "YOUR_HUGGINGFACE_API_TOKEN"; // <-- Replace with your token

export const useHuggingFaceTranslation = (text, targetLang) => {
  const [translated, setTranslated] = useState(text);
  useEffect(() => {
    const doTranslate = async () => {
      if (!text || !targetLang || targetLang === "en") {
        setTranslated(text);
        return;
      }
      try {
        const response = await fetch(HF_API_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${HF_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: text,
            parameters: {
              src_lang: "en",
              tgt_lang: LANG_MAP[targetLang] || targetLang,
            },
          }),
        });
        const result = await response.json();
        setTranslated(result[0]?.translation_text || text);
      } catch (err) {
        setTranslated(text);
      }
    };
    doTranslate();
  }, [text, targetLang]);
  return translated;
};
