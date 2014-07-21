import os
from flask import Flask
import lime

if __name__ == '__main__' :
    app = lime.app
    port = int(os.environ.get('PORT', 5001))
    app.run(host="0.0.0.0", port=port, use_debugger=True, use_reloader=True)
