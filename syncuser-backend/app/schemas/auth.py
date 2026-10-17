from datetime import datetime

from pydantic import BaseModel, EmailStr

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UpdateUsernameRequest(BaseModel):
    username: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr

    class Config:
        from_attributes = True

class LoginActivityResponse(BaseModel):
    id: int
    login_at: datetime

    class Config:
        from_attributes = True