import { Cluster, ClusterGroup } from './cluster';
import { RawImage } from './raw-image';

const RESIZE_TO = 256;
const CLUSTER_COUNT = 4;
const MAX_SAMPLE = 10;
const ITERATION_COUNT = 50;

export function findClusters(image: RawImage): ClusterGroup {
  if (!image) {
    throw new Error('Image must have a value to find a cluster group');
  }
  image.scale(
    Math.min(image.getWidth(), RESIZE_TO),
    Math.min(image.getHeight(), RESIZE_TO));
  const width = image.getWidth();
  const height = image.getHeight();

  const randX = Math.floor(Math.random() * width);
  const randY = Math.floor(Math.random() * height);

  const clusters = new ClusterGroup();
  for (let i = 0; i < CLUSTER_COUNT; i++) {
    let colorUnique = false;
    for (let j = 0; j < MAX_SAMPLE; j++) {
      const randPixel = image.getPixelAt(randX, randY);
      if (randPixel.color.a === 0) {
        // ignore transparent pixels
        continue;
      }
      colorUnique = !clusters.containsCentroid(randPixel.color);
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
          continue;
        }
        const closestCluster = clusters.closest(pixel.color);
        closestCluster.addPoint(pixel.color);
      }
    }
    convergence = true;
    clusters.getClusters().map((c) => {
      convergence = convergence && c.compareCentroidWithAggregate();
      c.recomputeCentroid();
    });
  }
  // Sort clusters by populations so we can tell what the most popular color is
  // Sort by weight
  clusters.sort();
  return clusters;
}
