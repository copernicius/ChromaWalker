import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('/api/auth/google', async ({ request }) => {
    const { credential } = (await request.json()) as { credential?: string };

    if (!credential) {
      return HttpResponse.json({ error: 'Missing credential' }, { status: 400 });
    }

    // Decode user info from the Google JWT payload
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

  http.post('/api/photos', async ({ request }) => {
    const body = (await request.json()) as {
      image?: string;
      location?: string;
      color?: string;
      taskType?: string;
      missionId?: string;
    };

    return HttpResponse.json({
      _id: crypto.randomUUID(),
      imageUrl: body.image,
      location: body.location,
      color: body.color,
      taskType: body.taskType,
      missionId: body.missionId,
      likes: 0,
      favorites: 0,
      comments: 0,
      createdAt: new Date().toISOString(),
    }, { status: 201 });
  }),

  http.get('/api/auth/me', () => {
    const saved = localStorage.getItem('user');
    if (!saved) {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return HttpResponse.json(JSON.parse(saved));
  }),
];
