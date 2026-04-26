# ChromaWalk API Specification

**Version:** 1.0.0
**Base URL:** `/api`

---

## Authentication

ChromaWalk uses **Google OAuth 2.0** for authentication. The client obtains a Google ID token via the Google Sign-In flow, sends it to the server, and receives a **JWT** for subsequent API calls.

All authenticated endpoints require the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

### JWT Payload

| Field | Type | Description |
|-------|------|-------------|
| `sub` | string | Internal user ID (UUID) |
| `email` | string | Google account email |
| `username` | string | Display name |
| `iat` | number | Issued at (Unix timestamp) |
| `exp` | number | Expiration (Unix timestamp, 7 days from `iat`) |

---

## Data Models

### User

```yaml
User:
  type: object
  required: [id, email, username, level, points, nextLevelPoints, photosUploaded, missionsCompleted, avatarUrl, createdAt]
  properties:
    id:
      type: string
      format: uuid
      example: "550e8400-e29b-41d4-a716-446655440000"
    email:
      type: string
      format: email
      example: "colorhunter@gmail.com"
    username:
      type: string
      example: "colorhunter"
    level:
      type: integer
      example: 5
    points:
      type: integer
      example: 1240
    nextLevelPoints:
      type: integer
      example: 1500
    photosUploaded:
      type: integer
      example: 24
    missionsCompleted:
      type: integer
      example: 8
    avatarUrl:
      type: string
      format: uri
      example: "https://lh3.googleusercontent.com/a/example"
    createdAt:
      type: string
      format: date-time
```

### AuthTokens

```yaml
AuthTokens:
  type: object
  required: [accessToken, expiresIn, user]
  properties:
    accessToken:
      type: string
      description: JWT access token
    expiresIn:
      type: integer
      description: Token lifetime in seconds
      example: 604800
    user:
      $ref: "#/components/schemas/User"
```

### Photo

```yaml
Photo:
  type: object
  required: [id, imageUrl, color, location, lat, lng, likes, favorites, username, timestamp, comments]
  properties:
    id:
      type: string
      format: uuid
    imageUrl:
      type: string
      format: uri
    color:
      type: string
      description: App color category ID, determined by the frontend based on Vision API RGB data
      example: "red"
    location:
      type: string
      example: "Central Library"
    lat:
      type: number
      format: double
      example: 40.7589
    lng:
      type: number
      format: double
      example: -73.9851
    likes:
      type: integer
      example: 24
    favorites:
      type: integer
      example: 8
    username:
      type: string
      example: "colorhunter"
    timestamp:
      type: string
      format: date-time
    comments:
      type: integer
      example: 5
    liked:
      type: boolean
      description: Whether the current authenticated user has liked this photo
    favorited:
      type: boolean
      description: Whether the current authenticated user has favorited this photo
    caption:
      type: string
      example: "Beautiful sunset orange glow on the historic library building"
    userRole:
      type: string
      description: Display role/title for the uploader
      example: "Color Explorer"
    colorPalette:
      type: array
      description: Hex colors converted from Vision API RGB values by the frontend, sorted by dominance
      items:
        type: string
        pattern: "^#[0-9A-Fa-f]{6}$"
      example: ["#FF8A65", "#FF7043", "#FF5722", "#E64A19"]
    commentsList:
      type: array
      description: Only populated when fetching a single photo via GET /api/photos/:id
      items:
        $ref: "#/components/schemas/Comment"
```

### VisionColor

A single dominant color from the Google Cloud Vision API. The server receives RGB from Vision API, converts it to hex, and returns both. The frontend uses the hex values to map to the nearest app color category and to render color swatches.

```yaml
VisionColor:
  type: object
  required: [hex, score, pixelFraction]
  properties:
    hex:
      type: string
      pattern: "^#[0-9A-Fa-f]{6}$"
      description: Hex color converted from Vision API RGB by the server
      example: "#FF8A65"
    score:
      type: number
      format: float
      minimum: 0
      maximum: 1
      description: Vision API confidence score for this color
      example: 0.42
    pixelFraction:
      type: number
      format: float
      minimum: 0
      maximum: 1
      description: Fraction of pixels in the image matching this color
      example: 0.31
```

