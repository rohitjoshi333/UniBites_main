"""
eSewa Payment Gateway Utility
Handles HMAC-SHA256 signature generation and response verification.
"""
import hmac
import hashlib
import base64
import json
from django.conf import settings


def generate_signature(total_amount: str, transaction_uuid: str, product_code: str) -> str:
    
    # Generate HMAC-SHA256 signature for eSewa payment request eSewa requires: HMAC-SHA256(secret_key, "total_amount=X,transaction_uuid=Y,product_code=Z") Output is Base64-encoded.

    message = f"total_amount={total_amount},transaction_uuid={transaction_uuid},product_code={product_code}"
    secret = settings.ESEWA_SECRET_KEY.encode('utf-8')
    message_bytes = message.encode('utf-8')
    
    digest = hmac.new(secret, message_bytes, hashlib.sha256).digest()
    return base64.b64encode(digest).decode('utf-8')


def verify_esewa_response(encoded_data: str) -> dict | None:
    
    #Decode and verify eSewa's Base64-encoded response after payment and returns the decoded data dict if signature is valid, else None.
    try:
        decoded_bytes = base64.b64decode(encoded_data)
        data = json.loads(decoded_bytes.decode('utf-8'))
    except Exception:
        return None

    esewa_signature = data.get('signature', '')
    signed_field_names = data.get('signed_field_names', '')

    if not signed_field_names:
        return None

    # Construct the message string exactly as specified by signed_field_names
    fields = signed_field_names.split(',')
    message_parts = [f"{field}={data.get(field, '')}" for field in fields]
    message = ",".join(message_parts)

    secret = settings.ESEWA_SECRET_KEY.encode('utf-8')
    message_bytes = message.encode('utf-8')
    digest = hmac.new(secret, message_bytes, hashlib.sha256).digest()
    expected_signature = base64.b64encode(digest).decode('utf-8')
    
    if hmac.compare_digest(expected_signature, esewa_signature):
        return data
    return None
