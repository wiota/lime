from flask import Blueprint, request, send_file, abort, send_from_directory
from flask import render_template, flash, url_for, redirect
from flask import current_app as app
from flask.ext.login import login_required
from flask.ext.wtf import Form
from wtforms import TextField
from itsdangerous import URLSafeSerializer, BadSignature
from wtforms.validators import Required, Email
from toolbox.build_db import build_db, clear_db
from flask.ext.login import login_required
from flask.ext.login import current_user
from toolbox.tools import admin_required
from toolbox.models import User, Host, Vertex
from flask.ext.login import login_user
import requests

import os

mod = Blueprint('admin', __name__, static_folder='static', template_folder='templates/admin', static_url_path='/static/admin', url_prefix='/admin')


@mod.route("/")
@admin_required
def index():
    return render_template('admin.html')

@mod.route("/users/")
@login_required
@admin_required
def users():
    return render_template('users.html', admins=User.objects(admin=True), users=User.objects(admin=False))

@mod.route("/users/login/<id>/")
@login_required
@admin_required
def login_as_user(id):
    login_user(User.objects.get(id=id))
    return redirect(url_for("root.index"))

@mod.route("/users/delete/<id>/")
@login_required
@admin_required
def delete_user(id):
    return render_template('delete_user_confirm.html', user=User.objects.get(id=id))

@mod.route("/users/delete/<id>/confirm/")
@login_required
@admin_required
def definitely_delete_user(id):
    owner = User.objects.get(id=id)
    Host.objects(owner=owner).delete()
    Vertex.objects(owner=owner).delete()
    owner.delete()
    flash("User '%s' successfully deleted" % (owner.username))
    return redirect(url_for("admin.index"))

@mod.route("/invite/", methods=["GET", "POST"])
@login_required
@admin_required
def invite():
    ref = request.args.get('ref', None)
    form = InviteForm()
    if request.method == 'GET':
        return render_template("invite.html", form=form, ref=ref)
    if form.validate_on_submit():
        user = User(email=form.email.data)

        s = URLSafeSerializer(app.config['SECRET_KEY'])
        payload = s.dumps(str(user.id))
        link = url_for("root.confirm", payload=payload, _external=True)

        user.save()

        # TODO: Move this somewhere nicer
        url = "https://api.sendgrid.com/api/mail.send.json"
        payload = {
            "api_user" : os.environ['SENDGRID_USERNAME'],
            "api_key" : os.environ['SENDGRID_PASSWORD'],
            "to" : user.email,
            "from" : "goaheadandreply@wiota.co",
            "fromname" : "Wiota Co.",
            "subject" : "Confirm your new Lime account!",
            "html" : render_template("confirm_email.html", link=link)
        }
        r = requests.post(url, data=payload)

        flash("Successfully sent invitation.")
        return redirect(url_for("admin.invite"))
    return render_template("invite.html", form=form, ref=ref)



# This is a temporary endpoint, only for the testuser!
@mod.route('/build_db/')
@login_required
def rebuild():
    if current_user.username == "testuser":
        build_db(current_user.username)
        return "Success."
    return "Not allowed."

# This is a temporary endpoint
@mod.route('/clear_db/')
@login_required
def clear():
    clear_db(current_user.username)
    return "Success"


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


