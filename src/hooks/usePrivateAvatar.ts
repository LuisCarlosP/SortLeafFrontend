import { useEffect, useState } from 'react';
import { authService } from '../services/auth';
import type { User } from '../types/auth.types';

export function usePrivateAvatar(user: User | null, token: string | undefined, revision: number): string | null {
  const key = user?.profile?.profile_picture ? [user.id, user.profile.profile_picture, revision].join(':') : null;
  const [photo, setPhoto] = useState<{ key: string; url: string } | null>(null);

  useEffect(() => {
    if (!token || !key) return;
    const controller = new AbortController();
    let url: string | undefined;
    void authService.getProfilePicture(token, controller.signal).then(blob => {
      if (controller.signal.aborted) return;
      url = URL.createObjectURL(blob);
      setPhoto({ key, url });
    }).catch(() => {
      if (!controller.signal.aborted) setPhoto(null);
    });
    return () => {
      controller.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [key, token]);

  return token && photo?.key === key ? photo?.url ?? null : null;
}
