import { Crown, MapPin, Plus, Target, Trophy, Users, X, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { MissionCard } from '../components/MissionCard';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { MOCK_MISSIONS } from '../data/mockData';

export function Missions() {
  const [_selectedMission, setSelectedMission] = useState<string | null>(null);
  const [showDifficultyGuide, setShowDifficultyGuide] = useState(false);
  const [hasJoinedTeam, setHasJoinedTeam] = useState(false);
  const [missionStarted, setMissionStarted] = useState(false);

  const soloMissions = MOCK_MISSIONS.filter((m) => !m.teamMission);
  const teamMissions = MOCK_MISSIONS.filter((m) => m.teamMission);

  // Mock team data
  const currentTeamMission = teamMissions[0]; // Using the first team mission as the current one
  const currentUserIsLeader = true; // Set to true for the current user being the leader
  const teamMembers = [
    { username: 'colorhunter', avatar: '🎨', isLeader: true, contribution: 2, status: 'active' },
    { username: 'explorer92', avatar: '🔍', isLeader: false, contribution: 1, status: 'active' },
    {
      username: 'sunshine_walker',
      avatar: '☀️',
      isLeader: false,
      contribution: 0,
      status: 'waiting',
    },
  ];

  const minTeamSize = 2;
  const maxTeamSize = 5;
  const canStartMission = teamMembers.length >= minTeamSize && currentUserIsLeader;

  // Check if this is the first visit
  useEffect(() => {
    const hasVisitedMissions = localStorage.getItem('hasVisitedMissions');
    if (!hasVisitedMissions) {
      setShowDifficultyGuide(true);
      localStorage.setItem('hasVisitedMissions', 'true');
    }
  }, []);

  const handleCloseDifficultyGuide = () => {
    setShowDifficultyGuide(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F1ED] pb-24">
      <Header title="" />

      <div className="max-w-screen-xl mx-auto px-4 pt-4">
        {/* Brand Header */}
        <div className="mb-6 animate-fade-in">
          <h1 className="text-3xl mb-1">
            <span className="italic" style={{ fontFamily: 'var(--font-brand-serif)' }}>
              Missions
            </span>
          </h1>
        </div>

        {/* Mission Tabs */}
        <Tabs defaultValue="solo" className="w-full">
          <TabsList className="w-full mb-6 bg-white/80 backdrop-blur-sm p-2 rounded-2xl shadow-md border border-gray-200/50">
            <TabsTrigger
              value="solo"
              className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-400 data-[state=active]:to-purple-400 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl py-3 font-semibold transition-all"
            >
              <Target className="w-5 h-5 mr-2" />
              Solo Missions
            </TabsTrigger>
            <TabsTrigger
              value="team"
              className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-400 data-[state=active]:to-pink-400 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl py-3 font-semibold transition-all"
            >
              <Users className="w-5 h-5 mr-2" />
              Team Missions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="solo">
            <div className="space-y-4">
              {soloMissions.map((mission) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  onClick={() => setSelectedMission(mission.id)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="team">
            {/* No Team - Create Team View */}
            {!hasJoinedTeam && (
              <div className="space-y-6">
                {/* Info Banner */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <Users className="w-6 h-6 text-purple-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-purple-900 mb-1">Team Missions</p>
                      <p className="text-sm text-purple-800">
                        Join a team to complete missions together and earn bonus rewards!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Create Team Card */}
                <div className="bg-white rounded-2xl p-8 shadow-lg text-center border-2 border-dashed border-gray-300 hover:border-purple-400 transition-all">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Create Your Team</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Start a new team and invite friends to join you. Shake your device to find
                    teammates nearby!
                  </p>
                  <button
                    type="button"
                    onClick={() => setHasJoinedTeam(true)}
                    className="bg-gradient-to-r from-purple-400 to-pink-400 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    Create Team
                  </button>
                </div>

                {/* Available Team Missions Preview */}
                <div>
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-600" />
                    Available Team Missions
                  </h3>
                  <div className="space-y-3">
                    {teamMissions.map((mission) => (
                      <div
                        key={mission.id}
                        className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 opacity-60"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor:
                                mission.color === 'rainbow'
                                  ? 'linear-gradient(135deg, #FF8A65, #FFD54F, #4DB6AC)'
                                  : `var(--color-${mission.color}, #ccc)`,
                            }}
                          />
                          <div className="flex-1">
                            <p className="font-bold text-gray-900">{mission.title}</p>
                            <p className="text-sm text-gray-600">{mission.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-yellow-600">
                              +{mission.reward}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Has Team - Two States: Waiting for teammates OR Mission in progress */}
            {hasJoinedTeam && currentTeamMission && (
              <div className="space-y-6">
                {/* STATE 1: Waiting for Teammates to Join */}
                {!missionStarted && (
                  <>
                    {/* Mission Preview */}
                    <div className="bg-gradient-to-br from-purple-400 to-pink-400 rounded-3xl p-6 text-white shadow-lg">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="w-5 h-5" />
                            <span className="text-sm font-medium uppercase tracking-wide opacity-90">
                              Team Mission
                            </span>
                          </div>
                          <h2 className="text-2xl font-bold mb-2">{currentTeamMission.title}</h2>
                          <p className="text-sm opacity-90">{currentTeamMission.description}</p>
                        </div>
                        <div className="bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
                          <p className="text-sm font-medium">+{currentTeamMission.reward}</p>
                        </div>
                      </div>
                    </div>

                    {/* Waiting for Teammates */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Users className="w-8 h-8 text-purple-600" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Waiting for Teammates</h3>
                        <p className="text-sm text-gray-600">
                          {teamMembers.length}/{maxTeamSize} members joined · Min {minTeamSize}{' '}
                          required
                        </p>
                      </div>

                      {/* Team Members List */}
                      <div className="space-y-3 mb-6">
                        {teamMembers.map((member) => (
                          <div
                            key={member.username}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-2xl">
                                {member.avatar}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold">{member.username}</p>
                                  {member.isLeader && <Crown className="w-4 h-4 text-yellow-600" />}
                                </div>
                                <p className="text-xs text-gray-500">
                                  {member.isLeader ? 'Team Leader' : 'Team Member'}
                                </p>
                              </div>
                            </div>
                            <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                              Ready
                            </div>
                          </div>
                        ))}

                        {/* Empty Slots */}
                        {Array.from({ length: maxTeamSize - teamMembers.length }).map(
                          (_, index) => (
                            <div
                              key={`empty-slot-${maxTeamSize - teamMembers.length - index}`}
                              className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300"
                            >
                              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                <Users className="w-6 h-6 text-gray-400" />
                              </div>
                              <p className="text-sm text-gray-500">Waiting for teammate...</p>
                            </div>
                          ),
                        )}
                      </div>

                      {/* Shake to Find Teammates */}
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-purple-200 rounded-xl p-4 text-center mb-4">
                        <p className="text-sm text-purple-800 font-medium mb-2">
                          📱 Shake your device to find teammates nearby!
                        </p>
                        <p className="text-xs text-gray-600">
                          Other players looking for teams will appear when you shake
                        </p>
                      </div>

                      {/* Start Mission Button (Leader Only) */}
                      {currentUserIsLeader && (
                        <button
                          type="button"
                          onClick={() => setMissionStarted(true)}
                          disabled={!canStartMission}
                          className={`w-full px-6 py-4 rounded-full font-semibold transition-all flex items-center justify-center gap-2 ${
                            canStartMission
                              ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white hover:shadow-lg hover:scale-105 active:scale-95'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <Zap className="w-5 h-5" />
                          Start Mission
                        </button>
                      )}
                      {!currentUserIsLeader && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                          <p className="text-sm text-blue-800">
                            Waiting for team leader to start the mission...
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* STATE 2: Mission in Progress */}
                {missionStarted && (
                  <>
                    {/* Mission Header with Progress */}
                    <div className="bg-gradient-to-br from-purple-400 to-pink-400 rounded-3xl p-6 text-white shadow-lg">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="w-5 h-5" />
                            <span className="text-sm font-medium uppercase tracking-wide opacity-90">
                              Mission In Progress
                            </span>
                          </div>
                          <h2 className="text-2xl font-bold mb-2">{currentTeamMission.title}</h2>
                          <p className="text-sm opacity-90">{currentTeamMission.description}</p>
                        </div>
                        <div className="bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
                          <p className="text-sm font-medium">+{currentTeamMission.reward}</p>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">Team Progress</span>
                          <span className="font-bold">
                            {currentTeamMission.progress}/{currentTeamMission.total}
                          </span>
                        </div>
                        <Progress
                          value={
                            ((currentTeamMission.progress ?? 0) / (currentTeamMission.total ?? 1)) *
                            100
                          }
                          className="h-3 bg-white/20"
                        />
                      </div>
                    </div>

                    {/* Team Members Status */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold flex items-center gap-2">
                          <Users className="w-5 h-5 text-purple-600" />
                          Team Members ({teamMembers.length})
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {teamMembers.map((member) => (
                          <div
                            key={member.username}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-2xl">
                                {member.avatar}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold">{member.username}</p>
                                  {member.isLeader && <Crown className="w-4 h-4 text-yellow-600" />}
                                </div>
                                <p className="text-xs text-gray-600">
                                  {member.contribution} photo{member.contribution !== 1 ? 's' : ''}{' '}
                                  contributed
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              {member.contribution > 0 ? (
                                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                                  Active
                                </div>
                              ) : (
                                <div className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                                  Waiting
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Mission Location (if applicable) */}
                    {currentTeamMission.location && (
                      <div className="bg-white rounded-2xl p-5 shadow-sm">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-blue-600" />
                          Mission Location
                        </h3>
                        <div className="bg-gray-100 rounded-xl p-4">
                          <p className="font-medium text-gray-900">{currentTeamMission.location}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            Find {currentTeamMission.total} {currentTeamMission.color} objects
                            within this area
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Team Info Note */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                      <p className="text-xs text-amber-800">
                        💡 You cannot leave the team until the mission is completed
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Mission Difficulty Guide - Only shown on first visit */}
        {showDifficultyGuide && (
          <div className="mt-8 bg-white rounded-lg p-5 shadow-sm relative animate-slide-up">
            <button
              type="button"
              onClick={handleCloseDifficultyGuide}
              className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <h3 className="font-semibold mb-4">Difficulty Levels</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm">Easy</span>
                </div>
                <span className="text-sm text-gray-600">+40 points</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-sm">Medium</span>
                </div>
                <span className="text-sm text-gray-600">+80 points</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-sm">Hard</span>
                </div>
                <span className="text-sm text-gray-600">+150 points</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="text-sm">Legendary</span>
                </div>
                <span className="text-sm text-gray-600">+250 points</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
