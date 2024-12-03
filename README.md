#  Music Matcher

## Overview
MusicMatcher is a web application designed to connect users based on their music preferences. By integrating with Spotify’s API, users can link their Spotify accounts through OAuth to create personalized profiles showcasing their listening history.

## Features
- **User Profile Creation**: Users can build a profile displaying their music taste, generated from Spotify listening data.
- **Music Taste Analytics**: The app visualizes listening statistics using interactive charts and graphics.
- **User Matching**: Matches users with similar music tastes based on their listening history, enabling them to discover other listeners with shared interests.
- **Profile Exploration**: Users can view the profiles of their matches and explore their music preferences to find new songs and artists.

## Tech Stack
- **Frontend**: JavaScript, vite, libraries like Recharts for data visualization.
- **Backend**: Firebase for storing and using user data
- **API Integration**: Spotify API for obtaining user data.

## Installation
To run the project locally, clone the repository and install dependencies:
```bash
# Clone the repo
git clone https://github.com/cis3296f24/MusicMatcher

# Navigate into the project directory
cd MusicMatcher/musicmatcher

# Install dependencies
npm install
npm install firebase
If Vite is not installed globally (optional), install it:
npm install -g vite

# Start the development server
npm run dev
```
# Open the WebApp
In your browser, visit: http://localhost:5173/

## License
This project is open-source and available under the MIT License.
