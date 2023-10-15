# Base image
FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm install

# Install netcat for the wait-for-it script
RUN apt-get update && apt-get install -y netcat-openbsd

# Copy Prisma schema
COPY prisma/ ./prisma/

# Generate Prisma Client
RUN npx prisma generate

# Bundle the rest of app source
COPY . .

# Build the application
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Start the application
CMD [ "node", "dist/main.js" ]
