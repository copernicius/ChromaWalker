import { Clock, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { useParams } from 'react-router';
import { Header } from '../components/Header';
import { PhotoCard } from '../components/PhotoCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { MOCK_PHOTOS, RAINBOW_COLORS, RARE_COLORS } from '../data/mockData';

export const ColorGallery = () => {
  const { colorId } = useParams();

  const allColors = useMemo(() => [...RAINBOW_COLORS, ...RARE_COLORS], []);
  const color = useMemo(() => allColors.find((c) => c.id === colorId), [allColors, colorId]);
  const photos = useMemo(() => MOCK_PHOTOS.filter((p) => p.color === colorId), [colorId]);

  const sortedByPopular = useMemo(
    () => [...photos].sort((a, b) => b.likes + b.favorites * 2 - (a.likes + a.favorites * 2)),
    [photos],
  );

  const sortedByRecent = useMemo(
    () => [...photos].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
    [photos],
  );

  if (!color) {
    return (
      <div className="min-h-screen bg-[#F5F1ED] pb-24">
        <Header title="Gallery Not Found" showBack />
        <div className="max-w-screen-xl mx-auto px-4 pt-20 text-center">
          <p className="text-gray-600">This color gallery doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F1ED] pb-24">
      <Header title="" showBack />

      <div className="max-w-screen-xl mx-auto px-4 pt-16">
        {/* Color Header */}
        <div
          className="rounded-3xl p-8 mb-6 text-white shadow-md relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${color.hex} 0%, ${color.hex}dd 100%)` }}
        >
          <div className="relative z-10">
            <div className="mb-2">
              <span className="text-xs uppercase tracking-wide opacity-90">{color.category}</span>
            </div>
            <h1 className="text-4xl font-bold mb-2">{color.name}</h1>
            <p className="text-lg opacity-90">{photos.length} photos captured</p>
          </div>
          <div
            className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full opacity-20"
            style={{ background: color.hex }}
          />
        </div>

        {/* Photo Grid with Tabs */}
        <Tabs defaultValue="popular" className="w-full">
          <TabsList className="w-full mb-6 bg-white rounded-2xl p-1">
            <TabsTrigger
              value="popular"
              className="flex-1 rounded-xl data-[state=active]:bg-[#2D2520] data-[state=active]:text-white"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Popular
            </TabsTrigger>
            <TabsTrigger
              value="recent"
              className="flex-1 rounded-xl data-[state=active]:bg-[#2D2520] data-[state=active]:text-white"
            >
              <Clock className="w-4 h-4 mr-2" />
              Recent
            </TabsTrigger>
          </TabsList>

          <TabsContent value="popular">
            {sortedByPopular.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {sortedByPopular.map((photo) => (
                  <PhotoCard key={photo.id} photo={photo} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl">
                <p className="text-gray-600">
                  No photos yet. Be the first to capture {color.name.toLowerCase()}!
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="recent">
            {sortedByRecent.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {sortedByRecent.map((photo) => (
                  <PhotoCard key={photo.id} photo={photo} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl">
                <p className="text-gray-600">
                  No photos yet. Be the first to capture {color.name.toLowerCase()}!
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
