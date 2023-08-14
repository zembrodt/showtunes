import { Color } from '../util';

/**
 * Represents a centroid RGB value and aggregate RGB value for a k-means cluster
 */
export class Cluster {
  private centroid: number[] = [0, 0, 0];
  private aggregate: number[] = [0, 0, 0];
  private counter = 0;
  private weight = 0;

  /**
   * Set the cluster's centroid value using the data from a Color
   * @param color the Color to use as the cluster's centroid
   */
  setCentroid(color: Color): void {
    if (!color) {
      throw new Error('Color must have a value to set the centroid');
    }
    this.centroid[0] = color.r;
    this.centroid[1] = color.g;
    this.centroid[2] = color.b;
  }

  /**
   * Check if a color's value is the same as the cluster's centroid
   * @param color the Color to check
   */
  isAtCentroid(color: Color): boolean {
    if (!color) {
      return false;
    }
    return color.r === this.centroid[0] && color.g === this.centroid[1] && color.b === this.centroid[2];
  }

  /**
   * Recomputes the centroid of the cluster based on the aggregate. The number of points used to calculate this center is stored for
   * weighting purposes. The aggregate and counter are cleared for the next iteration.
   */
  recomputeCentroid(): void {
    if (this.counter > 0) {
      this.centroid[0] = Math.floor(this.aggregate[0] / this.counter);
      this.centroid[1] = Math.floor(this.aggregate[1] / this.counter);
      this.centroid[2] = Math.floor(this.aggregate[2] / this.counter);

      this.aggregate = [0, 0, 0];
      this.weight = this.counter;
      this.counter = 0;
    }
  }

  /**
   * Adds the RGB value of a color to the aggregate
   * @param color the Color to add to the aggregate
   */
  addPoint(color: Color): void {
    if (!color) {
      throw new Error('Color must have a value to addPoint');
    }
    this.aggregate[0] += color.r;
    this.aggregate[1] += color.g;
    this.aggregate[2] += color.b;
    this.counter++;
  }

  /**
   * Calculates the distance between a color and the centroid
   * @param color the Color to calculate the distance to
   */
  getDistanceSquared(color: Color): number {
    if (!color) {
      throw new Error('Color must have a value to getDistanceSquared');
    }
    const r = color.r - this.centroid[0];
    const g = color.g - this.centroid[1];
    const b = color.b - this.centroid[2];
    return r * r + g * g + b * b;
  }

  /**
   * Checks if the centroid of the cluster has moved to determine if it's hit convergence. Checks whether the centroid is the same
   * as the aggregate sum of points that will be used to generate the next centroid.
   */
  compareCentroidWithAggregate(): boolean {
    if (this.counter === 0) {
      return false;
    }
    return Math.floor(this.aggregate[0] / this.counter) === this.centroid[0] &&
      Math.floor(this.aggregate[1] / this.counter) === this.centroid[1] &&
      Math.floor(this.aggregate[2] / this.counter) === this.centroid[2];
  }

  getCentroid(): number[] {
    return this.centroid;
  }

  getWeight(): number {
    return this.weight;
  }
}

/**
 * Represents an array of Cluster objects
 */
export class ClusterGroup {
  private clusters: Cluster[] = [];

  /**
   * Checks if any cluster in the cluster group contains a centroid with the value of the color
   * @param color the Color to check is in the cluster group
   */
  containsCentroid(color: Color): boolean {
    for (const cluster of this.clusters) {
      if (cluster.isAtCentroid(color)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Calculates the Cluster in the group with the closest centroid to the given color
   * @param color the Color to find the closest Cluster to
   */
  closest(color: Color): Cluster {
    let closestCluster: Cluster = null;
    let distanceToClosest = -1;
    for (const cluster of this.clusters) {
      const d = cluster.getDistanceSquared(color);
      if (distanceToClosest < 0 || d < distanceToClosest) {
        distanceToClosest = d;
        closestCluster = cluster;
      }
    }
    return closestCluster;
  }

  /**
   * Adds a Cluster to the group
   * @param cluster the Cluster to add
   */
  addCluster(cluster: Cluster): void {
    if (cluster) {
      this.clusters.push(cluster);
    }
  }

  getClusters(): Cluster[] {
    return this.clusters;
  }

  getLength(): number {
    return this.clusters.length;
  }

  /**
   * Sorts the Clusters in the group by weight
   */
  sort(): void {
    this.clusters.sort((c1, c2) => (c1.getWeight() < c2.getWeight()) ? -1 : 1);
  }
}
