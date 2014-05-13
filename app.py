import os
from flask import Flask
import portphilio_admin

if __name__ == '__main__' :
    app = portphilio_admin.app
    port = int(os.environ.get('PORT', 5001))
    app.run(host="0.0.0.0", port=port, use_debugger=True, use_reloader=True)
