import { findClusters } from './k-means';
import { Pixel, RawImage } from './raw-image';

describe('k-means findClusters', () => {
  let img: MockRawImage;

  beforeEach(() => {
    img = new MockRawImage();
    img.scale = jasmine.createSpy();
  });

  it('should scale down an image to 256x256', () => {
    img.mockWidth = 500;
    img.mockHeight = 500;
    findClusters(img);
    expect(img.scale).toHaveBeenCalledWith(256, 256);

    img.mockWidth = 255;
    findClusters(img);
    expect(img.scale).toHaveBeenCalledWith(255, 256);

    img.mockWidth = 500;
    img.mockHeight = 255;
    findClusters(img);
    expect(img.scale).toHaveBeenCalledWith(256, 255);
  });

  it('should not scale image if smaller than 256x256', () => {
    img.mockWidth = 255;
    img.mockHeight = 255;
    findClusters(img);
    expect(img.scale).toHaveBeenCalledWith(255, 255);
  });

  it('should throw an error if raw image is null', () => {
    expect(() => findClusters(null)).toThrowError();
  });

  it('should return a ClusterGroup', () => {
    expect(findClusters(img)).toBeTruthy();
  });
});

class MockRawImage extends RawImage {
  public mockWidth = 0;
  public mockHeight = 0;

  constructor() {
    super(new Uint8ClampedArray([1, 2, 3, 4]), 1, 1);
  }

  getWidth(): number {
    return this.mockWidth;
  }

  getHeight(): number {
    return this.mockHeight;
  }

  getPixelAt(x: number, y: number): Pixel {
    return {
      x: 0,
      y: 0,
      color: {r: 1, g: 2, b: 3, a: 255}
    };
  }

  scale(w: number, h: number): void {
  }
}
