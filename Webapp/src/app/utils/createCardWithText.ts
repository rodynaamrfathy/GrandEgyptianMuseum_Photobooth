import {
  MAX_TEXT_LENGTH,
  MAX_TEXT_LINES,
  CHARS_PER_LINE,
} from "../constants/cardText";

const LINE_BREAK_REGEX = new RegExp(`.{1,${CHARS_PER_LINE}}`, "g");

export function createCardWithText(
  cardUrl: string,
  overlayText: string,
  dateString: string
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = cardUrl;

    img.onload = async () => {
      const dpr = window.devicePixelRatio || 1;

      const canvas = document.createElement("canvas");
      canvas.width = img.width * dpr;
      canvas.height = img.height * dpr;
      canvas.style.width = `${img.width}px`;
      canvas.style.height = `${img.height}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context could not be created"));
        return;
      }

      ctx.scale(dpr, dpr);

      ctx.drawImage(img, 0, 0, img.width, img.height);

      const mainSize = Math.floor(img.width * 0.09);
      const dateSize = Math.floor(img.width * 0.03);
      const isArabic = /[\u0600-\u06FF]/.test(overlayText);

      const mainFont = isArabic ? "ArabicCustom" : "Mariam";
      const dateFont = "Averia";

      await document.fonts.load(`bold ${mainSize}px '${mainFont}'`);
      await document.fonts.load(`bold ${dateSize}px '${dateFont}'`);

      ctx.font = `bold ${mainSize}px '${mainFont}', serif`;
      ctx.fillStyle = "#333333";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const lines = overlayText.match(LINE_BREAK_REGEX)?.slice(0, MAX_TEXT_LINES) ?? [];

      const baseY = img.height * 0.41;
      const lineSpacing = mainSize * 1.1;

      lines.forEach((line, index) => {
        ctx.fillText(line, img.width / 2, baseY + index * lineSpacing);
      });

      ctx.font = `bold ${dateSize}px '${dateFont}', sans-serif`;
      ctx.fillStyle = "#393939";
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillText(dateString, img.width * 0.82, img.height * 0.506);

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Blob creation failed"));
        } else {
          resolve(blob);
        }
      }, "image/png");
    };

    img.onerror = () => reject(new Error("Image failed to load"));
  });
}

export { MAX_TEXT_LENGTH, MAX_TEXT_LINES, CHARS_PER_LINE };