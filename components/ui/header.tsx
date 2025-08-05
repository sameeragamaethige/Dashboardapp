'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, LogOut, ShieldAlert } from 'lucide-react';
import { settingsStorage } from '@/lib/local-storage';
import { LocalStorageService } from '@/lib/database-service';

interface HeaderProps {
    user?: any;
    navigateTo?: (page: string) => void;
    onLogout?: () => void;
    centerLogo?: boolean;
}

export function Header({ user, navigateTo, onLogout, centerLogo = false }: HeaderProps) {
    const [logo, setLogo] = useState<string | null>(null);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [navbarColor, setNavbarColor] = useState<string | null>(null);

    useEffect(() => {
        const updateHeaderSettings = async () => {
            try {
                // Use the enhanced settings storage with database fallback
                const settings = await settingsStorage.getSettingsWithFallback();

                setLogo(settings?.logo || null);
                if (settings?.changeNavbarColor && settings?.primaryColor) {
                    setNavbarColor(settings.primaryColor);
                } else {
                    setNavbarColor(null);
                }
            } catch (error) {
                console.error('Error loading header settings:', error);
                // Fallback to localStorage only
                const settings = settingsStorage.getSettings();
                setLogo(settings?.logo || null);
                if (settings?.changeNavbarColor && settings?.primaryColor) {
                    setNavbarColor(settings.primaryColor);
                } else {
                    setNavbarColor(null);
                }
            }
        };

        // Update on mount
        updateHeaderSettings();

        // Listen for storage changes from other tabs
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'appSettings') {
                updateHeaderSettings();
            }
        };

        // Listen for local storage updates from our app
        const handleLocalChange = () => {
            updateHeaderSettings();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('storage-updated', handleLocalChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('storage-updated', handleLocalChange);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.relative')) {
                setShowProfileMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Get role badge for header
    const getRoleBadge = () => {
        if (user?.role === "admin") {
            return (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3" /> Admin
                </Badge>
            );
        }
        return null;
    };

    // Only show header if logo exists or user is logged in
    if (!logo && !user) {
        return null;
    }

    return (
        <header
            className="border-b border-gray-200 px-4 py-3 min-h-[64px]"
            style={navbarColor ? { backgroundColor: navbarColor } : { backgroundColor: '#fff' }}
        >
            <div className="container mx-auto h-full">
                <div className={`flex items-center h-full ${centerLogo ? 'justify-center' : 'justify-between'}`}>
                    {/* Logo Section */}
                    <div className="flex items-center">
                        {logo && (
                            <img
                                src={logo}
                                alt="Application Logo"
                                className="h-8 w-auto max-w-[200px] object-contain cursor-pointer"
                                onClick={() => {
                                    if (navigateTo) {
                                        if (user?.role === "admin") {
                                            // Set the companies tab for admin dashboard
                                            if (typeof window !== 'undefined') {
                                                sessionStorage.setItem('adminDashboardTab', 'companies');
                                            }
                                            navigateTo('adminDashboard');
                                        } else {
                                            navigateTo('customerDashboard');
                                        }
                                    }
                                }}
                            />
                        )}
                    </div>

                    {/* User Navigation Section - Only show if not centering logo */}
                    {!centerLogo && user && (
                        <div className="relative flex gap-3 items-center">
                            {getRoleBadge()}
                            <button
                                className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 focus:outline-none"
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                            >
                                <User className="h-6 w-6 text-gray-600" />
                            </button>
                            {showProfileMenu && (
                                <div className="absolute left-1/2 transform -translate-x-1/2 top-full mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg">
                                    <button
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        onClick={() => {
                                            setShowProfileMenu(false);
                                            navigateTo && navigateTo('userSettings'); // Redirect to user settings for changing password or email
                                        }}
                                    >
                                        Account Settings
                                    </button>
                                    <button
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        onClick={onLogout}
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
