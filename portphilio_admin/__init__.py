import os
from flask import Flask, request, render_template
from pymongo import Connection
from urlparse import urlparse
from bson.objectid import ObjectId

# Get the URL for the database from the environment
MONGO_URL = os.environ.get('MONGOHQ_URL')

if MONGO_URL:
    # Create a new DB connection
    connection = Connection(MONGO_URL)
    # Parse the DB name from the URL
    db_name = urlparse(MONGO_URL).path[1:]
    # Create a new DB
    db = connection[db_name]
else:
    # The environmental variable is not set
    sys.exit("MongoDB URL not found, exiting")

# Create a starter app
app = Flask(__name__)

# Turn on debugging if it's set
app.debug = os.environ.get('FLASK_DEBUG') == 'True'
# Tell jinja to trim blocks
app.jinja_env.trim_blocks = True

app.config['STATIC_FOLDER'] = 'static'
app.config['COMMON_FOLDER'] = 'common'
app.config['DIRECTORY_INDEX'] = 'index.html'

#TODO Get this from somewhere else
app.config['HOST'] = "www.maggiecasey.com"

from portphilio_admin.views import api
api.db = db
api.config = app.config
app.register_blueprint(api.mod)

from portphilio_admin.views import admin
admin.db = db
admin.config = app.config
app.register_blueprint(admin.mod)

from portphilio_admin.views import upload
upload.db = db
upload.config = app.config
app.register_blueprint(upload.mod)
