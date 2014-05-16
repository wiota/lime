from flask import Blueprint
from flask import current_app as app
from portphilio_admin.tools import bsonify

mod = Blueprint('api', __name__, url_prefix='/api/v1')


@mod.route('/work')
def work():
    return "Maybe list all works here?"


@mod.route('/work/<name>')
def work_name(name):
    ret = db.worksets.find_one({'host': app.config['HOST'], 'name': name})
    return bsonify(**ret)


@mod.route('/work/<name>/<slug>')
def work_individual(name, slug):
    return "Show individual work (name: " + name + ", slug: " + slug + ")"
