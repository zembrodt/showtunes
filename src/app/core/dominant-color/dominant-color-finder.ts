import { ImageElement } from '../types';
import { calculateForegroundFontColor, Color, FontColor, rgbToHex } from '../util';
import { Canvas } from './canvas';
import { ClusterGroup } from './cluster';
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

  private readonly findClustersFn: (image: RawImage) => ClusterGroup;
  private canvas: Canvas = null;

  constructor(findClustersFn = findClusters) {
    this.findClustersFn = findClustersFn;
  }

  /**
   * Retrieves the dominant color of an image given it's URL
   * @param src the URL to an image
   */
  public getColor(src: string): Promise<DominantColor> {
    if (!src) {
      return Promise.reject('getColor requires an image src');
    }

    const img = this.createImage();
    img.crossOrigin = '';
    img.src = src;

    return new Promise((resolve, reject) => {
      const onLoad = () => {
        removeListeners();

        if (!this.canvas) {
          try {
            this.canvas = this.createCanvas();
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
        reject(`Error loading image at ${src}`);
      };

      const onAbort = () => {
        removeListeners();
        reject(`Loading aborted for image at ${src}`);
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

  /**
   * Finds the dominant color given a raw image
   * @param img the RawImage to find the dominant color in
   * @private
   * @return Color the dominant color
   */
  private findDominantColor(img: RawImage): Color {
    const clusters = this.findClustersFn(img);
    let dominantColor: Color;
    // Loop through the each cluster to find which one has an appropriate color. Skips any clusters that are too bright/dark according
    // to the configured maxBrightness and minDarkness values
    for (let i = 0; i < clusters.getLength(); i++) {
      const centroid = clusters.getClusters()[i].getCentroid();
      // Sum the RGB values to compare against maxBrightness and minDarkness
      const summedColor = centroid[0] + centroid[1] + centroid[2];
      if (summedColor < DominantColorFinder.maxBrightness && summedColor > DominantColorFinder.minDarkness) {
        dominantColor = {
          r: centroid[0],
          g: centroid[1],
          b: centroid[2],
          a: 255
        };
      } else if (i === 0) {
        // Set the first color as valid if no others exist
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

  private createCanvas(): Canvas {
    return new Canvas();
  }

  private createImage(): ImageElement {
    return new Image();
  }
}
