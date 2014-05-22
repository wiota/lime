import datetime
from bson.objectid import ObjectId
from flask import jsonify
from mongoengine.queryset import QuerySet
from mongoengine import Document


def bson_encode(obj):
    """Encodes BSON-specific elements to jsonify-able strings"""
    if isinstance(obj, (datetime.datetime, datetime.date)):
        return obj.isoformat()
    elif isinstance(obj, ObjectId):
        return unicode(obj)
    elif isinstance(obj, list):
        return [bson_encode(x) for x in obj]
    elif not isinstance(obj, dict):
        return obj
    return dict((str(k), bson_encode(v))
                for k, v in obj.items())


def bsonify(*args, **kwargs):
    """ jsonify with support for MongoDB BSON objects
        such as datetime and ObjectId
    """
    ret = bson_encode(kwargs)
    return jsonify(args, **ret)


def to_dict(ret, deref_list=[]):
    """ Converts MongoEngine result to a dict, while dereferencing
        the fields provided
    """
    retdict = ret.to_mongo().to_dict()
    for ref in deref_list:
        if isinstance(ret._data[ref], list):
            retdict[ref] = [x.to_mongo().to_dict() for x in ret._data[ref]]
        else:
            retdict[ref] = ret._data[ref].to_mongo().to_dict()
    return retdict


def make_response(ret):
    """ Wraps a dictionary into a response dictionary for the API endpoint to
        return as BSON.
    """
    return {"result": ret}

#### MongoEngine Extensions ####


def queryset_to_bson(self):
    """ Converts a QuerySet into a wrapped BSON response.
    """
    return bsonify(**make_response(self.to_dict()))


def queryset_to_dict(self):
    """ Converts the elements in a QuerySet into dictionaries
    """
    return [x.to_dict(expand=False) for x in self]


def document_to_bson(self):
    """ Converts a Document into a wrapped BSON response.
    """
    return bsonify(**make_response(self.to_dict()))


def document_to_dict(self, expand=True):
    """ Converts a document into a dictionary, expanding fields as supplied.
    """
    expand_fields = self._expand_fields if expand else []
    return to_dict(self.select_related(), expand_fields)

setattr(QuerySet, 'to_bson', queryset_to_bson)
setattr(QuerySet, 'to_dict', queryset_to_dict)
setattr(Document, 'to_bson', document_to_bson)
setattr(Document, 'to_dict', document_to_dict)
