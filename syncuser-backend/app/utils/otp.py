import secrets

from pwdlib import PasswordHash


otp_hash = PasswordHash.recommended()


def generate_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def hash_otp(otp: str) -> str:
    return otp_hash.hash(otp)


def verify_otp(otp: str, hashed_otp: str) -> bool:
    return otp_hash.verify(otp, hashed_otp)