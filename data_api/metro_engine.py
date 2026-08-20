"""Proxy module to re-export metro_engine_shared for data_api."""
try:
    from metro_engine_shared import *
except ImportError:
    from data_api.metro_engine_shared import *
