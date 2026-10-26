import pytest
from app.core.crypto import CryptoEngine

def test_canonical_json_ordering():
    dict1 = {"b": 2, "a": 1, "nested": {"z": 26, "y": 25}}
    dict2 = {"a": 1, "nested": {"y": 25, "z": 26}, "b": 2}
    
    bytes1 = CryptoEngine.canonical_json_bytes(dict1)
    bytes2 = CryptoEngine.canonical_json_bytes(dict2)
    
    assert bytes1 == bytes2
    assert CryptoEngine.sha256_hash(bytes1) == CryptoEngine.sha256_hash(bytes2)

def test_ecdsa_signing_and_verification():
    priv_pem, pub_pem = CryptoEngine.generate_ecdsa_keypair()
    payload = {"medication": "Amoxicillin", "qty": 30}
    payload_hash = CryptoEngine.sha256_hash(CryptoEngine.canonical_json_bytes(payload))
    
    signature = CryptoEngine.sign_hash(priv_pem, payload_hash)
    assert signature is not None
    
    # Valid signature check
    is_valid = CryptoEngine.verify_signature(pub_pem, payload_hash, signature)
    assert is_valid is True
    
    # Altered payload must fail verification
    altered_hash = CryptoEngine.sha256_hash(b'{"medication":"Amoxicillin","qty":3000}')
    assert CryptoEngine.verify_signature(pub_pem, altered_hash, signature) is False

def test_aes_gcm_authenticated_encryption():
    key = b"0123456789abcdef0123456789abcdef"
    plaintext = "Patient: Jane Doe, Condition: Hypertension, Sensitive Note: Alpha"
    aad = "rx-uuid-12345"
    
    envelope = CryptoEngine.encrypt_aes_gcm(key, plaintext, associated_data=aad)
    assert "nonce" in envelope
    assert "ciphertext" in envelope
    assert envelope["aad"] == aad
    
    decrypted = CryptoEngine.decrypt_aes_gcm(key, envelope)
    assert decrypted == plaintext

def test_aes_gcm_tamper_detection():
    key = b"0123456789abcdef0123456789abcdef"
    plaintext = "Secret Medical Record"
    envelope = CryptoEngine.encrypt_aes_gcm(key, plaintext, associated_data="rx-1")
    
    # Corrupt the ciphertext
    envelope["ciphertext"] = "AAAA" + envelope["ciphertext"][4:]
    with pytest.raises(ValueError):
        CryptoEngine.decrypt_aes_gcm(key, envelope)
