from portphilio_admin.models import *
from flask import Blueprint
from flask import current_app as app
from portphilio_admin.tools import bsonify, to_dict
from bson.json_util import dumps
from flask.ext.login import login_required


mod = Blueprint('api', __name__, url_prefix='/api/v1')


@mod.route('/work')
@login_required
def work():
    return Work.objects.to_bson()

@mod.route('/work/<id>')
@login_required
def work_name(id):
    return Work.objects.with_id(id).to_bson()

@mod.route('/category/')
@login_required
def work_individual():
    return Category.objects.to_bson()

@mod.route('/category/<id>')
@login_required
def category_id(id):
    return Category.objects.with_id(id).to_bson()
