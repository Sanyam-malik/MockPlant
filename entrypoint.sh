#!/bin/bash

# Run the configuration script
nohup python /app/mockplant_http.py &

# Keep the container running
tail -f /dev/null