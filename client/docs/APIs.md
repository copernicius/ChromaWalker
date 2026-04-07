# ChromaWalk API Documentation

All responses return HTTP `200 OK`. Use the `errno` field to determine success or failure.

## Error Convention

Every response body contains an `errno` field:

- `errno: 0` — success, data is in the response
- `errno: non-zero` — error, check `message` for details

```json
{ "errno": 1001, "message": "credential is required" }
```

### Error Code Reference

| errno  | Description                        |
| ------ | ---------------------------------- |
| `0`    | Success                            |
| `1001` | Missing or invalid parameters      |
| `1002` | Invalid Google token               |
| `2001` | Missing or invalid auth token      |
| `2002` | Token expired                      |
| `2003` | Forbidden (not authorized)         |
| `3001` | User not found                     |
| `3002` | Photo not found                    |
| `3003` | Mission not found                  |
| `3004` | Color not found                    |
| `4001` | Mission already completed          |
| `5001` | Internal server error              |

---

# Auth APIs

## `POST /api/auth/google`

Exchange a Google id_token for an app JWT.

### Request Body (`application/json`)

| Parameter    | Type   | Required | Description                                        |
| ------------ | ------ | -------- | -------------------------------------------------- |
| `credential` | string | Yes      | The `id_token` returned by Google's OAuth2 sign-in |

### Response

```json
{
  "errno": 0,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "google-sub-id",
    "email": "user@gmail.com",
    "name": "Zan",
    "picture": "https://lh3.googleusercontent.com/..."
  }
}
```

### Errors

| errno  | message                    | When                         |
| ------ | -------------------------- | ---------------------------- |
| `1001` | credential is required     | Missing `credential` in body |
| `1002` | Invalid Google token       | Token verification fails     |

---

## `GET /api/auth/me`

Get the current authenticated user's profile.

### Headers

| Header          | Type   | Required | Description                                  |
| --------------- | ------ | -------- | -------------------------------------------- |
| `Authorization` | string | Yes      | `Bearer <jwt_token>` from the login response |

### Response

```json
{
  "errno": 0,
  "user": {
    "id": "google-sub-id",
    "email": "user@gmail.com",
    "name": "Zan",
    "picture": "https://lh3.googleusercontent.com/..."
  }
}
```

### Errors

| errno  | message                                  | When                              |
| ------ | ---------------------------------------- | --------------------------------- |
| `2001` | Missing or invalid Authorization header  | No `Bearer` token provided        |
| `2002` | Token expired or invalid                 | JWT expired or tampered           |
| `3001` | User not found                           | Token valid but user not in store |

---

## `POST /api/auth/logout`

Invalidate the current token. Requires authentication.

### Headers

| Header          | Type   | Required | Description                                  |
| --------------- | ------ | -------- | -------------------------------------------- |
| `Authorization` | string | Yes      | `Bearer <jwt_token>` from the login response |

### Response

```json
{ "errno": 0, "message": "Logged out" }
```

### Errors

| errno  | message                                 | When              |
| ------ | --------------------------------------- | ----------------- |
| `2001` | Missing or invalid Authorization header | Not authenticated |

---

# Photo APIs

## `POST /api/photos/upload`

Upload an image with metadata. The server stores the file in a temporary directory and runs color analysis.

### Request Body (`multipart/form-data`)

| Field      | Type   | Required | Description                                                                 |
| ---------- | ------ | -------- | --------------------------------------------------------------------------- |
| `image`    | File   | Yes      | Image file (JPEG, PNG, etc.). Max 10 MB.                                   |
| `color`    | string | Yes      | Color ID: `red`, `orange`, `yellow`, `green`, `blue`, `indigo`, `violet`   |
| `location` | string | Yes      | Human-readable location name                                               |
| `username` | string | Yes      | Uploader's username                                                        |
| `lat`      | number | No       | Latitude (defaults to 0)                                                   |
| `lng`      | number | No       | Longitude (defaults to 0)                                                  |

### Response

