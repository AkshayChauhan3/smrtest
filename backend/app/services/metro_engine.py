"""Proxy module for sharing the single metro engine source of truth.

This proxy ensures cross-platform compatibility (e.g., avoiding symlink issues
on Windows/limited environments) and lets static analysis tools (like Pyrefly/Pyright)
resolve the module successfully.
"""

import os
import sys

# Prepend the project root to sys.path so data_api package is importable at runtime.
_project_root = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..")
)
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

from data_api.metro_engine_shared import *
