FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Pacific/Auckland

RUN apt-get update

# Install basic utils
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    vim \
    sudo \
    software-properties-common \
    ca-certificates \
    lsb-release \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js (LTS version)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g npm@latest

# Install MongoDB 
RUN wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor | tee /usr/share/keyrings/mongodb.gpg > /dev/null && \
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb.gpg ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list && \
    apt-get update && \
    apt-get install -y mongodb-org && \
    rm -rf /var/lib/apt/lists/*

# Create MongoDB data directory
RUN mkdir -p /data/db && \
    chown -R mongodb:mongodb /data/db

# Install build tools and libraries
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    python3-pip \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Install build tools and libraries
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    gdb \
    cmake \
    make \
    clang \
    lldb \
    libssl-dev \
    libcurl4-openssl-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Install PM2 and development tools
RUN npm install -g pm2 && \
    npm install -g \
    nodemon \
    express-generator \
    typescript \
    ts-node \
    @types/node

# Set environment variables
ENV NODE_ENV=development
ENV PATH="/usr/local/bin:$PATH"

# Create app directorys
RUN mkdir -p /app

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Expose ports
EXPOSE 22 27017 3000 6885 8080

WORKDIR /app

# Start command
CMD ["sh", "-c", "tail -f /dev/null"]