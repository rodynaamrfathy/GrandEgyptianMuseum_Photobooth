export const createCardWithText = (
  cardUrl: string,
  overlayText: string,
  dateString: string
): Promise<Blob> => {
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

      // Draw the card image
      ctx.drawImage(img, 0, 0, img.width, img.height);

      // Font setup
      const mainSize = Math.floor(img.width * 0.09);
      const dateSize = Math.floor(img.width * 0.03);
      const isArabic = /[\u0600-\u06FF]/.test(overlayText);

      const mainFont = isArabic ? "ArabicCustom" : "Mariam";
      const dateFont = "Averia";

      await document.fonts.load(`bold ${mainSize}px '${mainFont}'`);
      await document.fonts.load(`bold ${dateSize}px '${dateFont}'`);

      // Set font and color
      ctx.font = `bold ${mainSize}px '${mainFont}', serif`;
      ctx.fillStyle = "#333333";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Split text into lines (max 3 lines, 20 chars per line)
      const lineLength = 25;
      const lines = overlayText.match(new RegExp(`.{1,${lineLength}}`, 'g'))?.slice(0, 3) || [];

      // Vertical position for first line
      const baseY = img.height * 0.41;
      const lineSpacing = mainSize * 1.1;

      lines.forEach((line, index) => {
        ctx.fillText(line, img.width / 2, baseY + index * lineSpacing);
      });

      // Draw the date
      ctx.font = `bold ${dateSize}px '${dateFont}', sans-serif`;
      ctx.fillStyle = "#393939";
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillText(dateString, img.width * 0.82, img.height * 0.506);

      // Export canvas as PNG blob
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
};
