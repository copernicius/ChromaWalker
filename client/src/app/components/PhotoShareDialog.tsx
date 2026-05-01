import { Copy, Instagram, MessageCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui';

interface SharePhoto {
  id: string;
  imageUrl: string;
  caption?: string;
  location: string;
  username: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photo: SharePhoto;
}

export function PhotoShareDialog({ open, onOpenChange, photo }: Props) {
  // Deep link into the gallery with the photo modal pre-opened. Galleries
  // reads the `photo` query param and lifts it into selectedPhoto on mount.
  const url = `${window.location.origin}/galleries?photo=${photo.id}`;
  // The raw image URL — only used for the Instagram-fallback download path.
  const imageUrl = `${window.location.origin}${photo.imageUrl}`;
  const text =
    photo.caption?.trim() ||
    `${photo.username}'s photo at ${photo.location} on ChromaWalk`;

  const close = () => onOpenChange(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
      close();
    } catch {
      toast.error('Could not copy link');
    }
  };

  const handleWhatsApp = () => {
    const message = `${text} ${url}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer',
    );
    close();
  };

  // Instagram has no web→IG share API. On mobile with Web Share API installed,
  // calling navigator.share() opens the native sheet where IG is one of the
  // targets. On desktop (or unsupported browsers), fall back to downloading
  // the image so the user can manually post it from the IG app.
  const handleInstagram = async () => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ url, text });
        close();
        return;
      } catch (err) {
        // AbortError = user cancelled the sheet — silently ignore.
        if ((err as { name?: string }).name === 'AbortError') return;
      }
    }
    // Fallback: download the image, prompt the user to post manually.
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `chromawalk-${photo.id}.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success('Image downloaded — share it from your Instagram app');
    close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-none sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold text-[#2D2520]">
            Share this photo
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            Pick where to send it
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3 mt-2">
          <ShareButton
            icon={<MessageCircle className="w-6 h-6 text-white" />}
            label="WhatsApp"
            color="#25D366"
            onClick={handleWhatsApp}
          />
          <ShareButton
            icon={<Instagram className="w-6 h-6 text-white" />}
            label="Instagram"
            // Instagram's brand gradient — gives it visual weight to match
            // the other two solid-color tiles.
            background="linear-gradient(135deg, #F58529 0%, #DD2A7B 50%, #8134AF 100%)"
            onClick={handleInstagram}
          />
          <ShareButton
            icon={<Copy className="w-6 h-6 text-white" />}
            label="Copy link"
            color="#2D2520"
            onClick={handleCopyLink}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ShareButtonProps {
  icon: ReactNode;
  label: string;
  color?: string;
  background?: string;
  onClick: () => void;
}

function ShareButton({ icon, label, color, background, onClick }: ShareButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        // The share dialog is portaled but its React-tree parent is
        // PhotoDetail's backdrop (which closes on click). Without this,
        // clicking a share tile would close the photo modal too.
        e.stopPropagation();
        onClick();
      }}
      className="flex flex-col items-center gap-2 p-2 rounded-2xl hover:bg-gray-50 transition-colors active:scale-95"
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
        style={{ background: background ?? color }}
      >
        {icon}
      </div>
      <span className="text-xs font-medium text-[#2D2520]">{label}</span>
    </button>
  );
}
