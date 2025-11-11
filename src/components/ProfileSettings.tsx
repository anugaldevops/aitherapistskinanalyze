import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert } from './ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Loader2, Check, ArrowLeft, AlertTriangle } from 'lucide-react';

interface ProfileSettingsProps {
  onBack: () => void;
}

export function ProfileSettings({ onBack }: ProfileSettingsProps) {
  const { profile, updateProfile, updatePassword, refreshProfile, deleteAccount } = useAuth();

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [skinType, setSkinType] = useState('');
  const [savingBasic, setSavingBasic] = useState(false);
  const [basicSuccess, setBasicSuccess] = useState(false);
  const [basicError, setBasicError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [notifyAnalysis, setNotifyAnalysis] = useState(false);
  const [notifyRoutine, setNotifyRoutine] = useState(false);
  const [notifyProgress, setNotifyProgress] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [notificationsSuccess, setNotificationsSuccess] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setAge(profile.age?.toString() || '');
      setSkinType(profile.skin_type || '');
      setNotifyAnalysis(profile.notify_analysis_reminders || false);
      setNotifyRoutine(profile.notify_routine_reminders || false);
      setNotifyProgress(profile.notify_progress_updates || false);
    }
  }, [profile]);

  const handleSaveBasicInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setBasicError(null);
    setBasicSuccess(false);
    setSavingBasic(true);

    try {
      await updateProfile({
        name,
        age: age ? parseInt(age) : null,
        skin_type: skinType || null,
      });

      await refreshProfile();
      setBasicSuccess(true);
      setTimeout(() => setBasicSuccess(false), 3000);
    } catch (error: any) {
      setBasicError(error.message || 'Failed to save changes');
    } finally {
      setSavingBasic(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setSavingPassword(true);

    try {
      const { error } = await updatePassword(currentPassword, newPassword);

      if (error) {
        setPasswordError(error.message);
      } else {
        setPasswordSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(false), 3000);
      }
    } catch (error: any) {
      setPasswordError(error.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotificationsError(null);
    setNotificationsSuccess(false);
    setSavingNotifications(true);

    try {
      await updateProfile({
        notify_analysis_reminders: notifyAnalysis,
        notify_routine_reminders: notifyRoutine,
        notify_progress_updates: notifyProgress,
      });

      await refreshProfile();
      setNotificationsSuccess(true);
      setTimeout(() => setNotificationsSuccess(false), 3000);
    } catch (error: any) {
      setNotificationsError(error.message || 'Failed to save preferences');
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError(null);
    setIsDeleting(true);

    try {
      const { error } = await deleteAccount();

      if (error) {
        setDeleteError(error.message);
        setIsDeleting(false);
      }
    } catch (error: any) {
      setDeleteError(error.message || 'Failed to delete account');
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-[#0EA5E9] hover:underline bg-transparent border-0 cursor-pointer"
            style={{ background: 'none', padding: 0 }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Analysis
          </button>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile Settings</h1>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Update your personal details and skin information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveBasicInfo} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    disabled={savingBasic}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Enter your age"
                    min="1"
                    max="120"
                    disabled={savingBasic}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skinType">Skin Type</Label>
                  <select
                    id="skinType"
                    value={skinType}
                    onChange={(e) => setSkinType(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={savingBasic}
                  >
                    <option value="">Select skin type</option>
                    <option value="Normal">Normal</option>
                    <option value="Oily">Oily</option>
                    <option value="Dry">Dry</option>
                    <option value="Combination">Combination</option>
                    <option value="Sensitive">Sensitive</option>
                  </select>
                </div>

                {basicError && (
                  <Alert variant="destructive">
                    {basicError}
                  </Alert>
                )}

                {basicSuccess && (
                  <Alert className="bg-green-50 text-green-800 border-green-200">
                    <Check className="h-4 w-4" />
                    <span className="ml-2">Saved successfully!</span>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={savingBasic}>
                  {savingBasic ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your account password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                    disabled={savingPassword}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    minLength={6}
                    disabled={savingPassword}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                    disabled={savingPassword}
                  />
                </div>

                {passwordError && (
                  <Alert variant="destructive">
                    {passwordError}
                  </Alert>
                )}

                {passwordSuccess && (
                  <Alert className="bg-green-50 text-green-800 border-green-200">
                    <Check className="h-4 w-4" />
                    <span className="ml-2">Password updated successfully!</span>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={savingPassword}>
                  {savingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Manage your email notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveNotifications} className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="notifyAnalysis"
                      checked={notifyAnalysis}
                      onChange={(e) => setNotifyAnalysis(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={savingNotifications}
                    />
                    <Label htmlFor="notifyAnalysis" className="cursor-pointer font-normal">
                      Email me analysis reminders
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="notifyRoutine"
                      checked={notifyRoutine}
                      onChange={(e) => setNotifyRoutine(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={savingNotifications}
                    />
                    <Label htmlFor="notifyRoutine" className="cursor-pointer font-normal">
                      Email me routine reminders
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="notifyProgress"
                      checked={notifyProgress}
                      onChange={(e) => setNotifyProgress(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={savingNotifications}
                    />
                    <Label htmlFor="notifyProgress" className="cursor-pointer font-normal">
                      Email me progress updates
                    </Label>
                  </div>
                </div>

                {notificationsError && (
                  <Alert variant="destructive">
                    {notificationsError}
                  </Alert>
                )}

                {notificationsSuccess && (
                  <Alert className="bg-green-50 text-green-800 border-green-200">
                    <Check className="h-4 w-4" />
                    <span className="ml-2">Preferences saved successfully!</span>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={savingNotifications}>
                  {savingNotifications ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Preferences'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50/50">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>
                Permanent account deletion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Delete Account</h3>
                <p className="text-sm text-red-600 mb-4">
                  Permanently delete your account and all data
                </p>
              </div>

              <Button
                onClick={() => setShowDeleteModal(true)}
                variant="destructive"
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Delete My Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <DialogTitle className="text-xl">Are You Sure?</DialogTitle>
            </div>
            <DialogDescription className="text-base pt-4">
              <p className="font-semibold text-gray-900 mb-3">
                This will permanently delete:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>All your skin analyses</li>
                <li>Your routines and reminders</li>
                <li>All progress history</li>
              </ul>
              <p className="font-semibold text-red-600">
                This cannot be undone.
              </p>
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <Alert variant="destructive">
              {deleteError}
            </Alert>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting account...
                </>
              ) : (
                'Yes, Delete Everything'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
