import sys
from flask import Blueprint, request, jsonify, abort
from flask import current_app as app
from toolbox.tools import update_document, make_response, get_custom_vertex_fields
from toolbox.models import *
from flask.ext.login import current_user
from mongoexhaust import bsonify
from functools import wraps


def login_required(func):
    @wraps(func)
    def decorated_view(*args, **kwargs):
        if not current_user.is_authenticated():
            abort(401)
        return func(*args, **kwargs)
    return decorated_view

mod = Blueprint('api', __name__, url_prefix='/api/v1')

def str_to_class(str):
    '''
    Converts a string (e.g., "category") to the corresponding class. This is
    used to convert a request for a form at an endpoint to the correct class
    to call to_form() on. This will eventually go away when we get rid of
    predefined Vertex model types.
    '''
    return reduce(getattr, str.split("."), sys.modules[__name__])

def model_exists(str):
    '''
    Checks if a given string exists as a class in this scope.
    '''
    return reduce(hasattr, str.split("."), sys.modules[__name__])

@mod.route('/<classname>/form/', methods=['GET'])
@login_required
def vertex_to_form(classname):
    '''
    Returns a form for a given classname. Eventually this will become a
    vertex-type and the model_exists class can go away.
    '''
    # Check if the model exists. If it does, this is an old Model
    if model_exists(classname.title()):

        # Convert the string to a class and return the form
        return str_to_class(classname.title())().to_form()
    else:
        # This is not an explicitly defined model. Make the form from
        # it's custom fields.

        # This is duplicated from toolbox.tools.document_to_form and should
        # probably be gotten rid of.
        type_dict = {
            StringField.__name__: "text",
            LongStringField.__name__: "textarea",
            DateTimeField.__name__: "datetime-local",
            URLField.__name__: "text"
        }

        return jsonify(make_response([
            {
                "name": cv.name,
                "label": cv.verbose_name,
                "required": cv.required,
                "type": type_dict[cv.field_type]
            } for cv in get_custom_vertex_fields(classname)]))


'''
Body endpoints
'''

@mod.route('/body/', methods=['GET'])
@login_required
def body():
    return Body.by_current_user().to_bson()


'''
Happening endpoints
'''

@mod.route('/happenings/', methods=['GET'])
@login_required
def happenings():
    return Happenings.by_current_user().to_bson()


'''
User endpoints
'''

@mod.route('/user/', methods=['GET'])
@login_required
def user():
    return User.objects.get(id=current_user.id).to_bson()


'''
Host endpoints
'''

@mod.route('/host/', methods=['GET'])
@login_required
def user():
    return Host.objects.get(owners__in=[current_user.id]).to_bson()


'''
Vertex endpoints
'''

@mod.route('/<vertex_type>/', methods=['GET'])
@login_required
def vertices_by_type(vertex_type):
    host = Host.by_current_user()
    return Vertex.objects(vertex_type=vertex_type, host=host).to_bson()


@mod.route('/<vertex_type>/<id>/', methods=['GET'])
@login_required
def vertex_id(vertex_type, id):
    return Vertex.by_id(id).to_bson()


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


@mod.route('/<vertex_type>/', methods=['POST'])
@login_required
def post_vertex(vertex_type):
    doc = Vertex()
    doc.vertex_type = vertex_type
    doc.host = Host.by_current_user()
    data = {k: request.json[k] for k in doc.get_aggregate_fields() if k in request.json.keys()}
    update_document(doc, data).save()

    return doc.to_bson(), 200


@mod.route('/<vertex_type>/<id>/', methods=['PUT'])
@login_required
def put_category(vertex_type, id):
    doc = Vertex.by_id(id)
    data = {k: request.json[k] for k in doc.get_aggregate_fields() if k in request.json.keys()}
    update_document(doc, data).save()

    return jsonify(result="success"), 200  # TODO: Should be a 204


'''
Photo endpoints
'''

@mod.route('/photo/', methods=['POST'])
@login_required
def post_photo():
    # TODO: This should probably be removed and a POST to /<vertex_type> with a
    # type of "photo" used instead. See issue #122
    data = request.json
    data['host'] = Host.by_current_user()
    photo = Photo(**data).save()
    return photo.to_bson(expand=False), 200

'''
Audio endpoints
'''

@mod.route('/audio/', methods=['POST'])
@login_required
def post_audio():
    # TODO: This should probably be removed and a POST to /<vertex_type> with a
    # type of "audio" used instead. See issue #122
    data = request.json
    data['host'] = Host.by_current_user()
    audio = Audio(**data).save()
    return audio.to_bson(expand=False), 200

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
