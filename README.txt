This personal project is a Flask web application for visualizing the results of common clustering algorithms
on geospatial point data. Currently, the algorithms supported are K-means, DBSCAN, and WARD. I am using the
scikit-learn implementations of these algorithms provided as a simple RESTful service. A Postgres database, accessed
and populated using SQLAlchemy, stores information on the algorithms (maybe a little overkill, for now), and
Backbone is used on the frontend.

A demo can be seen at http://www.doublestranded.com/clusterdisplay, which is hosted on Heroku. A SciPy buildpack
(https://github.com/thenovices/heroku-buildpack-scipy) is required for Heroku deployment. 
The requirements.txt specifies the necessary Python packages and corresponding versions; the version numbers
need to match exactly for NumPy, SciPy, and scikit-learn.


The project was started almost a year ago, so I am revisiting the code to refactor and restyle as necessary.
