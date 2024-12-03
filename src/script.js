import * as authFlow from './authorization.js';
import * as userData from './user_data.js';
import * as firebaseDB from './db_management.js'
import * as display from './display.js'

/* Authorize (PKCE) once the page loads */
console.log("top of script.js");
window.addEventListener("load", async () => {
    if (!localStorage.spotifyAccessToken 
        || !authFlow.tokenValid(localStorage.spotifyAccessToken)) {
        console.log("!loc");
        await authFlow.authorize();
        await userData.getUserData();
        display.displayUserInfo(userData.user);
        await firebaseDB.storeUserData(userData.user);
    } else {
        console.log("yloc");
        await authFlow.authorize();
        await userData.getUserData();
        display.displayUserInfo(userData.user);
        await firebaseDB.storeUserData(userData.user);
    }
}); 

document.getElementById("logoutButton").addEventListener("click", () => authFlow.logout());

/* Find matches in the database who like the same song(s) and/or artist(s)  */
document.getElementById("findMatchesButton").addEventListener("click", async () => {
    document.getElementById("findMatchesButton").style.display = "none";
    await firebaseDB.findMatches();
    display.showMatches(userData.user);
    console.log(`user match: ${JSON.stringify(userData.user.matches)}`);
    
});






