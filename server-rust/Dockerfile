# Stage 1: Builder
FROM rust:1.83 AS builder
WORKDIR /app

# Copy manifest to cache dependencies
COPY Cargo.toml ./

# Create a dummy main.rs to build dependencies only
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

# Copy the actual source code
COPY . .

# Build the application
RUN cargo build --release --bin wow-dashboard-backend

# Stage 2: Runtime
FROM debian:bookworm-slim AS runtime
WORKDIR /app

# Install OpenSSL and CA certificates (needed for reqwest/Google Login)
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && apt-get autoremove -y \
    && apt-get clean -y \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/wow-dashboard-backend /app/wow-dashboard-backend

# Expose the port
EXPOSE 3000

CMD ["./wow-dashboard-backend"]
