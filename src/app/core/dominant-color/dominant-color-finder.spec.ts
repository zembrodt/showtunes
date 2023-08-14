/* tslint:disable:no-string-literal */

import { fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { expect } from '@angular/flex-layout/_private-utils/testing';
import { MockImageElement } from '../testing/mock-image-element';
import { ImageElement } from '../types';
import { Color, FontColor } from '../util';
import { Canvas } from './canvas';
import { Cluster, ClusterGroup } from './cluster';
import { DominantColor, DominantColorFinder } from './dominant-color-finder';
import { RawImage } from './raw-image';

const STEP = 10;

describe('DominantColorFinder', () => {
  let dominantColorFinder: DominantColorFinder;
  let mockImg: MockImageElement;
  let mockCanvas: MockCanvas;

  beforeEach(() => {
    dominantColorFinder = new DominantColorFinder(generateMockFindClustersFn({
      r: 100, g: 100, b: 100, a: 255
    }));
    mockImg = new MockImageElement(1, 1);
    mockCanvas = new MockCanvas(new Uint8ClampedArray([1, 2, 3, 4]));
    dominantColorFinder['createImage'] = () => mockImg;
    dominantColorFinder['createCanvas'] = () => mockCanvas;
  });

  it('should add the event listeners', fakeAsync(() => {
    const spy = spyOn(mockImg, 'addEventListener').and.callThrough();
    mockImg.onLoad(STEP);
    dominantColorFinder.getColor('test.png');
    tick(STEP);
    flushMicrotasks();

    expect(spy).toHaveBeenCalledTimes(3);
    expect(spy.calls.all()[0].args[0]).toEqual('load');
    expect(spy.calls.all()[1].args[0]).toEqual('error');
    expect(spy.calls.all()[2].args[0]).toEqual('abort');
  }));

  it('should be truthy', fakeAsync(() => {
    let actualDominantColor: DominantColor = null;
    mockImg.onLoad(STEP);
    dominantColorFinder.getColor('test.png').then((result) => {
      actualDominantColor = result;
    }, (reason) => {
      fail('Promise should not have been rejected: ' + reason);
    });
    tick(STEP);
    flushMicrotasks();

    expect(actualDominantColor).toBeTruthy();
  }));

  it('should remove the event listeners when image onLoad is called', fakeAsync(() => {
    const spy = spyOn(mockImg, 'removeEventListener').and.callThrough();
    mockImg.onLoad(STEP);
    dominantColorFinder.getColor('test.png').then((_) => {}, (reason) => {
      fail('Promise should not have been rejected: ' + reason);
    });
    tick(STEP);
    flushMicrotasks();

    expect(spy).toHaveBeenCalledTimes(3);
    expect(spy.calls.all()[0].args[0]).toEqual('load');
    expect(spy.calls.all()[1].args[0]).toEqual('error');
    expect(spy.calls.all()[2].args[0]).toEqual('abort');
  }));

  it('should reject the promise if given an invalid src', fakeAsync(() => {
    let actualErr: string = null;
    dominantColorFinder.getColor('').then((_) => {
      fail('Promise should not have been resolved');
    }, (reason) => {
      actualErr = reason;
    });
    flushMicrotasks();

    expect(actualErr).toEqual('getColor requires an image src');

    actualErr = null;
    dominantColorFinder.getColor(null).then((_) => {
      fail('Promise should not have been resolved');
    }, (reason) => {
      actualErr = reason;
    });
    flushMicrotasks();

    expect(actualErr).toEqual('getColor requires an image src');
  }));

  it('should reject the promise if an error occurred creating the Canvas', fakeAsync(() => {
    const canvasError = Error('Canvas test error');
    dominantColorFinder['createCanvas'] = () => {
      throw canvasError;
    };

    mockImg.onLoad(STEP);
    let actualErr: string = null;
    dominantColorFinder.getColor('test.png').then((_) => {
      fail('Promise should not have been resolved');
    }, (reason) => {
      actualErr = reason;
    });
    tick(STEP);
    flushMicrotasks();

    expect(actualErr).toEqual('Error creating Canvas: ' + canvasError);
  }));

  it('should return the required color values given a dominant color', fakeAsync(() => {
    const testColor: Color = { r: 50, g: 100, b: 150, a: 255 };
    dominantColorFinder['findDominantColor'] = () => testColor;
    mockImg.onLoad(STEP);

    let actualDominantColor: DominantColor = null;
    dominantColorFinder.getColor('test.png').then((result) => {
      actualDominantColor = result;
    }, (reason) => {
      fail('Promise should not have been rejected: ' + reason);
    });
    tick(STEP);
    flushMicrotasks();

    expect(actualDominantColor.rgb).toEqual(testColor);
    expect(actualDominantColor.hex).toEqual('326496');
    expect(actualDominantColor.foregroundFontColor).toEqual(FontColor.White);
  }));

  it('should reject the promise when image onError is called', fakeAsync(() => {
    const badImgUrl = 'bad_image_url.png';
    mockImg.onError(STEP);

    let actualErr: string = null;
    dominantColorFinder.getColor(badImgUrl).then((_) => {
      fail('Promise should not have been resolved');
    }, (reason) => {
      actualErr = reason;
    });
    tick(STEP);
    flushMicrotasks();

    expect(actualErr).toEqual('Error loading image at ' + badImgUrl);
  }));

  it('should remove the event listeners when image onError is called', fakeAsync(() => {
    const spy = spyOn(mockImg, 'removeEventListener').and.callThrough();
    mockImg.onError(STEP);

    dominantColorFinder.getColor('bad_image_url.png').then((_) => {
      fail('Promise should not have been resolved');
    }, (_) => {});
    tick(STEP);
    flushMicrotasks();

    expect(spy).toHaveBeenCalledTimes(3);
    expect(spy.calls.all()[0].args[0]).toEqual('load');
    expect(spy.calls.all()[1].args[0]).toEqual('error');
    expect(spy.calls.all()[2].args[0]).toEqual('abort');
  }));

  it('should reject the promise when image onAbort is called', fakeAsync(() => {
    const badImgUrl = 'aborted_image_url.png';
    mockImg.onAbort(STEP);

    let actualErr: string = null;
    dominantColorFinder.getColor(badImgUrl).then((_) => {
      fail('Promise should not have been resolved');
    }, (reason) => {
      actualErr = reason;
    });
    tick(STEP);
    flushMicrotasks();

    expect(actualErr).toEqual('Loading aborted for image at ' + badImgUrl);
  }));

  it('should remove the event listeners when image onAbort is called', fakeAsync(() => {
    const spy = spyOn(mockImg, 'removeEventListener').and.callThrough();
    mockImg.onAbort(STEP);

    dominantColorFinder.getColor('aborted_image_url.png').then((_) => {
      fail('Promise should not have been resolved');
    }, (_) => {});
    tick(STEP);
    flushMicrotasks();

    expect(spy).toHaveBeenCalledTimes(3);
    expect(spy.calls.all()[0].args[0]).toEqual('load');
    expect(spy.calls.all()[1].args[0]).toEqual('error');
    expect(spy.calls.all()[2].args[0]).toEqual('abort');
  }));

  it('should return dominant colors within max brightness and min darkness', () => {
    dominantColorFinder = new DominantColorFinder(generateMockFindClustersFn(
        { r: 100, g: 100, b: 100, a: 255 },
        { r: 225, g: 225, b: 225, a: 255 },
        { r: 25, g: 25, b: 25, a: 255}
      ));
    const actualDominantColor = dominantColorFinder['findDominantColor'](new RawImage(new Uint8ClampedArray([1, 2, 3, 4]), 1, 1));
    expect(actualDominantColor).toEqual({ r: 100, g: 100, b: 100, a: 255});
  });

  it('should return dominant color above max brightness if only cluster', () => {
    dominantColorFinder = new DominantColorFinder(generateMockFindClustersFn({ r: 225, g: 225, b: 225, a: 255 }));
    const actualDominantColor = dominantColorFinder['findDominantColor'](new RawImage(new Uint8ClampedArray([1, 2, 3, 4]), 1, 1));
    expect(actualDominantColor).toEqual({ r: 225, g: 225, b: 225, a: 255});
  });

  it('should return dominant color below min brightness if only cluster', () => {
    dominantColorFinder = new DominantColorFinder(generateMockFindClustersFn({ r: 25, g: 25, b: 25, a: 255 }));
    const actualDominantColor = dominantColorFinder['findDominantColor'](new RawImage(new Uint8ClampedArray([1, 2, 3, 4]), 1, 1));
    expect(actualDominantColor).toEqual({ r: 25, g: 25, b: 25, a: 255});
  });

  it('should return dominant color from first cluster if no valid clusters', () => {
    dominantColorFinder = new DominantColorFinder(generateMockFindClustersFn(
      { r: 25, g: 25, b: 25, a: 255 },
      { r: 0, g: 0, b: 0, a: 255 },
      { r: 225, g: 225, b: 225, a: 255 }
    ));
    const actualDominantColor = dominantColorFinder['findDominantColor'](new RawImage(new Uint8ClampedArray([1, 2, 3, 4]), 1, 1));
    expect(actualDominantColor).toEqual({ r: 25, g: 25, b: 25, a: 255});
  });
});

/**
 * Used to generate a mock function to dependency inject the findClusters function into DominantColorFinder
 * @param points the points to make up each Cluster's centroid in the ClusterGroup
 */
function generateMockFindClustersFn(...points: Color[]): (img: RawImage) => ClusterGroup {
  const clusterGroup = new ClusterGroup();
  for (const point of points) {
    const cluster = new Cluster();
    cluster.addPoint(point);
    cluster.recomputeCentroid();
    clusterGroup.addCluster(cluster);
  }
  return (_: RawImage) => clusterGroup;
}

/**
 * Mocks the Canvas object to overwrite what imageData to return on getImageData.
 */
class MockCanvas extends Canvas {
  private readonly imageData: Uint8ClampedArray = null;

  constructor(imageData: Uint8ClampedArray) {
    super();
    this.imageData = imageData;
  }

  getImageData(image: ImageElement): Uint8ClampedArray {
    return this.imageData;
  }
}
