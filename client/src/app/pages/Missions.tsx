import {
  Archive,
  Crown,
  Dices,
  MapPin,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
  Target,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  DailyMissionCard,
  Header,
  MissionCard,
  ShakeToJoinDialog,
  UserAvatar,
} from '../components';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Progress,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui';
import { getPaletteColor, PALETTE } from '../data';
import {
  type TeamMission,
  useCreateTeamMissionMutation,
  useJoinTeamMissionMutation,
  useLeaveTeamMissionMutation,
  useMyMissionProgressQuery,
  useMyTeamMissionsQuery,
  useOpenTeamMissionsQuery,
  usePostTeamMessageMutation,
  useSoloMissionsQuery,
  useTeamMessageStream,
  useTeamMessagesQuery,
  useTeamMissionOptionsQuery,
  useTeamUpdatesStream,
} from '../queries';
import { useAppStore } from '../store';

export function Missions() {
  const navigate = useNavigate();
  const [showDifficultyGuide, setShowDifficultyGuide] = useState(false);
  const user = useAppStore((s) => s.user);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  const { data: soloMissions = [] } = useSoloMissionsQuery();
  const { data: openTeams = [] } = useOpenTeamMissionsQuery();
  const { data: myTeams = [] } = useMyTeamMissionsQuery();
  const { data: missionProgress = {} } = useMyMissionProgressQuery();

  // Send the user to /upload with the selected mission pre-populated; the
  // Upload page reads ?taskType=&missionId= on mount and applies the state.
  const goUploadFor = (taskType: 'solo', missionId: string) => {
    navigate(`/upload?taskType=${taskType}&missionId=${missionId}`);
  };

  // Open teams I'm not already in.
  const joinableTeams = openTeams.filter(
    (t) => !t.members.some((m) => m.username === user.username),
  );

  useEffect(() => {
    if (!localStorage.getItem('hasVisitedMissions')) {
      setShowDifficultyGuide(true);
      localStorage.setItem('hasVisitedMissions', 'true');
    }
  }, []);

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

        {/* Daily mission card — shared component matching the Home page.
            Always renders the frame so the layout below doesn't shift when
            the query resolves. */}
        <div className="mb-6">
          <DailyMissionCard />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="solo" className="w-full">
          <TabsList className="w-full mb-6 bg-white/80 backdrop-blur-sm p-2 rounded-2xl shadow-md border border-gray-200/50">
            <TabsTrigger
              value="solo"
              className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-400 data-[state=active]:to-purple-400 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl py-3 font-semibold transition-all"
            >
              <Target className="w-5 h-5 mr-2" />
              Solo
            </TabsTrigger>
            <TabsTrigger
              value="team"
              className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-400 data-[state=active]:to-pink-400 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl py-3 font-semibold transition-all"
            >
              <Users className="w-5 h-5 mr-2" />
              Team
            </TabsTrigger>
          </TabsList>

          <TabsContent value="solo">
            <div className="space-y-4">
              {soloMissions.map((mission) => {
                const target = mission.total ?? 1;
                const rawProgress = missionProgress[mission.id] ?? 0;
                const progress = Math.min(rawProgress, target);
                const completed = rawProgress >= target;
                return (
                  <MissionCard
                    key={mission.id}
                    mission={{ ...mission, progress, completed }}
                    onClick={() => goUploadFor('solo', mission.id)}
                  />
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="team">
            <TeamMissionsTab
              myTeams={myTeams}
              joinableTeams={joinableTeams}
              isAuthenticated={isAuthenticated}
            />
          </TabsContent>
        </Tabs>

        {/* Difficulty Guide */}
        {showDifficultyGuide && (
          <div className="mt-8 bg-white rounded-lg p-5 shadow-sm relative animate-slide-up">
            <button
              type="button"
              onClick={() => setShowDifficultyGuide(false)}
              className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <h3 className="font-semibold mb-4">Difficulty Levels</h3>
            <div className="space-y-3">
              {[
                ['Easy', 'bg-green-500', '+40 points'],
                ['Medium', 'bg-yellow-500', '+80 points'],
                ['Hard', 'bg-orange-500', '+150 points'],
                ['Legendary', 'bg-purple-500', '+250 points'],
              ].map(([label, dot, pts]) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${dot}`} />
                    <span className="text-sm">{label}</span>
                  </div>
                  <span className="text-sm text-gray-600">{pts}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Team tab — my teams, joinable teams, create dialog.
// ────────────────────────────────────────────────────────────────────

interface TeamTabProps {
  myTeams: TeamMission[];
  joinableTeams: TeamMission[];
  isAuthenticated: boolean;
}

function TeamMissionsTab({ myTeams, joinableTeams, isAuthenticated }: TeamTabProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [shakeOpen, setShakeOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600">Sign in to join or create team missions.</p>
      </div>
    );
  }

  // Single-team rule (mirrors server): a user is "in a team" iff they have
  // an active membership (open or in_progress). Completed teams don't count
  // — finishing a mission frees the slot. Completed teams move to the
  // History section below as read-only records.
  const activeTeam = myTeams.find(
    (t) => t.status === 'open' || t.status === 'in_progress',
  );
  const historyTeams = myTeams.filter((t) => t.status === 'completed');
  const isLocked = !!activeTeam;

  const tryOpenCreate = () => {
    if (isLocked) {
      toast.error('You are already in a team. Finish it before creating another.');
      return;
    }
    setCreateOpen(true);
  };

  const tryOpenShake = () => {
    if (isLocked) {
      toast.error('You are already in a team. Finish it before joining another.');
      return;
    }
    setShakeOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Create + shake-to-join — both gated by the single-team rule. */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={tryOpenCreate}
          disabled={isLocked}
          className={`bg-gradient-to-r from-purple-400 to-pink-400 text-white px-4 py-4 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 shadow-md ${
            isLocked
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:shadow-xl hover:scale-[1.02] active:scale-95'
          }`}
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm">{isLocked ? 'In a team' : 'Create team'}</span>
        </button>
        <button
          type="button"
          onClick={tryOpenShake}
          disabled={isLocked}
          className={`bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-4 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 shadow-md ${
            isLocked
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:shadow-xl hover:scale-[1.02] active:scale-95'
          }`}
        >
          <Dices className="w-5 h-5" />
          <span className="text-sm">Shake to join</span>
        </button>
      </div>

      {/* My Team — single active mission. Empty state when slot is free. */}
      <section>
        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <Crown className="w-5 h-5 text-yellow-600" />
          My Team
        </h3>
        {activeTeam ? (
          <TeamRow team={activeTeam} canLeave />
        ) : (
          <p className="text-sm text-gray-500 bg-white rounded-xl p-4">
            You're not in any team yet.
          </p>
        )}
      </section>

      {/* Open Teams */}
      <section>
        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-600" />
          Open Teams
          <span className="text-sm font-normal text-gray-500">
            ({joinableTeams.length})
          </span>
        </h3>
        {joinableTeams.length === 0 ? (
          <p className="text-sm text-gray-500 bg-white rounded-xl p-4">
            No open teams right now. Be the first to start one!
          </p>
        ) : (
          <div className="space-y-3">
            {joinableTeams.map((team) => (
              <TeamRow
                key={team.id}
                team={team}
                canJoin
                joinDisabled={isLocked}
              />
            ))}
          </div>
        )}
      </section>

      {/* History — completed missions as read-only records. The team data
          + chat survive completion; everything past this point is frozen. */}
      {historyTeams.length > 0 && (
        <section>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Archive className="w-5 h-5 text-gray-500" />
            History
            <span className="text-sm font-normal text-gray-500">
              ({historyTeams.length})
            </span>
          </h3>
          <div className="space-y-3">
            {historyTeams.map((team) => (
              <TeamRow key={team.id} team={team} readOnly />
            ))}
          </div>
        </section>
      )}

      <CreateTeamDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ShakeToJoinDialog open={shakeOpen} onOpenChange={setShakeOpen} />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Single team row — used in both My Teams and Open Teams sections.
// ────────────────────────────────────────────────────────────────────

interface TeamRowProps {
  team: TeamMission;
  canJoin?: boolean;
  canLeave?: boolean;
  joinDisabled?: boolean;
  // Frozen view for History entries — disables actions, skips the live
  // updates subscription, and renders the detail dialog as read-only.
  readOnly?: boolean;
}

// Auto-start threshold mirrors the server rule (joinTeamMission):
// strictly more than half the seats must be filled.
function startThreshold(maxSize: number): number {
  return Math.floor(maxSize / 2) + 1;
}

function TeamRow({ team, canJoin, canLeave, joinDisabled, readOnly }: TeamRowProps) {
  const me = useAppStore((s) => s.user);
  const join = useJoinTeamMissionMutation();
  const leave = useLeaveTeamMissionMutation();
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmJoinOpen, setConfirmJoinOpen] = useState(false);
  const [confirmDisbandOpen, setConfirmDisbandOpen] = useState(false);
  const isCreator = team.creatorUsername === me.username;
  // Subscribe to live progress updates only for active teams the user is
  // in. Read-only history rows are frozen — no socket churn, no toast on
  // mount. The onCompleted callback fires once when the mission flips to
  // completed.
  useTeamUpdatesStream(team.id, !!canLeave && !readOnly, (t) => {
    const share = t.members.length > 0 ? Math.floor(t.reward / t.members.length) : 0;
    toast.success(`Team mission "${t.title}" completed!`, {
      description: share > 0 ? `+${share} points awarded to each member` : undefined,
      duration: 6000,
    });
  });
  const color = getPaletteColor(team.color);
  const progressPct = (team.currentProgress / team.target) * 100;
  const isRainbow = team.color === 'rainbow';

  const threshold = startThreshold(team.maxSize);
  const remainingToStart = Math.max(0, threshold - team.members.length);

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      {/* Card body — clickable to open the detail dialog. The action row
          below stops propagation so its buttons don't double-fire. */}
      <button
        type="button"
        onClick={() => setDetailOpen(true)}
        className="w-full text-left -m-1 p-1 rounded-xl hover:bg-gray-50 transition-colors"
        aria-label={`View details for ${team.title}`}
      >
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm"
            style={{
              background: isRainbow
                ? 'linear-gradient(135deg, #FF8A65, #FFD54F, #4DB6AC)'
                : color?.morandi,
            }}
          >
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="font-bold text-[#2D2520] truncate">{team.title}</p>
              <span className="text-xs font-semibold text-[#F4C430] flex-shrink-0">
                +{team.reward} pts
              </span>
            </div>
            {team.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{team.description}</p>
            )}
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" /> {team.members.length}/{team.maxSize}
              </span>
              <span>· {team.status.replace('_', ' ')}</span>
              <span>
                · {isRainbow ? 'Any color' : (color?.fancyName ?? team.color)}
              </span>
              {team.location && (
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3" /> {team.location}
                </span>
              )}
            </p>
          </div>
        </div>

        {team.status === 'open' && remainingToStart > 0 && (
          <p className="text-xs text-purple-600 font-medium">
            Needs {remainingToStart} more {remainingToStart === 1 ? 'member' : 'members'} to start
          </p>
        )}

        {team.status === 'in_progress' || team.status === 'completed' ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Progress</span>
              <span>
                {team.currentProgress}/{team.target}
              </span>
            </div>
            <Progress value={progressPct} className="h-1.5" />
          </div>
        ) : null}
      </button>

      {!readOnly && (
      <div
        className="flex gap-2 mt-3"
        onClick={(e) => e.stopPropagation()}
      >
        {canJoin && (
          <Button
            onClick={() => {
              if (join.isPending) return;
              if (joinDisabled) {
                toast.error('You are already in a team. Finish it first.');
                return;
              }
              // Surface the no-leaving rule before the user commits — this
              // is a one-way door, so the warning matters.
              setConfirmJoinOpen(true);
            }}
            disabled={
              join.isPending ||
              team.members.length >= team.maxSize ||
              joinDisabled
            }
            className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
          >
            <Zap className="w-4 h-4 mr-1" />
            {joinDisabled ? 'Already in a team' : 'Join'}
          </Button>
        )}
        {/* Only the creator can leave — and doing so destroys the team for
            everyone (see leaveTeamMission on the server). Joiners have no
            leave path; that's surfaced in JoinConfirmDialog. */}
        {canLeave && isCreator && team.status !== 'completed' && (
          <Button
            variant="outline"
            onClick={() => {
              if (leave.isPending) return;
              setConfirmDisbandOpen(true);
            }}
            disabled={leave.isPending}
            className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
          >
            Disband team
          </Button>
        )}
      </div>
      )}

      <TeamDetailDialog
        team={team}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        readOnly={readOnly}
      />
      <JoinConfirmDialog
        open={confirmJoinOpen}
        onOpenChange={setConfirmJoinOpen}
        pending={join.isPending}
        onConfirm={() => {
          join.mutate(team.id, {
            onSuccess: () => {
              toast.success('Joined team');
              setConfirmJoinOpen(false);
            },
            onError: (e) => toast.error(e.message || 'Could not join'),
          });
        }}
      />
      <DisbandConfirmDialog
        open={confirmDisbandOpen}
        onOpenChange={setConfirmDisbandOpen}
        pending={leave.isPending}
        memberCount={team.members.length}
        onConfirm={() => {
          leave.mutate(team.id, {
            onSuccess: () => {
              toast.success('Team disbanded');
              setConfirmDisbandOpen(false);
              setDetailOpen(false);
            },
            onError: (e) => toast.error(e.message || 'Could not disband'),
          });
        }}
      />
    </div>
  );
}

// One-way door warning. Joining locks the user in until the mission
// completes (see leaveTeamMission server-side) and consumes their single
// team slot, so we make the consequence explicit before they commit.
function JoinConfirmDialog({
  open,
  onOpenChange,
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-none sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-500" />
            Ready for the challenge?
          </DialogTitle>
          <DialogDescription className="text-left space-y-2 pt-2">
            <span className="block">
              Once you join, <strong>you can't leave</strong> — only the team
              creator can disband the team. You can only be in one team at a
              time.
            </span>
            <span className="block">
              This is a challenging game. If you want to finish, just invite
              more people in!
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={pending}
            className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
          >
            {pending ? 'Joining…' : "Yes, I'm in"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Creator-only destructive action: leaving destroys the team entirely
// (cascade-deletes its messages on the server). Make the consequence
// loud since other members are along for the ride.
function DisbandConfirmDialog({
  open,
  onOpenChange,
  pending,
  memberCount,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  memberCount: number;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-none sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <X className="w-5 h-5" />
            Disband this team?
          </DialogTitle>
          <DialogDescription className="text-left space-y-2 pt-2">
            <span className="block">
              Leaving the team you created <strong>destroys it for everyone</strong>.
              Progress, members, and the message board will all be gone.
            </span>
            {memberCount > 1 && (
              <span className="block">
                {memberCount - 1}{' '}
                {memberCount - 1 === 1 ? 'other member' : 'other members'} will lose
                this mission. This cannot be undone.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
            className="flex-1"
          >
            Keep team
          </Button>
          <Button
            onClick={onConfirm}
            disabled={pending}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            {pending ? 'Disbanding…' : 'Disband team'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ────────────────────────────────────────────────────────────────────
// Team detail — full mission info + members list. Reachable by clicking
// any team card in the My Teams or Open Teams sections.
// ────────────────────────────────────────────────────────────────────

function TeamDetailDialog({
  team,
  open,
  onOpenChange,
  readOnly,
}: {
  team: TeamMission;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  readOnly?: boolean;
}) {
  const color = getPaletteColor(team.color);
  const isRainbow = team.color === 'rainbow';
  const threshold = startThreshold(team.maxSize);
  const remainingToStart = Math.max(0, threshold - team.members.length);
  const progressPct = (team.currentProgress / team.target) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-none sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div
              className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm"
              style={{
                background: isRainbow
                  ? 'linear-gradient(135deg, #FF8A65, #FFD54F, #4DB6AC)'
                  : color?.morandi,
              }}
            >
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <DialogTitle className="text-lg">{team.title}</DialogTitle>
              <DialogDescription className="text-xs">
                {team.status.replace('_', ' ')} ·{' '}
                {isRainbow
                  ? 'Any color'
                  : color
                    ? `${color.fancyName} (${color.name})`
                    : team.color}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {team.description && (
            <p className="text-sm text-gray-700">{team.description}</p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Photos" value={`${team.currentProgress}/${team.target}`} />
            <Stat label="Reward" value={`+${team.reward}`} />
            <Stat label="Members" value={`${team.members.length}/${team.maxSize}`} />
          </div>

          {/* Progress / start hint */}
          {team.status === 'open' && (
            <div className="bg-purple-50 rounded-xl p-3 text-sm text-purple-700">
              {remainingToStart > 0
                ? `Needs ${remainingToStart} more ${remainingToStart === 1 ? 'member' : 'members'} to auto-start. (Threshold: ${threshold} of ${team.maxSize})`
                : 'Ready to start once the next join lands.'}
            </div>
          )}
          {(team.status === 'in_progress' || team.status === 'completed') && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Progress</span>
                <span>
                  {team.currentProgress}/{team.target}
                </span>
              </div>
              <Progress value={progressPct} className="h-2" />
            </div>
          )}

          {team.location && (
            <p className="text-sm text-gray-600 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-gray-400" />
              {team.location}
            </p>
          )}

          {/* Members */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              Members ({team.members.length}/{team.maxSize})
            </h4>
            <ul className="space-y-2">
              {team.members.map((m) => (
                <li
                  key={m.userId}
                  className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2"
                >
                  <UserAvatar url={m.avatarUrl} name={m.username} size={32} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#2D2520] truncate">
                      {m.username}
                    </p>
                    <p className="text-xs text-gray-500">
                      Joined {new Date(m.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-purple-600">
                    {m.contribution} {m.contribution === 1 ? 'photo' : 'photos'}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Message board — members only. The endpoint is gated server-side
              too; the isMember check here just hides the board entirely for
              non-members so they don't see "permission denied" noise. */}
          <MessageBoard team={team} open={open} readOnly={readOnly} />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-2.5">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-[#2D2520]">{value}</p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Message board — newest-first list + composer. Members-only on both
// sides; non-members see a one-line notice instead.
// ────────────────────────────────────────────────────────────────────

function MessageBoard({
  team,
  open,
  readOnly,
}: {
  team: TeamMission;
  open: boolean;
  readOnly?: boolean;
}) {
  const me = useAppStore((s) => s.user);
  const isMember = team.members.some((m) => m.username === me.username);
  const { data: messages = [], isLoading } = useTeamMessagesQuery(
    team.id,
    open && isMember,
  );
  // Live updates via Socket.IO. The stream patches the same query cache the
  // initial GET hydrated, so the list grows in real time without polling.
  // Skipped in read-only mode — history rooms are frozen.
  useTeamMessageStream(team.id, open && isMember && !readOnly);
  const post = usePostTeamMessageMutation(team.id);
  const [draft, setDraft] = useState('');

  const send = () => {
    const trimmed = draft.trim();
    if (trimmed.length === 0 || post.isPending) return;
    post.mutate(trimmed, {
      onSuccess: () => setDraft(''),
      onError: (e) => toast.error(e.message || 'Could not send'),
    });
  };

  if (!isMember) {
    return (
      <div>
        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-gray-500" />
          Message board
        </h4>
        <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
          Join the team to see and post messages.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-gray-500" />
        Message board
        <span className="text-xs font-normal text-gray-500">
          ({messages.length}){readOnly ? ' · archived' : ''}
        </span>
      </h4>

      {!readOnly && (
        <div className="flex gap-2 mb-3">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Leave a message…"
            maxLength={500}
          />
          <Button
            onClick={send}
            disabled={post.isPending || draft.trim().length === 0}
            className="bg-purple-500 hover:bg-purple-600 text-white shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      )}

      {isLoading ? (
        <p className="text-xs text-gray-500">Loading messages…</p>
      ) : messages.length === 0 ? (
        <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
          No messages yet. Be the first to say hi!
        </p>
      ) : (
        <ul className="space-y-2 max-h-64 overflow-y-auto">
          {messages.map((m) => (
            <li
              key={m.id}
              className="flex items-start gap-2 bg-gray-50 rounded-xl px-3 py-2"
            >
              <div className="mt-0.5">
                <UserAvatar url={m.avatarUrl} name={m.username} size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-[#2D2520] truncate">
                    {m.username}
                  </span>
                  <span className="text-xs text-gray-500 shrink-0">
                    {new Date(m.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-800 break-words whitespace-pre-wrap">
                  {m.text}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Create team dialog
// ────────────────────────────────────────────────────────────────────

interface CreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CreateTeamDialog({ open, onOpenChange }: CreateDialogProps) {
  const { data: options } = useTeamMissionOptionsQuery();
  const targetOptions = options?.targets ?? [];
  const rewardOptions = options?.rewards ?? [];
  const maxSizeOptions = options?.maxSizes ?? [];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PALETTE[0].id);
  const [target, setTarget] = useState<number | null>(null);
  const [reward, setReward] = useState<number | null>(null);
  const [maxSize, setMaxSize] = useState<number | null>(null);
  // Validation only reveals once the user has clicked Create — avoids
  // splashing the form red the moment the dialog opens.
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const create = useCreateTeamMissionMutation();

  // Pin defaults once the server's allowed values arrive — avoids hard-coding
  // numbers on the client that could drift from lib/teamMissionOptions.
  useEffect(() => {
    if (target === null && targetOptions.length > 0) setTarget(targetOptions[0]);
    if (reward === null && rewardOptions.length > 0) setReward(rewardOptions[0]);
    if (maxSize === null && maxSizeOptions.length > 0) setMaxSize(maxSizeOptions[0]);
  }, [target, reward, maxSize, targetOptions, rewardOptions, maxSizeOptions]);

  // Reset error state on every dialog re-open so a previous failed attempt
  // doesn't leave the form red.
  useEffect(() => {
    if (open) setSubmitAttempted(false);
  }, [open]);

  const reset = () => {
    setTitle('');
    setDescription('');
    setColor(PALETTE[0].id);
    setTarget(targetOptions[0] ?? null);
    setReward(rewardOptions[0] ?? null);
    setMaxSize(maxSizeOptions[0] ?? null);
    setSubmitAttempted(false);
  };

  const titleInvalid = title.trim().length === 0;
  const targetInvalid = target === null;
  const rewardInvalid = reward === null;
  const maxSizeInvalid = maxSize === null;
  const showTitleError = submitAttempted && titleInvalid;
  const showTargetError = submitAttempted && targetInvalid;
  const showRewardError = submitAttempted && rewardInvalid;
  const showMaxSizeError = submitAttempted && maxSizeInvalid;

  const handleSubmit = () => {
    setSubmitAttempted(true);
    if (titleInvalid || targetInvalid || rewardInvalid || maxSizeInvalid) {
      toast.error('Please fill in the highlighted fields');
      return;
    }
    create.mutate(
      {
        title: title.trim(),
        description: description.trim(),
        color,
        target: target as number,
        reward: reward as number,
        maxSize: maxSize as number,
      },
      {
        onSuccess: () => {
          toast.success('Team mission created');
          reset();
          onOpenChange(false);
        },
        onError: (e) => toast.error(e.message || 'Could not create team'),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-none sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a team mission</DialogTitle>
          <DialogDescription>
            Pick a target color and how many photos the team needs to find.
            Anyone can join until the minimum size is reached — then it
            auto-starts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="t-title"
              className={showTitleError ? 'text-red-600' : undefined}
            >
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="t-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sunset Coral doors in the CBD"
              maxLength={100}
              aria-invalid={showTitleError || undefined}
              aria-describedby={showTitleError ? 't-title-err' : undefined}
            />
            {showTitleError && (
              <p id="t-title-err" className="text-xs text-red-600">
                Please give your team mission a title.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="t-desc">Description (optional)</Label>
            <Input
              id="t-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A bit more context for joiners…"
              maxLength={500}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Target color</Label>
            <ColorSwatchPicker value={color} onChange={setColor} />
          </div>

          <div className="space-y-1.5">
            <Label className={showTargetError ? 'text-red-600' : undefined}>
              Photos to collect <span className="text-red-500">*</span>
            </Label>
            <SegmentedNumberPicker
              value={target}
              options={targetOptions}
              onChange={setTarget}
              invalid={showTargetError}
            />
            {showTargetError && (
              <p className="text-xs text-red-600">Pick how many photos the team needs.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className={showRewardError ? 'text-red-600' : undefined}>
              Total reward (split equally) <span className="text-red-500">*</span>
            </Label>
            <SegmentedNumberPicker
              value={reward}
              options={rewardOptions}
              onChange={setReward}
              suffix=" pts"
              invalid={showRewardError}
            />
            {showRewardError && (
              <p className="text-xs text-red-600">Pick a reward to split among members.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className={showMaxSizeError ? 'text-red-600' : undefined}>
              Max team size <span className="text-red-500">*</span>
            </Label>
            <SegmentedNumberPicker
              value={maxSize}
              options={maxSizeOptions}
              onChange={setMaxSize}
              invalid={showMaxSizeError}
            />
            {showMaxSizeError ? (
              <p className="text-xs text-red-600">Pick the maximum team size.</p>
            ) : (
              maxSize !== null && (
                <p className="text-xs text-gray-500">
                  Auto-starts once {startThreshold(maxSize)} of {maxSize} members have joined.
                </p>
              )
            )}
          </div>
        </div>

        <DialogFooter className="flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={create.isPending}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={create.isPending}
            className="flex-1 bg-[#2D2520] hover:bg-[#3D3530] text-white"
          >
            {create.isPending ? 'Creating…' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Two-row swatch grid — clicking a swatch picks the color. The label below
// shows BOTH names of the current selection: boutique fancy name for flavor
// ("Sunset Coral"), literal name in muted text for clarity ("Red"). Hover
// tooltip carries both too, so users learn the mapping.
function ColorSwatchPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const selected = getPaletteColor(value);
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-6 gap-2">
        {PALETTE.map((c) => {
          const active = c.id === value;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange(c.id)}
              title={`${c.fancyName} (${c.name})`}
              aria-label={`${c.fancyName} (${c.name})`}
              aria-pressed={active}
              className={`aspect-square rounded-md border-2 transition ${
                active
                  ? 'border-[#2D2520] ring-2 ring-[#2D2520]/20'
                  : 'border-transparent hover:border-gray-300'
              }`}
              style={{ backgroundColor: c.morandi }}
            />
          );
        })}
      </div>
      {selected && (
        <p className="text-sm text-gray-600">
          Selected:{' '}
          <span className="font-medium text-gray-900">{selected.fancyName}</span>
          <span className="text-gray-500"> ({selected.name})</span>
        </p>
      )}
    </div>
  );
}

// Pill row of fixed numeric choices — replaces the free-form number input
// so the client can only submit values the server accepts.
function SegmentedNumberPicker({
  value,
  options,
  onChange,
  suffix = '',
  invalid = false,
}: {
  value: number | null;
  options: number[];
  onChange: (n: number) => void;
  suffix?: string;
  /** Highlights every unselected option in red — used by the create-team
      form to show that nothing has been picked yet. */
  invalid?: boolean;
}) {
  if (options.length === 0) {
    return <p className="text-sm text-gray-400">Loading options…</p>;
  }
  return (
    <div className="flex gap-2">
      {options.map((n) => {
        const active = n === value;
        const inactiveBorder = invalid
          ? 'border-red-300 hover:border-red-400'
          : 'border-gray-200 hover:border-gray-400';
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-pressed={active}
            className={`flex-1 h-9 rounded-md text-sm border transition ${
              active
                ? 'bg-[#2D2520] text-white border-[#2D2520]'
                : `bg-white text-gray-700 ${inactiveBorder}`
            }`}
          >
            {n}
            {suffix}
          </button>
        );
      })}
    </div>
  );
}