```json
{
  "errno": 0,
  "_id": "6649a1b2c3d4e5f6a7b8c9d0",
  "imageUrl": "/tmp/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg",
  "color": "red",
  "location": "Central Library",
  "lat": -36.853,
  "lng": 174.768,
  "likes": 0,
  "favorites": 0,
  "comments": 0,
  "username": "colorhunter",
  "analysis": {
    "dominantRGB": { "r": 182, "g": 45, "b": 71 },
    "palette": [
      { "r": 182, "g": 45, "b": 71 },
      { "r": 210, "g": 120, "b": 90 },
      { "r": 55, "g": 30, "b": 22 },
      { "r": 240, "g": 200, "b": 180 },
      { "r": 130, "g": 60, "b": 50 }
    ]
  },
  "createdAt": "2026-04-01T10:30:00.000Z",
  "updatedAt": "2026-04-01T10:30:00.000Z"
}
```

### Errors

| errno  | message                                    | When                    |
| ------ | ------------------------------------------ | ----------------------- |
| `1001` | No image file provided                     | Missing `image` field   |
| `1001` | color, location and username are required  | Missing required fields |
| `5001` | Upload failed                              | Server / database error |

---

## `GET /api/photos`

Retrieve photos with optional filtering, sorting, geo-query, and pagination. Sorted by newest first by default.

### Query Parameters

| Param      | Type   | Required | Description                                                    |
| ---------- | ------ | -------- | -------------------------------------------------------------- |
| `color`    | string | No       | Filter by color ID                                             |
| `username` | string | No       | Filter by username                                             |
| `sort`     | string | No       | Sort order: `recent` (default), `popular`, `favorites`         |
| `lat`      | number | No       | Center latitude for geo query (requires `lng` and `radius`)    |
| `lng`      | number | No       | Center longitude for geo query (requires `lat` and `radius`)   |
| `radius`   | number | No       | Search radius in meters (default: 1000)                        |
| `limit`    | number | No       | Max results to return (default: 50)                            |
| `offset`   | number | No       | Number of results to skip for pagination (default: 0)          |

### Response

