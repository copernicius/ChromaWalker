import { Link, useLocation } from 'react-router';
import { Home, Palette, Target, User, Plus } from 'lucide-react';

export function Navigation() {
  const location = useLocation();
  
  const navItems = [
    { path: '/home', icon: Home, label: 'Home' },
    { path: '/galleries', icon: Palette, label: 'Gallery' },
    { path: '/upload', icon: Plus, label: '', isUpload: true },
    { path: '/missions', icon: Target, label: 'Missions' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 rounded-t-3xl shadow-lg">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex justify-around items-center h-20 relative">
          {navItems.map(({ path, icon: Icon, label, isUpload }) => {
            const isActive = location.pathname === path;
            
            // Special styling for upload button (center item)
            if (isUpload) {
              return (
                <Link
                  key={path}
                  to={path}
                  className="flex flex-col items-center justify-center -mt-6"
                >
                  <div className="bg-gradient-to-br from-[#FF8A65] to-[#9575CD] text-white rounded-full p-4 shadow-xl hover:shadow-2xl transition-all hover:scale-110 active:scale-95 ring-4 ring-white">
                    <Icon className="w-7 h-7" strokeWidth={2.5} />
                  </div>
                </Link>
              );
            }
            
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all ${
                  isActive
                    ? 'text-[#2D2520]'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'fill-[#2D2520]/10' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}