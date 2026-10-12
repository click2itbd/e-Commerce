#!/bin/bash
# Universal deployment script for cPanel
# This script uses $HOME so it works automatically on ANY cPanel account

DEST="$HOME/public_html"
BACKEND_DEST="$HOME/backend_app"

set -e

echo "Starting deployment to $DEST..."

# ==============================
# FRONTEND
# ==============================

# Clean old frontend files
/bin/rm -rf "$DEST/assets"
/bin/rm -f "$DEST/index.html"
/bin/rm -f "$DEST/_redirects"
/bin/rm -f "$DEST/.htaccess"
/bin/rm -f "$DEST/robots.txt"
/bin/rm -f "$DEST/sitemap.xml"
/bin/rm -f "$DEST/logo.png"
/bin/rm -f "$DEST/upload.php"
/bin/rm -f "$DEST/share.php"

# Deploy frontend build
if [ -d "dist" ]; then
  /bin/cp -R dist/. "$DEST/"
  /bin/cp -f upload.php "$DEST/" 2>/dev/null || true
  /bin/cp -f share.php "$DEST/" 2>/dev/null || true
else
  echo "Error: dist folder not found! Please run npm run build before pushing."
  exit 1
fi

# ==============================
# BACKEND
# ==============================

# Preserve existing .env if present
if [ -f "$BACKEND_DEST/.env" ]; then
  /bin/cp "$BACKEND_DEST/.env" /tmp/saved_backend_env.tmp 2>/dev/null || true
fi

/bin/rm -rf "$BACKEND_DEST"
/bin/mkdir -p "$BACKEND_DEST"

# Copy backend source and config files needed for production runtime
/bin/cp -R backend/. "$BACKEND_DEST/"

# Restore preserved .env or copy example
if [ -f /tmp/saved_backend_env.tmp ]; then
  /bin/cp /tmp/saved_backend_env.tmp "$BACKEND_DEST/.env"
  /bin/rm -f /tmp/saved_backend_env.tmp
elif [ -f "$BACKEND_DEST/.env.example" ] && [ ! -f "$BACKEND_DEST/.env" ]; then
  /bin/cp "$BACKEND_DEST/.env.example" "$BACKEND_DEST/.env"
fi

# Install backend dependencies and build TypeScript if compiler available
/usr/local/bin/npm install --prefix "$BACKEND_DEST" --no-audit --no-fund
/usr/local/bin/npm --prefix "$BACKEND_DEST" run build 2>/dev/null || echo "Using prebuilt dist output"

echo "Deployment completed successfully!"
echo "Create a cPanel Node.js app that points to $BACKEND_DEST and starts with: node dist/server.js"
