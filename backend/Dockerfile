# Use the official lightweight Node.js image
FROM node:18-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy the rest of your app's source code
COPY . .

# Expose the port the app runs on
EXPOSE 8080

# CORRECTED: Define the command to run your app from the root
CMD [ "node", "server.js" ]