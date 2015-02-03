import sys
from flask import Blueprint, request, jsonify
from flask import current_app as app
from toolbox.tools import update_document, make_response
from toolbox.models import *
from flask.ext.login import login_required
from flask.ext.login import current_user
from mongoexhaust import bsonify


mod = Blueprint('api', __name__, url_prefix='/api/v1')

def str_to_class(str):
    return reduce(getattr, str.split("."), sys.modules[__name__])

@mod.route('/<classname>/form/', methods=['GET'])
@login_required
def vertex_to_form(classname):
    return str_to_class(classname.title())().to_form()


'''
Body endpoints
'''

@mod.route('/apex/body/', methods=['GET'])
@login_required
def body():
    return Body.by_current_user().to_bson()


@mod.route('/apex/body/succset/', methods=['PUT'])
@login_required
def put_body_succset():
    body = Body.by_current_user()
    Body.objects.get(id=body.id).update(set__succset=request.json['succset'])
    return jsonify(result="success"), 200  # TODO: Should be a 204


'''
Happening endpoints
'''

@mod.route('/apex/happenings/', methods=['GET'])
@login_required
def happenings():
    return Happenings.by_current_user().to_bson()


@mod.route('/happening/', methods=['POST'])
@login_required
def post_happening():
    data = request.json
    data['host'] = Host.by_current_user().id
    happening = Happening(**data).save()
    return happening.to_bson(), 200


@mod.route('/happening/<id>/', methods=['PUT'])
@login_required
def put_happening(id):
    doc = Happening.by_id(id)

    # TODO: This is a bad function
    data = {k: request.json[k] for k in doc.get_save_fields() if k in request.json.keys()}
    update_document(doc, data).save()

    # TODO: This is a hack. get_save_fields should be reworked.
    if 'cover' in request.json.keys():
        doc.reload()
        doc.update(set__cover=request.json['cover'])

    return jsonify(result="success"), 200  # TODO: Should be a 204


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
    data['host'] = Host.by_current_user()
    work = Work(**data).save()
    return work.to_bson(), 200


@mod.route('/work/<id>/', methods=['PUT'])
@login_required
def put_work(id):
    doc = Work.by_id(id)

    # TODO: This is a bad function
    data = {k: request.json[k] for k in doc.get_save_fields() if k in request.json.keys()}
    update_document(doc, data).save()

    # TODO: This is a hack. get_save_fields should be reworked.
    if 'cover' in request.json.keys():
        doc.reload()
        doc.update(set__cover=request.json['cover'])

    return jsonify(result="success"), 200  # TODO: Should be a 204


'''
Tag endpoints
'''

@mod.route('/tag/', methods=['POST'])
@login_required
def post_tag():
    data = request.json
    data['host'] = Host.by_current_user()
    tag = Tag(**data).save()
    return tag.to_bson(), 200


'''
Category endpoints
'''

@mod.route('/category/', methods=['POST'])
@login_required
def post_category():
    data = request.json
    data['host'] = Host.by_current_user()
    category = Category(**data).save()
    return category.to_bson(), 200


@mod.route('/category/<id>/', methods=['PUT'])
@login_required
def put_category(id):
    doc = Category.by_id(id)
    host = Host.by_current_user()

    # TODO: This is a hack. The key 'Category' here should come from the
    # <vertex_type> in the URL when we eventually condense these endpoints.
    # Essentially returnsn an empty list if the type is not defined for the
    # host, so nothing happens.
    custom_vertex_keys = [x.name for x in host.custom_vertex_fields.get('Category', [])]

    # TODO: This is a bad function
    # It gets the valid fields for a document and uses them to populate the
    # data dictionary, since the MongoEngine model doesn't respond well when we
    # give it fields it's not expecting.
    data = {k: request.json[k] for k in doc.get_save_fields() if k in request.json.keys()}

    # TODO: Just making this worse...
    # Extracts the custom fields from the request based on which keys are
    # available for the host
    data["customfields"]= [{
        'key': k,
        'value': request.json[k]} for k in custom_vertex_keys if k in request.json.keys()
    ]

    update_document(doc, data).save()

    # TODO: This is a hack. get_save_fields should be reworked.
    if 'cover' in request.json.keys():
        doc.reload()
        doc.update(set__cover=request.json['cover'])

    return jsonify(result="success"), 200  # TODO: Should be a 204


'''
Vertex endpoints
'''

@mod.route('/<vertex_type>/<id>/', methods=['GET'])
@login_required
def vertex_id(vertex_type, id):
    '''
    This was originally:

    return Vertex.by_id(id).to_bson()

    ...but now we need to bake in the potential custom fields for every vertex
    type. This requires getting the vertex as a dict, extracting them from the
    `customfields` field, setting them in the dict, removing the customfields
    field, and then bsonify-ing the resulting dict. Perhaps not the best, but
    it works for now until custom fields become more solid.

    '''
    v = Vertex.by_id(id).to_dict()
    for x in v['customfields']:
        v[x["key"]] = x["value"]
    del v['customfields']
    return bsonify(**make_response(v))


@mod.route('/<vertex_type>/<id>/succset/', methods=['PUT'])
@login_required
def put_succset(vertex_type, id):
    vertex = Vertex.by_id(id)
    Vertex.objects.get(id=vertex.id).update(set__succset=request.json['succset'])
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
    data['host'] = Host.by_current_user()
    photo = Photo(**data).save()
    return photo.to_bson(expand=False), 200


'''
Page endpoints
'''

@mod.route('/page/', methods=['POST'])
@login_required
def post_page():
    data = request.json
    data['host'] = Host.by_current_user()
    page = CustomPage(**data).save()
    return page.to_bson(), 200


# TODO: This function probably isn't used and definitely doesn't work.
@mod.route('/page/<id>/', methods=['PUT'])
@login_required
def put_page(id):
    doc = CustomPage.by_id(id)
    data = {k: request.json[k] for k in doc.get_save_fields()}
    update_document(doc, data).save()
    return jsonify(result="success"), 200  # TODO: Should be a 204


'''
Edge endpoints
'''

@mod.route('/edge/', methods=["POST"])
@login_required
def add_edge():
    edges = request.json["edges"]
    for source_id, sink_id in zip(edges, edges[1:]):
        source = Vertex.by_id(source_id)
        succset = [sink_id] + source.succset
        source.update(set__succset=succset)
        sink = Vertex.by_id(sink_id)
        predset = [source_id] + sink.predset
        sink.update(set__predset=predset)
    return jsonify(result="success"), 200  # TODO: Should be a 204


@mod.route('/edge/', methods=["DELETE"])
@login_required
def delete_edge():
    edges = request.json["edges"]
    for source_id, sink_id in zip(edges, edges[1:]):
        source = Vertex.by_id(source_id)
        source.update(pull__succset=sink_id)
        sink = Vertex.by_id(sink_id)
        sink.update(pull__predset=source_id)
    return jsonify(result="success"), 200  # TODO: Should be a 204
