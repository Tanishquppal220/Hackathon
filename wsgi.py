import sys
import os

# Add your project directory to the sys.path
project_home = '/home/Tanishquppal2200/Hackathon'
if project_home not in sys.path:
    sys.path.append(project_home)

# Set the environment variable for the Flask app
os.environ['FLASK_APP'] = 'app.py'

# Import the Flask app
from app import app as application
