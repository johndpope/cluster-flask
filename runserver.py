import os
from clusterapp import app

DEBUG = False

if 'DYNO' not in os.environ:
    DEBUG = True

app.run('127.0.0.1', debug=DEBUG)

