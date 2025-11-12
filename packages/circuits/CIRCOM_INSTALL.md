# Circom Installation Guide

## Option 1: Install via Homebrew (macOS)

```bash
brew install circom
```

## Option 2: Install via apt (Linux - Ubuntu/Debian)

```bash
# Add rust first if not installed
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Clone and build circom
git clone https://github.com/iden3/circom.git
cd circom
cargo build --release
# Binary at target/release/circom
sudo mv target/release/circom /usr/local/bin/
```

## Option 3: Using Docker

```dockerfile
FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    build-essential \
    cargo \
    git

RUN git clone https://github.com/iden3/circom.git && \
    cd circom && \
    cargo build --release && \
    mv target/release/circom /usr/local/bin/

WORKDIR /app
```

## Option 4: Direct Binary Download (if available)

Download pre-built binary from: https://github.com/iden3/circom/releases

## Verify Installation

```bash
circom --version
```

Should output something like: `circom compiler 2.1.x`

## After Installation

Once circom is installed globally, you can compile:

```bash
cd packages/circuits
npm run build
```
