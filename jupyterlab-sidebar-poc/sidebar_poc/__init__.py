"""A JupyterLab sidebar extension POC."""

__version__ = "0.1.0"


def _jupyter_labextension_paths():
    """Declare the prebuilt labextension (standard JupyterLab discovery hook)."""
    return [{"src": "labextension", "dest": "sidebar-poc"}]
