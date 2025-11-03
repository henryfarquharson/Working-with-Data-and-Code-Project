# Introduction: Graffiti Wall 
Graffiti Wall is my project prototype and uses a Raspberry Pi to communicate with the Graffiti Wall website to display advertisments and content on large digital screens. You can watch the demo video here 
## Overview
I built a website that uses a supabase backend to store the users details, their content and display information e.g. duration and location. The Raspberry Pi is the 'middle man', polling the backend each 20 secs to look for new content and then displaying this information on the correct screen
## The Goal
To reduce the barrier to outdoor advertising allowing companies and people to expose their content and brand to thousands of people without having to agree to long contracts and spend large amounts of money. 
## How it works
Users upload media through the Graffiti Wall website which is connected to the supabase backend. 
Then the Raspberry Pi polls the Supabase API, retrieves the display content in a JSON format, and shows it in fullscreen kiosk mode via Chromium.
A fallback image is displayed when no content is available.
# The Tech Stack
Raspberry Pi 4B: The core of the prototype communicating with the backend and displaying images
Supabase: The backend where all the content and ad details are stored
Chromium Browser: displays the advertisments in full screen on the display
Linx Operating System: The Raspberry Pi Operating System
VNC Viewer: The application used to view the Raspberry Pi destop
# The Main Features
- Polling Feature: Every 20 seconds the Raspberry Pi 'polls' the Playlist API checking for new media. This ensures that ads appear and end on time.
- The Fallback image: If no content is scheduled a fallback image appears to maintain display activity giving the screen a professional look
- Rebooting feature: If the script or the Raspberry Pi shuts down for any reason the player script uses a systemd service to reboot the script
- Secrets in the environment: API and display IDs have been loaded into the environment keeping them safe and allows for quick environment changes if these scecrets change.
- Kisok Mode: The Raspberry Pi will automically load images/videos in a Chromium Browser
- JSON Data returned from the backend: The data sent from the supabase backend has been formatted to ensure ease of communication between the backend and the Raspberry Pi
- Remote Access via SSH: The Raspberry Pi support secure shell allowing users to access the desopt of the Raspberry Pi through their own terminal by ssh into the device.
# Author
Henry Farquharson

henry.d.farquharson@student.uts.edu.au

Please contact me if you have any questions or issues with the assignment. Thank you !

