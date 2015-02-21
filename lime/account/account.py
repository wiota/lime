from flask import Blueprint
from flask import current_app as app
from flask import render_template, request, redirect, url_for, flash
from flask.ext.login import login_required
from flask.ext.login import current_user, login_user
from toolbox.models import User, Host
import stripe

mod = Blueprint('account', __name__, static_folder='static', template_folder='views', static_url_path='/static/account', url_prefix='/account')


def current_stripe_customer():
    return stripe.Customer.retrieve(current_user.stripe_id)

def get_stripe_invoice(invoice_id):
    return stripe.Invoice.retrieve(invoice_id)

def get_all_stripe_invoices():
    return stripe.Invoice.all(customer=current_user.stripe_id)


@mod.route('/')
@login_required
def account():
    return render_template("account.html", user=current_user, host=Host.by_current_user(), cust=current_stripe_customer(), pubkey=stripe.public_key, invoices=get_all_stripe_invoices())


@mod.route('/card/new/', methods=['POST'])
@login_required
def new_card():
    cust = current_stripe_customer()
    cust.cards.create(card=request.form.get('stripeToken'))
    flash("Card successfully added.")
    return redirect(url_for("account.account"))


@mod.route('/card/delete/<id>', methods=['GET'])
@login_required
def delete_card(id):
    cust = current_stripe_customer()
    try:
        cust.cards.retrieve(id).delete()
    except:
        pass
    flash("Your card has been deleted.")
    return redirect(url_for("account.account"))


@mod.route('/invoice/<invoice_id>/', methods=['GET'])
@login_required
def get_invoice(invoice_id):
    return render_template("invoice.html", invoice=get_stripe_invoice(invoice_id))


@mod.route('/receipt/<invoice_id>/', methods=['GET'])
@login_required
def get_receipt(invoice_id):
    return render_template("receipt.html", invoice=get_stripe_invoice(invoice_id))


@mod.route('/invoice/<invoice_id>/pay/', methods=['GET'])
@login_required
def pay_invoice(invoice_id):
    invoice = get_stripe_invoice(invoice_id)
    cust = current_stripe_customer()

    if cust.cards.total_count < 1 :
        flash("Please add a card first.")
    else :
        invoice.closed = False
        invoice.save()
        invoice.pay()
        flash("Successfully paid!")
    return redirect(url_for("account.account"))
