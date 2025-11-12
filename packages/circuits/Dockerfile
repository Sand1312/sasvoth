FROM node:18-bullseye

# Install Rust (required for circom)
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install dependencies for building
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    curl \
    wget

# Clone and build circom
RUN git clone https://github.com/iden3/circom.git /circom && \
    cd /circom && \
    cargo build --release && \
    cp target/release/circom /usr/local/bin/

# Verify installation
RUN circom --version

WORKDIR /app

# Install node dependencies
COPY package*.json ./
RUN npm install

# Copy circuit files
COPY . .

# Generate Powers of Tau (for testing/development)
# Using snarkjs to create a small ptau file
RUN npx snarkjs powersoftau new bn128 12 pot_0000.ptau < /dev/null && \
    npx snarkjs powersoftau contribute pot_0000.ptau pot_final.ptau --name="build" < /dev/null || true

# Build circuits
RUN mkdir -p build && \
    echo "🔧 Compiling circuit..." && \
    circom VoteProof.circom --r1cs --wasm -o build/ && \
    echo "📝 Setting up zkey..." && \
    npx snarkjs groth16 setup build/VoteProof.r1cs pot_final.ptau build/VoteProof_0000.zkey < /dev/null && \
    echo "✅ Verifying setup..." && \
    npx snarkjs zkey verify build/VoteProof.r1cs pot_final.ptau build/VoteProof_0000.zkey && \
    echo "📤 Exporting verification key..." && \
    npx snarkjs zkey export verificationkey build/VoteProof_0000.zkey build/verification_key.json && \
    echo "✨ Build complete!"

CMD ["node"]