```json
{
  "errno": 0,
  "photos": [
    {
      "_id": "6649a1b2c3d4e5f6a7b8c9d0",
      "imageUrl": "/tmp/a1b2c3d4.jpg",
      "color": "red",
      "location": "Central Library",
      "lat": -36.853,
      "lng": 174.768,
      "likes": 24,
      "favorites": 8,
      "comments": 5,
      "username": "colorhunter",
      "analysis": {
        "dominantRGB": { "r": 182, "g": 45, "b": 71 },
        "palette": [...]
      },
      "createdAt": "2026-04-01T10:30:00.000Z",
      "updatedAt": "2026-04-01T10:30:00.000Z"
    }
  ],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

### Errors

| errno  | message                | When                    |
| ------ | ---------------------- | ----------------------- |
| `5001` | Failed to fetch photos | Server / database error |

---

## `GET /api/photos/user/:user_id`

Get all photos uploaded by a specific user, with optional filtering and sorting.

### Path Parameters

| Param     | Type   | Required | Description    |
| --------- | ------ | -------- | -------------- |
| `user_id` | string | Yes      | The user's ID  |

### Query Parameters

| Param       | Type   | Required | Description                                            |
| ----------- | ------ | -------- | ------------------------------------------------------ |
| `color`     | string | No       | Filter by color ID                                     |
| `sort`      | string | No       | Sort order: `recent` (default), `popular`, `favorites` |
| `startDate` | string | No       | Filter photos from this date (ISO 8601, e.g. `2026-03-01`) |
| `endDate`   | string | No       | Filter photos up to this date (ISO 8601, e.g. `2026-03-31`) |
| `minLikes`  | number | No       | Only return photos with at least this many likes       |
| `limit`     | number | No       | Max results to return (default: 50)                    |
| `offset`    | number | No       | Number of results to skip for pagination (default: 0)  |

### Response

```json
{
  "errno": 0,
  "photos": [
    {
      "_id": "6649a1b2c3d4e5f6a7b8c9d0",
      "imageUrl": "/tmp/a1b2c3d4.jpg",
      "color": "red",
      "location": "Central Library",
      "lat": -36.853,
      "lng": 174.768,
      "likes": 24,
      "favorites": 8,
      "comments": 5,
      "username": "colorhunter",
      "createdAt": "2026-04-01T10:30:00.000Z",
      "updatedAt": "2026-04-01T10:30:00.000Z"
    }
  ],
  "total": 12,
  "limit": 50,
  "offset": 0
}
```

### Errors

| errno  | message                      | When                    |
| ------ | ---------------------------- | ----------------------- |
| `3001` | User not found               | Invalid user ID         |
| `5001` | Failed to fetch user's photos | Server / database error |

---

## `GET /api/photos/:id`

Get a single photo by its ID.

### Path Parameters

| Param | Type   | Required | Description    |
| ----- | ------ | -------- | -------------- |
| `id`  | string | Yes      | The photo's ID |

### Response

```json
{
  "errno": 0,
  "_id": "6649a1b2c3d4e5f6a7b8c9d0",
  "imageUrl": "/tmp/a1b2c3d4.jpg",
  "color": "red",
  "location": "Central Library",
  "lat": -36.853,
  "lng": 174.768,
  "likes": 24,
  "favorites": 8,
  "comments": 5,
  "username": "colorhunter",
  "createdAt": "2026-04-01T10:30:00.000Z",
  "updatedAt": "2026-04-01T10:30:00.000Z"
}
```

### Errors

| errno  | message         | When             |
| ------ | --------------- | ---------------- |
| `3002` | Photo not found | Invalid photo ID |

---

## `POST /api/photos/:id/like`

Toggle like on a photo. Requires authentication.

### Headers

| Header          | Type   | Required | Description                                  |
| --------------- | ------ | -------- | -------------------------------------------- |
| `Authorization` | string | Yes      | `Bearer <jwt_token>` from the login response |

### Response

```json
{
  "errno": 0,
  "_id": "6649a1b2c3d4e5f6a7b8c9d0",
  "likes": 25,
  "liked": true
}
```

Calling again removes the like:

```json
{
  "errno": 0,
  "_id": "6649a1b2c3d4e5f6a7b8c9d0",
  "likes": 24,
  "liked": false
}
```

### Errors

| errno  | message                                 | When              |
| ------ | --------------------------------------- | ----------------- |
| `2001` | Missing or invalid Authorization header | Not authenticated |
| `3002` | Photo not found                         | Invalid photo ID  |

---

## `POST /api/photos/:id/favorite`

Toggle favorite on a photo. Requires authentication.

### Headers

| Header          | Type   | Required | Description                                  |
| --------------- | ------ | -------- | -------------------------------------------- |
| `Authorization` | string | Yes      | `Bearer <jwt_token>` from the login response |

### Response

```json
{
  "errno": 0,
  "_id": "6649a1b2c3d4e5f6a7b8c9d0",
  "favorites": 9,
  "favorited": true
}
```

### Errors

| errno  | message                                 | When              |
| ------ | --------------------------------------- | ----------------- |
| `2001` | Missing or invalid Authorization header | Not authenticated |
| `3002` | Photo not found                         | Invalid photo ID  |

---

## `GET /api/photos/locations`

Get photos grouped by coordinates, used by map views.

### Query Parameters

| Param   | Type   | Required | Description          |
| ------- | ------ | -------- | -------------------- |
| `color` | string | No       | Filter by color ID   |

### Response

```json
{
  "errno": 0,
  "locations": [
    {
      "lat": -36.853,
      "lng": 174.768,
      "count": 3,
      "photos": [
        {
          "_id": "...",
          "imageUrl": "/tmp/abc.jpg",
          "color": "red",
          "location": "Central Library",
          "username": "colorhunter",
          "likes": 24,
          "favorites": 8
        }
      ]
    }
  ]
}
```

---

## `GET /api/photos/:id/analysis`

Get the color analysis result for a specific photo.

### Path Parameters

| Param | Type   | Required | Description    |
| ----- | ------ | -------- | -------------- |
| `id`  | string | Yes      | The photo's ID |

### Response

```json
{
  "errno": 0,
  "_id": "6649a1b2c3d4e5f6a7b8c9d0",
  "analysis": {
    "dominantRGB": { "r": 182, "g": 45, "b": 71 },
    "palette": [
      { "r": 182, "g": 45, "b": 71 },
      { "r": 210, "g": 120, "b": 90 },
      { "r": 55, "g": 30, "b": 22 },
      { "r": 240, "g": 200, "b": 180 },
      { "r": 130, "g": 60, "b": 50 }
    ]
  }
}
```

### Errors

| errno  | message         | When             |
| ------ | --------------- | ---------------- |
| `3002` | Photo not found | Invalid photo ID |

---

## `DELETE /api/photos/:id`

Delete a photo. Only the photo's owner can delete it. Requires authentication.

### Headers

| Header          | Type   | Required | Description                                  |
| --------------- | ------ | -------- | -------------------------------------------- |
| `Authorization` | string | Yes      | `Bearer <jwt_token>` from the login response |

### Response

```json
{ "errno": 0, "message": "Photo deleted" }
```

### Errors

| errno  | message                                 | When                          |
| ------ | --------------------------------------- | ----------------------------- |
| `2001` | Missing or invalid Authorization header | Not authenticated             |
| `2003` | Not authorized to delete this photo     | Photo belongs to another user |
| `3002` | Photo not found                         | Invalid photo ID              |

---

# Collection APIs

## `GET /api/collections`

Get color collections with a preview of the top photo and trending count for each color.

### Query Parameters

| Param   | Type   | Required | Description                            |
| ------- | ------ | -------- | -------------------------------------- |
| `limit` | number | No       | Max collections to return (default: 7) |

### Response

```json
{
  "errno": 0,
  "collections": [
    {
      "color": {
        "id": "red",
        "name": "Sunset Orange",
        "category": "WARM",
        "hex": "#FF8A65"
      },
      "count": 5,
      "preview": {
        "_id": "...",
        "imageUrl": "/tmp/abc.jpg",
        "likes": 42,
        "favorites": 18
      }
    }
  ]
}
```

---

## `GET /api/collections/:colorId`

Get the most popular recent photos for a specific color collection.

### Path Parameters

| Param     | Type   | Required | Description  |
| --------- | ------ | -------- | ------------ |
| `colorId` | string | Yes      | The color ID |

### Query Parameters

| Param     | Type   | Required | Description                                              |
| --------- | ------ | -------- | -------------------------------------------------------- |
| `days`    | number | No       | Lookback window in days (default: 7)                     |
| `sort`    | string | No       | Sort order: `popular` (default), `recent`, `favorites`   |
| `limit`   | number | No       | Max results to return (default: 20)                      |
| `offset`  | number | No       | Number of results to skip for pagination (default: 0)    |

### Response

```json
{
  "errno": 0,
  "color": {
    "id": "red",
    "name": "Sunset Orange",
    "category": "WARM",
    "hex": "#FF8A65"
  },
  "photos": [
    {
      "_id": "6649a1b2c3d4e5f6a7b8c9d0",
      "imageUrl": "/tmp/a1b2c3d4.jpg",
      "color": "red",
      "location": "Central Library",
      "lat": -36.853,
      "lng": 174.768,
      "likes": 42,
      "favorites": 18,
      "comments": 11,
      "username": "colorhunter",
      "createdAt": "2026-04-01T10:30:00.000Z"
    }
  ],
  "total": 5,
  "limit": 20,
  "offset": 0
}
```

### Errors

| errno  | message                    | When                    |
| ------ | -------------------------- | ----------------------- |
| `3004` | Color not found            | Invalid color ID        |
| `5001` | Failed to fetch collection | Server / database error |

---

# User APIs

## `GET /api/users/:user_id`

Get a user's profile including stats and level progress.

### Path Parameters

| Param     | Type   | Required | Description   |
| --------- | ------ | -------- | ------------- |
| `user_id` | string | Yes      | The user's ID |

### Response

```json
{
  "errno": 0,
  "_id": "...",
  "username": "colorhunter",
  "email": "alice@gmail.com",
  "avatarUrl": "https://lh3.googleusercontent.com/...",
  "level": 5,
  "points": 1240,
  "nextLevelPoints": 1500,
  "photosUploaded": 24,
  "missionsCompleted": 8,
  "createdAt": "2026-03-01T00:00:00.000Z"
}
```

### Errors

| errno  | message        | When            |
| ------ | -------------- | --------------- |
| `3001` | User not found | Invalid user ID |

---

## `PATCH /api/users/:user_id`

Update the authenticated user's profile. Requires authentication.

### Headers

| Header          | Type   | Required | Description                                  |
| --------------- | ------ | -------- | -------------------------------------------- |
| `Authorization` | string | Yes      | `Bearer <jwt_token>` from the login response |

### Request Body (`application/json`)

All fields optional — only include fields to update.

| Field      | Type   | Required | Description       |
| ---------- | ------ | -------- | ----------------- |
| `username` | string | No       | New display name  |
| `avatarUrl`| string | No       | New avatar URL    |

### Response

Updated user object (same shape as `GET /api/users/:user_id`) with `"errno": 0`.

### Errors

| errno  | message                                 | When                  |
| ------ | --------------------------------------- | --------------------- |
| `2001` | Missing or invalid Authorization header | Not authenticated     |
| `2003` | Not authorized to update this user      | Updating another user |
| `3001` | User not found                          | Invalid user ID       |

---

## `GET /api/users/:user_id/achievements`

Get all achievements for a user, including progress on locked ones.

### Path Parameters

| Param     | Type   | Required | Description   |
| --------- | ------ | -------- | ------------- |
| `user_id` | string | Yes      | The user's ID |

### Response

```json
{
  "errno": 0,
  "achievements": [
    {
      "_id": "...",
      "name": "Explorer",
      "description": "Upload photos in 5 different locations",
      "icon": "map-pin",
      "unlocked": false,
      "progress": 3,
      "total": 5
    },
    {
      "_id": "...",
      "name": "Color Hunter",
      "description": "Upload 10 photos",
      "icon": "camera",
      "unlocked": true,
      "progress": 10,
      "total": 10
    }
  ]
}
```

### Errors

| errno  | message        | When            |
| ------ | -------------- | --------------- |
| `3001` | User not found | Invalid user ID |

---

## `GET /api/users/:user_id/colors`

Get the colors a user has unlocked.

### Path Parameters

| Param     | Type   | Required | Description   |
| --------- | ------ | -------- | ------------- |
| `user_id` | string | Yes      | The user's ID |

### Response

```json
{
  "errno": 0,
  "colors": [
    {
      "id": "red",
      "name": "Sunset Orange",
      "category": "WARM",
      "hex": "#FF8A65",
      "unlocked": true
    },
    {
      "id": "orange",
      "name": "Burnt Sienna",
      "category": "WARM",
      "hex": "#D2691E",
      "unlocked": true
    }
  ]
}
```

### Errors

| errno  | message        | When            |
| ------ | -------------- | --------------- |
| `3001` | User not found | Invalid user ID |

---

## `GET /api/users/:user_id/locations`

Get distinct locations where the user has uploaded photos, with photo counts.

### Path Parameters

| Param     | Type   | Required | Description   |
| --------- | ------ | -------- | ------------- |
| `user_id` | string | Yes      | The user's ID |

### Response

```json
{
  "errno": 0,
  "locations": [
    {
      "location": "Central Library",
      "count": 3
    },
    {
      "location": "Arts Building",
      "count": 1
    }
  ]
}
```

### Errors

| errno  | message        | When            |
| ------ | -------------- | --------------- |
| `3001` | User not found | Invalid user ID |

---

# Mission APIs

## `GET /api/missions`

Get missions, optionally filtered by type. Used by the Missions page's solo/team tabs.

### Query Parameters

| Param         | Type    | Required | Description                                        |
| ------------- | ------- | -------- | -------------------------------------------------- |
| `teamMission` | boolean | No       | `true` for team only, `false` for solo only. Omit for all. |
| `difficulty`  | string  | No       | Filter by difficulty: `easy`, `medium`, `hard`, `legendary` |
| `color`       | string  | No       | Filter by associated color ID                      |
| `completed`   | boolean | No       | `true` for completed, `false` for in-progress      |
| `limit`       | number  | No       | Max results to return (default: 50)                |
| `offset`      | number  | No       | Number of results to skip for pagination (default: 0) |

### Response

```json
{
  "errno": 0,
  "missions": [
    {
      "_id": "...",
      "title": "Find Blue Sky",
      "description": "Capture a photo of something blue in the sky",
      "difficulty": "easy",
      "reward": 40,
      "color": "blue",
      "location": null,
      "lat": null,
      "lng": null,
      "progress": 0,
      "total": 1,
      "completed": false,
      "teamMission": false
    },
    {
      "_id": "...",
      "title": "Team Yellow Hunt",
      "description": "Work with your team to find 5 yellow objects across campus",
      "difficulty": "medium",
      "reward": 80,
      "color": "yellow",
      "location": null,
      "lat": null,
      "lng": null,
      "progress": 2,
      "total": 5,
      "completed": false,
      "teamMission": true
    }
  ],
  "total": 6,
  "limit": 50,
  "offset": 0
}
```

### Errors

| errno  | message                  | When                    |
| ------ | ------------------------ | ----------------------- |
| `5001` | Failed to fetch missions | Server / database error |

---

## `GET /api/missions/:id`

Get a single mission by ID.

### Path Parameters

| Param | Type   | Required | Description      |
| ----- | ------ | -------- | ---------------- |
| `id`  | string | Yes      | The mission's ID |

### Response

```json
{
  "errno": 0,
  "_id": "...",
  "title": "Red Near Library",
  "description": "Find something red within 50m of the Central Library",
  "difficulty": "medium",
  "reward": 80,
  "color": "red",
  "location": "Central Library",
  "lat": 40.7589,
  "lng": -73.9851,
  "progress": 0,
  "total": 1,
  "completed": false,
  "teamMission": false
}
```

### Errors

| errno  | message           | When               |
| ------ | ----------------- | ------------------ |
| `3003` | Mission not found | Invalid mission ID |

---

## `PATCH /api/missions/:id/progress`

Increment progress on a mission. Automatically marks as completed when progress reaches total. Requires authentication.

### Headers

| Header          | Type   | Required | Description                                  |
| --------------- | ------ | -------- | -------------------------------------------- |
| `Authorization` | string | Yes      | `Bearer <jwt_token>` from the login response |

### Request Body (`application/json`)

| Field      | Type   | Required | Description                                              |
| ---------- | ------ | -------- | -------------------------------------------------------- |
| `progress` | number | No       | Set progress to this value. If omitted, increments by 1. |

### Response

```json
{
  "errno": 0,
  "_id": "...",
  "title": "Team Yellow Hunt",
  "progress": 3,
  "total": 5,
  "completed": false,
  "reward": 80
}
```

When progress reaches total:

```json
{
  "errno": 0,
  "_id": "...",
  "title": "Team Yellow Hunt",
  "progress": 5,
  "total": 5,
  "completed": true,
  "reward": 80
}
```

### Errors

| errno  | message                                 | When                      |
| ------ | --------------------------------------- | ------------------------- |
| `2001` | Missing or invalid Authorization header | Not authenticated         |
| `3003` | Mission not found                       | Invalid mission ID        |
| `4001` | Mission already completed               | Mission already completed |

---

## `POST /api/missions/:id/complete`

Mark a mission as completed immediately. Awards the mission's reward points to the user. Requires authentication.

### Headers

| Header          | Type   | Required | Description                                  |
| --------------- | ------ | -------- | -------------------------------------------- |
| `Authorization` | string | Yes      | `Bearer <jwt_token>` from the login response |

### Response

```json
{
  "errno": 0,
  "_id": "...",
  "title": "Find Blue Sky",
  "progress": 1,
  "total": 1,
  "completed": true,
  "reward": 40,
  "pointsAwarded": 40
}
```

### Errors

| errno  | message                                 | When                      |
| ------ | --------------------------------------- | ------------------------- |
| `2001` | Missing or invalid Authorization header | Not authenticated         |
| `3003` | Mission not found                       | Invalid mission ID        |
| `4001` | Mission already completed               | Mission already completed |
