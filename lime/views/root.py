from flask import Blueprint, request, redirect, render_template, url_for, flash

from toolbox.models import *
from toolbox.tools import retrieve_image
from toolbox.s3 import s3_config
from toolbox.email import *
from toolbox.nocache import nocache
from flask.ext.login import LoginManager
from flask.ext.login import login_required, login_user, logout_user, current_user
from flask.ext.wtf import Form
from wtforms import TextField, PasswordField, BooleanField
from wtforms.validators import Required, Email, EqualTo
from werkzeug import check_password_hash, generate_password_hash
from itsdangerous import URLSafeSerializer, BadSignature

from flask import current_app as app
import requests
import boto
import os
import stripe

mod = Blueprint('root', __name__, template_folder='templates')


@mod.route('/', methods=["GET", "POST"])
@nocache
def index():
    if current_user.is_authenticated():
        return render_template('index.html')
    ref = request.args.get('next', None)
    form = LoginForm()
    if request.method == 'GET':
        return render_template("login.html", form=form, ref=ref)
    if form.validate_on_submit():
        # login and validate the user...
        user = User.objects.get(id=form.user.id)
        login_user(user)
        flash("Logged in successfully.")
        return redirect(request.values.get("next") or url_for("admin.index"))
    return render_template("login.html", form=form, ref=ref)


@mod.route('/image/<image_name>')
def image(image_name):
    return retrieve_image(image_name, current_user.username)


@mod.route("/logout/")
@nocache
def logout():
    logout_user()
    flash("You have been logged out.")
    return redirect(url_for("root.index"))


@mod.route("/forgot-password/", methods=['GET', 'POST'])
@nocache
def forgot_password():
    form = ForgotPasswordForm()
    if request.method == 'GET':
        return render_template("forgot_password.html", form=form)
    if form.validate_on_submit():
        user = User.objects.get(email=form.email.data)

        s = URLSafeSerializer(app.config['SECRET_KEY'])
        payload = s.dumps(str(user.id))
        link = url_for("root.reset_password", payload=payload, _external=True)

        subject = "Forgotten password reset"
        html = render_template("forgot_password_email.html", link=link)

        send_email(user.email, subject, html)
        flash("Reset sent. Check your email.")
    return render_template("forgot_password.html", form=form)


@mod.route("/reset-password/", methods=['GET', 'POST'])
@mod.route("/reset-password/<payload>", methods=['GET', 'POST'])
@nocache
def reset_password(payload=None):
    form = ResetPasswordForm()
    if request.method == 'GET':
        s = URLSafeSerializer(app.config['SECRET_KEY'])
        try:
            user_id = s.loads(payload)
        except BadSignature:
            abort(404)

        user = User.objects.get(id=user_id)
        login_user(user)
        return render_template("reset_password.html", form=form)
    if form.validate_on_submit():
        user = User.objects.get(id=current_user.id)
        user.password = generate_password_hash(form.password.data)
        user.save()
        return redirect(url_for("root.index"))
    flash("Passwords must match.")
    return render_template("reset_password.html", form=form)


@mod.route('/confirm/', methods=['GET', 'POST'])
@mod.route('/confirm/<payload>', methods=['GET', 'POST'])
@nocache
def confirm(payload=None):
    ''' This is where user creation lives, for now...
    '''
    # TODO: Get this out of here!
    form = ConfirmForm()
    if request.method == 'GET':
        s = URLSafeSerializer(app.config['SECRET_KEY'])
        try:
            user_id = s.loads(payload)
        except BadSignature:
            abort(404)

        user = User.objects.get(id=user_id)
        login_user(user)
        if not user.confirmed:
            user.activate()
            flash("Your email has been verified.")
            return render_template("confirm.html", form=form)
        else:
            return redirect(url_for("root.index"))
    if form.validate_on_submit():
        user = User.objects.get(id=current_user.id)
        user.username = form.username.data
        user.password = generate_password_hash(form.password.data)

        # Create a stripe customer
        stripe.api_key = app.config['STRIPE_API_KEY']
        customer = stripe.Customer.create(email=user.email)
        user.stripe_id = customer.id

        # Create the body
        # TODO: Body doesn't need a slug or title
        body = Body(owner=user.id, slug="", title="")
        body.save()

        # Create the S3 stuff
        conn = boto.connect_s3()
        bucket_name = '%s_%s' % (os.environ["S3_BUCKET"], user.username)
        bucket = conn.create_bucket(bucket_name)
        s3_conf = s3_config()
        bucket.set_policy(s3_conf.get_policy(user.username))
        bucket.set_cors_xml(s3_conf.get_cors())

        # Create the host
        host = Host(bucketname=bucket_name, owner=user.id)
        host.save()

        user.save()
        return redirect(url_for("root.index"))
    return render_template("confirm.html", form=form)


class ForgotPasswordForm(Form):
    email = TextField('Email address', [Required(), Email()])

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

    def __init__(self, *args, **kwargs):
        Form.__init__(self, *args, **kwargs)
        self.user = None

    def validate(self):
        try:
            user = User.objects.get(
                Q(username=self.username.data) | Q(email=self.username.data))
        except Exception:
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

    def __init__(self, *args, **kwargs):
        Form.__init__(self, *args, **kwargs)
        self.user = None

    def validate(self):
        if self.password.data == self.confirm.data:
            return True
        return False


class ConfirmForm(Form):
    username = TextField('Username', [Required()])
    password = PasswordField('Password', [Required()])
    confirm = PasswordField('Repeat Password', [
        Required(),
        EqualTo('password', message='Passwords must match')
    ])

    def __init__(self, *args, **kwargs):
        Form.__init__(self, *args, **kwargs)
        self.user = None

    def validate(self):
        if User.objects(username=self.username.data).first() is not None:
            flash("Username is already taken")
            return False
        return True