### Comment

```yaml
Comment:
  type: object
  required: [id, username, text]
  properties:
    id:
      type: string
    username:
      type: string
    text:
      type: string
    avatar:
      type: string
      format: uri
```

### Mission

```yaml
Mission:
  type: object
  required: [id, title, description, difficulty, reward, color]
  properties:
    id:
      type: string
    title:
      type: string
      example: "Find Blue Sky"
    description:
      type: string
    difficulty:
      type: string
      enum: [easy, medium, hard, legendary]
    reward:
      type: integer
      example: 40
    color:
      type: string
      example: "blue"
    location:
      type: string
    lat:
      type: number
      format: double
    lng:
      type: number
      format: double
    progress:
      type: integer
      example: 0
    total:
      type: integer
      example: 1
    completed:
      type: boolean
    teamMission:
      type: boolean
```

### Achievement

```yaml
Achievement:
  type: object
  required: [id, name, description, icon, unlocked, progress, total]
  properties:
    id:
      type: string
    name:
      type: string
      example: "Explorer"
    description:
      type: string
    icon:
      type: string
      example: "map-pin"
    unlocked:
      type: boolean
    progress:
      type: integer
    total:
      type: integer
```

### ColorInfo

```yaml
ColorInfo:
  type: object
  required: [id, name, category, hex, unlocked]
  properties:
    id:
      type: string
      example: "red"
    name:
      type: string
      example: "Sunset Orange"
    category:
      type: string
      enum: [WARM, NEUTRAL, EARTH, COOL, RARE]
    hex:
      type: string
      example: "#FF8A65"
    unlocked:
      type: boolean
    requiredLevel:
      type: integer
      description: Only present for rare/locked colors
```

### Error

All responses use HTTP `200` for business-logic errors, with an `error_code` field to indicate what went wrong. Only `403` (forbidden), `404` (not found), and `500` (server crash) use non-200 HTTP status codes.

```yaml
Error:
  type: object
  required: [error_code, message]
  properties:
    error_code:
      type: string
      example: "INVALID_TOKEN"
    message:
      type: string
      example: "Google ID token verification failed"
```

---

## API Routes

### Auth

#### `POST /api/auth/google`

Exchange a Google OAuth 2.0 ID token for a ChromaWalk JWT. Creates the user account on first login.

**When:** Called on the Welcome page after the user taps "Sign in with Google" and the Google SDK returns an ID token. This is the entry point for all new and returning users.

**Request Body:**

```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIs..."
}
```

**Response `200 OK`:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 604800,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "colorhunter@gmail.com",
    "username": "colorhunter",
    "level": 5,
    "points": 1240,
    "nextLevelPoints": 1500,
    "photosUploaded": 24,
    "missionsCompleted": 8,
    "avatarUrl": "https://lh3.googleusercontent.com/a/example",
    "createdAt": "2026-01-15T10:30:00Z"
  }
}
```

**Error response (HTTP 200 with `error_code`):**

```json
{
  "error_code": "INVALID_TOKEN",
  "message": "Google ID token verification failed"
}
```

| `error_code` | When |
|--------------|------|
| `INVALID_TOKEN` | Google ID token verification failed |

---

#### `POST /api/auth/refresh`

Refresh a JWT before it expires. Requires a valid (non-expired) token.

**When:** Called proactively by the HTTP client (e.g. an Axios interceptor) when the stored JWT is close to expiration, so the user stays logged in without re-authenticating through Google.

**Headers:** `Authorization: Bearer <jwt_token>`

**Response `200 OK`:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 604800
}
```

**Error response (HTTP 200 with `error_code`):**

| `error_code` | When |
|--------------|------|
| `TOKEN_EXPIRED` | JWT has expired, user must re-authenticate via Google |
| `INVALID_TOKEN` | JWT is malformed or tampered with |

