from flask import Blueprint, request, send_file, abort, send_from_directory
from flask import render_template, flash, url_for, redirect
from flask import current_app as app
from flask.ext.login import login_required
from itsdangerous import URLSafeSerializer, BadSignature
from toolbox.build_db import build_db, clear_db
from flask.ext.login import login_required
from flask.ext.login import current_user
from toolbox.tools import admin_required
from toolbox.models import User, Host, Vertex, Body, Happenings
from toolbox.email import ActionEmail
from toolbox.s3 import s3_config
from flask.ext.login import login_user
from .forms import *
import requests
import boto
import stripe
import md5
import os

mod = Blueprint(
    'admin',
    __name__,
    static_folder='static',
    template_folder='views',
    static_url_path='/static/admin',
    url_prefix='/admin')


def send_invite(user):
    s = URLSafeSerializer(app.config['SECRET_KEY'])
    payload = s.dumps(str(user.id))

    link_text = "Confirm email address"
    link_href = url_for("root.confirm", payload=payload, _external=True)
    subject = "Confirm your new Lime account!"
    content = "Clink the link below to confirm your account:"

    ActionEmail(user.email, subject, content, link_text, link_href).send()
    flash("Successfully sent invitation.")


@mod.route("/")
@admin_required
def index():
    return render_template('admin_index.html')


@mod.route("/user/")
@login_required
@admin_required
def user():
    return render_template(
        'user.html', admins=User.objects(admin=True), users=User.objects(admin=False))


@mod.route("/user/<id>/")
@login_required
@admin_required
def individual_user(id):
    stripe.api_key = app.config['STRIPE_SECRET_KEY']
    user = User.objects.get(id=id)
    host = Host.objects.get(owner=user)
    cust = stripe.Customer.retrieve(user.stripe_id)
    plans = stripe.Plan.all()
    return render_template('individual_user.html', user=user, host=host, cust=cust, plans=plans)


@mod.route("/user/<id>/login/")
@login_required
@admin_required
def login_as_user(id):
    login_user(User.objects.get(id=id, admin=False))
    return redirect(url_for("root.index"))


@mod.route("/user/<id>/invite/")
@login_required
@admin_required
def invite_user(id):
    send_invite(User.objects.get(id=id, admin=False))
    return redirect(url_for("admin.index"))


@mod.route("/user/<id>/delete/")
@login_required
@admin_required
def delete_user(id):
    return render_template(
        'delete_user_confirm.html', user=User.objects.get(id=id))


@mod.route("/user/<id>/delete/confirm/", methods=["POST"])
@login_required
@admin_required
def definitely_delete_user(id):
    user = User.objects.get(id=id)
    if user.email == request.form["email"]:
        # Delete the S3 Bucket
        conn = boto.connect_s3()
        try:
            bucket_name = '%s_%s' % (os.environ["S3_BUCKET"], user.email_hash)
            b = boto.s3.bucket.Bucket(conn, bucket_name)
            for x in b.list():
                b.delete_key(x.key)
            conn.delete_bucket(bucket_name)
        except:
            pass

        # Delete the Stripe customer
        try:
            stripe.api_key = app.config['STRIPE_SECRET_KEY']
            customer = stripe.Customer.retrieve(user.stripe_id)
            customer.delete()
        except:
            pass

        Host.objects(owner=user).delete()
        Vertex.objects(owner=user).delete()
        user.delete()
        flash("User '%s' successfully deleted" % (user.email))
        return redirect(url_for("admin.index"))
    flash("Email address is incorrect!")
    return redirect(url_for("admin.delete_user", id=id))


@mod.route("/user/<user_id>/plan/<plan_id>/add/")
@login_required
@admin_required
def add_plan(user_id, plan_id):
    stripe.api_key = app.config['STRIPE_SECRET_KEY']
    user = User.objects.get(id=user_id)
    cust = stripe.Customer.retrieve(user.stripe_id)
    if cust.cards.total_count > 0:
        cust.subscriptions.create(plan=plan_id)
    else:
        flash("The user must add a card first.")
    return redirect(url_for("admin.individual_user", id=user_id))


@mod.route("/user/<user_id>/plan/<sub_id>/remove/")
@login_required
@admin_required
def remove_plan(user_id, sub_id):
    stripe.api_key = app.config['STRIPE_SECRET_KEY']
    user = User.objects.get(id=user_id)
    cust = stripe.Customer.retrieve(user.stripe_id)
    cust.subscriptions.retrieve(sub_id).delete()

    return redirect(url_for("admin.individual_user", id=user_id))


@mod.route("/create/", methods=["GET", "POST"])
@login_required
@admin_required
def create_user():
    ref = request.args.get('ref', None)
    form = CreateForm()
    if request.method == 'GET':
        return render_template("create_user.html", form=form, ref=ref)
    if form.validate_on_submit():
        email_hash = md5.new(form.email.data.strip().lower()).hexdigest()
        user = User(email=form.email.data, email_hash=email_hash)
        hostname = form.hostname.data

        # Create a stripe customer
        stripe.api_key = app.config['STRIPE_SECRET_KEY']
        customer = stripe.Customer.create(email=user.email)
        user.stripe_id = customer.id

        # Create the Body apex
        body = Body(owner=user.id)
        body.save()

        # Create the Happening apex
        happenings = Happenings(owner=user.id)
        happenings.save()

        user.save()

        # Create the S3 stuff
        conn = boto.connect_s3()
        bucket_name = '%s_%s' % (os.environ["S3_BUCKET"], email_hash)
        bucket = conn.create_bucket(bucket_name)
        s3_conf = s3_config()
        bucket.set_policy(s3_conf.get_policy(email_hash))
        bucket.set_cors_xml(s3_conf.get_cors())

        # Create the host
        host = Host(hostname=hostname, template=hostname, bucketname=bucket_name, owner=user.id)
        host.save()

        if form.send_invite.data:
            send_invite(user)
        else:
            flash("Successfully created user.")
        return redirect(url_for("admin.create_user"))
    return render_template("create_user.html", form=form, ref=ref)


@mod.route('/build_db/')
@login_required
def rebuild():
    ''' This is a temporary endpoint, only for the testuser! '''
    if current_user.email == "test@test.com":
        build_db(current_user)
        return "Success."
    return "Not allowed."


@mod.route('/clear_db/')
@login_required
def clear():
    ''' This is a temporary endpoint, only for the testuser! '''
    if current_user.email == "test@test.com":
        clear_db(current_user)
        return "Success."
    return "Not allowed."
