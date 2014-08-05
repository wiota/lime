from flask import Blueprint, request, jsonify
from flask import current_app as app
from toolbox.tools import bsonify, to_dict, update_document, slugify
from toolbox.models import *
from flask.ext.login import login_required
from flask.ext.login import current_user


mod = Blueprint('api', __name__, url_prefix='/api/v1')


@mod.route('/apex/body/')
@login_required
def body():
    return Body.objects.get(owner=current_user.id).to_bson()


@mod.route('/apex/happenings/')
@login_required
def happenings():
    return Happenings.objects.get(owner=current_user.id).to_bson()


@mod.route('/user/')
@login_required
def user():
    return User.objects.get(id=current_user.id).to_bson()


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


@mod.route('/tag/', methods=['POST'])
@login_required
def post_tag():
    data = request.json
    data['owner'] = current_user.id
    data['slug'] = slugify(data['title'])
    tag = Tag(**data).save()
    return tag.to_bson(), 200


@mod.route('/work/<id>/', methods=['PUT'])
@login_required
def put_work(id):
    doc = Work.objects.get(owner=current_user.id, id=request.json['_id'])
    data = {k: request.json[k] for k in doc.get_save_fields()}
    update_document(doc, data).save()
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


@mod.route('/happening/', methods=['POST'])
@login_required
def post_happening():
    data = request.json
    print data
    data['slug'] = slugify(data['title'])
    data['owner'] = current_user.id
    happening = Happening(**data).save()
    return happening.to_bson(), 200


@mod.route('/category/<id>/', methods=['PUT'])
@login_required
def put_category(id):
    doc = Category.objects.get(owner=current_user.id, id=request.json['_id'])
    data = {k: request.json[k] for k in doc.get_save_fields()}
    update_document(doc, data).save()
    return jsonify(result="success"), 200  # TODO: Should be a 204


@mod.route('/photo/', methods=['POST'])
@login_required
def post_photo():
    data = request.json
    data['owner'] = current_user.id
    photo = Photo(**data).save()
    return photo.to_bson(expand=False), 200


@mod.route('/<vertex_type>/<id>/')
@login_required
def vertex_id(vertex_type, id):
    return Vertex.objects.get(owner=current_user.id, id=id).to_bson()


@mod.route('/<vertex_type>/<id>/succset/', methods=['PUT'])
@login_required
def put_succset(vertex_type, id):
    Vertex.objects(
        owner=current_user.id,
        id=id).update_one(
        set__succset=request.json['succset'])
    return jsonify(result="success"), 200  # TODO: Should be a 204


@mod.route('/apex/body/succset/', methods=['PUT'])
@login_required
def put_body_succset():
    Body.objects(
        owner=current_user.id).update_one(
        set__succset=request.json['succset'])
    return jsonify(result="success"), 200  # TODO: Should be a 204


@mod.route('/<vertex_type>/<id>/', methods=['DELETE'])
@login_required
def delete_by_id(vertex_type, id):
    Vertex.objects.get(id=id).delete()
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


@mod.route('/happening/form/')
@login_required
def happening_form():
    return Happening().to_form()


@mod.route('/edge/', methods=["POST"])
@login_required
def add_edge():
    data = request.json
    for edge in data["edges"]:
        source_id = edge["_source"]
        sink_id = edge["_sink"]

        source = Vertex.objects.get(id=source_id, owner=current_user.id)
        source.update(add_to_set__succset=sink_id)

        sink = Vertex.objects.get(id=sink_id, owner=current_user.id)
        sink.update(add_to_set__predset=source_id)

    return jsonify(result="success"), 200  # TODO: Should be a 204


@mod.route('/edge/', methods=["DELETE"])
@login_required
def delete_edge():
    data = request.json
    for edge in data["edges"]:
        source_id = edge["_source"]
        sink_id = edge["_sink"]

        source = Vertex.objects.get(id=source_id, owner=current_user.id)
        source.update(pull__succset=sink_id)

        sink = Vertex.objects.get(id=sink_id, owner=current_user.id)
        sink.update(pull__predset=source_id)

    return jsonify(result="success"), 200  # TODO: Should be a 204
