import { createWorker } from "tesseract.js";

const initializeWorker = async (loggerCallback) => {
    try {
        const worker = await createWorker({
            logger: loggerCallback,
        });

        await worker.loadLanguage("eng");
        await worker.initialize("eng");

        await worker.setParameters({
            tessedit_pageseg_mode: "1",
            tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 -.",
            preserve_interword_spaces: "1",
        });

        console.log("Tesseract worker initialized.");
        return worker;
    } catch (error) {
        console.error("Failed to initialize Tesseract worker:", error);
        throw error;
    }
};

const recognizeText = async (worker, canvas, minConfidence = 50) => {
    try {
        const { data } = await worker.recognize(canvas);

        const filteredText = data.words
            ?.filter((word) => word.confidence >= minConfidence)
            .map((word) => word.text)
            .join(" ");

        return {
            originalText: data.text,
            filteredText: filteredText || data.text,
            confidence: data.confidence,
        };
    } catch (error) {
        console.error("OCR recognition error:", error);
        throw error;
    }
};

const terminateWorker = async (worker) => {
    await worker.terminate();
};

export { initializeWorker, recognizeText, terminateWorker };

