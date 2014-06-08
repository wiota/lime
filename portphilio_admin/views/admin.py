from flask import Blueprint, request, send_file, abort, send_from_directory
from flask import current_app as app
from flask import render_template
from flask.ext.login import login_required
from portphilio_lib.build_db import build_db, clear_db
from portphilio_lib.tools import retrieve_image
from flask.ext.login import login_required
from flask.ext.login import current_user

import os

mod = Blueprint('admin', __name__, static_folder='static', template_folder='templates', static_url_path='/static/admin')

@mod.route('/')
@login_required
def index():
    return render_template('index.html')

@mod.route('/image/<image_name>')
def image(image_name):
   return retrieve_image(image_name, current_user.username)

# This is a temporary endpoint, only for the testuser!
@mod.route('/build_db/')
@login_required
def rebuild():
    if current_user.username == "testuser":
        build_db(current_user.username)
        return "Success."
    return "Not allowed."

# This is a temporary endpoint
@mod.route('/clear_db/')
@login_required
def clear():
    clear_db(current_user.username)
    return "Success"
