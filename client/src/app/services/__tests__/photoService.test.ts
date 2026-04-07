import { describe, expect, it } from 'vitest';
import { colorService, missionService, photoService, userService } from '../photoService';

describe('photoService', () => {
  it('returns all photos', async () => {
    const photos = await photoService.getPhotos();
    expect(photos.length).toBeGreaterThan(0);
  });

  it('filters photos by color', async () => {
    const photos = await photoService.getPhotosByColor('red');
    expect(photos.every((p) => p.color === 'red')).toBe(true);
  });

  it('filters photos by user', async () => {
    const photos = await photoService.getPhotosByUser('colorhunter');
    expect(photos.every((p) => p.username === 'colorhunter')).toBe(true);
  });

  it('creates a photo with generated fields', async () => {
    const photo = await photoService.uploadPhoto({
      imageUrl: 'test.jpg',
      color: 'red',
      location: 'Test',
      lat: 0,
      lng: 0,
      username: 'tester',
      timestamp: new Date(),
    });
    expect(photo.id).toBeTruthy();
    expect(photo.likes).toBe(0);
  });
});

describe('missionService', () => {
  it('returns all missions', async () => {
    const missions = await missionService.getMissions();
    expect(missions.length).toBeGreaterThan(0);
  });

  it('separates solo and team missions', async () => {
    const solo = await missionService.getSoloMissions();
    const team = await missionService.getTeamMissions();
    expect(solo.every((m) => !m.teamMission)).toBe(true);
    expect(team.every((m) => m.teamMission)).toBe(true);
  });
});

describe('userService', () => {
  it('returns a user profile', async () => {
    const user = await userService.getProfile();
    expect(user.username).toBeTruthy();
    expect(user.level).toBeGreaterThan(0);
  });
});

describe('colorService', () => {
  it('returns rainbow colors', async () => {
    const colors = await colorService.getColors();
    expect(colors.length).toBe(7);
  });

  it('returns all colors including rare', async () => {
    const all = await colorService.getAllColors();
    const rare = await colorService.getRareColors();
    const rainbow = await colorService.getColors();
    expect(all.length).toBe(rainbow.length + rare.length);
  });
});
