# Raspberry Pi Digital Signage Setup

This guide explains how to set up your Raspberry Pi to display scheduled media from your digital signage system.

## System Architecture

- **Media Storage**: Files uploaded to Supabase storage bucket
- **Bookings Database**: Stores who, what, when for each display
- **Playlist API**: returns current/next media with signed URLs
- **Overlap Prevention**: Database constraint ensures no booking conflicts

## API Endpoint

The playlist API is: https://pbaqcwrozmuxgzacajao.supabase.co/functions/v1/playlist


# Request Format

GET or POST

**Parameters**:
- `displayId` (required): UUID of the display

**Example GET Request**:
```bash
curl "https://pbaqcwrozmuxgzacajao.supabase.co/functions/v1/playlist?displayId=YOUR_DISPLAY_ID"
```
### Response Format

```json
{
  "displayName": "Main Display",
  "current": {
    "media_url": "https://...signed-url-valid-for-60-seconds",
    "media_type": "image",
    "filename": "promo.jpg",
    "end_time": "2025-10-05T14:30:00Z"
  },
  "next": {
    "start_time": "2025-10-05T14:30:00Z",
    "filename": "video-ad.mp4"
  }
}
```
## Raspberry Pi Setup

### 1. Install Required Software

```bash
sudo apt-get update
sudo apt-get install -y chromium-browser unclutter
```

### 2. Create Kiosk Display Script

Create `/home/pi/signage_display.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Digital Signage</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: black;
            overflow: hidden;
        }
        #media-container {
            width: 100vw;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        img, video {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }
    </style>
</head>
<body>
    <div id="media-container"></div>
    <script>
        const DISPLAY_ID = 'YOUR_DISPLAY_ID_HERE'; // Replace with actual display ID
        const API_URL = 'https://pbaqcwrozmuxgzacajao.supabase.co/functions/v1/playlist';
        const POLL_INTERVAL = 10000; // 10 seconds
        
        let currentMediaUrl = null;
        
        async function fetchPlaylist() {
            try {
                const response = await fetch(`${API_URL}?displayId=${DISPLAY_ID}`);
                const data = await response.json();
                
                if (data.current && data.current.media_url !== currentMediaUrl) {
                    currentMediaUrl = data.current.media_url;
                    displayMedia(data.current);
                } else if (!data.current) {
                    // No scheduled content, show black screen
                    document.getElementById('media-container').innerHTML = '';
                    currentMediaUrl = null;
                }
            } catch (error) {
                console.error('Error fetching playlist:', error);
            }
        }
        
        function displayMedia(media) {
            const container = document.getElementById('media-container');
            container.innerHTML = '';
            
            if (media.media_type === 'video') {
                const video = document.createElement('video');
                video.src = media.media_url;
                video.autoplay = true;
                video.loop = true;
                video.muted = true;
                container.appendChild(video);
            } else {
                const img = document.createElement('img');
                img.src = media.media_url;
                container.appendChild(img);
            }
        }
        
        // Initial fetch
        fetchPlaylist();
        
        // Poll every 10 seconds
        setInterval(fetchPlaylist, POLL_INTERVAL);
    </script>
</body>
</html>
```

### 3. Set Up Kiosk Mode

Edit `/home/pi/.config/lxsession/LXDE-pi/autostart`:

```bash
@lxpanel --profile LXDE-pi
@pcmanfm --desktop --profile LXDE-pi
@xscreensaver -no-splash
@xset s off
@xset -dpms
@xset s noblank
@unclutter -idle 0.1 -root
@chromium-browser --kiosk --incognito --disable-infobars --noerrdialogs --disable-session-crashed-bubble file:///home/pi/signage_display.html
```

### 4. Get Your Display ID

Your display IDs are stored in the `displays` table. You can find them in the dashboard or by querying the database.

Demo display code: `DEMO2025`

### 5. Reboot

```bash
sudo reboot
```

## How It Works

1. Raspberry Pi polls the playlist API every 20 seconds
2. API checks current UTC time against bookings for the display
3. API generates a signed URL (valid 60 seconds) for the current media
4. Browser downloads and displays the media fullscreen
5. When booking ends, the API returns 'nothing to display' and screen switches to the default image
6. Process repeats for next scheduled booking


