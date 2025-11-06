#!/bin/bash

# SSL Certificate Generation Script for MyChurch Production
# This script generates self-signed SSL certificates for development/testing
# For production, use certificates from a trusted CA like Let's Encrypt

set -e

# Configuration
SSL_DIR="/etc/nginx/ssl"
DOMAIN="mychurch.com"
SUBJECT="/C=IR/ST=Tehran/L=Tehran/O=MyChurch/OU=IT/CN=${DOMAIN}"
VALID_DAYS=365

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create SSL directory if it doesn't exist
echo -e "${YELLOW}Creating SSL directory...${NC}"
mkdir -p ${SSL_DIR}

# Check if OpenSSL is installed
if ! command -v openssl &> /dev/null; then
    echo -e "${RED}Error: OpenSSL is not installed${NC}"
    echo "Please install OpenSSL first:"
    echo "  Ubuntu/Debian: sudo apt-get install openssl"
    echo "  CentOS/RHEL: sudo yum install openssl"
    echo "  macOS: brew install openssl"
    exit 1
fi

# Generate private key
echo -e "${YELLOW}Generating private key...${NC}"
openssl genrsa -out ${SSL_DIR}/key.pem 2048

# Generate certificate signing request
echo -e "${YELLOW}Generating certificate signing request...${NC}"
openssl req -new -key ${SSL_DIR}/key.pem -out ${SSL_DIR}/csr.pem -subj "${SUBJECT}"

# Generate self-signed certificate
echo -e "${YELLOW}Generating self-signed certificate...${NC}"
openssl x509 -req -days ${VALID_DAYS} -in ${SSL_DIR}/csr.pem -signkey ${SSL_DIR}/key.pem -out ${SSL_DIR}/cert.pem

# Clean up CSR file
rm ${SSL_DIR}/csr.pem

# Set appropriate permissions
chmod 600 ${SSL_DIR}/key.pem
chmod 644 ${SSL_DIR}/cert.pem

echo -e "${GREEN}SSL certificates generated successfully!${NC}"
echo -e "${GREEN}Private key: ${SSL_DIR}/key.pem${NC}"
echo -e "${GREEN}Certificate: ${SSL_DIR}/cert.pem${NC}"

# Display certificate information
echo -e "${YELLOW}Certificate information:${NC}"
openssl x509 -in ${SSL_DIR}/cert.pem -text -noout

# Generate DH parameters for Perfect Forward Secrecy
echo -e "${YELLOW}Generating DH parameters...${NC}"
openssl dhparam -out ${SSL_DIR}/dhparam.pem 2048

echo -e "${GREEN}SSL setup completed!${NC}"
echo ""
echo "For production deployment, consider using Let's Encrypt with Certbot:"
echo "  sudo apt-get install certbot"
echo "  sudo certbot certonly --standalone -d ${DOMAIN}"
echo "  sudo cp /etc/letsencrypt/live/${DOMAIN}/fullchain.pem ${SSL_DIR}/cert.pem"
echo "  sudo cp /etc/letsencrypt/live/${DOMAIN}/privkey.pem ${SSL_DIR}/key.pem"
echo ""
echo "Note: Self-signed certificates are only recommended for development/testing."
echo "In production, browsers will show security warnings for self-signed certificates."