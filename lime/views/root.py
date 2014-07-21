from flask import Blueprint, request, redirect, render_template, url_for, flash

from toolbox.models import *
from toolbox.tools import retrieve_image
from toolbox.s3 import s3_config
from flask.ext.login import LoginManager
from flask.ext.login import login_required, login_user, logout_user, current_user
from flask.ext.wtf import Form
from wtforms import TextField, PasswordField, BooleanField
from wtforms.validators import Required, Email, EqualTo
from werkzeug import check_password_hash, generate_password_hash
from itsdangerous import URLSafeSerializer, BadSignature

from flask import current_app as app
import boto
import os

mod = Blueprint('root', __name__, template_folder='templates')

@mod.route('/')
@login_required
def index():
    return render_template('index.html')

@mod.route('/image/<image_name>')
def image(image_name):
   return retrieve_image(image_name, current_user.username)

@mod.route("/login/", methods=["GET", "POST"])
def login():
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
    flash("Invalid credentials, please try again")
    return render_template("login.html", form=form, ref=ref)


@mod.route("/logout/")
def logout():
    logout_user()
    flash("You have been logged out.")
    return redirect("/login/")


@mod.route('/confirm/', methods=['GET', 'POST'])
@mod.route('/confirm/<payload>', methods=['GET', 'POST'])
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
            return redirect(url_for("admin.index"))
    if form.validate_on_submit():
        user = User.objects.get(id=current_user.id)
        user.username=form.username.data
        user.password=generate_password_hash(form.password.data)

        # Create the body
        #TODO: Body doesn't need a slug or title
        body = Body(owner=user.id, slug="", title="")
        body.save()

        # Create the S3 stuff
        conn = boto.connect_s3()
        bucket_name ='%s_%s' % (os.environ["S3_BUCKET"], user.username)
        bucket = conn.create_bucket(bucket_name)
        s3_conf = s3_config()
        bucket.set_policy(s3_conf.get_policy(user.username))
        bucket.set_cors_xml(s3_conf.get_cors())

        # Create the host
        # TODO: Where does the hostname get set?
        host = Host(hostname="foo.com", bucketname=bucket_name, owner=user.id)
        host.save()

        user.save()
        return redirect(url_for("root.index"))
    return render_template("confirm.html", form=form)


class LoginForm(Form):
    username = TextField('Username or Email', [Required()])
    password = PasswordField('Password', [Required()])

    def __init__(self, *args, **kwargs):
        Form.__init__(self, *args, **kwargs)
        self.user = None

    def validate(self):
        try:
            user = User.objects.get(Q(username=self.username.data) | Q(email=self.username.data))
        except Exception:
            return False

        if not check_password_hash(user.password, self.password.data):
            return False

        self.user = user
        return True


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


class RegisterForm(Form):
    username = TextField('Username', [Required()])
    email = TextField('Email address', [Required(), Email()])
    password = PasswordField('Password', [Required()])
    confirm = PasswordField('Repeat Password', [
        Required(),
        EqualTo('password', message='Passwords must match')
    ])
    admin = BooleanField('Check if admin', [Required()])

    def __init__(self, *args, **kwargs):
        Form.__init__(self, *args, **kwargs)
        self.user = None

    def validate(self):
        if User.objects(username=self.username.data).first() is not None:
            flash("Username is already taken")
            return False
        if User.objects(email=self.email.data).first() is not None:
            flash("This email address already has an account")
            return False
        return True


@mod.route('/register/', methods=['GET', 'POST'])
def register():
    """
    Registration Form
    """
    form = RegisterForm()
    if form.validate_on_submit():
        # create an user instance not yet stored in the database
        user = User(username=form.username.data, email=form.email.data,
                    password=generate_password_hash(form.password.data),
                    admin=form.admin.data)
        # Insert the record in our database and commit it
        user.save()

        # Log the user in, as he now has an id
        login_user(user)

        # flash will display a message to the user
        flash('Thanks for registering')
        # redirect user to the 'home' method of the user module.
        return redirect(url_for('admin.index'))
    return render_template("register.html", form=form)
