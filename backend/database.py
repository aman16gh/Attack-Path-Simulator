from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import re
import socket
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/attack_sim")

def fix_db_url_for_ipv4(url: str) -> str:
    """If the database hostname resolves to IPv6, force IPv4 by replacing hostname with its IPv4 address."""
    pattern = r'postgresql://(?P<user>[^:]+):(?P<password>[^@]+)@(?P<host>[^:]+):(?P<port>\d+)/(?P<db>.+)'
    match = re.match(pattern, url)
    if not match:
        # If URL doesn't match expected format, return as-is (for localhost or other)
        return url

    host = match.group('host')
    port = int(match.group('port'))
    
    # Resolve IPv4 address
    try:
        addrs = socket.getaddrinfo(host, port, socket.AF_INET, socket.SOCK_STREAM)
        if addrs:
            ipv4 = addrs[0][4][0]  # get the first IPv4 address
            new_url = f"postgresql://{match.group('user')}:{match.group('password')}@{ipv4}:{port}/{match.group('db')}"
            return new_url
        else:
            return url  # fallback
    except socket.gaierror:
        return url  # fallback, e.g., for localhost

# Force IPv4 for Render compatibility
FIXED_DATABASE_URL = fix_db_url_for_ipv4(DATABASE_URL)

engine = create_engine(FIXED_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()