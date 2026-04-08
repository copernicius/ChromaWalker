import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';

interface HeaderProps {
  title: string;
  showBack?: boolean;
}

export function Header({ title, showBack = false }: HeaderProps) {
  const navigate = useNavigate();

  // Don't render header if title is empty and no back button
  if (!title && !showBack) {
    return null;
  }

  // Use transparent header if there's no title
  const headerClasses = title
    ? 'fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40'
    : 'fixed top-0 left-0 right-0 z-40';

  return (
    <header className={headerClasses}>
      <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center">
        {showBack && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mr-3 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        {title && <h1 className="text-lg font-semibold">{title}</h1>}
      </div>
    </header>
  );
}
