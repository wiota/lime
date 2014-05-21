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
    ret = {"result" : to_dict(Category.objects.with_id(id).select_related(1), ["subset"])}
    return bsonify(**ret)

@mod.route('/category/')
def work_individual():
    ret = {"result" : [to_dict(x) for x in Category.objects]}
    return bsonify(**ret)
