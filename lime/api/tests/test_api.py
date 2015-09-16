import unittest
import pytest
import json
from random import shuffle


def _post_json(app, endpoint, data):
    prefix = "/api/v1"
    response = app.post(
        "{}{}".format(prefix, endpoint),
        data=json.dumps(data),
        content_type='application/json'
    )
    result = json.loads(response.data)['result']
    return response, result


def _put_json(app, endpoint, data):
    prefix = "/api/v1"
    response = app.put(
        "{}{}".format(prefix, endpoint),
        data=json.dumps(data),
        content_type='application/json'
    )
    result = json.loads(response.data)['result']
    return response, result


def _delete_json(app, endpoint, data):
    prefix = "/api/v1"
    response = app.delete(
        "{}{}".format(prefix, endpoint),
        data=json.dumps(data),
        content_type='application/json'
    )
    result = json.loads(response.data)['result']
    return response, result


def _get_json(app, endpoint):
    prefix = "/api/v1"
    response = app.get(
        "{}{}".format(prefix, endpoint),
        #content_type='application/json'
    )
    result = json.loads(response.data)['result']
    return response, result


class AuthenticatedUser(object):
    def __init__(self, mongo_user):
        self.id = mongo_user.id
    def is_authenticated(self):
        return True

class APITestCase(unittest.TestCase):

    def setUp(self):
        from mongoengine import connection
        import mongomock
        connection._connections['default'] = mongomock.MongoClient()
        connection._connection_settings['default'] = {
            'name': None,
            'username': None,
            'password': None,
            'authentication_source': None,
        }

        import os
        os.environ['SECRET_KEY'] = "SECRET_KEY"

        import lime
        from flask.ext.mongoengine import MongoEngine
        lime.db = MongoEngine(lime.app)
        lime.app.debug = True

        import toolbox
        testuser = toolbox.models.User(email="testuser@testuser.com")
        testuser.save()
        testhost = toolbox.models.Host(bucketname="testbucket", hostname="testhost.com", owners=[testuser])
        testhost.save()

        auth_user = AuthenticatedUser(testuser)
        lime.api.current_user = auth_user
        toolbox.models.current_user = auth_user
        self.app = lime.app.test_client()

    def tearDown(self):
        pass

    def test_create_vertex(self):
        data = {
            "title": "testing",
            "vertex_type": "text"
        }
        response, result = _post_json(self.app, '/text/', data)
        assert response.status_code == 200
        assert all(item in result.items() for item in data.items())


    def test_delete_edge(self):
        # Create four vertices
        response, v1 = _post_json(self.app, '/text/', {
            "title": "v1",
            "vertex_type": "text"
        })
        response, v2 = _post_json(self.app, '/text/', {
            "title": "v2",
            "vertex_type": "text"
        })
        response, v3 = _post_json(self.app, '/text/', {
            "title": "v3",
            "vertex_type": "text"
        })
        response, v4 = _post_json(self.app, '/text/', {
            "title": "v3",
            "vertex_type": "text"
        })

        children = [v2, v3, v4]

        # Put v2-v4 in the succset of v1
        for v in children:
            response, res = _post_json(self.app, '/edge/', {
                'edges': [v1['_id'], v['_id']]
            })

        # Get the updated parent vertex
        response, v1 = _get_json(self.app, '/text/{}/'.format(v1['_id']))

        # Extract the succset IDs
        succset = [v['_id'] for v in v1['succset']]

        # All children got added
        assert set(succset) == set([v['_id'] for v in children])

        # Reorder succset
        shuffle(succset)

        response, res = _put_json(
            self.app,
            '/text/{}/succset/'.format(v1['_id']),
            data={
                'succset': succset
            }
        )

        # Get the updated parent vertex
        response, v1 = _get_json(self.app, '/text/{}/'.format(v1['_id']))

        # Extract the succset IDs
        new_succset = [v['_id'] for v in v1['succset']]

        # The reordering worked
        succset == new_succset

        # Delete an edge
        response, res = _delete_json(self.app, '/edge/', data={
            'edges': [v1['_id'], v2['_id']]
        })

        # Get the updated parent vertex
        response, v1 = _get_json(self.app, '/text/{}/'.format(v1['_id']))

        # Extract the succset IDs
        final_succset = [v['_id'] for v in v1['succset']]

        assert len(final_succset) == 2
        assert v2['_id'] not in final_succset
