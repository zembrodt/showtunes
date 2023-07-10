export class Canvas {
  private readonly canvas: HTMLCanvasElement = null;
  private readonly context: CanvasRenderingContext2D = null;

  constructor() {
    this.canvas = document.createElement('canvas');
    if (!this.canvas) {
      throw new Error('Unable to create Canvas element');
    }
    this.canvas.style.display = 'none';
    // document.body.appendChild(this.element);
    this.context = this.canvas.getContext('2d', {willReadFrequently: true});
    if (!this.context) {
      throw new Error('Unable to get Canvas 2D context');
    }
    this.context.imageSmoothingEnabled = false;
    this.clearCanvas(0, 0);
  }

  getImageData(image: HTMLImageElement): Uint8ClampedArray {
    if (!image) {
      throw new Error('Image must not be null');
    }

    this.canvas.width = image.width;
    this.canvas.height = image.height;

    this.context.clearRect(0, 0, image.width, image.height);
    this.context.drawImage(image, 0, 0, image.width, image.height);
    const imageData = this.context.getImageData(0, 0, image.width, image.height);
    if (!imageData) {
      throw new Error(`Unable to fetch image data from image at ${image.src}`);
    }
    this.clearCanvas(image.width, image.height);
    return imageData.data;
  }

  private clearCanvas(width: number, height: number): void {
    this.context.clearRect(0, 0, width, height);
    this.canvas.width = 1;
    this.canvas.height = 1;
  }
}
