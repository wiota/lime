from portphilio_admin.models import *
from flask import Blueprint
from flask import current_app as app
from portphilio_admin.tools import bsonify, to_dict
from bson.json_util import dumps
from flask.ext.login import login_required
from flask.ext.login import current_user


mod = Blueprint('api', __name__, url_prefix='/api/v1')

@mod.route('/body')
@login_required
def body():
    return Body.objects.get(owner=current_user.id).to_bson()

@mod.route('/work')
@login_required
def work():
    return Work.objects(owner=current_user.id).to_bson()

@mod.route('/work/<id>')
@login_required
def work_name(id):
    return Work.objects.get(owner=current_user.id, id=id).to_bson()

@mod.route('/category/')
@login_required
def work_individual():
    return Category.objects(owner=current_user.id).to_bson()

@mod.route('/category/<id>')
@login_required
def category_id(id):
    return Category.objects.get(owner=current_user.id, id=id).to_bson()
