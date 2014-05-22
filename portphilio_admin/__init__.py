import os
from flask import Flask, request, render_template
from pymongo import Connection
from urlparse import urlparse
from bson.objectid import ObjectId
from flask.ext.mongoengine import MongoEngine
from flask.ext.login import LoginManager

# Create a starter app
app = Flask(__name__)

# Turn on debugging if it's set
app.debug = os.environ.get('FLASK_DEBUG') == 'True'
# Tell jinja to trim blocks
app.jinja_env.trim_blocks = True

# For CSRF usage
app.config['SECRET_KEY'] = os.environ.get('CSRF_SECRET_KEY')

# Get the URL for the database from the environment
MONGO_URL = os.environ.get('MONGOHQ_URL')

# MongoEngine configuration
app.config["MONGODB_SETTINGS"] = {
    "DB": urlparse(MONGO_URL).path[1:],
    "host": MONGO_URL}

# MongoEngine DB
db = MongoEngine(app)

# Pymongo DB
# Create a new DB connection
connection = Connection(MONGO_URL)
# Parse the DB name from the URL
db_name = urlparse(MONGO_URL).path[1:]
# Create a new DB
db_pm = connection[db_name]

from portphilio_admin.views import api
api.db = db_pm
api.config = app.config
app.register_blueprint(api.mod)

from portphilio_admin.views import admin
admin.db = db_pm
admin.config = app.config
app.register_blueprint(admin.mod)

from portphilio_admin.views import upload
upload.db = db_pm
upload.config = app.config
app.register_blueprint(upload.mod)

from portphilio_admin.views.auth import auth
auth.config = app.config
app.register_blueprint(auth)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "auth.login"

from portphilio_admin.models import User


@login_manager.user_loader
def load_user(userid):
    return User.objects.get(id=userid)
