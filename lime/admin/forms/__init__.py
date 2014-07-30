from flask import flash
from flask.ext.wtf import Form
from wtforms import TextField
from wtforms.validators import Required, Email
from toolbox.models import User


class InviteForm(Form):
    email = TextField('Email address', [Required(), Email()])

    def __init__(self, *args, **kwargs):
        Form.__init__(self, *args, **kwargs)
        self.user = None

    def validate(self):
        if User.objects(email=self.email.data).first() is not None:
            flash("This email address already has an account")
            return False
        return True
