import os
from flask_sslify import SSLify
from flask import Flask, request, render_template
from urlparse import urlparse
from bson.objectid import ObjectId
from flask.ext.mongoengine import MongoEngine
from flask.ext.login import LoginManager
from toolbox.tools import AnonymousUser
from lime.account import account
from lime.admin import admin
from lime.api import api
from lime.root import root
from lime.upload import upload
from lime.webhook import webhook
from toolbox.models import User
from toolbox.template_tools import format_date, format_money

# Create a starter app
app = Flask(__name__)

# Force SSL/HTTPS
sslify = SSLify(app, permanent=True)

# Turn on debugging if it's set
app.debug = os.environ.get('FLASK_DEBUG') == 'True'
# Tell jinja to trim blocks
app.jinja_env.trim_blocks = True

# Jinja formatting functions
app.jinja_env.filters["date"] = format_date
app.jinja_env.filters["money"] = format_money

# For CSRF usage
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')

# Stripe API keys
app.config['STRIPE_SECRET_KEY'] = os.environ.get('STRIPE_SECRET_KEY')
app.config['STRIPE_PUBLIC_KEY'] = os.environ.get('STRIPE_PUBLIC_KEY')

# Get the URL for the database from the environment
MONGO_URL = os.environ.get('MONGOHQ_URL')

# MongoEngine configuration
app.config["MONGODB_SETTINGS"] = {
    "DB": urlparse(MONGO_URL).path[1:],
    "host": MONGO_URL}

# MongoEngine DB
db = MongoEngine(app)

api.config = app.config
app.register_blueprint(api.mod)

admin.config = app.config
app.register_blueprint(admin.mod)

upload.config = app.config
app.register_blueprint(upload.mod)

account.config = app.config
app.register_blueprint(account.mod)

webhook.config = app.config
app.register_blueprint(webhook.mod)

root.config = app.config
app.register_blueprint(root.mod)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "root.login"
login_manager.anonymous_user = AnonymousUser


@login_manager.user_loader
def load_user(userid):
    try:
        return User.objects.get(id=userid)
    except:
        return AnonymousUser()