---

#### `POST /api/auth/logout`

Invalidate the current token (server-side blocklist).

**When:** Called when the user taps "Log out" on the Profile page. The client should also clear the locally stored JWT after this call.

**Headers:** `Authorization: Bearer <jwt_token>`

**Response `204 No Content`**

---

### Users

#### `GET /api/users/me`

Get the authenticated user's profile.

**When:** Called on app launch to hydrate the Zustand store with the latest user data (level, points, stats). Also used by the Profile page and the Home page header to display user info.

**Headers:** `Authorization: Bearer <jwt_token>`

**Response `200 OK`:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "colorhunter@gmail.com",
  "username": "colorhunter",
  "level": 5,
  "points": 1240,
  "nextLevelPoints": 1500,
  "photosUploaded": 24,
  "missionsCompleted": 8,
  "avatarUrl": "https://lh3.googleusercontent.com/a/example",
  "createdAt": "2026-01-15T10:30:00Z"
}
```

---

#### `PATCH /api/users/me`

Update the authenticated user's profile.

**When:** Called when the user edits their username or avatar in the Profile edit dialog.

**Headers:** `Authorization: Bearer <jwt_token>`

**Request Body (partial update):**

```json
{
  "username": "newname",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

**Response `200 OK`:** Updated `User` object.

**Error response (HTTP 200 with `error_code`):**

| `error_code` | When |
|--------------|------|
| `USERNAME_TAKEN` | Username is already in use |
| `VALIDATION_ERROR` | Invalid field values |

---

#### `GET /api/users/me/achievements`

Get the authenticated user's achievements.

**When:** Called when the user navigates to the Profile page's "Achievements" tab to display unlocked badges and progress bars.

**Headers:** `Authorization: Bearer <jwt_token>`

**Response `200 OK`:**

```json
[
  {
    "id": "a1",
    "name": "Explorer",
    "description": "Upload photos in 5 different locations",
    "icon": "map-pin",
    "unlocked": false,
    "progress": 3,
    "total": 5
  }
]
```

---

#### `GET /api/users/:username`

Get a public user profile by username.

**When:** Called when the user taps on another user's name on a PhotoCard or in a comments list to view their public profile.

**Headers:** `Authorization: Bearer <jwt_token>`

**Response `200 OK`:**

```json
{
  "username": "explorer92",
  "level": 3,
  "points": 680,
  "photosUploaded": 12,
  "avatarUrl": "https://lh3.googleusercontent.com/a/example"
}
```

**Errors:** Returns HTTP `404` if the user does not exist.

---

### Photos

#### `GET /api/photos`

List photos with optional filters.

**When:** Called by the Home page (recent photos feed), the Galleries page (all photos), and the ColorGallery page (filtered by `?color=red`). Also used by the Map page to fetch photos with location data for map markers.

**Headers:** `Authorization: Bearer <jwt_token>`

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `color` | string | Filter by color ID (e.g. `red`) |
| `username` | string | Filter by uploader username |
| `page` | integer | Page number (default: 1) |
| `limit` | integer | Items per page (default: 20, max: 100) |

**Response `200 OK`:**

```json
{
  "data": [ /* Photo[] */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

---

#### `GET /api/photos/:id`

Get a single photo by ID, including its comments.

**When:** Called when the user taps a PhotoCard to open the PhotoDetail modal, which needs the full photo data including the comments list.

**Headers:** `Authorization: Bearer <jwt_token>`

**Response `200 OK`:** `Photo` object with `commentsList` populated.

**Errors:** Returns HTTP `404` if the photo does not exist.

---

#### `POST /api/photos`

Upload a new photo. The frontend should call `detect-color` first to get Vision API RGB data, then convert RGB to hex and map to an app color category before calling this endpoint.

**When:** Called when the user completes the Upload page flow — after selecting an image, previewing the detected color (from `detect-color`), picking a location, and optionally adding a caption.

**Headers:** `Authorization: Bearer <jwt_token>`
**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | file | yes | Image file (JPEG/PNG, max 10 MB) |
| `color` | string | yes | App color category ID, determined by the frontend from Vision API RGB data |
| `colorPalette` | string | no | JSON array of hex strings derived from Vision API RGB by the frontend |
| `location` | string | yes | Location name |
| `lat` | number | yes | Latitude |
| `lng` | number | yes | Longitude |
| `caption` | string | no | Photo caption |

**Response `201 Created`:** Created `Photo` object. If the uploaded photo matches any active mission criteria (correct color, location within radius, etc.), the server automatically increments that mission's progress.

---

#### `GET /api/photos/:id/comments`

Get paginated comments for a photo.

**When:** Called when the user scrolls to load more comments in the PhotoDetail modal, or when the comments section first opens.

**Headers:** `Authorization: Bearer <jwt_token>`

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `page` | integer | Page number (default: 1) |
| `limit` | integer | Items per page (default: 20, max: 50) |

**Response `200 OK`:**

```json
{
  "data": [
    {
      "id": "c1",
      "username": "Alex Johnson",
      "text": "Amazing capture! Love the warm tones",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=alex"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

---

#### `DELETE /api/photos/:id/comments/:commentId`

Delete a comment. Only the comment author can delete their own comment.

**When:** Called when the user taps the delete action on their own comment in the PhotoDetail modal.

**Headers:** `Authorization: Bearer <jwt_token>`

**Response `200 OK`:**

```json
{
  "comments": 4
}
```

**Errors:** Returns HTTP `403` if the user is not the comment author. Returns HTTP `404` if the comment does not exist.

---

#### `POST /api/photos/:id/like`

Like a photo. Idempotent per user.

**When:** Called when the user taps the heart icon on a PhotoCard or in the PhotoDetail modal.

**Headers:** `Authorization: Bearer <jwt_token>`

**Response `200 OK`:**

```json
{
  "likes": 25
}
```

---

#### `DELETE /api/photos/:id/like`

Remove a like from a photo.

**When:** Called when the user taps the heart icon again to unlike a previously liked photo.

**Headers:** `Authorization: Bearer <jwt_token>`

**Response `200 OK`:**

```json
{
  "likes": 24
}
```

---

#### `POST /api/photos/:id/favorite`

Favorite a photo. Idempotent per user.

**When:** Called when the user taps the bookmark/star icon to save a photo to their favorites collection.

**Headers:** `Authorization: Bearer <jwt_token>`

**Response `200 OK`:**

```json
{
  "favorites": 9
}
```

---

#### `DELETE /api/photos/:id/favorite`

Remove a favorite from a photo.

**When:** Called when the user taps the bookmark/star icon again to remove a photo from their favorites.

**Headers:** `Authorization: Bearer <jwt_token>`

**Response `200 OK`:**

```json
{
  "favorites": 8
}
```

---

#### `POST /api/photos/:id/comments`

Add a comment to a photo.

**When:** Called when the user submits a comment in the PhotoDetail modal's comment input.

**Headers:** `Authorization: Bearer <jwt_token>`

**Request Body:**

```json
{
  "text": "Amazing capture!"
}
```

**Response `201 Created`:** Created `Comment` object.

---

#### `POST /api/photos/detect-color`

Detect dominant colors from an uploaded image without saving it. The server forwards the image to the **Google Cloud Vision API** (`IMAGE_PROPERTIES` detection), converts the returned RGB values to hex, and returns them. The frontend is then responsible for:

1. Mapping the most dominant hex color to the nearest app color category (e.g. `red`, `blue`) using color distance
2. Building the `colorPalette` hex array for display

**When:** Called on the Upload page immediately after the user selects an image. The frontend uses the returned hex colors to preview the matched color category and palette before the user confirms the upload. This is a preview-only call — the photo is not persisted until `POST /api/photos` is called.

**Pipeline:** Client image → Server → Google Vision API (RGB) → Server converts RGB→hex → Frontend maps hex to app color

**Headers:** `Authorization: Bearer <jwt_token>`
**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | file | yes | Image file to analyze (JPEG/PNG, max 10 MB) |

**Response `200 OK`:**

```json
{
  "visionColors": [
    { "hex": "#FF8A65", "score": 0.42, "pixelFraction": 0.31 },
    { "hex": "#FF7043", "score": 0.28, "pixelFraction": 0.22 },
    { "hex": "#FF5722", "score": 0.18, "pixelFraction": 0.15 },
    { "hex": "#E64A19", "score": 0.12, "pixelFraction": 0.09 }
  ]
}
```

**Response Fields:**

| Field | Description |
|-------|-------------|
| `visionColors` | Array of dominant colors from Google Vision API, sorted by `score` (most dominant first). Hex values are converted from RGB by the server. The frontend maps these to app color categories and builds the display palette |

**Error response (HTTP 200 with `error_code`):**

| `error_code` | When |
|--------------|------|
| `COLOR_DETECTION_FAILED` | Vision API could not extract colors from the image |
| `PAYLOAD_TOO_LARGE` | Image exceeds 10 MB |

---

### Missions

#### `GET /api/missions`

List missions for the authenticated user.

**When:** Called when the user navigates to the Missions page. The `type` filter is used when switching between the "Solo" and "Team" tabs. Also called by the Home page to show the daily challenge / active mission card.

**Headers:** `Authorization: Bearer <jwt_token>`

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `type` | string | `solo` or `team` (omit for all) |

**Response `200 OK`:** `Mission[]`

---

#### `GET /api/missions/:id`

Get a single mission.

**When:** Called when the user taps a MissionCard to view its full details, including location info and progress breakdown.

**Headers:** `Authorization: Bearer <jwt_token>`

**Response `200 OK`:** `Mission` object.

---

#### `POST /api/missions/:id/progress`

Increment progress on a mission.

**When:** Called automatically by the server after a photo upload matches a mission's criteria (correct color, location within radius, etc.). Can also be called directly when the user completes a non-photo mission step. The response indicates whether the mission is now complete.

**Headers:** `Authorization: Bearer <jwt_token>`

**Response `200 OK`:**

```json
{
  "progress": 1,
  "total": 3,
  "completed": false
}
```

---

### Colors

#### `GET /api/colors`

List all color categories. No authentication required.

**When:** Called on the Galleries page to render the color grid with swatches. Use `includeRare=true` to also show locked rare colors (greyed out with a lock icon and required level). This is one of the few public endpoints — it can be called before login to preview available colors.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `includeRare` | boolean | Include locked rare colors (default: false) |

**Response `200 OK`:** `ColorInfo[]`

---

## Error Handling

### HTTP Status Codes

Only three non-200 status codes are used:

| Status | Meaning |
|--------|---------|
| 403 | Forbidden — authenticated but not allowed to access this resource |
| 404 | Not Found — the requested resource does not exist |
| 500 | Internal Server Error — unexpected server crash |

### Business Logic Errors

All other errors return HTTP `200` with an `error_code` field in the response body. The frontend should check for the presence of `error_code` to determine if the request failed.

**Success response** (no `error_code` field):

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 604800,
  "user": { ... }
}
```

**Error response** (`error_code` present):

```json
{
  "error_code": "INVALID_TOKEN",
  "message": "Google ID token verification failed"
}
```

### All Error Codes

| `error_code` | Description |
|--------------|-------------|
| `INVALID_TOKEN` | Google ID token or JWT verification failed |
| `TOKEN_EXPIRED` | JWT has expired, user must re-authenticate |
| `USERNAME_TAKEN` | Username is already in use |
| `VALIDATION_ERROR` | Request body fails validation |
| `PAYLOAD_TOO_LARGE` | File exceeds size limit |
| `COLOR_DETECTION_FAILED` | Vision API could not extract colors from the image |
| `RATE_LIMITED` | Too many requests, try again later |
