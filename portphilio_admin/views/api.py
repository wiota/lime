from flask import Blueprint, request, jsonify
from flask import current_app as app
from portphilio_lib.tools import bsonify, to_dict, update_document, slugify
from portphilio_lib.models import *
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


@mod.route('/work/', methods=['GET'])
@login_required
def work():
    return Work.objects(owner=current_user.id).to_bson()


@mod.route('/work/', methods=['POST'])
@login_required
def post_work():
    data = request.json
    data['owner'] = current_user.id
    data['slug'] = slugify(data['title'])
    work = Work(**data).save()
    return work.to_bson(), 200


@mod.route('/work/<id>', methods=['PUT'])
@login_required
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
    return jsonify(result="success"), 200  # TODO: Should be a 204


@mod.route('/category/', methods=['GET'])
@login_required
def work_individual():
    return Category.objects(owner=current_user.id).to_bson()


@mod.route('/category/', methods=['POST'])
@login_required
def post_category():
    data = request.json
    data['slug'] = slugify(data['title'])
    data['owner'] = current_user.id
    category = Category(**data).save()
    return category.to_bson(), 200


@mod.route('/photo/', methods=['POST'])
@login_required
def post_category():
    data = request.json
    data['slug'] = ''   # TODO: temporary...
    data['title'] = ''  # TODO: temporary...
    data['owner'] = current_user.id
    photo = Photo(**data).save()
    return photo.to_bson(expand=False), 200


@mod.route('/<subset_type>/<id>')
@login_required
def subset_id(subset_type, id):
    return Subset.objects.get(owner=current_user.id, id=id).to_bson()


@mod.route('/<subset_type>/<id>/subset/', methods=['PUT'])
@login_required
def put_subset(subset_type, id):
    Subset.objects(
        owner=current_user.id,
        id=id).update_one(
        set__subset=request.json['subset'])
    return jsonify(result="success"), 200  # TODO: Should be a 204


@mod.route('/<subset_type>/<id>', methods=['DELETE'])
@login_required
def delete_by_id(subset_type, id):
    Subset.objects.get(id=id).delete()
    return jsonify(result="success"), 200  # TODO: Should be a 204


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
