# Stage 1: Chef (optimizes dependency caching)
FROM rust:1.83 as chef
WORKDIR /app
RUN cargo install cargo-chef

# Stage 2: Planner
FROM chef as planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

# Stage 3: Builder
FROM chef as builder
COPY --from=planner /app/recipe.json recipe.json
# Build dependencies - this is the cached layer
RUN cargo chef cook --release --recipe-path recipe.json
# Build application
COPY . .
RUN cargo build --release --bin wow-dashboard-backend

# Stage 4: Runtime
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
