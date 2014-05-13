from flask import Blueprint, request, send_file, abort, send_from_directory, Response
from flask import current_app as app
from bson.json_util import dumps
import os

mod = Blueprint('api', __name__, url_prefix='/api/v1')

@mod.route('/work')
def work() :
    return "Maybe list all works here?"

@mod.route('/work/<name>')
def work_name(name) :
    ret = db.worksets.find_one({'host':app.config['HOST'], 'name':name})
    resp = Response(response=dumps(ret), status=200, mimetype="application/json")
    return resp

@mod.route('/work/<name>/<slug>')
def work_individual(name, slug) :
    return "Show individual work (name: " + name + ", slug: " + slug + ")"

