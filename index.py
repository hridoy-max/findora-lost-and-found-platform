import sys
import os

# Add the Backend directory to the sys.path to resolve internal imports
sys.path.append(os.path.join(os.getcwd(), 'Backend'))

from Backend.app import app
