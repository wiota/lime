from flask import flash
from flask.ext.wtf import Form
from wtforms import TextField, PasswordField, BooleanField, SubmitField
from wtforms.validators import Required, Email, EqualTo
from werkzeug import check_password_hash, generate_password_hash
from toolbox.models import User
from mongoengine.queryset import Q


class ForgotPasswordForm(Form):
    email = TextField('Email address', [Required(), Email()])
    submit = SubmitField('Reset password')

    def __init__(self, *args, **kwargs):
        Form.__init__(self, *args, **kwargs)
        self.user = None

    def validate(self):
        if User.objects(email=self.email.data).first() is None:
            flash("This email address is not in the system.")
            return False
        return True


class LoginForm(Form):
    username = TextField('Username or Email', [Required()])
    password = PasswordField('Password', [Required()])
    submit = SubmitField('Login')

    def __init__(self, *args, **kwargs):
        Form.__init__(self, *args, **kwargs)
        self.user = None

    def validate(self):
        try:
            user = User.objects.get(
                Q(username=self.username.data) | Q(email=self.username.data))
        except User.DoesNotExist:
            flash("Username or email does not exist, please try again.")
            return False

        if not user.confirmed:
            flash("Account not yet confirmed. Check your email. ")
            return False

        if not check_password_hash(user.password, self.password.data):
            flash("Invalid password, please try again.")
            return False

        self.user = user
        return True


class ResetPasswordForm(Form):
    password = PasswordField('Password', [Required()])
    confirm = PasswordField('Repeat Password', [
        Required(),
        EqualTo('password', message='Passwords must match')
    ])
    submit = SubmitField('Reset password')

    def __init__(self, *args, **kwargs):
        Form.__init__(self, *args, **kwargs)
        self.user = None

    def validate(self):
        if self.password.data == self.confirm.data:
            return True
        return False


class ConfirmForm(Form):
    username = TextField('Choose a username', [Required()])
    password = PasswordField('Password', [Required()])
    confirm = PasswordField('Repeat Password', [
        Required(),
        EqualTo('password', message='Passwords must match')
    ])
    submit = SubmitField('Register')

    def __init__(self, *args, **kwargs):
        Form.__init__(self, *args, **kwargs)
        self.user = None

    def validate(self):
        if User.objects(username=self.username.data).first() is not None:
            flash("Username is already taken")
            return False
        return True
