#!/bin/bash

# Start React development server with mobile-friendly WebSocket configuration
cd /root/dopewars-react/drug-warz

# Set WebSocket configuration for HTTPS proxy
export WDS_SOCKET_HOST=drugwarz.com
export WDS_SOCKET_PORT=443
export WDS_SOCKET_PATH=/ws
export WDS_SOCKET_PROTOCOL=wss

# Start the development server
npm start
