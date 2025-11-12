#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CIRCUITS_DIR="$(dirname "$SCRIPT_DIR")"

echo "Building circuits using Docker..."

# Build Docker image
echo "Building Docker image (this may take 10-15 minutes for first build)..."
docker build -t sasvoth-circuits:latest "$CIRCUITS_DIR"

# Create temporary container to extract artifacts
echo "Extracting build artifacts..."
CONTAINER_ID=$(docker create sasvoth-circuits:latest)

# Clean old build if exists
rm -rf "$CIRCUITS_DIR/build"
mkdir -p "$CIRCUITS_DIR/build"

# Copy all artifacts
docker cp "$CONTAINER_ID:/app/build/." "$CIRCUITS_DIR/build/" || true
docker cp "$CONTAINER_ID:/app/pot_final.ptau" "$CIRCUITS_DIR/build/" || true
docker cp "$CONTAINER_ID:/app/VoteProof_js" "$CIRCUITS_DIR/build/" || true

# Clean up
docker rm "$CONTAINER_ID"

echo ""
echo "Build complete! Artifacts extracted:"
ls -lh "$CIRCUITS_DIR/build/"

# Verify key files
echo ""
echo "Verifying key files..."
if [ -f "$CIRCUITS_DIR/build/verification_key.json" ]; then
  echo "verification_key.json found"
  echo "   Size: $(du -h "$CIRCUITS_DIR/build/verification_key.json" | cut -f1)"
else
  echo "verification_key.json NOT found"
  exit 1
fi

if [ -f "$CIRCUITS_DIR/build/VoteProof_0000.zkey" ]; then
  echo "VoteProof_0000.zkey found"
  echo "   Size: $(du -h "$CIRCUITS_DIR/build/VoteProof_0000.zkey" | cut -f1)"
else
  echo "VoteProof_0000.zkey NOT found"
  exit 1
fi

if [ -d "$CIRCUITS_DIR/build/VoteProof_js" ]; then
  echo " VoteProof_js (WASM) directory found"
  if [ -f "$CIRCUITS_DIR/build/VoteProof_js/VoteProof.wasm" ]; then
    echo "   Size: $(du -h "$CIRCUITS_DIR/build/VoteProof_js/VoteProof.wasm" | cut -f1)"
  fi
else
  echo " VoteProof_js directory NOT found"
  exit 1
fi

echo ""
echo "All artifacts ready! Circuit is compiled and ready to use."

!/bin/bash

# set -e

# SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# CIRCUITS_DIR="$(dirname "$SCRIPT_DIR")"

# echo " Building circuits using Docker..."

# # Build Docker image với resource limits và better error handling
# echo " Building Docker image (this may take 10-15 minutes for first build)..."
# if ! docker build --memory=4g --memory-swap=4g -t sasvoth-circuits:latest "$CIRCUITS_DIR"; then
#     echo " Docker build failed!"
#     echo " Try: docker system prune -a && ./build.sh"
#     exit 1
# fi

# # Kiểm tra image đã build thành công
# if ! docker image inspect sasvoth-circuits:latest > /dev/null 2>&1; then
#     echo " Docker image not found after build!"
#     exit 1
# fi

# # Create temporary container to extract artifacts
# echo " Extracting build artifacts..."
# CONTAINER_ID=$(docker create sasvoth-circuits:latest)

# # Clean old build if exists
# rm -rf "$CIRCUITS_DIR/build"
# mkdir -p "$CIRCUITS_DIR/build"

# # Copy all artifacts với detailed error checking
# echo " Copying artifacts..."
# if ! docker cp "$CONTAINER_ID:/app/build/." "$CIRCUITS_DIR/build/" 2>/dev/null; then
#     echo "  No build directory found in container"
# fi

# if ! docker cp "$CONTAINER_ID:/app/pot_final.ptau" "$CIRCUITS_DIR/build/" 2>/dev/null; then
#     echo " No pot_final.ptau found in container"
# fi

# if ! docker cp "$CONTAINER_ID:/app/VoteProof_js" "$CIRCUITS_DIR/build/" 2>/dev/null; then
#     echo "  No VoteProof_js directory found in container"
# fi

# # Clean up
# docker rm "$CONTAINER_ID" > /dev/null

# echo ""
# echo "Build artifacts extracted:"
# ls -la "$CIRCUITS_DIR/build/" 2>/dev/null || {
#     echo " No artifacts found!"
#     exit 1
# }

# # Verify key files
# echo ""
# echo "Verifying key files..."
# ALL_GOOD=true

# if [ -f "$CIRCUITS_DIR/build/verification_key.json" ]; then
#     echo " verification_key.json found"
#     echo "   Size: $(du -h "$CIRCUITS_DIR/build/verification_key.json" | cut -f1)"
# else
#     echo " verification_key.json NOT found"
#     ALL_GOOD=false
# fi

# if [ -f "$CIRCUITS_DIR/build/VoteProof_0000.zkey" ]; then
#     echo "VoteProof_0000.zkey found"
#     echo "   Size: $(du -h "$CIRCUITS_DIR/build/VoteProof_0000.zkey" | cut -f1)"
# else
#     echo " VoteProof_0000.zkey NOT found"
#     ALL_GOOD=false
# fi

# if [ -d "$CIRCUITS_DIR/build/VoteProof_js" ]; then
#     echo " VoteProof_js (WASM) directory found"
#     if [ -f "$CIRCUITS_DIR/build/VoteProof_js/VoteProof.wasm" ]; then
#         echo "   Size: $(du -h "$CIRCUITS_DIR/build/VoteProof_js/VoteProof.wasm" | cut -f1)"
#     else
#         echo " VoteProof.wasm NOT found in VoteProof_js directory"
#         ALL_GOOD=false
#     fi
# else
#     echo " VoteProof_js directory NOT found"
#     ALL_GOOD=false
# fi

# if [ "$ALL_GOOD" = false ]; then
#     echo ""
#     echo " Some artifacts are missing. Build may have failed."
#     echo " Check Dockerfile and build process"
#     exit 1
# fi

# echo ""
# echo "All artifacts ready! Circuit is compiled and ready to use."