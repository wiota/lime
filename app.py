import os
from flask import Flask
import lime
import newrelic.agent

if __name__ == '__main__' :
    app = lime.app
    newrelic.agent.initialize('newrelic.ini')
    port = int(os.environ.get('PORT', 5001))
    app.run(host="0.0.0.0", port=port, use_reloader=True)
