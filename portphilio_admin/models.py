from portphilio_admin import db
from flask_login import UserMixin
from mongoengine import *
import bson


class User(Document, UserMixin):
    id = ObjectIdField(
        primary_key=True,
        default=lambda: bson.ObjectId())
    email = EmailField(required=True)
    username = StringField(required=True, max_length=50)
    password = StringField(required=True)
    admin = BooleanField(default=False)

    meta = {'allow_inheritance': True}

    def is_authenticated(self):
        return True

    def is_active(self):
        return True

    def is_anonymous(self):
        return False


class Client(User):
    hostname = StringField(required=True)

class Administrator(User):
    admin = BooleanField(default=True)
