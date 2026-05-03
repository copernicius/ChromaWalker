import { Clock, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router";
import { Header, PhotoDetail, WaterfallGrid } from "../components";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui";
import { getPaletteColor } from "../data";
import { usePhotosQuery } from "../queries";

export function ColorGallery() {
  const { colorId } = useParams();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const { data: allPhotos = [] } = usePhotosQuery();
  const color = getPaletteColor(colorId);
  const photos = allPhotos.filter((p) => p.color === colorId);

  const selectedPhotoData = selectedPhoto
    ? allPhotos.find((p) => p.id === selectedPhoto)
    : null;

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

  const sortedByRecent = [...photos].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
  );

  return (
    <div className="min-h-screen bg-[#F5F1ED] pb-24">
      <Header title="" showBack />

      <div className="max-w-screen-xl mx-auto px-4 pt-16">
        {/* Color Header */}
        <div
          className="rounded-3xl p-8 mb-6 text-white shadow-md relative overflow-hidden"
          style={{ backgroundColor: color.morandi }}
        >
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-2">
              {color.fancyName ?? color.name}
            </h1>
            <p className="text-lg opacity-90">
              {photos.length} photos captured
            </p>
          </div>
          <div
            className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full opacity-20"
            style={{ background: color.morandi }}
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
              <WaterfallGrid
                photos={sortedByPopular}
                onSelect={setSelectedPhoto}
              />
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl">
                <p className="text-gray-600">
                  No photos yet. Be the first to capture{" "}
                  {(color.fancyName ?? color.name).toLowerCase()}!
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="recent">
            {sortedByRecent.length > 0 ? (
              <WaterfallGrid
                photos={sortedByRecent}
                onSelect={setSelectedPhoto}
              />
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl">
                <p className="text-gray-600">
                  No photos yet. Be the first to capture{" "}
                  {(color.fancyName ?? color.name).toLowerCase()}!
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Photo Detail Modal */}
      {selectedPhotoData && (
        <PhotoDetail
          photo={selectedPhotoData}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </div>
  );
}
