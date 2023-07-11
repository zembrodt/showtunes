/* tslint:disable:no-string-literal */

import { expect } from '@angular/flex-layout/_private-utils/testing';
import { Canvas } from './canvas';

describe('Canvas', () => {
  it('should be truthy', () => {
    const canvas = new Canvas();
    expect(canvas).toBeTruthy();
    expect(canvas['canvas']).toBeTruthy();
    expect(canvas['context']).toBeTruthy();
  });

  it('should create a canvas with style display none', () => {
    const canvas = new Canvas();
    expect(canvas['canvas'].style.display).toEqual('none');
  });

  it('should create a 2D context with correct settings', () => {
    const canvas = new Canvas();
    expect(canvas['context'].getContextAttributes().willReadFrequently).toBeTruthy();
    expect(canvas['context'].imageSmoothingEnabled).toBeTrue();
  });

  it('should throw an error if the canvas fails to be created', () => {
    spyOn(document, 'createElement').and.returnValue(null);
    expect(() => new Canvas()).toThrowError();
  });

  it('should throw an error if the canvas context fails to be created', () => {
    const canvas = document.createElement('canvas');
    spyOn(document, 'createElement').and.returnValue(canvas);
    spyOn(canvas, 'getContext').and.returnValue(null);
    expect(() => new Canvas()).toThrowError();
  });

  it('should clear the canvas on initialization', () => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    spyOn(document, 'createElement').and.returnValue(canvas);
    spyOn(canvas, 'getContext').and.returnValue(context);
    spyOn(context, 'clearRect');

    expect(() => new Canvas()).not.toThrowError();
    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 0, 0);
    expect(canvas.width).toEqual(1);
    expect(canvas.height).toEqual(1);
  });

  it('should get imageData and reset canvas', () => {
    const img = new Image(10, 10);
    const canvas = new Canvas();
    spyOn(canvas['context'], 'clearRect');
    spyOn(canvas['context'], 'drawImage');

    const data = canvas.getImageData(img);
    expect(canvas['context'].clearRect).toHaveBeenCalledWith(0, 0, 10, 10);
    expect(canvas['context'].drawImage).toHaveBeenCalledWith(img, 0, 0, 10, 10);
    expect(canvas['context'].clearRect).toHaveBeenCalledWith(0, 0, 10, 10);
    expect(canvas['canvas'].width).toEqual(1);
    expect(canvas['canvas'].height).toEqual(1);
    expect(data).toBeTruthy();
    expect(data.length).toEqual(400);
  });

  it('should throw an error on an invalid image', () => {
    const canvas = new Canvas();
    expect(() => canvas.getImageData(null)).toThrowError();
  });

  it('should throw an error when imageData is invalid', () => {
    const canvas = new Canvas();
    spyOn(canvas['context'], 'getImageData').and.returnValue(null);

    expect(() => canvas.getImageData(new Image(10, 10))).toThrowError();
  });
});
