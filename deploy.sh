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

# Deploy frontend build
if [ -d "dist" ]; then
  /bin/cp -R dist/assets "$DEST/"
  /bin/cp dist/index.html "$DEST/"
  /bin/cp dist/.htaccess "$DEST/"
  /bin/cp dist/_redirects "$DEST/"
  /bin/cp dist/robots.txt "$DEST/"
  /bin/cp dist/sitemap.xml "$DEST/"
  /bin/cp dist/logo.png "$DEST/"
  /bin/cp upload.php "$DEST/"
else
  echo "Error: dist folder not found! Please run npm run build before pushing."
  exit 1
fi

# ==============================
# BACKEND
# ==============================

/bin/rm -rf "$BACKEND_DEST"
/bin/mkdir -p "$BACKEND_DEST"

# Copy backend source and config files needed for production runtime
/bin/cp -R backend/. "$BACKEND_DEST/"

# Install backend dependencies and build TypeScript
/usr/local/bin/npm install --prefix "$BACKEND_DEST" --no-audit --no-fund
/usr/local/bin/npm --prefix "$BACKEND_DEST" run build

# Keep runtime environment file out of Git but allow cPanel app config to supply it.
if [ -f "$BACKEND_DEST/.env.example" ] && [ ! -f "$BACKEND_DEST/.env" ]; then
  /bin/cp "$BACKEND_DEST/.env.example" "$BACKEND_DEST/.env"
fi

echo "Deployment completed successfully!"
echo "Create a cPanel Node.js app that points to $BACKEND_DEST and starts with: node dist/server.js"
