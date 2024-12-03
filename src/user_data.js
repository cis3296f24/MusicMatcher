export const user = {
    name: null,
    id: null,
    profile: null, 
    pfpURL: null,
    topArtists: null,
    topSongs: null, 
    profile_link: null,
    matches: {} /* JSON object to store all match info */
}

async function fetchProfile(token) {
    /* calls API to get user data  */
    let result = null;

    try {
        result = await fetch("https://api.spotify.com/v1/me", {
            method: "GET", headers: { Authorization: `Bearer ${token}` }
        });

        if (result.ok) {
            return await result.json(); 
        } else {
            const errorMessage = await result.text();
            console.error("Could not fetch profile:", errorMessage);
            return null;
        }

    } catch(error) {
        window.location.reload();
    }
}

async function getTopArtists(token) {
    const result = await fetch("https://api.spotify.com/v1/me/top/artists", {
	    method: "GET", headers: { Authorization:`Bearer ${token}` }
    });

    return await result.json();
}

async function getTopSongs(token) {
    const result = await fetch("https://api.spotify.com/v1/me/top/tracks", {
	    method: "GET", headers: { Authorization:`Bearer ${token}` }
    });

    return await result.json();
}

export async function getUserData() {
    console.log(`localStorage.spotifyAccessToken: ${localStorage.spotifyAccessToken}`);
    if (localStorage.spotifyAccessToken) {
        user.profile = await fetchProfile(localStorage.spotifyAccessToken);
        user.name = user.profile.display_name;
        console.log(`in getUserData, display name: ${user.name}`);
        user.id = user.profile.id;
        user.topArtists = await getTopArtists(localStorage.spotifyAccessToken);
        user.topSongs = await getTopSongs(localStorage.spotifyAccessToken);
        user.profile_link = `https://open.spotify.com/user/${user.profile.id}`;
    
        if (user.profile.images && user.profile.images[0]) {
            user.pfpURL = user.profile.images[0];
        }

    } else {
        return false;
    }
}
