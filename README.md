# TaxGuru Installation

1. Create and activate a virtual environment:

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
```

2. Install the required dependencies:

```bash
pip install -r requirements.txt
```

3. Set up environment variables:

Create a `.env` file in the root directory and add the necessary environment variables. For example:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

4. Run the Flask application:

```bash
flask run
```

# Deployment on PythonAnywhere

To deploy this Flask application on PythonAnywhere, follow these steps:

1. **Create a new web app**:
   - Log in to your PythonAnywhere account.
   - Go to the "Web" tab and click "Add a new web app".
   - Choose "Manual configuration" and select "Flask" as the framework.

2. **Set up the virtual environment**:
   - In the "Virtualenv" section, create a new virtual environment if you don't already have one.
   - Activate the virtual environment and install the required dependencies:

   ```bash
   pip install -r /path/to/your/project/requirements.txt
   ```

3. **Configure the WSGI file**:
   - Edit the WSGI configuration file (usually located at `/var/www/your_username_pythonanywhere_com_wsgi.py`).
   - Add the following lines to import your Flask app:

   ```python
   import sys
   import os

   # Add your project directory to the sys.path
   project_home = '/home/your_username/your_project_directory'
   if project_home not in sys.path:
       sys.path.append(project_home)

   # Set the environment variable for the Flask app
   os.environ['FLASK_APP'] = 'app.py'

   # Import the Flask app
   from app import app as application
   ```

4. **Reload the web app**:
   - Go back to the "Web" tab on PythonAnywhere.
   - Click the "Reload" button to apply the changes.

Your Flask application should now be running on PythonAnywhere. You can access it via the provided URL.

For more detailed instructions, refer to the [PythonAnywhere Flask deployment guide](https://help.pythonanywhere.com/pages/Flask/).
