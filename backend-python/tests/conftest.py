"""
conftest.py - Ensure backend-python is on sys.path so tests can import modules directly.
This is the correct way to set up the path for pytest.
"""
import sys
import os

# The conftest.py is at backend-python/tests/conftest.py
# We want to add backend-python/ to the path
_backend_python = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _backend_python not in sys.path:
    sys.path.insert(0, _backend_python)
