# Build stage
FROM rust:1.82-alpine AS builder

RUN apk add --no-cache musl-dev openssl-dev openssl-libs-static pkgconfig

WORKDIR /app

# Copy manifests
COPY Cargo.toml Cargo.lock ./

# Create dummy main.rs for dependency caching
RUN mkdir src && echo "fn main() {}" > src/main.rs

# Build dependencies
RUN cargo build --release && rm -rf src

# Copy source code
COPY src ./src
COPY migrations ./migrations

# Build application
RUN touch src/main.rs && cargo build --release

# Runtime stage
FROM alpine:3.19

RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY --from=builder /app/target/release/galerie-backend .
COPY --from=builder /app/migrations ./migrations

ENV RUST_LOG=info

EXPOSE 3000

CMD ["./galerie-backend"]
