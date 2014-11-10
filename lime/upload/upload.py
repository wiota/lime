from flask import Blueprint
from flask import Flask, request, Response
from flask import current_app as app
from hashlib import sha1
from flask.ext.login import login_required
from flask.ext.login import current_user
from toolbox.models import *
import time, os, json, base64, hmac, urllib

mod = Blueprint( 'upload', __name__, url_prefix='/upload')


# Listen for GET requests to yourdomain.com/sign_s3/
@mod.route('/sign_s3/')
@login_required
def sign_s3():
    # Load necessary information into the application:
    AWS_ACCESS_KEY = os.environ.get('AWS_ACCESS_KEY_ID')
    AWS_SECRET_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
    S3_BUCKET = Host.by_current_user().bucketname

    # Collect information on the file from the GET parameters of the request:
    object_name = urllib.quote_plus(request.args.get('s3_object_name'))
    mime_type = request.args.get('s3_object_type')

    # Set the expiry time of the signature (in seconds) and declare the
    # permissions of the file to be uploaded
    expires = int(time.time() + 600)
    amz_headers = "x-amz-acl:public-read"

    # Generate the PUT request that JavaScript will use:
    put_request = "PUT\n\n%s\n%d\n%s\n/%s/%s" % (
        mime_type, expires, amz_headers, S3_BUCKET, object_name)

    # Generate the signature with which the request can be signed:
    signature = base64.encodestring(
        hmac.new(
            AWS_SECRET_KEY,
            put_request,
            sha1).digest())
    # Remove surrounding whitespace and quote special characters:
    signature = urllib.quote_plus(signature.strip())

    # Build the URL of the file in anticipation of its imminent upload:
    url = 'https://s3.amazonaws.com/%s/%s' % (S3_BUCKET, object_name)

    content = json.dumps({
        'signed_request': '%s?AWSAccessKeyId=%s&Expires=%d&Signature=%s' % (url, AWS_ACCESS_KEY, expires, signature),
        'url': url
    })

    # Return the signed request and the anticipated URL back to the browser in
    # JSON format:
    return Response(content, mimetype='text/plain; charset=x-user-defined')
