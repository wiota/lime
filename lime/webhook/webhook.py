from flask import Blueprint
from flask import current_app as app
from flask import render_template
from flask import request
from flask import url_for
from flask.ext.login import login_required
from flask.ext.login import current_user
from toolbox.models import User, Host
from toolbox.email import StripeEmail, ReceiptEmail
from time import strftime, localtime
import stripe
from toolbox.template_tools import format_date

mod = Blueprint('webhook', __name__, template_folder='views', url_prefix='/webhook')


@mod.route('/stripe/', methods=['POST'])
def stripe_hook():
    if request.json["livemode"] or app.debug:
        StripeEmail(request.json).send()
    stripe.api_key = app.config['STRIPE_SECRET_KEY']
    e = stripe.Event.retrieve(request.json["id"])
    if e["type"] == "invoice.created" :
        user = User.objects.get(stripe_id=e["data"]["object"]["customer"])
        invoice = stripe.Invoice.retrieve(e["data"]["object"]["id"])
        if not invoice.paid :
            # This is a manual invoice, close it so it can be paid later
            invoice.closed = True
            invoice.save()
            link = url_for("account.get_invoice", id=invoice.id, _external=True)
            BillingEmail(user.email, invoice, e, link).send()
    elif e["type"] == "invoice.payment_succeeded" :
        user = User.objects.get(stripe_id=e["data"]["object"]["customer"])
        invoice = stripe.Invoice.retrieve(e["data"]["object"]["id"])
        link = url_for("account.get_receipt", id=invoice.id, _external=True)
        ReceiptEmail(user.email, invoice, e, link).send()
    return '', 200
