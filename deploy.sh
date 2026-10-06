#!/bin/bash
# Universal deployment script for cPanel
# This script uses $HOME so it works automatically on ANY cPanel account

DEST="$HOME/public_html"
BACKEND_DEST="$HOME/backend_app"

echo "Starting deployment to $DEST..."

# ==============================
# FRONTEND
# ==============================

# Clean old frontend files
/bin/rm -rf $DEST/assets
/bin/rm -f $DEST/index.html
/bin/rm -f $DEST/_redirects
/bin/rm -f $DEST/.htaccess
/bin/rm -f $DEST/robots.txt
/bin/rm -f $DEST/sitemap.xml

# Deploy frontend build
if [ -d "dist" ]; then
  /bin/cp -R dist/assets $DEST/
  /bin/cp dist/index.html $DEST/
  /bin/cp dist/.htaccess $DEST/
  /bin/cp dist/_redirects $DEST/
  /bin/cp dist/robots.txt $DEST/
  /bin/cp dist/sitemap.xml $DEST/
  /bin/cp dist/logo.png $DEST/
  /bin/cp upload.php $DEST/
else
  echo "Error: dist folder not found! Please run npm run build before pushing."
  exit 1
fi

# ==============================
# BACKEND
# ==============================

/bin/mkdir -p $BACKEND_DEST

# Backend package files
/bin/cp backend/package.json $BACKEND_DEST/
/bin/cp backend/package-lock.json $BACKEND_DEST/

# Install production dependencies
/usr/local/bin/npm install --prefix $BACKEND_DEST --omit=dev --no-audit --no-fund

echo "Deployment completed successfully!"
