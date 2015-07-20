import sys,os
import numpy
import scipy
from sklearn.cluster import DBSCAN, KMeans, Ward
sys.path.append(os.path.dirname(os.path.abspath(__file__)).rsplit('/',1)[0] + '/libs/')
from haversine import haversine


class Coordinate:
    key = 0
    latitude = 0.0
    longitude = 0.0

    def __init__(self,**kwargs):
    	self.__dict__.update(kwargs)


class Clusterer(object):
    """ Holds coordinates, provides a cluster method, handles labeling
    of clusters.
    """
    
    def __init__(self):
        self.coords = []

        # a dictionary of cluster labels -> list of coords in cluster
        self.clustered_coords = {}
    
    def add_coord(self,key,lat,lon):
        self.coords.append(Coordinate(key=key,latitude=lat,longitude=lon))

    def cluster(self):
        raise NotImplementedError('cluster method not implemented!')

    def relabel(self,labels):
        for i,l in enumerate(labels):
            label_key = str(l)
            if label_key not in self.clustered_coords:
                self.clustered_coords[label_key] = []
            c = self.coords[i]
            self.clustered_coords[label_key].append({'key':c.key,'coord':[c.latitude,c.longitude]})

    # returns the newly clustered coordinates 
    def get_clusters(self):
        return self.clustered_coords

class DbscanClusterer(Clusterer):
    """An explanation of the DBSCAN algorithm can be found here:
    http://en.wikipedia.org/wiki/DBSCAN
    """
    eps = 10.0
    minpts = 5

    def set_eps(self,eps):
        self.eps = eps

    def set_minpts(self,minpts):
        self.minpts = minpts

    def cluster(self):
        X = numpy.array([[c.latitude,c.longitude] for c in self.coords])
        distance = scipy.spatial.distance.squareform(scipy.spatial.distance.pdist(X,lambda u,v:haversine(u,v)))

        result = DBSCAN(eps=self.eps,min_samples=self.minpts,metric='precomputed').fit(distance)
        labels = result.labels_
        self.relabel(labels)

class KmeansClusterer(Clusterer):

    n_clusters = 3

    def set_nclusters(self,n_clusters):
        self.n_clusters = n_clusters

    def cluster(self):
        X = numpy.array([[c.latitude,c.longitude] for c in self.coords])
        distance = scipy.spatial.distance.squareform(scipy.spatial.distance.pdist(X,lambda u,v:haversine(u,v)))

        result = KMeans(n_clusters=self.n_clusters).fit(distance)
        labels = result.labels_
        self.relabel(labels)

class WardClusterer(Clusterer):

    n_clusters = 3

    def set_nclusters(self,n_clusters):
        self.n_clusters = n_clusters

    def cluster(self):

        X = numpy.array([[c.latitude,c.longitude] for c in self.coords])
        distance = scipy.spatial.distance.squareform(scipy.spatial.distance.pdist(X,lambda u,v:haversine(u,v)))

        result = Ward(n_clusters=self.n_clusters).fit(distance)
        labels = result.labels_
        self.relabel(labels)


