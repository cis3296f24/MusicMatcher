/* for Spotify  */
const clientID = "9f79956a03b04bcfb5df0ff2a5a78059";
const params = new URLSearchParams(window.location.search);
const code = params.get("code");

/* for Firebase  */
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get } from "firebase/database"

const firebaseConfig = {
    apiKey: "AIzaSyDraqYDDgFC5TW6EQCiSyFTVinLvJ3UvPc",
    authDomain: "musicmatcherdb.firebaseapp.com",
    databaseURL: "https://musicmatcherdb-default-rtdb.firebaseio.com/",
    projectId: "musicmatcherdb",
    storageBucket: "musicmatcherdb.appspot.com",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

let accessToken, refreshToken, profile, topArtists, topSongs, userID, displayName;

async function tokenValid(token) {
    const result = await fetch("https://api.spotify.com/v1/me", {
        method: "GET", 
        headers: { Authorization: `Bearer ${token}` }
    });

    return result.ok;
}


/* Check if user is authenticated */
window.addEventListener("load", async () => {
    let accessToken = localStorage.getItem("spotifyAccessToken");
    let refreshToken = localStorage.getItem("spotifyRefreshToken");

    if (code) {
	accessToken = await getAccessToken(clientID, code);
	localStorage.setItem("spotifyAccessToken", accessToken);
	window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (accessToken && await tokenValid(accessToken)) {
	try {
	    profile = await fetchProfile(accessToken);
	    topArtists = await getTopArtists(accessToken);
	    topSongs = await getTopSongs(accessToken);
	    populateUI(profile);
	    showTopArtists(topArtists);
	    showTopSongs(topSongs);
	    userID = profile.id;
	    displayName = profile.display_name;

	    await storeTopLists(userID, displayName, topArtists, topSongs);
	    return;
	    
	} catch (error) {
	    console.error("Access token invalid", error);
	}
    }

    /* Did not have valid Spotify access token, check for refresh token  */
    if (refreshToken) {
	try {
	    const newAccessToken = await refreshAccessToken(refreshToken);
	    if (newAccessToken && await tokenValid(newAccessToken)) {
		localStorage.setItem("spotifyAccessToken", newAccessToken);
		profile = await fetchProfile(newAccessToken);
		topArtists = await getTopArtists(newAccessToken);
		topSongs = await getTopSongs(newAccessToken);
		populateUI(profile);
		showTopArtists(topArtists);
		showTopSongs(topSongs);
		userID = profile.id;
		displayName = profile.display_name;

		await storeTopLists(userID, displayName, topArtists, topSongs);
		return;
	    }
	} catch (error) {
	    console.error("Refresh token invalid.", error);
	}
    }
    
    /* No access token and no refresh token. Redirect to authorization screen */
    redirectToAuthCodeFlow(clientID);
});
    

export async function redirectToAuthCodeFlow(clientID) {
    /* Redirects to spotify authorization  */
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
    /* gets access code for token  */
    
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
    /* calls API to get user data  */

    const result = await fetch("https://api.spotify.com/v1/me", {
	method: "GET", headers: { Authorization: `Bearer ${token}` }
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
	method: "GET", headers: { Authorization:`Bearer ${token}` }
    });

    return await result.json();
}

function showTopArtists(topArtists) {
    const topArtistsContainer = document.getElementById("topArtistsScrollable");
    topArtistsContainer.innerHTML = ""; // Clear any existing content

    if (topArtists.items.length === 0) {
        topArtistsContainer.innerText = "No artists found";
    } else {
        topArtists.items.forEach(artist => {
            // Create container for each artist
            const artistItem = document.createElement("div");
            artistItem.classList.add("artist-item");

            // Create a clickable link for the artist
            const artistLink = document.createElement("a");
            artistLink.href = `https://open.spotify.com/artist/${artist.id}`;  // Link to artist's Spotify page
            artistLink.target = "_blank";  // Open in a new tab

            // Create image element for the artist profile
            const artistImage = document.createElement("img");
            artistImage.classList.add("artist-image");
            artistImage.src = artist.images[0]?.url || 'placeholder.jpg'; // Use artist image or placeholder

            // Append the image to the artist link
            artistLink.appendChild(artistImage);

            // Create a span for the artist name
            const artistName = document.createElement("span");
            artistName.classList.add("artist-name");
            artistName.textContent = artist.name;

            // Append the artist name to the link
            artistLink.appendChild(artistName);

            // Append the link to the artist item container
            artistItem.appendChild(artistLink);

            // Append the artist item to the container
            topArtistsContainer.appendChild(artistItem);
        });
    }
}


async function getTopSongs(token) {
    const result = await fetch("https://api.spotify.com/v1/me/top/tracks", {
	method: "GET", headers: { Authorization:`Bearer ${token}` }
    });

    return await result.json();
}

async function showTopSongs(topSongs) {
    const topSongsContainer = document.getElementById("topSongsScrollable");
    topSongsContainer.innerHTML = ""; // Clear any existing content

    if (topSongs.items.length === 0) {
        topSongsContainer.innerText = "No songs found";
    } else {
        topSongs.items.forEach(song => {
            // Create container for each song item
            const songItem = document.createElement("div");
            songItem.classList.add("song-item");

            // Create a clickable link for the song
            const songLink = document.createElement("a");
            songLink.href = `https://open.spotify.com/track/${song.id}`;  // Link to song's Spotify page
            songLink.target = "_blank";  // Open in a new tab

            // Create image element for the song cover
            const songCover = document.createElement("img");
            songCover.classList.add("song-cover");
            songCover.src = song.album.images[0]?.url || 'placeholder.jpg'; // Use song cover image or placeholder
            songLink.appendChild(songCover); // Append cover to the link

            // Create container for song information
            const songInfo = document.createElement("div");
            songInfo.classList.add("song-info");

            // Create a span for the song name
            const songName = document.createElement("span");
            songName.classList.add("song-name");
            songName.textContent = song.name;
            songInfo.appendChild(songName);

            // Create a span for the artist name
            const artistName = document.createElement("span");
            artistName.classList.add("artist-name");
            artistName.textContent = song.artists[0].name;
            songInfo.appendChild(artistName);

            // Create a span for the "Song" pill label
            const songPill = document.createElement("span");
            songPill.classList.add("song-pill");
            songPill.textContent = "Song";
            songInfo.appendChild(songPill);

            // Append song info to the link
            songLink.appendChild(songInfo);

            // Append the song link to the song item
            songItem.appendChild(songLink);

            // Append the song item to the container
            topSongsContainer.appendChild(songItem);
        });
    }
}

  function populateUI(profile) {
    /* Display user's data in the UI */
    
    // Get the container where you want to display the profile picture and username
    const displayNameContainer = document.getElementById("displayName");
    const avatarContainer = document.getElementById("avatar");

    // Clear previous content
    displayNameContainer.innerHTML = "";
    avatarContainer.innerHTML = "";

    // Display the user's Spotify name
    displayNameContainer.innerText = profile.display_name;

    // Check if the profile image exists
    if (profile.images && profile.images[0]) {
        // Create an image element for the profile picture
        const profileImage = new Image(100, 100); // Set the size of the profile picture
        profileImage.src = profile.images[0].url; // Set the image source to the profile image URL
        profileImage.alt = "Profile Image"; // Add alt text for accessibility

        // Style the profile picture (optional)
        profileImage.style.borderRadius = "50%"; // Make the profile image circular
        profileImage.style.marginBottom = "10px"; // Space between the image and name

        // Append the profile image to the avatar container
        avatarContainer.appendChild(profileImage);
    }

    // logic for  Spotify display name (if it's different from the username)
    const username = document.createElement("span");
    username.innerText = profile.display_name; // Username
    username.style.color = "white"; // Optional: Make sure the text color is visible
    avatarContainer.appendChild(username);
}

/* Store data in firebase database  */
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
    console.log("stored top artists and songs in firebase.");
}

/* Find matches in the database who like the same song(s) and/or artist(s)  */
document.getElementById("findMatchesButton").addEventListener("click", async () => {
    const userID = profile.id;

    await findMatches(userID, topArtists, topSongs);
});

async function findMatches(userID, topArtists, topSongs) {
    const usersReference = ref(database, 'users');
    const snapshot = await get(usersReference);

    if (!snapshot.exists()) {
        console.log("Could not get snapshot of user data");
        return;
    }

    const allUserData = snapshot.val();

    // Clear previous matches displayed
    document.getElementById("displaymatches").innerHTML = "";

    // Create a container to hold all match containers
    const scrollableContainer = document.createElement("div");
    scrollableContainer.classList.add("horizontal-scrollable");

    for (let userKey in allUserData) {
        const user = allUserData[userKey];

        // Skip the current user
        if (userKey == userID) {
            continue;
        }

        let artistsInCommon = [];
        let songsInCommon = [];

        // Find artists in common
        for (let artist of topArtists.items) {
            if (user.topArtistsList && user.topArtistsList.some(item => item.name == artist.name)) {
                artistsInCommon.push(artist);
            }
        }

        // Find songs in common
        for (let song of topSongs.items) {
            if (user.topSongsList && user.topSongsList.some(item => item.name == song.name && item.artist == song.artists[0].name)) {
                songsInCommon.push(song);
            }
        }

        // If there's any match, display it
        if (artistsInCommon.length > 0 || songsInCommon.length > 0) {
            // Create a container for the match information
            const matchContainer = document.createElement("div");
            matchContainer.classList.add("match-container");

            // Add the matched user's name
            const userNameHeading = document.createElement("h4");
            userNameHeading.textContent = `${user.displayName} also likes:`;
            matchContainer.appendChild(userNameHeading);

            // Add matched artist pictures and names
            if (artistsInCommon.length > 0) {
                const artistMatchesContainer = document.createElement("div");
                artistMatchesContainer.classList.add("artist-matches-container");

                artistsInCommon.forEach(artist => {
                    // Create a container for each artist match
                    const artistMatchItem = document.createElement("div");
                    artistMatchItem.classList.add("artist-item");

                    // Create a clickable link for the artist
                    const artistLink = document.createElement("a");
                    artistLink.href = `https://open.spotify.com/artist/${artist.id}`;  // Link to artist's Spotify page
                    artistLink.target = "_blank";  // Open in a new tab

                    // Create an image element for the artist
                    const artistImage = document.createElement("img");
                    artistImage.classList.add("artist-image");
                    artistImage.src = artist.images[0]?.url || 'placeholder.jpg'; // Use artist image or placeholder
                    artistLink.appendChild(artistImage);  // Add the image to the link

                    // Create a span for the artist name
                    const artistName = document.createElement("span");
                    artistName.classList.add("artist-name");
                    artistName.textContent = artist.name;
                    artistLink.appendChild(artistName);  // Add the name to the link

                    // Append the artist link to the artist item
                    artistMatchItem.appendChild(artistLink);

                    // Append the artist match item to the container
                    artistMatchesContainer.appendChild(artistMatchItem);
                });

                // Append artist matches to the match container
                matchContainer.appendChild(artistMatchesContainer);
            }

            // Add matched song details
            if (songsInCommon.length > 0) {
                const songMatchesContainer = document.createElement("div");
                songMatchesContainer.classList.add("song-matches-container");

                songsInCommon.forEach(song => {
                    const songInfo = document.createElement("p");
                    songInfo.textContent = `${song.name} by ${song.artists[0].name}`;
                    songMatchesContainer.appendChild(songInfo);
                });

                // Append song matches to the match container
                matchContainer.appendChild(songMatchesContainer);
            }

            // Append the match container to the scrollable container
            scrollableContainer.appendChild(matchContainer);
        }
    }

    // Append the scrollable container to the display matches section
    document.getElementById("displaymatches").appendChild(scrollableContainer);
}


