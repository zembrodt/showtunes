/* tslint:disable:no-string-literal */

import { expect } from '@angular/flex-layout/_private-utils/testing';
import { Color } from '../util';
import { Cluster, ClusterGroup } from './cluster';

describe('cluster package', () => {
  describe('Cluster', () => {
    let cluster: Cluster;

    beforeEach(() => {
      cluster = new Cluster();
    });

    it('should initialize cluster data as 0', () => {
      expect(cluster).toBeTruthy();
      expect(cluster['centroid']).toEqual([0, 0, 0]);
      expect(cluster['aggregate']).toEqual([0, 0, 0]);
      expect(cluster['counter']).toEqual(0);
      expect(cluster['weight']).toEqual(0);
    });

    it('should set the value of the centroid to the RGB values of a color', () => {
      const color: Color = {
        r: 1,
        g: 2,
        b: 3,
        a: 255
      };
      cluster.setCentroid(color);
      expect(cluster['centroid']).toEqual([1, 2, 3]);
    });

    it('should throw an error if a color value is null', () => {
      expect(() => cluster.setCentroid(null)).toThrowError();
    });

    it('should correctly check if the value of the centroid is the same as a color', () => {
      cluster['centroid'] = [1, 2, 3];
      expect(cluster.isAtCentroid({r: 1, g: 2, b: 3, a: 255})).toBeTrue();
      expect(cluster.isAtCentroid({r: 0, g: 2, b: 3, a: 255})).toBeFalse();
      expect(cluster.isAtCentroid({r: 1, g: 0, b: 3, a: 255})).toBeFalse();
      expect(cluster.isAtCentroid({r: 1, g: 2, b: 0, a: 255})).toBeFalse();
    });

    it('should return false when isAtCentroid is passed a null color', () => {
      expect(cluster.isAtCentroid(null)).toBeFalse();
    });

    it('should not recompute centroid when counter is 0', () => {
      cluster['centroid'] = [1, 2, 3];
      cluster.recomputeCentroid();
      expect(cluster['centroid']).toEqual([1, 2, 3]);
    });

    it('should recompute centroid when counter > 0', () => {
      const c1: Color = {r: 1, g: 2, b: 3, a: 255};
      const c2: Color = {r: 2, g: 4, b: 8, a: 255};
      cluster.addPoint(c1);
      cluster.addPoint(c2);
      expect(cluster['centroid']).toEqual([0, 0, 0]);
      expect(cluster['aggregate']).toEqual([c1.r + c2.r, c1.g + c2.g, c1.b + c2.b]);
      expect(cluster['counter']).toEqual(2);
      expect(cluster['weight']).toEqual(0);

      cluster.recomputeCentroid();
      expect(cluster['centroid']).toEqual([1, 3, 5]);
      expect(cluster['aggregate']).toEqual([0, 0, 0]);
      expect(cluster['counter']).toEqual(0);
      expect(cluster['weight']).toEqual(2);
    });

    it('should add a color to the aggregate with addPoint', () => {
      expect(cluster['aggregate']).toEqual([0, 0, 0]);
      expect(cluster['counter']).toEqual(0);
      cluster.addPoint({r: 1, g: 2, b: 3, a: 255});
      expect(cluster['aggregate']).toEqual([1, 2, 3]);
      expect(cluster['counter']).toEqual(1);
    });

    it('should throw an error if addPoint is passed a null color', () => {
      expect(() => cluster.addPoint(null)).toThrowError();
    });

    it('should get correct distance squared', () => {
      const c1: Color = {r: 2, g: 4, b: 8, a: 255};
      const c2: Color = {r: 8, g: 4, b: 2, a: 255};
      const actualDistance = Math.pow(c2.r - c1.r, 2) + Math.pow(c2.g - c1.g, 2) + Math.pow(c2.b - c1.b, 2);

      cluster.setCentroid(c1);
      expect(cluster.getDistanceSquared(c2)).toEqual(actualDistance);
    });

    it('should throw an error if getDistanceSquared passed a null color', () => {
      expect(() => cluster.getDistanceSquared(null)).toThrowError();
    });

    it('should return false for compareCentroidWithAggregate when counter is 0', () => {
      expect(cluster.compareCentroidWithAggregate()).toBeFalse();
    });

    it('should return true when aggregate equals centroid', () => {
      cluster['centroid'] = [2, 4, 8];
      cluster['aggregate'] = [4, 9, 17];
      cluster['counter'] = 2;
      expect(cluster.compareCentroidWithAggregate()).toBeTrue();
    });

    it('should return false when aggregate does not equal centroid', () => {
      cluster['centroid'] = [2, 4, 8];
      cluster['aggregate'] = [1, 8, 16];
      cluster['counter'] = 2;
      expect(cluster.compareCentroidWithAggregate()).toBeFalse();

      cluster['aggregate'] = [4, 1, 16];
      expect(cluster.compareCentroidWithAggregate()).toBeFalse();

      cluster['aggregate'] = [4, 8, 1];
      expect(cluster.compareCentroidWithAggregate()).toBeFalse();
    });
  });

  describe('ClusterGroup', () => {
    let clusterGroup: ClusterGroup;

    beforeEach(() => {
      clusterGroup = new ClusterGroup();
    });

    it('should be truthy', () => {
      expect(clusterGroup).toBeTruthy();
      expect(clusterGroup['clusters'].length).toEqual(0);
    });

    it('should return correctly if the group contains a centroid with the color', () => {
      const c1: Color = {r: 1, g: 2, b: 3, a: 255};
      const c2: Color = {r: 4, g: 5, b: 6, a: 255};
      const cluster1 = new Cluster();
      cluster1.setCentroid(c1);
      const cluster2 = new Cluster();
      cluster2.setCentroid(c2);

      clusterGroup.addCluster(cluster1);
      expect(clusterGroup.containsCentroid(c1)).toBeTrue();
      expect(clusterGroup.containsCentroid(c2)).toBeFalse();

      clusterGroup.addCluster(cluster2);
      expect(clusterGroup.containsCentroid(c1)).toBeTrue();
      expect(clusterGroup.containsCentroid(c2)).toBeTrue();
    });

    it('should return false if containsCentroid is passed null value', () => {
      const cluster = new Cluster();
      cluster.setCentroid({r: 1, g: 2, b: 3, a: 255});
      clusterGroup.addCluster(cluster);
      expect(clusterGroup.containsCentroid(null)).toBeFalse();
    });

    it('should return the cluster for a cluster group of one', () => {
      const cluster = new Cluster();
      cluster.setCentroid({r: 1, g: 2, b: 3, a: 255});
      clusterGroup.addCluster(cluster);
      expect(clusterGroup.closest({r: 4, g: 5, b: 6, a: 255})).toEqual(cluster);
    });

    it('should return the closest cluster to the given color', () => {
      const c1: Color = {r: 1, g: 2, b: 3, a: 255};
      const c2: Color = {r: 4, g: 5, b: 6, a: 255};
      const cluster1 = new Cluster();
      cluster1.setCentroid(c1);
      const cluster2 = new Cluster();
      cluster2.setCentroid(c2);
      clusterGroup.addCluster(cluster1);
      clusterGroup.addCluster(cluster2);

      expect(clusterGroup.closest(c1)).toEqual(cluster1);
      expect(clusterGroup.closest(c2)).toEqual(cluster2);
      expect(clusterGroup.closest({r: 5, g: 4, b: 7, a: 255})).toEqual(cluster2);
    });

    it('should return null for closest if no clusters have been added', () => {
      expect(clusterGroup.closest(null)).toBeNull();
    });

    it('should throw an error if closest is passed null color', () => {
      const cluster = new Cluster();
      cluster.setCentroid({r: 1, g: 2, b: 3, a: 255});
      clusterGroup.addCluster(cluster);
      expect(() => clusterGroup.closest(null)).toThrowError();
    });

    it('should add a cluster to the group', () => {
      expect(clusterGroup.getLength()).toEqual(0);
      clusterGroup.addCluster(new Cluster());
      expect(clusterGroup.getLength()).toEqual(1);
    });

    it('should not add a cluster to the group if the cluster is null', () => {
      expect(clusterGroup.getLength()).toEqual(0);
      clusterGroup.addCluster(null);
      expect(clusterGroup.getLength()).toEqual(0);
    });

    it('should sort clusters by weight', () => {
      const cluster1 = new Cluster();
      const cluster2 = new Cluster();
      const cluster3 = new Cluster();
      cluster1['weight'] = 3;
      cluster2['weight'] = 1;
      cluster3['weight'] = 2;
      clusterGroup.addCluster(cluster1);
      clusterGroup.addCluster(cluster2);
      clusterGroup.addCluster(cluster3);
      expect(clusterGroup.getClusters()).toEqual([cluster1, cluster2, cluster3]);

      clusterGroup.sort();
      expect(clusterGroup.getClusters()).toEqual([cluster2, cluster3, cluster1]);
    });
  });
});
