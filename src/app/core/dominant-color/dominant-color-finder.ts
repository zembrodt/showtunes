import { calculateForegroundFontColor, Color, FontColor, rgbToHex } from '../util';
import { Canvas } from './canvas';
import { findClusters } from './k-means';
import { RawImage } from './raw-image';

export interface DominantColor {
  hex: string;
  rgb: Color;
  foregroundFontColor: FontColor;
}

export class DominantColorFinder {
  private static readonly maxBrightness = 655;
  private static readonly minDarkness = 100;

  private canvas: Canvas = null;

  public getColor(src: string): Promise<DominantColor> {
    if (!src) {
      return Promise.reject(Error('getColor requires an image src'));
    }

    const img = new Image();
    img.crossOrigin = '';
    img.src = src;

    return new Promise((resolve, reject) => {
      const onLoad = () => {
        removeListeners();

        if (!this.canvas) {
          try {
            this.canvas = new Canvas();
          } catch (e) {
            reject(`Error creating Canvas: ${e}`);
          }
        }

        try {
          const data = this.canvas.getImageData(img);
          const rawImage = new RawImage(data, img.width, img.height);
          const dominantColor = this.findDominantColor(rawImage);

          return resolve({
            hex: rgbToHex(dominantColor),
            rgb: dominantColor,
            foregroundFontColor: calculateForegroundFontColor(dominantColor)
          });
        } catch (e) {
          reject(`Error finding dominant color from image ${src}:\n${e}`);
        }
      };

      const onError = () => {
        removeListeners();
        reject(Error(`Error loading image at ${src}`));
      };

      const onAbort = () => {
        removeListeners();
        reject(Error(`Loading aborted for image at ${src}`));
      };

      const removeListeners = () => {
        img.removeEventListener('load', onLoad);
        img.removeEventListener('error', onError);
        img.removeEventListener('abort', onAbort);
      };

      img.addEventListener('load', onLoad);
      img.addEventListener('error', onError);
      img.addEventListener('abort', onAbort);
    });
  }

  private findDominantColor(img: RawImage): Color {
    const clusters = findClusters(img);
    let dominantColor: Color;
    for (let i = 0; i < clusters.getLength(); i++) {
      const centroid = clusters.getClusters()[i].getCentroid();
      const summedColor = centroid[0] + centroid[1] + centroid[2];
      if (summedColor < DominantColorFinder.maxBrightness && summedColor > DominantColorFinder.minDarkness) {
        dominantColor = {
          r: centroid[0],
          g: centroid[1],
          b: centroid[2],
          a: 255
        };
      } else if (i === 0) {
        dominantColor = {
          r: centroid[0],
          g: centroid[1],
          b: centroid[2],
          a: 255
        };
      }
    }
    return dominantColor;
  }
}
