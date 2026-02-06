#!/bin/bash

URL="https://ed-yahska.xyz/notes/zig"
TOTAL_REQUESTS=100
DELAY=0.6  # 100 requests in 60 seconds = 0.6 seconds between requests

echo "Testing rate limiting on $URL"
echo "Sending $TOTAL_REQUESTS requests over 60 seconds..."
echo "----------------------------------------"

success=0
rate_limited=0

for i in $(seq 1 $TOTAL_REQUESTS); do
    status=$(curl -s -o /dev/null -w "%{http_code}" "$URL")

    if [ "$status" -eq 429 ]; then
        echo "Request $i: RATE LIMITED (HTTP $status)"
        ((rate_limited++))
    elif [ "$status" -ge 200 ] && [ "$status" -lt 300 ]; then
        echo "Request $i: OK (HTTP $status)"
        ((success++))
    else
        echo "Request $i: OTHER (HTTP $status)"
    fi

    if [ $i -lt $TOTAL_REQUESTS ]; then
        sleep $DELAY
    fi
done

echo "----------------------------------------"
echo "Summary:"
echo "  Successful: $success"
echo "  Rate Limited: $rate_limited"
echo "  Total: $TOTAL_REQUESTS"
