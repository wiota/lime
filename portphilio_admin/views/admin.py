from flask import Blueprint, request, send_file, abort, send_from_directory
from flask import current_app as app
from flask import render_template
from flask.ext.login import login_required

import os

mod = Blueprint('admin', __name__, static_folder='static', template_folder='templates', static_url_path='/static/admin')

@mod.route('/')
@login_required
def index():
    return render_template('index.html')
