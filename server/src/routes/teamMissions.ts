import express from 'express';
import {
  createTeamMission,
  getTeamMission,
  getTeamMissionOptions,
  joinRandomTeamMission,
  joinTeamMission,
  leaveTeamMission,
  listMyTeamMissions,
  listOpenTeamMissions,
  listTeamMessages,
  postTeamMessage,
} from '../controllers/teamMissionsController';
import { auth } from '../middleware/auth';

const router = express.Router();

// Static routes must be registered before /:id so Express doesn't match
// id="me", id="options", or id="random".
router.get('/options', getTeamMissionOptions);
router.get('/me', auth, listMyTeamMissions);
router.post('/random/join', auth, joinRandomTeamMission);
router.get('/', listOpenTeamMissions);
router.post('/', auth, createTeamMission);
router.get('/:id', getTeamMission);
router.post('/:id/join', auth, joinTeamMission);
router.post('/:id/leave', auth, leaveTeamMission);
router.get('/:id/messages', auth, listTeamMessages);
router.post('/:id/messages', auth, postTeamMessage);

export default router;
