# curateme-server
A server to power curate.me

# API Endpoint Reference
The following endpoints are available to get data from a firebase server that is initialized in app.js.
Base API URI
    http://localhost:port/api/

## Public Endpoints
These endpoints can be used without authentication. No user login is required.

### /api/playlist
Used to retrieve a public playlist.

**GET**

*Parameters*

* playlist_key - must match the firebase key for the given playlist.

### /api/users/playlists
Used to retrieve all of the public playlists for a user.

**GET**

*Parameters*

* user_key - must match the firebase key for the given user.


## Login-In Required Endpoints
These endpoints can only be used if the user is logged in.

### /api/playlist/suggest
Used to post suggestions to a public playlist.

**POST**

*Parameters*

* playlist_key - must match the firebase key for the given playlist.


## Private Endpoints
These endpoints require authentication, and are for getting and posting data for/from the logged in user.

The following header must be sent to verify the user:
    "Authentication": "Bearer {token}"

### /api/me/profile
Used to retrieve the profile of the logged-in user.

### /api/me/playlists
Used to retrieve the playlists of the logged-in user. This endpoint should be used over the /api/users/playlists endpoint to ensure that private playlists are grabbed as well as public ones.