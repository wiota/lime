from flask import Blueprint, request
from flask import current_app as app
from portphilio_lib.tools import bsonify, to_dict, update_document
from portphilio_lib.models import *
from bson.json_util import dumps
from flask.ext.login import login_required
from flask.ext.login import current_user


mod = Blueprint('api', __name__, url_prefix='/api/v1')


@mod.route('/user/')
@login_required
def user():
    return User.objects.get(id=current_user.id).to_bson()


@mod.route('/body/')
@login_required
def body():
    return Body.objects.get(owner=current_user.id).to_bson()


@mod.route('/work/')
@login_required
def work():
    return Work.objects(owner=current_user.id).to_bson()


@mod.route('/work/<id>', methods=['GET'])
@login_required
def work_name(id):
    return Work.objects.get(owner=current_user.id, id=id).to_bson()


@mod.route('/work/<id>', methods=['PUT'])
def put_work(id):
    data = request.json
    id = data['_id']

    # TODO: This is temporary...
    del data['_id']
    del data['_cls']
    del data['owner']
    del data['subset']

    update_document(
        Work.objects.get(
            owner=current_user.id,
            id=id),
        data).save()
    return '', 204


@mod.route('/category/')
@login_required
def work_individual():
    return Category.objects(owner=current_user.id).to_bson()


@mod.route('/category/<id>')
@login_required
def category_id(id):
    return Category.objects.get(owner=current_user.id, id=id).to_bson()


@mod.route('/<subset_type>/<id>', methods=['DELETE'])
@login_required
def delete_by_id(subset_type, id):
    Subset.objects.get(id=id).delete()
    return '', 204


@mod.route('/work/form/')
@login_required
def work_form():
    return Work().to_form()


@mod.route('/category/form/')
@login_required
def category_form():
    return Category().to_form()


@mod.route('/medium/form/')
@login_required
def medium_form():
    return Medium().to_form()
