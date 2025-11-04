# Itroduction: Graffiti Wall 
Graffiti Wall is my project prototype and uses a Raspberry Pi to communicate with the Graffiti Wall website to display advertisments and content on large digital screens. You can watch the demo video here https://youtu.be/mtNwoBIObh8
# Table of contents
- Overview
- The Miro Project Journal Link
- The Goal
- How it works
- Explainer Video
- The Tech Stack
- The Main Features
- How to use the prototype
- Room for Improvement
- Ackowledgements
- Author
## Overview
I built a website that uses a supabase backend to store the users details, their content and display information e.g. duration and location. The Raspberry Pi is the 'middle man', polling the backend each 20 secs to look for new content and then displaying this information on the correct screen
## The Miro project journal Link
https://miro.com/app/board/uXjVJKRztI0=/?share_link_id=399250784994
### The Goal
To reduce the barrier to outdoor advertising allowing companies and people to expose their content and brand to thousands of people without having to agree to long contracts and spend large amounts of money. 
### How it works
Users upload media through the Graffiti Wall website which is connected to the supabase backend. 
Then the Raspberry Pi polls the Supabase API, retrieves the display content in a JSON format, and shows it in fullscreen kiosk mode via Chromium.
A fallback image is displayed when no content is available.
## Explainer Video
In case there is any issues here is my explainer video https://youtu.be/-2OsFr4EoSs
## The Tech Stack
Raspberry Pi 4B: The core of the prototype communicating with the backend and displaying images
Supabase: The backend where all the content and ad details are stored
Chromium Browser: displays the advertisments in full screen on the display
Linx Operating System: The Raspberry Pi Operating System
VNC Viewer: The application used to view the Raspberry Pi destop
## The Main Features
- Polling Feature: Every 20 seconds the Raspberry Pi 'polls' the Playlist API checking for new media. This ensures that ads appear and end on time.
- The Fallback image: If no content is scheduled a fallback image appears to maintain display activity giving the screen a professional look
- Rebooting feature: If the script or the Raspberry Pi shuts down for any reason the player script uses a systemd service to reboot the script
- Secrets in the environment: API and display IDs have been loaded into the environment keeping them safe and allows for quick environment changes if these scecrets change.
- Kisok Mode: The Raspberry Pi will automically load images/videos in a Chromium Browser
- JSON Data returned from the backend: The data sent from the supabase backend has been formatted to ensure ease of communication between the backend and the Raspberry Pi
- Remote Access via SSH: The Raspberry Pi support secure shell allowing users to access the desopt of the Raspberry Pi through their own terminal by ssh into the device.
## How to use the Prototype
- Step 1: go to https://graffitiwall.info/
- Step 2: Create a profile
- Step 3: Upload your content and choose the time/duration
- Step 4: Connect to the Raspberry Pi desktop
- Step 5: See you ad displayed
## Room for improvement
- When the display switches to the next ad a fade transition could be put in placed to make the flow look more smooth and professional
- The display needs to be able to support video content
- The user experience could be improved to allow users to upload multiple ads at once
- Users could have the option to refine the start and finish time with a seconds button
- There could be a sound option to play video with soud coming through the screen
- The fallback image could be an advertisment promoting the digital ad space on the screen
## Acknowledgements
To my tutor Anna and the course leader Andrew who have signicantly helped bring this prototype to life. Thank you so much!
## Author
Henry Farquharson

henry.d.farquharson@student.uts.edu.au

Please contact me if you have any questions or issues with the assignment. Thank you !

