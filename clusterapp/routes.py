from clusterapp import app, api
import os
from functools import wraps
from flask import Flask, render_template ,abort ,jsonify, current_app, redirect, session, request, url_for, flash
from flask.ext.restful import reqparse, Resource, marshal_with, fields

import json
import cluster.models as cm
import cluster.application as ca


parser = reqparse.RequestParser()
for algorithm,data in cm.get_all_algorithms().items():
	for p in data["parameters"]:
		parser.add_argument(p['parameter'],
			type=cm.ALGORITHM_TYPES[p['param_type']])

parser.add_argument('coords',type=dict,location='json')

class ClusterAlgorithms(Resource):

	def get(self):
		""" Get all available algorithms and associated data
		"""
		return jsonify(cm.get_all_algorithms())


class Cluster(Resource):

	def post(self,**kwargs):

		#parser.parse_args() ?
		hack = eval(request.form.to_dict().keys()[0])

		clusterer = None
		if kwargs['algorithm'] == 'dbscan':
			try:
				min_pts = int(hack['min_pts'])
			except KeyError:
				abort(400)
			except ValueError:
				abort(400)
			try:
				print hack['eps']
				eps = float(hack['eps'])
			except KeyError:
				abort(400)
			except ValueError:
				abort(400)
			clusterer = ca.DbscanClusterer()
			clusterer.set_minpts(min_pts)
			clusterer.set_eps(eps)
		elif kwargs['algorithm'] == 'kmeans':
			try:
				n_clusters = int(hack['n_clusters'])
			except KeyError:
				abort(400)
			except ValueError:
				abort(400)
			clusterer = ca.KmeansClusterer()
			clusterer.set_nclusters(n_clusters)
		elif kwargs['algorithm'] == 'ward':
			try:
				n_clusters = int(hack['n_clusters'])
			except KeyError:
				abort(400)
			except ValueError:
				abort(400)
			clusterer = ca.WardClusterer()
			clusterer.set_nclusters(n_clusters)

		coords = hack['coords']
		
		for key,coord in coords.items():
			clusterer.add_coord(key=key,lat=coord[0],lon=coord[1])
		clusterer.cluster()
		return jsonify(clusterer.get_clusters()) 


api.add_resource(ClusterAlgorithms,'/algorithms')
api.add_resource(Cluster,'/cluster/<algorithm>')

@app.route('/')
def clusterdisplay():
	return render_template('index.html')
