export async function prepareVisionImage(file: File): Promise<Blob> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 ** 2 || file.size === 0) throw new Error("Invalid image");
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 48_000_000) throw new Error("Image too large");
    const ratio = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * ratio);
    canvas.height = Math.round(bitmap.height * ratio);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject): void => canvas.toBlob((blob): void => blob ? resolve(blob) : reject(new Error("Image conversion failed")), "image/jpeg", 0.92));
  } finally { bitmap.close(); }
}
