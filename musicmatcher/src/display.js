export function displayUserInfo(user){
    populateUI(user.profile);
    showTopArtists(user.topArtists);
    showTopSongs(user.topSongs);
}

export function showMatches(user) {
    document.getElementById("displaymatches").innerHTML = "";

    const matchCarousel = document.createElement("div");
    matchCarousel.classList.add("match-carousel");

    for (let match in user.matches) {
        console.log(`CHECKING: ${user.matches[match].name}`);
        const matchBox = document.createElement("div");
        matchBox.style.display = "flex";
        matchBox.style.flexDirection = "column";
        matchBox.style.alignItems = "center";
        matchBox.classList.add("match-carousel-item");
        matchBox.classList.add("scrollable-carousel");
        matchCarousel.appendChild(matchBox);

        const matchedUser = document.createElement("div");
        matchedUser.classList.add("matched-user");
        matchBox.appendChild(matchedUser);

        const userLink = document.createElement("a");
        userLink.href = `https://open.spotify.com/user/${match}`;
        matchBox.appendChild(userLink);

        const matchName = document.createElement("h2");
        matchName.textContent = user.matches[match].name;
        userLink.appendChild(matchName);
        matchBox.append(userLink);

        const matchMsg = document.createElement("h2");
        matchMsg.textContent = `You and ${user.matches[match].name} both like:`;
        matchBox.appendChild(matchMsg)

        if (user.matches[match].artistMatches.length > 0) {
            displayArtists(user.matches[match].artistMatches, matchBox);
        } 

        if (user.matches[match].songMatches.length > 0) {
            displaySongs(user.matches[match].songMatches, matchBox);
        }

        const followButton = document.createElement("button");
        followButton.style.maxWidth = "200px";
        followButton.classList.add("pill-button");
        followButton.textContent = `Follow ${user.matches[match].name}`;
        followButton.addEventListener("click", () => followUser(match));
        matchBox.appendChild(followButton);
    }
    document.getElementById("displaymatches").appendChild(matchCarousel);
}

function displayArtists(artists, htmlContainer) {
    artists.forEach(artist => {
        // Create a container for the artist
        const artistContainer = document.createElement("div");
        artistContainer.classList.add("artist-container");

        // Create the clickable link for the artist
        const artistLink = document.createElement("a");
        artistLink.href = `https://open.spotify.com/artist/${artist.spotifyID}`;
        artistLink.target = "_blank"; // Opens in a new tab
        artistLink.rel = "noopener noreferrer"; // Security best practice
        artistContainer.appendChild(artistLink);

        // Add artist image to the link
        const artistImage = document.createElement("img");
        artistImage.classList.add("artist-image");
        artistImage.src = artist.image;
        artistImage.alt = artist.name;
        artistImage.style.width = "30%";
        artistLink.appendChild(artistImage);

        // Add artist name under the link
        const artistName = document.createElement("h3");
        artistName.classList.add("artist-name");
        artistName.textContent = artist.name;
        artistContainer.appendChild(artistName);

        htmlContainer.appendChild(artistContainer);
    });
}

function displaySongs(songs, htmlContainer) {
    songs.forEach(song => {
        // Create a container for the song
        const songContainer = document.createElement("div");
        songContainer.classList.add("song-container");

        // Create the clickable link for the song
        const songLink = document.createElement("a");
        songLink.href = `https://open.spotify.com/track/${song.spotifyID}`;
        songLink.target = "_blank"; // Opens in a new tab
        songLink.rel = "noopener noreferrer"; // Security best practice
        songContainer.appendChild(songLink);

        // Add song name to the link
        const songName = document.createElement("h3");
        songName.classList.add("song-name");
        songName.textContent = `${song.name} by ${song.artist}`;
        songLink.appendChild(songName);

        htmlContainer.appendChild(songContainer);
    });
}

