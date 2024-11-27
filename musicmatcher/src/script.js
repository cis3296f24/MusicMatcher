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

/* Getting and displaying user's Spotify stats */
if (!code) {
    redirectToAuthCodeFlow(clientID);
} else {
    accessToken = await getAccessToken(clientID, code);
    profile = await fetchProfile(accessToken);
    topArtists = await getTopArtists(accessToken);
    topSongs = await getTopSongs(accessToken);
    populateUI(profile);
    showTopArtists(topArtists);
    showTopSongs(topSongs);

    /* Store data in Firebase */
    userID = profile.id;
    displayName = profile.display_name;
    await storeTopLists(userID, displayName, topArtists, topSongs);
}

/* Helper Functions */
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

function generateCodeVerifier(length) {
    let text = "";
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
}

async function generateCodeChallenge(codeVerifier) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest("SHA-256", data);

    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
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
        body: params,
    });

    const { access_token } = await result.json();
    return access_token;
}

async function fetchProfile(token) {
    const result = await fetch("https://api.spotify.com/v1/me", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
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
        headers: { Authorization: `Bearer ${token}` },
    });

    return await result.json();
}

function showTopArtists(topArtists) {
    const topArtistsList = document.getElementById("topArtistsList");
    topArtistsList.innerHTML = "";

    if (topArtists.items.length === 0) {
        document.getElementById("topArtistsList").innerText = "No artists found";
    } else {
        const artistCount = Math.min(topArtists.items.length, 10);
        for (let i = 0; i < artistCount; i++) {
            const artist = topArtists.items[i];
            const listItem = document.createElement("li");
            listItem.innerText = artist.name;
            topArtistsList.appendChild(listItem);
        }
    }
}

async function getTopSongs(token) {
    const result = await fetch("https://api.spotify.com/v1/me/top/tracks", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
    });

    return await result.json();
}

function showTopSongs(topSongs) {
    const topSongsList = document.getElementById("topSongsList");
    topSongsList.innerHTML = "";

    if (topSongs.items.length === 0) {
        document.getElementById("topSongsList").innerText = "No songs found";
    } else {
        const songCount = Math.min(topSongs.items.length, 10);
        for (let i = 0; i < songCount; i++) {
            const song = topSongs.items[i];
            const listItem = document.createElement("li");
            listItem.innerText = `${song.name} by ${song.artists[0].name}`;
            topSongsList.appendChild(listItem);
        }
    }
}

function populateUI(profile) {
    document.getElementById("displayName").innerText = profile.display_name;
    if (profile.images[0]) {
        const profileImage = new Image(200, 200);
        profileImage.src = profile.images[0].url;
        document.getElementById("avatar").appendChild(profileImage);
    }
}

async function storeTopLists(userID, displayName, topArtistsList, topSongsList) {
    const userReference = ref(database, "users/" + userID);

    await set(userReference, {
        displayName: displayName,
        topArtistsList: topArtistsList.items.map((artist) => ({ name: artist.name })),
        topSongsList: topSongsList.items.map((song) => ({
            name: song.name,
            artist: song.artists[0].name,
        })),
    });
    console.log("Stored top artists and songs in Firebase.");
}

/* Find matches in the database who like the same song(s) and/or artist(s) */
document.getElementById("findMatchesButton").addEventListener("click", async () => {
    const userID = profile.id;

    await findMatches(userID, topArtists, topSongs);
});

async function findMatches(userID, topArtists, topSongs) {
    const usersReference = ref(database, "users");
    const snapshot = await get(usersReference);

    if (!snapshot.exists()) {
        console.log("Could not get snapshot of user data");
        return;
    }

    const allUserData = snapshot.val();
    const matchesContainer = document.getElementById("displaymatches");
    matchesContainer.innerHTML = ""; // Clear previous matches

    for (let userKey in allUserData) {
        const user = allUserData[userKey];

        if (userKey === userID) {
            continue;
        }

        let artistsInCommon = [];
        let songsInCommon = [];

        for (let artist of topArtists.items) {
            if (user.topArtistsList && user.topArtistsList.some((item) => item.name === artist.name)) {
                artistsInCommon.push(artist.name);
            }
        }

        for (let song of topSongs.items) {
            if (
                user.topSongsList &&
                user.topSongsList.some((item) => item.name === song.name && item.artist === song.artists[0].name)
            ) {
                songsInCommon.push(`${song.name} by ${song.artists[0].name}`);
            }
        }

        if (artistsInCommon.length > 0 || songsInCommon.length > 0) {
            let matchInfo = `${user.displayName} also likes:\n`;

            if (artistsInCommon.length > 0) {
                matchInfo += `\n - ${artistsInCommon.join(", ")}`;
            }

            if (songsInCommon.length > 0) {
                matchInfo += `\n - ${songsInCommon.join(", ")}`;
            }

            const matchElement = document.createElement("div");
            matchElement.textContent = matchInfo;
            matchesContainer.appendChild(matchElement);
        }
    }
}