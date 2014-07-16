from flask import Blueprint
from flask import current_app as app
from flask import render_template
from flask.ext.login import login_required
from flask.ext.login import current_user

mod = Blueprint('account', __name__, static_folder='static', template_folder='templates', static_url_path='/static/account')

@mod.route('/account/')
@login_required
def account():
    return "Account"
