import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAvatarDataUrl } from './avatar-upload';

const mockFileReaderState = vi.hoisted(() => ({
  result: 'data:image/png;base64,original',
  error: null as Error | null,
  fail: false,
}));

const mockImageState = vi.hoisted(() => ({
  width: 400,
  height: 200,
  fail: false,
}));

class MockFileReader {
  result: string | ArrayBuffer | null = null;
  error: Error | null = null;
  onload: null | (() => void) = null;
  onerror: null | (() => void) = null;

  readAsDataURL() {
    this.result = mockFileReaderState.result;
    this.error = mockFileReaderState.error;

    if (mockFileReaderState.fail) {
      this.onerror?.();
      return;
    }

    this.onload?.();
  }
}

class MockImage {
  width = mockImageState.width;
  height = mockImageState.height;
  onload: null | (() => void) = null;
  onerror: null | (() => void) = null;

  set src(_value: string) {
    this.width = mockImageState.width;
    this.height = mockImageState.height;

    if (mockImageState.fail) {
      this.onerror?.();
      return;
    }

    this.onload?.();
  }
}

describe('avatar-upload', () => {
  beforeEach(() => {
    mockFileReaderState.result = 'data:image/png;base64,original';
    mockFileReaderState.error = null;
    mockFileReaderState.fail = false;
    mockImageState.width = 400;
    mockImageState.height = 200;
    mockImageState.fail = false;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.stubGlobal('FileReader', MockFileReader as unknown as typeof FileReader);
    vi.stubGlobal('Image', MockImage as unknown as typeof Image);
  });

  it('rejects files that are not images', async () => {
    const file = new File(['hello'], 'avatar.txt', { type: 'text/plain' });

    await expect(createAvatarDataUrl(file)).rejects.toThrow('Selecciona una imagen valida.');
  });

  it('rejects files larger than 5 MB', async () => {
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 });

    await expect(createAvatarDataUrl(file)).rejects.toThrow('La imagen supera el limite de 5 MB.');
  });

  it('returns a resized webp data url when conversion succeeds', async () => {
    const drawImage = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage,
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(
      ((type: string) =>
        type === 'image/webp'
          ? 'data:image/webp;base64,resized'
          : 'data:image/jpeg;base64,fallback') as typeof HTMLCanvasElement.prototype.toDataURL
    );

    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });

    await expect(createAvatarDataUrl(file)).resolves.toBe('data:image/webp;base64,resized');
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 256, 128);
  });

  it('falls back to jpeg when webp output is not available', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(
      ((type: string) =>
        type === 'image/webp'
          ? 'data:image/png;base64,unexpected'
          : 'data:image/jpeg;base64,fallback') as typeof HTMLCanvasElement.prototype.toDataURL
    );

    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });

    await expect(createAvatarDataUrl(file)).resolves.toBe('data:image/jpeg;base64,fallback');
  });

  it('throws when the file payload cannot be read as a string data url', async () => {
    mockFileReaderState.result = new ArrayBuffer(8);

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);

    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });

    await expect(createAvatarDataUrl(file)).rejects.toThrow('Invalid image payload');
  });

  it('throws when the file reader fails', async () => {
    mockFileReaderState.fail = true;
    mockFileReaderState.error = new Error('reader failed');

    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });

    await expect(createAvatarDataUrl(file)).rejects.toThrow('reader failed');
  });

  it('throws when the image cannot be decoded', async () => {
    mockImageState.fail = true;

    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });

    await expect(createAvatarDataUrl(file)).rejects.toThrow('Could not decode image');
  });

  it('throws when a canvas context is unavailable', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });

    await expect(createAvatarDataUrl(file)).rejects.toThrow('No se pudo preparar la imagen.');
  });
});
