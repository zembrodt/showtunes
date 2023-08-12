/* tslint:disable:no-string-literal */

import { expect } from '@angular/flex-layout/_private-utils/testing';
import { Color, FontColor } from '../util';
import { Cluster, ClusterGroup } from './cluster';
import { DominantColorFinder } from './dominant-color-finder';
import { RawImage } from './raw-image';

const TEST_IMG_SRC = 'favicon.ico';

describe('DominantColorFinder', () => {
  let dominantColorFinder: DominantColorFinder;

  beforeEach(() => {
    dominantColorFinder = new DominantColorFinder(generateMockFindClustersFn({
      r: 100, g: 100, b: 100, a: 255
    }));
  });

  it('should add the event listeners', (done) => {
    const spy = spyOn(Image.prototype, 'addEventListener').and.callThrough();
    dominantColorFinder.getColor(TEST_IMG_SRC).then((_) => done(), (reason) => {
      fail('Promise should not have been rejected: ' + reason);
      done();
    });
    expect(spy).toHaveBeenCalledTimes(3);
    expect(spy.calls.all()[0].args[0]).toEqual('load');
    expect(spy.calls.all()[1].args[0]).toEqual('error');
    expect(spy.calls.all()[2].args[0]).toEqual('abort');
  });

  it('should be truthy', (done) => {
    dominantColorFinder.getColor(TEST_IMG_SRC).then((result) => {
      expect(result).toBeTruthy();
      done();
    }, (reason) => {
      fail('Promise should not have been rejected: ' + reason);
      done();
    });
  });

  it('should remove the event listeners when image onLoad is called', (done) => {
    const spy = spyOn(Image.prototype, 'removeEventListener').and.callThrough();
    dominantColorFinder.getColor(TEST_IMG_SRC).then((_) => {
      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy.calls.all()[0].args[0]).toEqual('load');
      expect(spy.calls.all()[1].args[0]).toEqual('error');
      expect(spy.calls.all()[2].args[0]).toEqual('abort');
      done();
    }, (reason) => {
      fail('Promise should not have been rejected: ' + reason);
      done();
    });
  });

  it('should reject the promise if given an invalid src', (done) => {
    dominantColorFinder.getColor('').then((_) => {
      fail('Promise should not have been resolved');
      done();
    }, (reason) => {
      expect(reason).toEqual('getColor requires an image src');
      done();
    });

    dominantColorFinder.getColor(null).then((_) => {
      fail('Promise should not have been resolved');
      done();
    }, (reason) => {
      expect(reason).toEqual('getColor requires an image src');
      done();
    });
  });

  it('should reject the promise if an error occurred creating the Canvas', (done) => {
    const canvasError = 'Canvas test error';
    dominantColorFinder['createCanvas'] = () => {
      throw Error(canvasError);
    };
    dominantColorFinder.getColor(TEST_IMG_SRC).then((_) => {
      fail('Promise should not have been resolved');
      done();
    }, (reason) => {
      expect(reason).toEqual('Error creating Canvas: ' + Error(canvasError));
      done();
    });
  });

  it('should return the required color values given a dominant color', (done) => {
    const testColor: Color = { r: 50, g: 100, b: 150, a: 255 };
    dominantColorFinder['findDominantColor'] = () => testColor;
    dominantColorFinder.getColor(TEST_IMG_SRC).then((result) => {
      expect(result.rgb).toEqual(testColor);
      expect(result.hex).toEqual('326496');
      expect(result.foregroundFontColor).toEqual(FontColor.White);
      done();
    }, (reason) => {
      fail('Promise should not have been rejected: ' + reason);
      done();
    });
  });

  it('should reject the promise when image onError is called', (done) => {
    const badImgUrl = 'bad_image_url.png';
    dominantColorFinder.getColor(badImgUrl).then((_) => {
      fail('Promise should not have been resolved');
      done();
    }, (reason) => {
      expect(reason).toEqual('Error loading image at ' + badImgUrl);
      done();
    });
  });

  it('should remove the event listeners when image onError is called', (done) => {
    const spy = spyOn(Image.prototype, 'removeEventListener').and.callThrough();
    dominantColorFinder.getColor('bad_image_url.png').then((_) => {
      fail('Promise should not have been resolved');
      done();
    }, (_) => {
      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy.calls.all()[0].args[0]).toEqual('load');
      expect(spy.calls.all()[1].args[0]).toEqual('error');
      expect(spy.calls.all()[2].args[0]).toEqual('abort');
      done();
    });
  });

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


