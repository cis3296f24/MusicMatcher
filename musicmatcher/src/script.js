/* for Spotify */
const clientID = "9f79956a03b04bcfb5df0ff2a5a78059";
const params = new URLSearchParams(window.location.search);
const code = params.get("code");

/* for Firebase */
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyDraqYDDgFC5TW6EQCiSyFTVinLvJ3UvPc",
    authDomain: "musicmatcherdb.firebaseapp.com",
    databaseURL: "https://musicmatcherdb-default-rtdb.firebaseio.com/",
    projectId: "musicmatcherdb",
    storageBucket: "musicmatcherdb.appspot.com",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

let accessToken, profile, topArtists, topSongs, userID, displayName;

/* Main logic */
document.addEventListener("DOMContentLoaded", async () => {
    try {
        console.log("Page loaded. Checking local storage for cached data...");
        
        // Retrieve cached data from local storage
        const cachedTopArtists = JSON.parse(localStorage.getItem("topArtists"));
        const cachedTopSongs = JSON.parse(localStorage.getItem("topSongs"));

        if (cachedTopArtists && cachedTopSongs) {
            console.log("Found cached data:", { cachedTopArtists, cachedTopSongs });
            showTopArtists(cachedTopArtists);
            showTopSongs(cachedTopSongs);
        } else {
            console.log("No cached data found. Fetching from Spotify API...");

            if (!code) {
                redirectToAuthCodeFlow(clientID);
                return; // Exit if redirecting
            }

            // Fetch Spotify data
            accessToken = await getAccessToken(clientID, code);
            profile = await fetchProfile(accessToken);

            if (!profile) {
                throw new Error("Failed to fetch profile.");
            }

            topArtists = await getTopArtists(accessToken);
            topSongs = await getTopSongs(accessToken);

            // Cache the fetched data
            localStorage.setItem("topArtists", JSON.stringify(topArtists));
            localStorage.setItem("topSongs", JSON.stringify(topSongs));

            console.log("Data fetched and cached:", { topArtists, topSongs });

            // Populate UI with fetched data
            populateUI(profile);
            showTopArtists(topArtists);
            showTopSongs(topSongs);

            // Store data in Firebase
            userID = profile.id;
            displayName = profile.display_name;
            await storeTopLists(userID, displayName, topArtists, topSongs);
        }
    } catch (error) {
        console.error("Error during initialization:", error);
    }
});

/* Redirects to Spotify authorization */
export async function redirectToAuthCodeFlow(clientID) {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientID);
    params.append("response_type", "code");
    params.append("redirect_uri", "http://localhost:5173/callback");
    params.append("scope", "user-read-private user-read-email user-top-read");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

/* Helper functions for Spotify API */
function generateCodeVerifier(length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

async function generateCodeChallenge(codeVerifier) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);

    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

export async function getAccessToken(clientID, code) {
    const verifier = localStorage.getItem("verifier");

    const params = new URLSearchParams();
    params.append("client_id", clientID);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", "http://localhost:5173/callback");
    params.append("code_verifier", verifier);

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    const { access_token } = await result.json();
    return access_token;
}

async function fetchProfile(token) {
    const result = await fetch("https://api.spotify.com/v1/me", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!result.ok) {
        const errorMessage = await result.text();
        console.error("Could not fetch profile:", errorMessage);
        return null;
    }

    return await result.json();
}

async function getTopArtists(token) {
    const result = await fetch("https://api.spotify.com/v1/me/top/artists", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}

async function getTopSongs(token) {
    const result = await fetch("https://api.spotify.com/v1/me/top/tracks", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}

/* UI population */
function populateUI(profile) {
    document.getElementById("displayName").innerText = profile.display_name;
    if (profile.images[0]) {
        const profileImage = new Image(200, 200);
        profileImage.src = profile.images[0].url;
        document.getElementById("avatar").appendChild(profileImage);
    }
}

function showTopArtists(topArtists) {
    const container = document.getElementById("topArtistsContainer");
    container.innerHTML = "";
    if (!topArtists.items || topArtists.items.length === 0) {
        container.innerText = "No artists found.";
        return;
    }
    topArtists.items.slice(0, 5).forEach(artist => {
        const artistDiv = document.createElement("div");
        artistDiv.className = "artist";

        const artistName = document.createElement("div");
        artistName.innerText = artist.name;

        if (artist.images && artist.images.length > 0) {
            const artistImage = document.createElement("img");
            artistImage.src = artist.images[0].url;
            artistImage.alt = artist.name;
            artistImage.style.width = "100px";
            artistImage.style.borderRadius = "50%";
            artistDiv.appendChild(artistImage);
        }

        artistDiv.appendChild(artistName);
        container.appendChild(artistDiv);
    });
}

function showTopSongs(topSongs) {
    const container = document.getElementById("topSongsContainer");
    container.innerHTML = "";
    if (!topSongs.items || topSongs.items.length === 0) {
        container.innerText = "No songs found.";
        return;
    }
    topSongs.items.slice(0, 5).forEach(song => {
        const songDiv = document.createElement("div");
        songDiv.className = "song";

        const songInfo = document.createElement("div");
        songInfo.innerText = `${song.name} by ${song.artists[0]?.name}`;

        if (song.album.images && song.album.images.length > 0) {
            const songImage = document.createElement("img");
            songImage.src = song.album.images[0].url;
            songImage.alt = song.name;
            songImage.style.width = "100px";
            songImage.style.borderRadius = "10px";
            songDiv.appendChild(songImage);
        }

        songDiv.appendChild(songInfo);
        container.appendChild(songDiv);
    });
}

/* Firebase integration */
async function storeTopLists(userID, displayName, topArtistsList, topSongsList) {
    const userReference = ref(database, 'users/' + userID);
    await set(userReference, {
        displayName: displayName,
        topArtistsList: topArtistsList.items.map(artist => ({ name: artist.name })),
        topSongsList: topSongsList.items.map(song => ({
            name: song.name,
            artist: song.artists[0].name
        }))
    });
    console.log("Stored top artists and songs in Firebase.");
}
