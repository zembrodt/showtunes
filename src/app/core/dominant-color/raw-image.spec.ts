import { expect } from '@angular/flex-layout/_private-utils/testing';
import { Pixel, RawImage } from './raw-image';

describe('RawImage', () => {
  it('should create an image representation from an array of integers', () => {
    const data = new Uint8ClampedArray([
      0, 0, 0, 255, 1, 1, 1, 255,
      2, 2, 2, 255, 3, 3, 3, 255,
    ]);
    const expectedWidth = 2;
    const expectedHeight = 2;
    const expectedPixels: Pixel[][] = [
      [{x: 0, y: 0, color: c0}, {x: 1, y: 0, color: c1}],
      [{x: 0, y: 1, color: c2}, {x: 1, y: 1, color: c3}],
    ];

    const rawImg = new RawImage(data, expectedWidth, expectedHeight);

    expect(rawImg.getWidth()).toEqual(expectedWidth);
    expect(rawImg.getHeight()).toEqual(expectedHeight);
    for (let y = 0; y < expectedPixels.length; y++) {
      for (let x = 0; x < expectedPixels[y].length; x++) {
        expect(rawImg.getPixelAt(x, y)).toEqual(expectedPixels[y][x]);
      }
    }
  });

  it('should throw an error if invalid constructor arguments', () => {
    expect(() => new RawImage(new Uint8ClampedArray([1, 2, 3, 4]), 0, 2)).toThrowError();
    expect(() => new RawImage(new Uint8ClampedArray([1, 2, 3, 4]), 1, 0)).toThrowError();
    expect(() => new RawImage(new Uint8ClampedArray([1, 2, 3, 4]), -1, 2)).toThrowError();
    expect(() => new RawImage(new Uint8ClampedArray([1, 2, 3, 4]), 1, -1)).toThrowError();
    expect(() => new RawImage(null, 1, 2)).toThrowError();
    expect(() => new RawImage(new Uint8ClampedArray([1, 2, 3, 4]), null, 2)).toThrowError();
    expect(() => new RawImage(new Uint8ClampedArray([1, 2, 3, 4]), 1, null)).toThrowError();
  });

  it('should throw an error if width/height less than expected length', () => {
    expect(() => new RawImage(new Uint8ClampedArray([1, 2, 3, 4, 5]), 2, 2)).toThrowError();
  });

  it('should correctly scale down an image', () => {
    const data = new Uint8ClampedArray([
      0, 0, 0, 255, 1, 1, 1, 255, 2, 2, 2, 255, 3, 3, 3, 255,
      4, 4, 4, 255, 5, 5, 5, 255, 6, 6, 6, 255, 7, 7, 7, 255,
      8, 8, 8, 255, 9, 9, 9, 255, 10, 10, 10, 255, 11, 11, 11, 255,
      12, 12, 12, 255, 13, 13, 13, 255, 14, 14, 14, 255, 15, 15, 15, 255,
    ]);
    const oldWidth = 4;
    const oldHeight = 4;
    const newWidth = 2;
    const newHeight = 2;
    const expectedScaledPixels: Pixel[][] = [
      [{x: 0, y: 0, color: c0}, {x: 1, y: 0, color: c2}],
      [{x: 0, y: 1, color: c8}, {x: 1, y: 1, color: c10}]
    ];

    const rawImg = new RawImage(data, oldWidth, oldHeight);

    expect(rawImg.getWidth()).toEqual(oldWidth);
    expect(rawImg.getHeight()).toEqual(oldHeight);
    rawImg.scale(newWidth, newHeight);
    expect(rawImg.getWidth()).toEqual(newWidth);
    expect(rawImg.getHeight()).toEqual(newHeight);
    for (let y = 0; y < expectedScaledPixels.length; y++) {
      for (let x = 0; x < expectedScaledPixels[y].length; x++) {
        expect(rawImg.getPixelAt(x, y)).toEqual(expectedScaledPixels[y][x]);
      }
    }
  });

  it('should correctly scale up an image', () => {
    const data = new Uint8ClampedArray([
      0, 0, 0, 255, 1, 1, 1, 255,
      2, 2, 2, 255, 3, 3, 3, 255,
    ]);
    const oldWidth = 2;
    const oldHeight = 2;
    const newWidth = 4;
    const newHeight = 4;
    const expectedScaledPixels: Pixel[][] = [
      [{x: 0, y: 0, color: c0}, {x: 1, y: 0, color: c1}, {x: 2, y: 0, color: c1}, {x: 3, y: 0, color: c1}],
      [{x: 0, y: 1, color: c2}, {x: 1, y: 1, color: c3}, {x: 2, y: 1, color: c3}, {x: 3, y: 1, color: c3}],
      [{x: 0, y: 2, color: c2}, {x: 1, y: 2, color: c3}, {x: 2, y: 2, color: c3}, {x: 3, y: 2, color: c3}],
      [{x: 0, y: 3, color: c2}, {x: 1, y: 3, color: c3}, {x: 2, y: 3, color: c3}, {x: 3, y: 3, color: c3}],
    ];

    const rawImg = new RawImage(data, oldWidth, oldHeight);

    expect(rawImg.getWidth()).toEqual(oldWidth);
    expect(rawImg.getHeight()).toEqual(oldHeight);
    rawImg.scale(newWidth, newHeight);
    expect(rawImg.getWidth()).toEqual(newWidth);
    expect(rawImg.getHeight()).toEqual(newHeight);
    for (let y = 0; y < expectedScaledPixels.length; y++) {
      for (let x = 0; x < expectedScaledPixels[y].length; x++) {
        expect(rawImg.getPixelAt(x, y)).toEqual(expectedScaledPixels[y][x]);
      }
    }
  });

  it('should not scale an image if new width/height = old width/height', () => {
    const data = new Uint8ClampedArray([
      0, 0, 0, 255, 1, 1, 1, 255, 2, 2, 2, 255, 3, 3, 3, 255,
      4, 4, 4, 255, 5, 5, 5, 255, 6, 6, 6, 255, 7, 7, 7, 255,
      8, 8, 8, 255, 9, 9, 9, 255, 10, 10, 10, 255, 11, 11, 11, 255,
      12, 12, 12, 255, 13, 13, 13, 255, 14, 14, 14, 255, 15, 15, 15, 255,
    ]);
    const width = 4;
    const height = 4;
    const expectedScaledPixels: Pixel[][] = [
      [{x: 0, y: 0, color: c0}, {x: 1, y: 0, color: c1}, {x: 2, y: 0, color: c2}, {x: 3, y: 0, color: c3}],
      [{x: 0, y: 1, color: c4}, {x: 1, y: 1, color: c5}, {x: 2, y: 1, color: c6}, {x: 3, y: 1, color: c7}],
      [{x: 0, y: 2, color: c8}, {x: 1, y: 2, color: c9}, {x: 2, y: 2, color: c10}, {x: 3, y: 2, color: c11}],
      [{x: 0, y: 3, color: c12}, {x: 1, y: 3, color: c13}, {x: 2, y: 3, color: c14}, {x: 3, y: 3, color: c15}],
    ];

    const rawImg = new RawImage(data, width, height);

    expect(rawImg.getWidth()).toEqual(width);
    expect(rawImg.getHeight()).toEqual(height);
    rawImg.scale(width, height);
    expect(rawImg.getWidth()).toEqual(width);
    expect(rawImg.getHeight()).toEqual(height);
    for (let y = 0; y < expectedScaledPixels.length; y++) {
      for (let x = 0; x < expectedScaledPixels[y].length; x++) {
        expect(rawImg.getPixelAt(x, y)).toEqual(expectedScaledPixels[y][x]);
      }
    }
  });

  it('should throw an error if invalid scale width/height arguments', () => {
    const data = new Uint8ClampedArray([
      0, 0, 0, 255, 1, 1, 1, 255,
      2, 2, 2, 255, 3, 3, 3, 255,
    ]);
    const rawImg = new RawImage(data, 2, 2);
    expect(() => rawImg.scale(0, 4)).toThrowError();
    expect(() => rawImg.scale(4, 0)).toThrowError();
    expect(() => rawImg.scale(0, 0)).toThrowError();
    expect(() => rawImg.scale(-1, 4)).toThrowError();
    expect(() => rawImg.scale(4, -1)).toThrowError();
    expect(() => rawImg.scale(-1, -1)).toThrowError();
    expect(() => rawImg.scale(null, 4)).toThrowError();
    expect(() => rawImg.scale(4, null)).toThrowError();
    expect(() => rawImg.scale(null, null)).toThrowError();
  });

  it('should throw an error if accessing a pixel out of bounds', () => {
    const data = new Uint8ClampedArray([0, 0, 0, 255, 128, 128, 128, 255, 200, 150, 100, 255, 0, 0, 0, 128]);
    const rawImg = new RawImage(data, 2, 2);
    expect(() => rawImg.getPixelAt(2, 1)).toThrowError();
    expect(() => rawImg.getPixelAt(1, 2)).toThrowError();
    expect(() => rawImg.getPixelAt(2, 2)).toThrowError();
  });
});

// Test colors
const c0  = {r: 0,  g: 0,  b: 0,  a: 255};
const c1  = {r: 1,  g: 1,  b: 1,  a: 255};
const c2  = {r: 2,  g: 2,  b: 2,  a: 255};
const c3  = {r: 3,  g: 3,  b: 3,  a: 255};
const c4  = {r: 4,  g: 4,  b: 4,  a: 255};
const c5  = {r: 5,  g: 5,  b: 5,  a: 255};
const c6  = {r: 6,  g: 6,  b: 6,  a: 255};
const c7  = {r: 7,  g: 7,  b: 7,  a: 255};
const c8  = {r: 8,  g: 8,  b: 8,  a: 255};
const c9  = {r: 9,  g: 9,  b: 9,  a: 255};
const c10 = {r: 10, g: 10, b: 10, a: 255};
const c11 = {r: 11, g: 11, b: 11, a: 255};
const c12 = {r: 12, g: 12, b: 12, a: 255};
const c13 = {r: 13, g: 13, b: 13, a: 255};
const c14 = {r: 14, g: 14, b: 14, a: 255};
const c15 = {r: 15, g: 15, b: 15, a: 255};
