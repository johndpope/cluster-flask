import os
from flask import Flask
from flask.ext.restful import Api

app = Flask(__name__,static_folder='static', static_url_path='')
api = Api(app)

import clusterapp.routes
