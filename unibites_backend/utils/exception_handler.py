"""
Centralized DRF exception handler for UniBites.
Ensures no raw errors, stack traces, or internal details leak to the frontend.
"""
import logging
import traceback

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import (
    ValidationError,
    AuthenticationFailed,
    NotAuthenticated,
    PermissionDenied,
    NotFound,
)
from django.http import Http404
from django.core.exceptions import ObjectDoesNotExist

logger = logging.getLogger('unibites')


def custom_exception_handler(exc, context):
    """
    Custom exception handler that returns user-friendly error messages
    and logs full details server-side for debugging.
    """
    # Let DRF handle its known exceptions first
    response = exception_handler(exc, context)

    # Log full details server-side
    view = context.get('view', None)
    view_name = view.__class__.__name__ if view else 'UnknownView'
    logger.error(
        f"Exception in {view_name}: {exc.__class__.__name__}: {str(exc)}\n"
        f"{traceback.format_exc()}"
    )

    if response is not None:
        # DRF handled it - clean up the response
        custom_data = {
            'success': False,
            'message': _extract_message(response.data),
        }
        response.data = custom_data
        return response

    # DRF didn't handle it (unexpected server error)
    if isinstance(exc, Http404) or isinstance(exc, ObjectDoesNotExist):
        return Response(
            {'success': False, 'message': 'The requested resource was not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Generic 500 - never expose details
    return Response(
        {'success': False, 'message': 'Something went wrong. Please try again later.'},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


def _extract_message(data):
    """
    Extracts a clean, user-friendly message from DRF error response data.
    Handles dicts, lists, and strings.
    """
    if isinstance(data, str):
        return data

    if isinstance(data, list):
        # Return first error message from list
        return str(data[0]) if data else 'An error occurred.'

    if isinstance(data, dict):
        # Check for common keys first
        for key in ('detail', 'message', 'error'):
            if key in data:
                val = data[key]
                if isinstance(val, list):
                    return str(val[0])
                return str(val)

        # For field-level validation errors, return the first one
        for field, errors in data.items():
            if isinstance(errors, list) and errors:
                field_label = field.replace('_', ' ').capitalize()
                return f"{field_label}: {errors[0]}"
            elif isinstance(errors, str):
                field_label = field.replace('_', ' ').capitalize()
                return f"{field_label}: {errors}"

    return 'An error occurred. Please try again.'
