import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { LogOut, Settings, FileText, Calendar } from 'lucide-react';

interface UserProfileMenuProps {
  onViewAnalyses?: () => void;
  onViewProfile?: () => void;
  onViewRoutine?: () => void;
}

export function UserProfileMenu({ onViewAnalyses, onViewProfile, onViewRoutine }: UserProfileMenuProps) {
  const { user, profile, logout } = useAuth();

  if (!user || !profile) return null;

  const initials = profile.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold shadow-md">
            {initials}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{profile.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onViewAnalyses} className="cursor-pointer">
          <FileText className="mr-2 h-4 w-4" />
          My Analyses
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onViewRoutine} className="cursor-pointer">
          <Calendar className="mr-2 h-4 w-4" />
          My Skincare Routine
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onViewProfile} className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          Profile Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
