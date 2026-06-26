#!/bin/bash
# deploy.sh — Deploy VideoVault to GCP VM
# Usage: ./deploy.sh
# Prerequisites: SSH key at C:\ubuntuiso\.ssh\vboxuser (Windows)
#                or ~/.ssh/vboxuser (Linux/Mac)

set -e

VM_HOST="gcvmuser@34.174.56.186"
VM_DIR="~/MISEIA190_upload-videos"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/vboxuser}"

echo "=== VideoVault Deploy to GCP VM ==="
echo "Target: $VM_HOST:$VM_DIR"

# 1. Ensure target directory exists on VM
ssh -i "$SSH_KEY" "$VM_HOST" "mkdir -p $VM_DIR"

# 2. Sync project files to VM (exclude build artifacts and secrets)
rsync -avz --progress \
  --exclude '.next/' \
  --exclude 'node_modules/' \
  --exclude '.env*' \
  --exclude 'coverage/' \
  -e "ssh -i $SSH_KEY" \
  . "$VM_HOST:$VM_DIR/"

echo "=== Files synced. Starting Docker deployment... ==="

# 3. On the VM: build and start the container
ssh -i "$SSH_KEY" "$VM_HOST" "
  cd $VM_DIR
  echo 'Building and starting VideoVault...'
  docker compose -f docker-compose.prod.yml up -d --build
  echo 'Deploy complete!'
  docker compose -f docker-compose.prod.yml ps
"

echo "=== Deploy finished. VideoVault should be accessible at https://videovault.deviaaps.com ==="
