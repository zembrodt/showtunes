import { Color } from '../util';

export class Cluster {
  private centroid: number[] = [0, 0, 0];
  private aggregate: number[] = [0, 0, 0];
  private counter = 0;
  private weight = 0;

  setCentroid(color: Color): void {
    if (!color) {
      throw new Error('Color must have a value to set the centroid');
    }
    this.centroid[0] = color.r;
    this.centroid[1] = color.g;
    this.centroid[2] = color.b;
  }

  isAtCentroid(color: Color): boolean {
    if (!color) {
      return false;
    }
    return color.r === this.centroid[0] && color.g === this.centroid[1] && color.b === this.centroid[2];
  }

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

  addPoint(color: Color): void {
    if (!color) {
      throw new Error('Color must have a value to addPoint');
    }
    this.aggregate[0] += color.r;
    this.aggregate[1] += color.g;
    this.aggregate[2] += color.b;
    this.counter++;
  }

  getDistanceSquared(color: Color): number {
    if (!color) {
      throw new Error('Color must have a value to getDistanceSquared');
    }
    const r = color.r - this.centroid[0];
    const g = color.g - this.centroid[1];
    const b = color.b - this.centroid[2];
    return r * r + g * g + b * b;
  }

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

export class ClusterGroup {
  private clusters: Cluster[] = [];

  containsCentroid(color: Color): boolean {
    for (const cluster of this.clusters) {
      if (cluster.isAtCentroid(color)) {
        return true;
      }
    }
    return false;
  }

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

  sort(): void {
    this.clusters.sort((c1, c2) => (c1.getWeight() < c2.getWeight()) ? -1 : 1);
  }
}
