import { Color } from '../util';

export interface Pixel {
  x: number;
  y: number;
  color: Color;
}

export class RawImage {
  static readonly step = 4; // bytes per pixel

  private width = 0;
  private height = 0;
  private pixels: Pixel[][] = [];

  constructor(data: Uint8ClampedArray, width: number, height: number) {
    if (!data || !width || !height || width <= 0 || height <= 0) {
      throw new Error('Invalid arguments passed to RawImage');
    }
    const len = width * height * RawImage.step;
    if (len > data.length) {
      throw new Error('Invalid data passed to RawImage');
    }
    this.width = width;
    this.height = height;
    let x = 0;
    let y = 0;
    let pixelRow: Pixel[] = [];
    for (let i = 0; i < len; i += RawImage.step) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      pixelRow.push({ x, y, color: { r, g, b, a } });
      x++;
      if (x >= width) {
        x = 0;
        y++;
        this.pixels.push(pixelRow);
        pixelRow = [];
      }
    }
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  getPixelAt(x: number, y: number): Pixel {
    if (y >= this.pixels.length || x >= this.pixels[y].length) {
      throw new Error(`No pixel exists at (${x}, ${y})`);
    }
    return this.pixels[y][x];
  }

  /**
   * Scale the raw image using nearest neighbor
   * @param newWidth the new width in pixels
   * @param newHeight the new height in pixels
   */
  scale(newWidth: number, newHeight: number): void {
    if (!newWidth || !newHeight || newWidth <= 0 || newHeight <= 0) {
      throw new Error('Invalid arguments passed to scale image');
    }
    if (newWidth !== this.width || newHeight !== this.height) {
      const targetPixels: Pixel[][] = [];
      for (let y = 0; y < newHeight; y++) {
        const targetRow: Pixel[] = [];
        for (let x = 0; x < newWidth; x++) {
          let srcX = Math.round(x / newWidth * this.width);
          srcX = Math.min(srcX, this.width - 1);
          let srcY = Math.round(y / newHeight * this.height);
          srcY = Math.min(srcY, this.height - 1);
          if (srcY < this.pixels.length && srcX < this.pixels[srcY].length) {
            targetRow.push({
              x,
              y,
              color: this.pixels[srcY][srcX].color
            });
          }
        }
        targetPixels.push(targetRow);
      }
      this.pixels = targetPixels;
      this.width = newWidth;
      this.height = newHeight;
    }
  }
}
