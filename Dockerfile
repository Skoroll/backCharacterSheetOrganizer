# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=20.18.0
FROM node:${NODE_VERSION}-slim as base

LABEL fly_launch_runtime="NodeJS"

# NodeJS app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Install packages needed to build node modules
FROM base as build

# Install packages to build native modules (if needed)
RUN apt-get update -qq && \
    apt-get install -y python-is-python3 pkg-config build-essential

# Install node modules
COPY --link package.json package-lock.json ./
RUN npm install

# Copy application code
COPY --link . ./

# Final stage for app image
FROM base

# Copy built application
COPY --from=build /app /app

# Expose port 8080 for the app
EXPOSE 8080

# Start the server by default, this can be overwritten at runtime
CMD ["npm", "run", "start"]
