export function UploadTips() {
  return (
    <div className="mt-8 bg-white rounded-3xl p-6 shadow-sm animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">💡</span>
        <h3 className="text-lg font-semibold text-[#2D2520]">Tips for Great Photos</h3>
      </div>
      <ul className="space-y-3">
        <li className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-[#FF8A65]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-base">🎯</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[#2D2520] mb-0.5">Select a task first</p>
            <p className="text-xs text-gray-600">
              See which color you need to find for your mission
            </p>
          </div>
        </li>
        <li className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-[#FFD54F]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-base">📸</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[#2D2520] mb-0.5">Match the required color</p>
            <p className="text-xs text-gray-600">
              Take photos of objects that clearly match the color
            </p>
          </div>
        </li>
        <li className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-[#4DB6AC]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-base">💡</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[#2D2520] mb-0.5">Good lighting matters</p>
            <p className="text-xs text-gray-600">
              Proper lighting helps AI detect colors accurately
            </p>
          </div>
        </li>
        <li className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-[#8BA888]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-base">🔄</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[#2D2520] mb-0.5">Try again if needed</p>
            <p className="text-xs text-gray-600">
              If color test fails, retake with better color match
            </p>
          </div>
        </li>
      </ul>
    </div>
  );
}
