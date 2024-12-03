import * as userData from './user_data.js';

export const clientID = "9f79956a03b04bcfb5df0ff2a5a78059";
//export const redirectURI = "https://localhost:5173/callback";
export const redirectURI = "https://musicmatcherdb.web.app/callback";
const scope = "user-read-private user-read-email user-top-read user-follow-modify user-modify-playback-state";
const authURL = new URL("https://accounts.spotify.com/authorize");

let accessToken = localStorage.getItem("spotifyAccessToken");
let refreshToken = localStorage.getItem("spotifyRefreshToken");

export async function authorize() {
    let urlParams = new URLSearchParams(window.location.search);
    let code = urlParams.get('code');

    if (code) {
        console.log("found code");
        window.history.replaceState({}, document.title, window.location.pathname);
        await getAccessToken(clientID, code);
    } else if (accessToken && await tokenValid(accessToken)) {
    } else if (refreshToken && await tokenValid(refreshToken)) {
        await refreshAccessToken(refreshToken);
    } else {
        await requestAuthorization(clientID);
    }   
}

export async function requestAuthorization(clientID) {
    const verifier = generateCodeVerifier(128);
    localStorage.setItem('verifier', verifier);

    const challenge = await generateCodeChallenge(verifier);

    const params = {
        response_type: 'code',
        client_id: clientID,
        scope, 
        code_challenge_method: 'S256',
        code_challenge: challenge,
        redirect_uri: redirectURI,
    };

    authURL.search = new URLSearchParams(params).toString();
    console.log(`authURL: ${authURL}`);
    window.location.href = authURL.toString();
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
    console.log(`code: ${code}`);
    const verifier = localStorage.getItem("verifier");

    const payload = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: clientID,
            grant_type: 'authorization_code',
            code,
            redirect_uri: '/spotify/authorize',
            code_verifier: verifier,
        }),
    }

    let response

    try {
        response = await fetch('/spotify/api/token', payload);
    }
        // spority api offline?
    catch (error) {
        throw new Error(`Error fetching Spotify Access Token: ${error}`);
    }

    // spotify api error?
    if (!response.ok) {
        throw new Error(`Spotify Access Token HTTP error! ${response.status}`);
    }
    // spotify api not JSON?
    try{
        const data = await response.json();
        localStorage.setItem("spotifyAccessToken", data.access_token);
        localStorage.setItem("spotifyRefreshToken", data.refresh_token);
        console.log("Spotify Access Token Saved!");
    }
    catch (error){
        throw new Error(`Spotify Access Token not JSON?: ${response.text()}`);
    }
}



async function refreshAccessToken(refreshToken) {
    const url = "/spotifyapi/token";

    const payload = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: clientID
        }),
    }

    const body = await fetch(url, payload);
    const response = await body.json();

    if (response.ok) {
        localStorage.setItem('spotifyAccessToken', response.access_token);
        if (response.refresh_token) {
            localStorage.setItem('spotifyRefreshToken', response.refresh_token);
        }
    } else {
        console.log("could not refresh token");
    }

    
}

export async function tokenValid(token) {
    const result = await fetch("https://api.spotify.com/v1/me", {
        method: "GET", 
        headers: { Authorization: `Bearer ${token}` }
    });

    return result.ok;
}

export function logout() {
    Object.keys(userData.user).forEach(key => userData.user[key] = null);
    localStorage.clear();
    sessionStorage.clear();
    requestAuthorization(clientID);
    window.location.reload();
}

