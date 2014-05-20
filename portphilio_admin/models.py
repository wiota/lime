from portphilio_admin import db
from flask_login import UserMixin
import mongoengine
import bson


class User(db.Document, UserMixin):
    id = mongoengine.ObjectIdField(
        primary_key=True,
        default=lambda: bson.ObjectId())
    email = db.EmailField(required=True)
    username = db.StringField(required=True, max_length=50)
    password = db.StringField(required=True)

    def is_authenticated(self):
        return True

    def is_active(self):
        return True

    def is_anonymous(self):
        return False
