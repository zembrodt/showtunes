import { Color } from '../util';

export interface Pixel {
  x: number;
  y: number;
  color: Color;
}

export class RawImage {
  private width = 0;
  private height = 0;
  private pixels: Pixel[][] = [];

  constructor(data: Uint8ClampedArray, width: number, height: number, step: number) {
    const len = width * height * step;
    this.width = width;
    this.height = height;
    let x = 0;
    let y = 0;
    let pixelRow: Pixel[] = [];
    for (let i = 0; i < len; i += step) {
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
    return this.pixels[x][y];
  }

  /**
   * Scale the raw image using nearest neighbor
   * @param newWidth the new width in pixels
   * @param newHeight the new height in pixels
   */
  scale(newWidth: number, newHeight: number): void {
    const targetPixels: Pixel[][] = [];
    for (let x = 0; x < newWidth; x++) {
      const targetRow: Pixel[] = [];
      for (let y = 0; y < newHeight; y++) {
        let srcX = Math.round(x / newWidth * this.width);
        srcX = Math.min(srcX, this.width - 1);
        let srcY = Math.round(y / newHeight * this.height);
        srcY = Math.min(srcY, this.height - 1);
        if (srcX < this.pixels.length && srcY < this.pixels[srcX].length) {
          const targetPixel = this.pixels[srcX][srcY];
          targetPixel.x = x;
          targetPixel.y = y;
          targetRow.push(targetPixel);
        }
      }
      targetPixels.push(targetRow);
    }
    this.pixels = targetPixels;
    this.width = newWidth;
    this.height = newHeight;
  }
}
