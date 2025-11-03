# Introduction: Graffiti Wall 
Graffiti Wall is my project prototype and uses a Raspberry Pi to communicate with the Graffiti Wall website to display advertisments and content on large digital screens.
## Overview
I built a website that uses a supabase backend to store the users details, their content and display information e.g. duration and location. The Raspberry Pi is the 'middle man', polling the backend each 20 secs to look for new content and then displaying this information on the correct screen
## The Goal
To reduce the barrier to outdoor advertising allowing companies and people to expose their content and brand to thousands of people without having to agree to long contracts and spend large amounts of money. 
## How it works
Users upload media through the Graffiti Wall website which is connected to the supabase backend. 
Then the Raspberry Pi polls the Supabase API, retrieves the display content in a JSON format, and shows it in fullscreen kiosk mode via Chromium.
A fallback image is displayed when no content is available.

