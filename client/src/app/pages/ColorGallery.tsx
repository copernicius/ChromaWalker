import { Clock, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router';
import { Header, PhotoCard, PhotoDetail } from '../components';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui';
import { MOCK_PHOTOS, RAINBOW_COLORS, RARE_COLORS } from '../data';

export function ColorGallery() {
  const { colorId } = useParams();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const color = [...RAINBOW_COLORS, ...RARE_COLORS].find((c) => c.id === colorId);
  const photos = MOCK_PHOTOS.filter((p) => p.color === colorId);

  const selectedPhotoData = selectedPhoto ? MOCK_PHOTOS.find((p) => p.id === selectedPhoto) : null;

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

  const sortedByPopular = [...photos].sort((a, b) => {
    const scoreA = a.likes + a.favorites * 2;
    const scoreB = b.likes + b.favorites * 2;
    return scoreB - scoreA;
  });

  const sortedByRecent = [...photos].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

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
                  <div key={photo.id}>
                    <PhotoCard photo={photo} onClick={() => setSelectedPhoto(photo.id)} />
                  </div>
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
                  <div key={photo.id}>
                    <PhotoCard photo={photo} onClick={() => setSelectedPhoto(photo.id)} />
                  </div>
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

      {/* Photo Detail Modal */}
      {selectedPhotoData && (
        <PhotoDetail photo={selectedPhotoData} onClose={() => setSelectedPhoto(null)} />
      )}
    </div>
  );
}
