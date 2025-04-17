import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { isFollowing, followUser, unfollowUser } from "@/lib/follow";

interface FollowButtonProps {
  targetUid: string;
}

export function FollowButton({ targetUid }: FollowButtonProps) {
  const { currentUser } = useAuth();
  const [isFollowed, setIsFollowed] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      if (!currentUser || !targetUid || currentUser.uid === targetUid) return;
      const result = await isFollowing(currentUser.uid, targetUid);
      if (mounted) setIsFollowed(result);
    };
    check();
    return () => { mounted = false; };
  }, [currentUser, targetUid]);

  if (!currentUser || currentUser.uid === targetUid) return null;

  const handleFollow = async () => {
    setLoading(true);
    try {
      await followUser(currentUser.uid, targetUid);
      setIsFollowed(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async () => {
    setLoading(true);
    try {
      await unfollowUser(currentUser.uid, targetUid);
      setIsFollowed(false);
    } finally {
      setLoading(false);
    }
  };

  return isFollowed ? (
    <Button size="sm" variant="outline" disabled={loading} onClick={handleUnfollow}>
      Takipten Çık
    </Button>
  ) : (
    <Button size="sm" variant="default" disabled={loading} onClick={handleFollow}>
      Takip Et
    </Button>
  );
}
