import { Cluster, ClusterGroup } from './cluster';
import { RawImage } from './raw-image';

const RESIZE_TO = 256;
const CLUSTER_COUNT = 4;
const MAX_SAMPLE = 10;
const ITERATION_COUNT = 50;

/**
 * Generates k-means cluster groups given the RawImage data. Used to find a dominant color
 * @param image the RawImage data
 */
export function findClusters(image: RawImage): ClusterGroup {
  if (!image) {
    throw new Error('Image must have a value to find a cluster group');
  }
  // Scale the image to the default size if greater than
  image.scale(
    Math.min(image.getWidth(), RESIZE_TO),
    Math.min(image.getHeight(), RESIZE_TO));
  const width = image.getWidth();
  const height = image.getHeight();

  const clusters = new ClusterGroup();
  for (let i = 0; i < CLUSTER_COUNT; i++) {
    // Try up to MAX_SAMPLE times to find a unique color. If no unique color is found, destroy the cluster
    let colorUnique = false;
    for (let j = 0; j < MAX_SAMPLE; j++) {
      const randPixel = image.getPixelAt(Math.floor(Math.random() * width), Math.floor(Math.random() * height));
      if (randPixel.color.a === 0) {
        // Ignore transparent pixels
        continue;
      }
      // Check if we've seen this color before
      colorUnique = !clusters.containsCentroid(randPixel.color);
      // If this is a unique color, set the center of the cluster to that color
      if (colorUnique) {
        const c = new Cluster();
        c.setCentroid(randPixel.color);
        clusters.addCluster(c);
        break;
      }
    }
    if (!colorUnique) {
      break;
    }
  }

  let convergence = false;
  for (let i = 0; i < ITERATION_COUNT && !convergence && clusters.getLength() !== 0; i++) {
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const pixel = image.getPixelAt(x, y);
        if (pixel.color.a === 0) {
          // Ignore transparent pixels
          continue;
        }
        // Find which cluster this color is closest to
        const closestCluster = clusters.closest(pixel.color);
        closestCluster.addPoint(pixel.color);
      }
    }
    // Calculate the new cluster centers to see if we've converged
    convergence = true;
    clusters.getClusters().map((c) => {
      convergence = convergence && c.compareCentroidWithAggregate();
      c.recomputeCentroid();
    });
  }
  // Sort clusters by populations so we can tell what the most popular color is (sorted by weight)
  clusters.sort();
  return clusters;
}
