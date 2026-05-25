import os
from typing import Generator
from fastapi import Depends
from fastapi_users import FastAPIUsers, schemas
from fastapi_users.authentication import (
    AuthenticationBackend,
    BearerTransport,
    JWTStrategy,
)
from fastapi_users_db_sqlalchemy import SQLAlchemyBaseUserTable, SQLAlchemyUserDatabase
from sqlalchemy import Column, Integer

from database import Base, get_db

SECRET = os.getenv("SECRET", "SUPER_SECRET_KEY_FOR_JWT")

# 1. Database Model
class User(SQLAlchemyBaseUserTable[int], Base):
    id = Column(Integer, primary_key=True)

# 2. User DB dependency
def get_user_db(session = Depends(get_db)):
    yield SQLAlchemyUserDatabase(session, User)

# 3. Authentication Strategy (JWT)
bearer_transport = BearerTransport(tokenUrl="auth/jwt/login")

def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(secret=SECRET, lifetime_seconds=3600)

auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)

# 4. Pydantic Schemas
class UserRead(schemas.BaseUser[int]):
    id: int

class UserCreate(schemas.BaseUserCreate):
    pass

class UserUpdate(schemas.BaseUserUpdate):
    pass

# 5. FastAPI-Users instance
fastapi_users = FastAPIUsers[User, int](
    get_user_db,
    [auth_backend],
)

current_active_user = fastapi_users.current_user(active=True)
