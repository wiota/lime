from portphilio_admin.models import *
from flask import Blueprint
from flask import current_app as app
from portphilio_admin.tools import bsonify, to_dict
from bson.json_util import dumps


mod = Blueprint('api', __name__, url_prefix='/api/v1')


@mod.route('/work')
def work():
    return "Maybe list all works here?"


@mod.route('/work/<name>')
def work_name(name):
    ret = db.worksets.find_one({'host': app.config['HOST'], 'name': name})
    return bsonify(**ret)

@mod.route('/category/<id>')
def category_id(id):
    return Category.objects.with_id(id).to_bson()

@mod.route('/category/')
def work_individual():
    return Category.objects.to_bson()
