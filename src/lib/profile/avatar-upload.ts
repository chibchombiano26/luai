const MAX_INPUT_FILE_SIZE = 5 * 1024 * 1024;
const MAX_OUTPUT_SIZE = 256;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Invalid image payload'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Could not read image'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not decode image'));
    image.src = src;
  });
}

export async function createAvatarDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selecciona una imagen valida.');
  }

  if (file.size > MAX_INPUT_FILE_SIZE) {
    throw new Error('La imagen supera el limite de 5 MB.');
  }

  const originalDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(originalDataUrl);
  const ratio = Math.min(1, MAX_OUTPUT_SIZE / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * ratio));
  const height = Math.max(1, Math.round(image.height * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('No se pudo preparar la imagen.');
  }

  context.drawImage(image, 0, 0, width, height);

  const webpDataUrl = canvas.toDataURL('image/webp', 0.82);
  if (webpDataUrl.startsWith('data:image/webp')) {
    return webpDataUrl;
  }

  return canvas.toDataURL('image/jpeg', 0.86);
}
