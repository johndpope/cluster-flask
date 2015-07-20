from sqlalchemy import create_engine

from flask.ext.sqlalchemy import SQLAlchemy
engine = create_engine('sqlite:///:memory:', echo=True)

from flask import Flask

import os,urlparse

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ['DATABASE_URL']
db = SQLAlchemy(app)


class User(db.Model):

	__tablename__ = 'user'
	id = db.Column(db.String, primary_key=True)
	password = db.Column(db.String)


ALGORITHM_TYPES = {'Integer':int,'Float':float,'String':str}


class Algorithm(db.Model):

	__tablename__ = 'algorithm'
	
	id = db.Column(db.String, primary_key=True)
	description = db.Column(db.String)
	reference = db.Column(db.String)
	num_params = db.Column(db.Integer)

	def __repr__(self):
		return "<Algorithm(id='%s', description='%s', reference='%s', num_params='%d')>" % (
			self.id, self.description, self.reference, self.num_params)

class Citation(db.Model):

	__tablename__ = 'citation'
	
	id = db.Column(db.Integer,primary_key=True)
	algorithm = db.Column(db.String,db.ForeignKey('algorithm.id'))
	label = db.Column(db.String)
	url = db.Column(db.String)

class Parameter(db.Model):

	__tablename__ = 'parameter'

	parameter = db.Column(db.String,primary_key=True)
	label = db.Column(db.String)
	param_type = db.Column(db.String)

class AlgorithmParameter(db.Model):

	__tablename__ = 'algorithm_parameter'

	id = db.Column(db.String,primary_key=True)
	algorithm = db.Column(db.String,db.ForeignKey('algorithm.id'))
	parameter = db.Column(db.String,db.ForeignKey('parameter.parameter'))


def get_dict(row,key):
	row_dict = dict((col, getattr(row, col)) for col in row.__table__.columns.keys() if col!=key)
	return_dict = {}
	for col,val in row_dict.iteritems():
		return_dict[col] = str(val)
	return return_dict

def get_all_algorithms():

	algorithms = {}
	results = db.session.query(Algorithm).all()
	for row in results:
		algorithm = row.id
		algorithms[algorithm] = get_dict(row,'id')

		citation_results = db.session.query(Citation).filter(Citation.algorithm==algorithm).all()

		algorithms[algorithm]['citations'] = []
		for row in citation_results:
			algorithms[algorithm]['citations'].append(get_dict(row,'algorithm'))

		parameters_results = db.session.query(Parameter).join(
			AlgorithmParameter).filter(AlgorithmParameter.algorithm==algorithm).all()

		algorithms[algorithm]['parameters'] = []
		for row in parameters_results:
			algorithms[algorithm]['parameters'].append(get_dict(row,'algorithm'))

	return algorithms


if __name__ == '__main__':

	#db.session.query(Citation).delete()
	#db.session.query(Parameter).delete()
	#db.session.query(Algorithm).delete()
	#db.session.query(AlgorithmParameter).delete()


	db.session.commit()

	db.create_all()

	db.session.add(Algorithm(id="dbscan",description="",reference="http://en.wikipedia.org/wiki/DBSCAN",num_params=2))
	db.session.add(Algorithm(id="kmeans",description="",reference="http://en.wikipedia.org/wiki/K-means_clustering",num_params=1))
	db.session.add(Algorithm(id="ward",description="",reference="http://en.wikipedia.org/wiki/Ward%27s_method",num_params=1))

	db.session.commit()

	db.session.add(Citation(id=1,algorithm="dbscan",label="DBSCAN implementation",url="http://scikit-learn.org/stable/modules/generated/sklearn.cluster.DBSCAN.html"))
	db.session.add(Citation(id=2,algorithm="dbscan",label="Haversine formula",url="https://pypi.python.org/pypi/haversine"))
	db.session.add(Citation(id=3,algorithm="dbscan",label="Leaflet Measure",url="https://github.com/jtreml/leaflet.measure"))


	db.session.add(Citation(id=4,algorithm="kmeans",label="Kmeans implementation",url="http://scikit-learn.org/stable/modules/generated/sklearn.cluster.KMeans.html"))
	db.session.add(Citation(id=5,algorithm="kmeans",label="Haversine formula",url="https://pypi.python.org/pypi/haversine"))
	db.session.add(Citation(id=6,algorithm="kmeans",label="Leaflet Measure",url="https://github.com/jtreml/leaflet.measure"))

	db.session.add(Citation(id=7,algorithm="ward",label="Ward implementation",url="http://scikit-learn.org/stable/modules/generated/sklearn.cluster.Ward.html"))
	db.session.add(Citation(id=8,algorithm="ward",label="Haversine formula",url="https://pypi.python.org/pypi/haversine"))
	db.session.add(Citation(id=9,algorithm="ward",label="Leaflet Measure",url="https://github.com/jtreml/leaflet.measure"))

	db.session.add(Parameter(parameter="n_clusters",label="Number of Clusters",param_type="Integer"))
	db.session.add(Parameter(parameter="eps",label="Eps",param_type="Float"))
	db.session.add(Parameter(parameter="min_pts",label="Minimum Points",param_type="Integer"))

	db.session.commit()

	db.session.add(AlgorithmParameter(id=1,algorithm="dbscan",parameter="eps"))
	db.session.add(AlgorithmParameter(id=2,algorithm="dbscan",parameter="min_pts"))
	db.session.add(AlgorithmParameter(id=3,algorithm="kmeans",parameter="n_clusters"))
	db.session.add(AlgorithmParameter(id=4,algorithm="ward",parameter="n_clusters"))

	db.session.commit()
