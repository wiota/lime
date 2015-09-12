import unittest
import pytest
import json

def _post_json(app, endpoint, data):
    prefix = "/api/v1"
    response = app.post(
        "{}{}".format(prefix, endpoint),
        data=json.dumps(data),
        content_type='application/json'
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
