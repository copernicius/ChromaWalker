import { http, HttpResponse } from 'msw';
import { MOCK_MISSIONS, MOCK_PHOTOS, type Photo } from '../app/data';

// Mutable photo list seeded from mock data. Lives for the lifetime of the
// service worker — refreshes the page reset to MOCK_PHOTOS.
let photosState: Photo[] = [...MOCK_PHOTOS];

export const handlers = [
  // ---- Auth ----

  http.post('/api/auth/google', async ({ request }) => {
    const { credential } = (await request.json()) as { credential?: string };

    if (!credential) {
      return HttpResponse.json({ error: 'Missing credential' }, { status: 400 });
    }

    const payload = JSON.parse(atob(credential.split('.')[1]));

    return HttpResponse.json({
      user: {
        _id: payload.sub,
        googleId: payload.sub,
        email: payload.email,
        username: payload.name,
        avatarUrl: payload.picture || '',
        level: 1,
        points: 0,
        nextLevelPoints: 100,
        photosUploaded: 0,
        missionsCompleted: 0,
      },
      token: `mock-jwt-${payload.sub}`,
    });
  }),

  http.get('/api/auth/me', () => {
    // Persist middleware stores under `chromawalk-store` as { state: { user, token, ... } }
    const persisted = localStorage.getItem('chromawalk-store');
    if (!persisted) {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 });
    }
    try {
      const { state } = JSON.parse(persisted);
      if (!state?.user) {
        return HttpResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return HttpResponse.json(state.user);
    } catch {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 });
    }
  }),

  // ---- Photos ----

  http.get('/api/photos', () => {
    return HttpResponse.json(photosState);
  }),

  http.post('/api/photos', async ({ request }) => {
    const body = (await request.json()) as {
      image?: string;
      location?: string;
      color?: string;
      taskType?: string;
      missionId?: string;
    };

    const newPhoto: Photo = {
      id: crypto.randomUUID(),
      imageUrl: body.image ?? '',
      color: body.color ?? '',
      location: body.location ?? '',
      lat: 0,
      lng: 0,
      likes: 0,
      favorites: 0,
      username: 'me',
      timestamp: new Date(),
      comments: 0,
    };

    photosState = [newPhoto, ...photosState];
    return HttpResponse.json(newPhoto, { status: 201 });
  }),

  // ---- Missions ----

  http.get('/api/missions', () => {
    return HttpResponse.json(MOCK_MISSIONS);
  }),
];
