# Base Image: CUDA 11.0 (Required for MuMax3.10)
FROM nvidia/cuda:11.0.3-base-ubuntu20.04

# Maintainer
LABEL maintainer="Antigravity Agent"

# Install Dependencies
RUN apt-get update && apt-get install -y \
    wget \
    cuda-toolkit-11-0 \
    && rm -rf /var/lib/apt/lists/*

# Install MuMax3
WORKDIR /app
RUN wget https://mumax.github.io/mumax3/binaries/mumax3.10_linux_cuda11.0.tar.gz \
    && tar -xvf mumax3.10_linux_cuda11.0.tar.gz \
    && mv mumax3.10_linux_cuda11.0/mumax3 /usr/local/bin/mumax3 \
    && chmod +x /usr/local/bin/mumax3

# Copy Simulation Script
COPY mumax3_script.mx3 /app/simulation.mx3

# Create Output Directory
RUN mkdir /app/output

# Run Simulation
CMD ["mumax3", "-o", "/app/output", "/app/simulation.mx3"]
