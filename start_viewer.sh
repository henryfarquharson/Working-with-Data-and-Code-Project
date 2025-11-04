# unclutter keeps the display clean and distraction free
unclutter -idle 1 -root &
# Waits 2 seconds to ensure all display services before laucnhing the image viewer
sleep 2
# Open the image viewer 'feh' in fullscreen mode with no cursor and reloads the current picture every second
feh --fullscreen --auto-zoom --hide-pointer --reload 1 /home/henry/player/assets/current.jpg
