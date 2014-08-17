from flask import Blueprint
from flask import current_app as app
from flask import render_template, request, redirect, url_for, flash
from flask.ext.login import login_required
from flask.ext.login import current_user, login_user
from toolbox.models import User, Host
import stripe

mod = Blueprint('account', __name__, static_folder='static', template_folder='views', static_url_path='/static/account', url_prefix='/account')


@mod.route('/')
@login_required
def account():
    stripe.api_key = app.config['STRIPE_SECRET_KEY']
    user = User.objects.get(id=current_user.id)
    host = Host.objects.get(owner=user)
    cust = stripe.Customer.retrieve(user.stripe_id)
    invoices = stripe.Invoice.all(customer=user.stripe_id)
    pubkey = app.config['STRIPE_PUBLIC_KEY']
    return render_template("account.html", user=user, host=host, cust=cust, pubkey=pubkey, invoices=invoices)


@mod.route('/card/new/', methods=['POST'])
@login_required
def new_card():
    stripe.api_key = app.config['STRIPE_SECRET_KEY']
    user = User.objects.get(id=current_user.id)
    cust = stripe.Customer.retrieve(user.stripe_id)
    cust.cards.create(card=request.form.get('stripeToken'))
    return redirect(url_for("account.account"))

@mod.route('/card/delete/<id>', methods=['GET'])
@login_required
def delete_card(id):
    stripe.api_key = app.config['STRIPE_SECRET_KEY']
    user = User.objects.get(id=current_user.id)
    cust = stripe.Customer.retrieve(user.stripe_id)
    try:
        cust.cards.retrieve(id).delete()
    except:
        pass
    return redirect(url_for("account.account"))

@mod.route('/invoice/<id>/', methods=['GET'])
def get_invoice(id):
    stripe.api_key = app.config['STRIPE_SECRET_KEY']
    invoice = stripe.Invoice.retrieve(id)
    user = User.objects.get(stripe_id=invoice.customer)
    login_user(user)
    return render_template("invoice.html", invoice=invoice)

@mod.route('/receipt/<id>/', methods=['GET'])
def get_receipt(id):
    stripe.api_key = app.config['STRIPE_SECRET_KEY']
    invoice = stripe.Invoice.retrieve(id)
    user = User.objects.get(stripe_id=invoice.customer)
    login_user(user)
    return render_template("receipt.html", invoice=invoice)

@mod.route('/invoice/<id>/pay/', methods=['GET'])
@login_required
def pay_invoice(id):
    stripe.api_key = app.config['STRIPE_SECRET_KEY']
    invoice = stripe.Invoice.retrieve(id)
    invoice.closed = False
    invoice.save()
    invoice.pay()
    flash("Successfully paid!")
    return redirect(url_for("account.account"))
