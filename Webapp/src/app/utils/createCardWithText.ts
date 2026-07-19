import { MAX_TEXT_LENGTH, MAX_TEXT_LINES, CHARS_PER_LINE } from "../constants/cardText";

const MAX_TEXT_WIDTH_RATIO = 0.72;

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length >= maxLines) {
        return lines;
      }
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  return lines.slice(0, maxLines);
}

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

      const mainFont = isArabic ? "Greta Arabic" : "Mariam";
      const mainWeight = isArabic ? "normal" : "bold";
      const dateFont = "Greta Sans";

      await document.fonts.load(`${mainWeight} ${mainSize}px '${mainFont}'`);
      await document.fonts.load(`bold ${dateSize}px '${dateFont}'`);

      ctx.font = `${mainWeight} ${mainSize}px '${mainFont}', serif`;
      ctx.fillStyle = "#333333";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const maxWidth = img.width * MAX_TEXT_WIDTH_RATIO;
      const lines = wrapText(ctx, overlayText, maxWidth, MAX_TEXT_LINES);

      const lineSpacing = mainSize * 1.1;
      const centerY = isArabic ? img.height * 0.406 : img.height * 0.41;

      // Three fixed slot positions: top, middle, bottom — centered around centerY
      const slotY: [number, number, number] = [
        centerY - lineSpacing,
        centerY,
        centerY + lineSpacing,
      ];

      // Map wrapped lines onto the fixed slots, centered vertically
      const startSlot = Math.floor((MAX_TEXT_LINES - lines.length) / 2);

      lines.forEach((line, index) => {
        ctx.fillText(line, img.width / 2, slotY[startSlot + index]);
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
