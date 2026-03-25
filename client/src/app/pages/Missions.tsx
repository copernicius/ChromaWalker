import { useState } from 'react';
import { Header } from '../components/Header';
import { MissionCard } from '../components/MissionCard';
import { MOCK_MISSIONS } from '../data/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Target, Users } from 'lucide-react';

export function Missions() {
  const [selectedMission, setSelectedMission] = useState<string | null>(null);
  
  const soloMissions = MOCK_MISSIONS.filter(m => !m.teamMission);
  const teamMissions = MOCK_MISSIONS.filter(m => m.teamMission);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="Missions" />
      
      <div className="max-w-screen-xl mx-auto px-4 pt-20">
        {/* Stats Banner */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">Available Missions</h2>
              <p className="opacity-90">Complete challenges and earn rewards</p>
            </div>
            <Target className="w-12 h-12 opacity-80" />
          </div>
        </div>

        {/* Mission Tabs */}
        <Tabs defaultValue="solo" className="w-full">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="solo" className="flex-1">
              <Target className="w-4 h-4 mr-2" />
              Solo Missions
            </TabsTrigger>
            <TabsTrigger value="team" className="flex-1">
              <Users className="w-4 h-4 mr-2" />
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
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900 mb-1">Team Missions</p>
                  <p className="text-sm text-blue-800">
                    Shake your device to find teammates nearby and complete missions together!
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {teamMissions.map((mission) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  onClick={() => setSelectedMission(mission.id)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Mission Difficulty Guide */}
        <div className="mt-8 bg-white rounded-lg p-5 shadow-sm">
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
      </div>
    </div>
  );
}
