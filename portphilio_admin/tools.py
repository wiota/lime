import datetime
from bson.objectid import ObjectId
from flask import jsonify


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
        retdict[ref] = [x.to_mongo().to_dict() for x in ret._data[ref]]
    return retdict
