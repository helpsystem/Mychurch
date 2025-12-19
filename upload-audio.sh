#!/bin/bash
# Upload Bible Audio Files to Production Server
# Size: 1.49 GB (1192 files in 66 books)

echo "=== Bible Audio Upload Script ==="
echo "Starting upload at: $(date)"

# Create audio directory on server
echo "Creating audio directory..."
ssh root@samanabyar.online "mkdir -p /root/Mychurch/backend/bible_data/audio"

# Upload TPV audio files with compression
echo "Uploading TPV audio files (1.49 GB)..."
echo "This will take approximately 15-30 minutes depending on connection speed..."

# Use rsync for efficient upload with progress
rsync -avz --progress \
    bible_data/audio/TPV/ \
    root@samanabyar.online:/root/Mychurch/backend/bible_data/audio/TPV/

echo ""
echo "=== Upload Complete ==="
echo "Finished at: $(date)"
echo ""
echo "Verify with:"
echo "ssh root@samanabyar.online 'ls -lah /root/Mychurch/backend/bible_data/audio/TPV/ | head -10'"
