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
    host = Host.by_current_user()
    cust = stripe.Customer.retrieve(current_user.stripe_id)
    invoices = stripe.Invoice.all(customer=current_user.stripe_id)
    return render_template("account.html", user=current_user, host=host, cust=cust, pubkey=stripe.public_key, invoices=invoices)


@mod.route('/card/new/', methods=['POST'])
@login_required
def new_card():
    cust = stripe.Customer.retrieve(current_user.stripe_id)
    cust.cards.create(card=request.form.get('stripeToken'))
    flash("Card successfully added.")
    return redirect(url_for("account.account"))


@mod.route('/card/delete/<id>', methods=['GET'])
@login_required
def delete_card(id):
    cust = stripe.Customer.retrieve(current_user.stripe_id)
    try:
        cust.cards.retrieve(id).delete()
    except:
        pass
    flash("Your card has been deleted.")
    return redirect(url_for("account.account"))


@mod.route('/invoice/<id>/', methods=['GET'])
@login_required
def get_invoice(id):
    invoice = stripe.Invoice.retrieve(id)
    return render_template("invoice.html", invoice=invoice)


@mod.route('/receipt/<id>/', methods=['GET'])
@login_required
def get_receipt(id):
    invoice = stripe.Invoice.retrieve(id)
    return render_template("receipt.html", invoice=invoice)


@mod.route('/invoice/<id>/pay/', methods=['GET'])
@login_required
def pay_invoice(id):
    invoice = stripe.Invoice.retrieve(id)
    cust = stripe.Customer.retrieve(current_user.stripe_id)

    if cust.cards.total_count < 1 :
        flash("Please add a card first.")
    else :
        invoice.closed = False
        invoice.save()
        invoice.pay()
        flash("Successfully paid!")
    return redirect(url_for("account.account"))
