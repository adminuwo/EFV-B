# Use Node.js 18 alpine for a lightweight image
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source code
COPY . .

# Expose the port the app runs on (based on logs it was 5000)
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
