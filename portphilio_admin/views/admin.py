from flask import Blueprint, request, send_file, abort, send_from_directory
from flask import current_app as app
from flask import render_template
from flask.ext.login import login_required
from portphilio_lib.build_db import build_db
from portphilio_lib.tools import retrieve_image
from flask.ext.login import login_required
from flask.ext.login import current_user

import os

mod = Blueprint('admin', __name__, static_folder='static', template_folder='templates', static_url_path='/static/admin')

@mod.route('/')
@login_required
def index():
    return render_template('index.html')

@mod.route('/build_db')
def rebuild():
    build_db()
    return "Success"

@mod.route('/image/<image_name>')
def image(image_name):
    return retrieve_image(image_name, current_user.username)
