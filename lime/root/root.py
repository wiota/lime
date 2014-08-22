from flask import Blueprint, request, redirect, render_template, url_for, flash, session

from toolbox.models import *
from toolbox.tools import retrieve_image
from toolbox.email import ActionEmail
from toolbox.nocache import nocache
from flask.ext.login import LoginManager
from flask.ext.login import login_required, login_user, logout_user, current_user
from itsdangerous import URLSafeSerializer, BadSignature
from .forms import *

from flask import current_app as app
import requests
import boto
import os
import stripe

mod = Blueprint('root', __name__, template_folder='views')


@mod.route('/', methods=["GET"])
@nocache
def index():
    if current_user.is_authenticated():
        return render_template('index.html')
    return render_template("login.html", form=LoginForm(), ref=request.args.get('next', None))

@mod.route('/', methods=["POST"])
@nocache
def post_index():
    form = LoginForm()
    ref = request.values.get('next', None)
    if form.validate_on_submit():
        # login and validate the user...
        user = User.objects.get(id=form.user.id)
        login_user(user)
        flash("Logged in successfully.")
        if user.admin :
            return redirect(url_for("admin.index"))
        return redirect(ref or url_for("root.index"))
    return render_template("login.html", form=form, ref=ref)


@mod.route('/image/<image_name>')
def image(image_name):
    return retrieve_image(image_name, current_user.email_hash)


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
        if not user.registered:
            flash("Please register first.")
            return redirect(url_for("root.index"))

        s = URLSafeSerializer(app.config['SECRET_KEY'])
        payload = s.dumps(str(user.id))
        link_href = url_for("root.reset_password", payload=payload, _external=True)
        link_text = "Reset password"
        subject = "Forgotten password reset"
        content = "Click the link below to reset your password:"

        ActionEmail(user.email, subject, content, link_text, link_href).send()
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
        if not user.registered:
            user.activate()
            flash("Your email has been verified.")
            session["user_id"] = user_id
            return render_template("confirm.html", form=form)
        else:
            return redirect(url_for("root.index"))
    if form.validate_on_submit():
        user = User.objects.get(id=session["user_id"])
        user.password = generate_password_hash(form.password.data)

        user.registered = True
        user.save()
        login_user(user)
        return redirect(url_for("root.index"))
    return render_template("confirm.html", form=form)
