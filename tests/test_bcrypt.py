from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
try:
    h = pwd_context.hash("TestPass123!")
    print("Hash works:", h[:30])
except Exception as e:
    print("Hash error:", type(e).__name__, e)
