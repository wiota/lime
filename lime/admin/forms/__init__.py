from flask import flash
from flask.ext.wtf import Form
from wtforms import TextField, BooleanField, SubmitField
from wtforms.validators import Required, Email
from toolbox.models import User


class CreateForm(Form):
    email = TextField('Email address', [Required(), Email()])
    hostname = TextField('Hostname', [Required()])
    send_invite = BooleanField('Send invitation email?', [Required()])
    submit = SubmitField('Submit')

    def __init__(self, *args, **kwargs):
        Form.__init__(self, *args, **kwargs)
        self.user = None

    def validate(self):
        if User.objects(email=self.email.data).first() is not None:
            flash("This email address already has an account")
            return False
        return True
