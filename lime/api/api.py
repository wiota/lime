from flask import Blueprint, request, jsonify
from flask import current_app as app
from toolbox.tools import update_document
from toolbox.models import *
from flask.ext.login import login_required
from flask.ext.login import current_user


mod = Blueprint('api', __name__, url_prefix='/api/v1')

'''
Body endpoints
'''

@mod.route('/apex/body/', methods=['GET'])
@login_required
def body():
    return Body.objects.get(owner=current_user.id).to_bson()


@mod.route('/apex/body/succset/', methods=['PUT'])
@login_required
def put_body_succset():
    Body.objects(
        owner=current_user.id).update_one(
        set__succset=request.json['succset'])
    return jsonify(result="success"), 200  # TODO: Should be a 204


'''
Happening endpoints
'''

@mod.route('/apex/happenings/', methods=['GET'])
@login_required
def happenings():
    return Happenings.objects.get(owner=current_user.id).to_bson()


@mod.route('/happening/', methods=['POST'])
@login_required
def post_happening():
    data = request.json
    data['owner'] = current_user.id
    happening = Happening(**data).save()
    return happening.to_bson(), 200


@mod.route('/happening/<id>/', methods=['PUT'])
@login_required
def put_happening(id):
    doc = Happening.objects.get(owner=current_user.id, id=id)

    # TODO: This is a bad function
    data = {k: request.json[k] for k in doc.get_save_fields() if k in request.json.keys()}
    update_document(doc, data).save()

    # TODO: This is a hack. get_save_fields should be reworked.
    if 'cover' in request.json.keys():
        doc.reload()
        doc.update(set__cover=request.json['cover'])

    return jsonify(result="success"), 200  # TODO: Should be a 204


@mod.route('/happening/form/', methods=['GET'])
@login_required
def happening_form():
    return Happening().to_form()


'''
User endpoints
'''

@mod.route('/user/', methods=['GET'])
@login_required
def user():
    return User.objects.get(id=current_user.id).to_bson()

'''
Work endpoints
'''

@mod.route('/work/', methods=['POST'])
@login_required
def post_work():
    data = request.json
    data['owner'] = current_user.id
    work = Work(**data).save()
    return work.to_bson(), 200


@mod.route('/work/<id>/', methods=['PUT'])
@login_required
def put_work(id):
    doc = Work.objects.get(owner=current_user.id, id=id)

    # TODO: This is a bad function
    data = {k: request.json[k] for k in doc.get_save_fields() if k in request.json.keys()}
    update_document(doc, data).save()

    # TODO: This is a hack. get_save_fields should be reworked.
    if 'cover' in request.json.keys():
        doc.reload()
        doc.update(set__cover=request.json['cover'])

    return jsonify(result="success"), 200  # TODO: Should be a 204


@mod.route('/work/form/', methods=['GET'])
@login_required
def work_form():
    return Work().to_form()


'''
Tag endpoints
'''

@mod.route('/tag/', methods=['POST'])
@login_required
def post_tag():
    data = request.json
    data['owner'] = current_user.id
    tag = Tag(**data).save()
    return tag.to_bson(), 200


'''
Category endpoints
'''

@mod.route('/category/', methods=['POST'])
@login_required
def post_category():
    data = request.json
    data['owner'] = current_user.id
    category = Category(**data).save()
    return category.to_bson(), 200


@mod.route('/category/<id>/', methods=['PUT'])
@login_required
def put_category(id):
    doc = Category.objects.get(owner=current_user.id, id=id)

    # TODO: This is a bad function
    data = {k: request.json[k] for k in doc.get_save_fields() if k in request.json.keys()}
    update_document(doc, data).save()

    # TODO: This is a hack. get_save_fields should be reworked.
    if 'cover' in request.json.keys():
        doc.reload()
        doc.update(set__cover=request.json['cover'])

    return jsonify(result="success"), 200  # TODO: Should be a 204


@mod.route('/category/form/', methods=['GET'])
@login_required
def category_form():
    return Category().to_form()


'''
Vertex endpoints
'''

@mod.route('/<vertex_type>/<id>/', methods=['GET'])
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


@mod.route('/<vertex_type>/<id>/', methods=['DELETE'])
@login_required
def delete_by_id(vertex_type, id):
    Vertex.objects.get(id=id).delete()
    return jsonify(result="success"), 200  # TODO: Should be a 204


'''
Photo endpoints
'''

@mod.route('/photo/', methods=['POST'])
@login_required
def post_photo():
    data = request.json
    data['owner'] = current_user.id
    photo = Photo(**data).save()
    return photo.to_bson(expand=False), 200


'''
Page endpoints
'''

@mod.route('/page/', methods=['POST'])
@login_required
def post_page():
    data = request.json
    data['owner'] = current_user.id
    page = CustomPage(**data).save()
    return page.to_bson(), 200


@mod.route('/page/<id>/', methods=['PUT'])
@login_required
def put_page(id):
    doc = CustomPage.objects.get(owner=current_user.id, id=id)
    data = {k: request.json[k] for k in doc.get_save_fields()}
    update_document(doc, data).save()
    return jsonify(result="success"), 200  # TODO: Should be a 204


@mod.route('/page/form/', methods=['GET'])
@login_required
def page_form():
    return CustomPage().to_form()


'''
Edge endpoints
'''

@mod.route('/edge/', methods=["POST"])
@login_required
def add_edge():
    edges = request.json["edges"]
    for source_id, sink_id in zip(edges, edges[1:]):
        source = Vertex.objects.get(id=source_id, owner=current_user.id)
        succset = [sink_id] + source.succset
        source.update(set__succset=succset)
        sink = Vertex.objects.get(id=sink_id, owner=current_user.id)
        predset = [source_id] + sink.predset
        sink.update(set__predset=predset)
    return jsonify(result="success"), 200  # TODO: Should be a 204


@mod.route('/edge/', methods=["DELETE"])
@login_required
def delete_edge():
    edges = request.json["edges"]
    for source_id, sink_id in zip(edges, edges[1:]):
        source = Vertex.objects.get(id=source_id, owner=current_user.id)
        source.update(pull__succset=sink_id)
        sink = Vertex.objects.get(id=sink_id, owner=current_user.id)
        sink.update(pull__predset=source_id)
    return jsonify(result="success"), 200  # TODO: Should be a 204


'''
Medium endpoint
'''

@mod.route('/medium/form/', methods=['GET'])
@login_required
def medium_form():
    return Medium().to_form()
