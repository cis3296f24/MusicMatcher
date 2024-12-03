import { user } from './user_data.js';

import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get } from "firebase/database"

const firebaseConfig = {
    apiKey: "AIzaSyDraqYDDgFC5TW6EQCiSyFTVinLvJ3UvPc",
    authDomain: "musicmatcherdb.firebaseapp.com",
    databaseURL: "https://musicmatcherdb-default-rtdb.firebaseio.com/",
    projectId: "musicmatcherdb",
    storageBucket: "musicmatcherdb.appspot.com",
};

const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

/* Store data in firebase database  */
export async function storeUserData() {
    const userReference = ref(database, 'users/' + user.id);

    /////////
    if (!user.topArtists || !user.topSongs) {
        console.log("not enough listening history");
        return;
    }

    await set(userReference, {
        displayName: user.name,
        link: user.profile_link,
        pfpURL: user.pfpURL,
        topArtistsList: user.topArtists.items.map(artist => ({ name: artist.name, link: artist.href })),
        topSongsList: user.topSongs.items.map(song => ({
            name: song.name,
            artist: song.artists[0].name,
            spotifyID: song.id
        })),
    });

    console.log("gets here");
    console.log("stored user data in firebase.");
}

export async function findMatches() {
    const usersReference = ref(database, 'users');
    const snapshot = await get(usersReference);

    if (!snapshot.exists()) {
        console.log("Could not get snapshot of user data");
        return;
    }

    const allUserData = snapshot.val();
    for (let otherUser in allUserData) {
        /* Skip current user */
        if (otherUser === user.id) {
            continue;
        }

        let artistsInCommon = [];
        let songsInCommon = [];

        // Find artists in common
        for (let artist of user.topArtists.items) {
            if (allUserData[otherUser].topArtistsList) {
                if (allUserData[otherUser].topArtistsList
                    .some(item => item.name == artist.name)) {
                        let artistData = {"name": artist.name,
                                          "spotifyID": artist.id,
                                          "image": artist.images[0].url}
                    artistsInCommon.push(artistData);
                }
            }
        }

        // Find songs in common
        for (let song of user.topSongs.items) {
            if (allUserData[otherUser].topSongsList) {
                if (allUserData[otherUser].topSongsList
                    .some(item => item.name == song.name 
                    && item.artist == song.artists[0].name)) {
                        let songData = {"name": song.name,
                                        "artist": song.artists[0].name,
                                        "spotifyID": song.id}
                        songsInCommon.push(songData);
                }
            }
        }

        /* Create and fill "matches" JSON object in the user object */
        if (artistsInCommon.length > 0 || songsInCommon.length > 0) {
            let matchUserID = otherUser;
            user.matches[matchUserID] = {"name": allUserData[otherUser].displayName,
                                        "pfp": "placeholderpfp.png",
                                        "songMatches": songsInCommon,
                                        "artistMatches": artistsInCommon,
                                        "link": allUserData[otherUser].link,
                                        };
            if (allUserData[otherUser].pfpURL?.url) {
                user.matches[matchUserID].pfp = allUserData[otherUser].pfpURL.url;
            }
        }
    }
}