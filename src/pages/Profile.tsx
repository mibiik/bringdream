import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/auth-provider';
import { db, storage } from '@/lib/firebase'; // Removed updateUserProfile, uploadFile
import { doc, onSnapshot, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore'; // Added updateDoc
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Added storage functions
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import { Camera, Edit2, UserCheck, UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { UserList } from '@/components/UserList'; // Assuming UserList can be adapted or a similar component exists
import { UserType } from '@/types'; // Assuming a UserType definition exists

interface UserProfileData {
  username: string;
  name: string;
  bio: string;
  avatar: string;
  coverPhoto: string;
  followersCount: number;
  followingCount: number;
}

export default function Profile() {
  const { currentUser } = useAuth();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', bio: '' });
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [followers, setFollowers] = useState<UserType[]>([]);
  const [following, setFollowing] = useState<UserType[]>([]);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentUser) return;

    const userDocRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Fetch follower/following counts
        const followersCol = collection(db, 'users', currentUser.uid, 'followers');
        const followingCol = collection(db, 'users', currentUser.uid, 'following');
        const followersSnap = await getDocs(followersCol);
        const followingSnap = await getDocs(followingCol);

        setProfileData({
          username: data.username || '',
          name: data.name || '',
          bio: data.bio || '',
          avatar: data.avatar || '/placeholder.svg',
          coverPhoto: data.coverPhoto || '/placeholder.svg', // Add a default cover photo placeholder
          followersCount: followersSnap.size,
          followingCount: followingSnap.size,
        });
        setEditData({ name: data.name || '', bio: data.bio || '' });
      } else {
        console.log('No such document!');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing && profileData) {
      // Reset edit fields if canceling
      setEditData({ name: profileData.name, bio: profileData.bio });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSave = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, { name: editData.name, bio: editData.bio }); // Use updateDoc
      toast.success('Profil başarıyla güncellendi!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Profil güncellenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') => {
    if (e.target.files && e.target.files[0]) {
      if (type === 'profile') {
        setProfileImageFile(e.target.files[0]);
        handleImageUpload('profile', e.target.files[0]);
      } else {
        setCoverImageFile(e.target.files[0]);
        handleImageUpload('cover', e.target.files[0]);
      }
    }
  };

  const handleImageUpload = async (type: 'profile' | 'cover', file: File) => {
    if (!currentUser || !file) return;

    const uploader = type === 'profile' ? setUploadingProfile : setUploadingCover;
    uploader(true);

    try {
      const filePath = `user_images/${currentUser.uid}/${type === 'profile' ? 'avatar' : 'cover'}_${Date.now()}`;
      const storageRef = ref(storage, filePath); // Create storage reference
      await uploadBytes(storageRef, file); // Upload file
      const downloadURL = await getDownloadURL(storageRef); // Get download URL

      const updateData = type === 'profile' ? { avatar: downloadURL } : { coverPhoto: downloadURL };
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, updateData); // Use updateDoc

      setProfileData(prev => prev ? { ...prev, [type === 'profile' ? 'avatar' : 'coverPhoto']: downloadURL } : null);
      toast.success(`${type === 'profile' ? 'Profil' : 'Kapak'} fotoğrafı başarıyla yüklendi!`);

      // Reset file input
      if (type === 'profile' && profileInputRef.current) profileInputRef.current.value = '';
      if (type === 'cover' && coverInputRef.current) coverInputRef.current.value = '';
      setProfileImageFile(null);
      setCoverImageFile(null);

    } catch (error) {
      console.error(`Error uploading ${type} image:`, error);
      toast.error(`${type === 'profile' ? 'Profil' : 'Kapak'} fotoğrafı yüklenirken bir hata oluştu.`);
    } finally {
      uploader(false);
    }
  };

  const fetchUsers = async (type: 'followers' | 'following') => {
    if (!currentUser) return [];
    const path = type === 'followers' ? 'followers' : 'following';
    const colRef = collection(db, 'users', currentUser.uid, path);
    const snapshot = await getDocs(colRef);
    const userIds = snapshot.docs.map(doc => doc.id);

    const usersData: UserType[] = [];
    for (const userId of userIds) {
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        usersData.push({ id: userDocSnap.id, ...userDocSnap.data() } as UserType);
      }
    }
    return usersData;
  };

  const openFollowersModal = async () => {
    setLoading(true);
    const users = await fetchUsers('followers');
    setFollowers(users);
    setShowFollowersModal(true);
    setLoading(false);
  };

  const openFollowingModal = async () => {
    setLoading(true);
    const users = await fetchUsers('following');
    setFollowing(users);
    setShowFollowingModal(true);
    setLoading(false);
  };

  if (loading && !profileData) {
    return <DashboardLayout><div className="flex justify-center items-center h-screen">Yükleniyor...</div></DashboardLayout>;
  }

  if (!profileData) {
    return <DashboardLayout><div className="flex justify-center items-center h-screen">Profil bilgileri yüklenemedi.</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <Card className="overflow-hidden shadow-lg">
        {/* Cover Photo */}
        <div className="relative h-48 md:h-64 bg-gray-300">
          <img
            src={coverImageFile ? URL.createObjectURL(coverImageFile) : profileData.coverPhoto}
            alt="Kapak Fotoğrafı"
            className="w-full h-full object-cover"
          />
          <Button
            variant="outline"
            size="icon"
            className="absolute bottom-4 right-4 bg-white/80 hover:bg-white rounded-full"
            onClick={() => coverInputRef.current?.click()}
            disabled={uploadingCover}
            title="Kapak Fotoğrafını Değiştir"
          >
            <Camera className="h-5 w-5" />
          </Button>
          <input
            type="file"
            accept="image/*"
            ref={coverInputRef}
            onChange={(e) => handleFileChange(e, 'cover')}
            className="hidden"
          />
          {uploadingCover && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">Yükleniyor...</div>}
        </div>

        <CardContent className="relative p-6 pt-0">
          {/* Profile Avatar */}
          <div className="relative -mt-16 mb-4 inline-block">
            <Avatar className="w-32 h-32 border-4 border-background shadow-md">
              <AvatarImage src={profileImageFile ? URL.createObjectURL(profileImageFile) : profileData.avatar} alt={profileData.name} />
              <AvatarFallback>{profileData.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <Button
              variant="outline"
              size="icon"
              className="absolute bottom-1 right-1 bg-white/80 hover:bg-white rounded-full w-8 h-8"
              onClick={() => profileInputRef.current?.click()}
              disabled={uploadingProfile}
              title="Profil Fotoğrafını Değiştir"
            >
              <Camera className="h-4 w-4" />
            </Button>
            <input
              type="file"
              accept="image/*"
              ref={profileInputRef}
              onChange={(e) => handleFileChange(e, 'profile')}
              className="hidden"
            />
             {uploadingProfile && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white rounded-full text-xs">Yükleniyor...</div>}
          </div>

          {/* Edit Button */}
          <Button
            variant="outline"
            size="icon"
            className="absolute top-4 right-4"
            onClick={handleEditToggle}
          >
            <Edit2 className="h-5 w-5" />
          </Button>

          {/* Profile Info */}
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">İsim</Label>
                <Input id="name" name="name" value={editData.name} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="bio">Biyografi</Label>
                <Textarea id="bio" name="bio" value={editData.bio} onChange={handleInputChange} />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleProfileSave} disabled={loading}>Kaydet</Button>
                <Button variant="outline" onClick={handleEditToggle}>İptal</Button>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold">{profileData.name}</h1>
              <p className="text-sm text-muted-foreground">@{profileData.username}</p>
              <p className="mt-2 text-foreground/80">{profileData.bio || 'Henüz bir biyografi eklenmemiş.'}</p>
            </div>
          )}

          {/* Follower/Following Stats */}
          <div className="mt-6 flex space-x-6 border-t pt-4">
            <Dialog open={showFollowersModal} onOpenChange={setShowFollowersModal}>
              <DialogTrigger asChild>
                <button onClick={openFollowersModal} className="text-center hover:underline" disabled={loading}>
                  <span className="font-semibold block">{profileData.followersCount}</span>
                  <span className="text-sm text-muted-foreground">Takipçi</span>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Takipçiler</DialogTitle>
                </DialogHeader>
                {/* Adapt UserList or create a new component */} 
                {/* <UserList users={followers} onSelectUser={() => {}} selectedUser={null} /> */}
                <div className="max-h-96 overflow-y-auto">
                  {followers.length > 0 ? followers.map(user => (
                    <div key={user.id} className="flex items-center p-2 border-b last:border-b-0">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{user.name} (@{user.username})</span>
                    </div>
                  )) : <p>Henüz takipçi yok.</p>}
                </div>
                 <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Kapat</Button>
                    </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showFollowingModal} onOpenChange={setShowFollowingModal}>
              <DialogTrigger asChild>
                <button onClick={openFollowingModal} className="text-center hover:underline" disabled={loading}>
                  <span className="font-semibold block">{profileData.followingCount}</span>
                  <span className="text-sm text-muted-foreground">Takip Edilen</span>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Takip Edilenler</DialogTitle>
                </DialogHeader>
                 {/* <UserList users={following} onSelectUser={() => {}} selectedUser={null} /> */}
                 <div className="max-h-96 overflow-y-auto">
                  {following.length > 0 ? following.map(user => (
                    <div key={user.id} className="flex items-center p-2 border-b last:border-b-0">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{user.name} (@{user.username})</span>
                      {/* Optional: Add unfollow button here */}
                    </div>
                  )) : <p>Henüz kimse takip edilmiyor.</p>}
                </div>
                 <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Kapat</Button>
                    </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder for user's dreams/posts */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Rüyalarım</h2>
        {/* Add logic to fetch and display user's dreams here */}
        <p className="text-muted-foreground">Henüz paylaşılan rüya yok.</p>
      </div>
    </DashboardLayout>
  );
}