function showTopArtists(topArtists) {
    const topArtistsContainer = document.getElementById("topArtistsScrollable");
    topArtistsContainer.innerHTML = ""; // Clear any existing content

    if (topArtists.items.length === 0) {
        topArtistsContainer.innerText = "No artists found";
    } else {
        topArtists.items.forEach(artist => {
            // Create a container for each artist
            const artistItem = document.createElement("div");
            artistItem.classList.add("artist-item");

            // Create the clickable link for the artist
            const artistLink = document.createElement("a");
            artistLink.href = artist.external_urls.spotify;
            artistLink.target = "_blank"; // Opens in a new tab
            artistLink.rel = "noopener noreferrer"; // Security best practice
            artistItem.appendChild(artistLink);

            // Add artist image to the link
            const artistImage = document.createElement("img");
            artistImage.classList.add("artist-image");
            artistImage.src = artist.images[0]?.url || 'placeholder.jpg';
            artistImage.alt = artist.name;
            artistLink.appendChild(artistImage);

            // Add artist name under the link
            const artistName = document.createElement("span");
            artistName.classList.add("artist-name");
            artistName.textContent = artist.name;
            artistItem.appendChild(artistName);

            topArtistsContainer.appendChild(artistItem);
        });
    }
}

function showTopSongs(topSongs) {
    const topSongsContainer = document.getElementById("topSongsScrollable");
    topSongsContainer.innerHTML = ""; // Clear any existing content

    if (topSongs.items.length === 0) {
        topSongsContainer.innerText = "No songs found";
    } else {
        topSongs.items.forEach(song => {
            // Create a container for each song
            const songItem = document.createElement("div");
            songItem.classList.add("song-item");

            // Create the clickable link for the song
            const songLink = document.createElement("a");
            songLink.href = song.external_urls.spotify;
            songLink.target = "_blank"; // Opens in a new tab
            songLink.rel = "noopener noreferrer"; // Security best practice
            songItem.appendChild(songLink);

            // Add song cover image to the link
            const songCover = document.createElement("img");
            songCover.classList.add("song-cover");
            songCover.src = song.album.images[0]?.url || 'placeholder.jpg';
            songCover.alt = song.name;
            songLink.appendChild(songCover);

            // Add song name and artist below the link
            const songInfo = document.createElement("div");
            songInfo.classList.add("song-info");
            songInfo.innerHTML = `<span>${song.name}</span> <span>${song.artists[0].name}</span>`;
            songItem.appendChild(songInfo);

            topSongsContainer.appendChild(songItem);
        });
    }
}


async function followUser(userID) {
    const followURL = `https://api.spotify.com/v1/me/following?type=user&ids=${userID}`;
    fetch(followURL, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.spotifyAccessToken}`,
        }
      })
      .then(response => {
        console.log(response);
      });
}

export function populateUI(profile) {
    /* Display user's data in the UI */
    
    // Get the container where you want to display the profile picture and username
    const displayNameContainer = document.getElementById("displayName");
    //const avatarContainer = document.getElementById("avatar");

    // Clear previous content
    displayNameContainer.innerHTML = "";
    //avatarContainer.innerHTML = "";

    displayNameContainer.innerText = profile.display_name;
}

export function showUserData(user) {
    // Clear previous matches displayed
    document.getElementById("displaymatches").innerHTML = "";

    // Create a container to hold all match containers
    const scrollableContainer = document.createElement("div");
    scrollableContainer.classList.add("horizontal-scrollable");
        // If there's any match, display it
        if (user.matches) {
            let artistsInCommon = [];
            let songsInCommon = [];
        //if (artistsInCommon.length > 0 || songsInCommon.length > 0) {
            // Create a container for the match information
            const matchContainer = document.createElement("div");
            matchContainer.classList.add("match-container");

            // Add the matched user's name
            const userNameHeading = document.createElement("h4");
            userNameHeading.textContent = `${user.displayName} also likes:`;
            matchContainer.appendChild(userNameHeading);

            // Add matched artist pictures and names
            console.log(user.matches);

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
            // Append the scrollable container to the display matches section
    document.getElementById("displaymatches").appendChild(scrollableContainer);
    }



