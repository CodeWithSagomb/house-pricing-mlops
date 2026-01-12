#!/bin/bash
# =============================================================================
# Generate Self-Signed Certificates for Local HTTPS
# =============================================================================
# Usage: ./scripts/generate-certs.sh
# =============================================================================

set -e

CERTS_DIR="./certs"
DOMAIN="${DOMAIN:-localhost}"

echo "🔐 Generating self-signed certificates for ${DOMAIN}..."

# Create certs directory if not exists
mkdir -p "${CERTS_DIR}"

# Generate private key
openssl genrsa -out "${CERTS_DIR}/localhost.key" 2048

# Generate certificate signing request
openssl req -new \
    -key "${CERTS_DIR}/localhost.key" \
    -out "${CERTS_DIR}/localhost.csr" \
    -subj "/C=US/ST=State/L=City/O=MLOps/OU=Development/CN=${DOMAIN}"

# Generate self-signed certificate (valid for 365 days)
openssl x509 -req \
    -days 365 \
    -in "${CERTS_DIR}/localhost.csr" \
    -signkey "${CERTS_DIR}/localhost.key" \
    -out "${CERTS_DIR}/localhost.crt" \
    -extfile <(printf "subjectAltName=DNS:${DOMAIN},DNS:*.${DOMAIN},IP:127.0.0.1")

# Generate combined PEM file for Traefik
cat "${CERTS_DIR}/localhost.crt" "${CERTS_DIR}/localhost.key" > "${CERTS_DIR}/localhost.pem"

# Set proper permissions
chmod 600 "${CERTS_DIR}/localhost.key"
chmod 644 "${CERTS_DIR}/localhost.crt"

echo "✅ Certificates generated successfully!"
echo ""
echo "Files created:"
echo "  - ${CERTS_DIR}/localhost.key (private key)"
echo "  - ${CERTS_DIR}/localhost.crt (certificate)"
echo "  - ${CERTS_DIR}/localhost.pem (combined)"
echo ""
echo "⚠️  These are self-signed certificates for development only!"
echo "    Your browser will show a security warning - this is expected."
