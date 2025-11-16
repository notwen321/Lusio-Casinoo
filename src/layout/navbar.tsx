'use client'
import React from "react";
import {
    Navbar,
    NavbarBrand,
    NavbarMenuToggle,
    NavbarMenuItem,
    NavbarMenu,
    NavbarContent,
    NavbarItem,
    Link,
} from "@heroui/react";
import { MenuList } from "@/components/Sidebar/menulist";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { useBalance } from "@/hooks/useBalance";
import { OctSvg } from "@/components/svgs";

export const AcmeLogo = () => {
    return (
        <svg fill="none" height="36" viewBox="0 0 32 32" width="36">
            <path
                clipRule="evenodd"
                d="M17.6482 10.1305L15.8785 7.02583L7.02979 22.5499H10.5278L17.6482 10.1305ZM19.8798 14.0457L18.11 17.1983L19.394 19.4511H16.8453L15.1056 22.5499H24.7272L19.8798 14.0457Z"
                fill="currentColor"
                fillRule="evenodd"
            />
        </svg>
    );
};

const CustomNavbar = () => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const currentAccount = useCurrentAccount();
    const { balance, loading } = useBalance();

    return (
        <Navbar 
            isBordered 
            isMenuOpen={isMenuOpen} 
            onMenuOpenChange={setIsMenuOpen} 
            maxWidth="full"
            classNames={{
                base: "bg-black/95 backdrop-blur-md border-b border-cyan-500/20 h-20",
                wrapper: "px-6 max-w-full",
            }}
        >
            {/* Mobile Menu Toggle */}
            <NavbarContent className="sm:hidden" justify="start">
                <NavbarMenuToggle aria-label={isMenuOpen ? "Close menu" : "Open menu"} className="text-white" />
            </NavbarContent>

            {/* Mobile Logo */}
            <NavbarContent className="sm:hidden pr-3" justify="center">
                <NavbarBrand>
                    <AcmeLogo />
                    <p className="font-bold text-white text-xl ml-2">LUSIO</p>
                </NavbarBrand>
            </NavbarContent>

            {/* Desktop Logo */}
            <NavbarContent className="hidden sm:flex gap-2" justify="start">
                <NavbarBrand className="flex items-center gap-3">
                    <AcmeLogo />
                    <div className="flex flex-col">
                        <p className="font-bold text-white text-2xl tracking-wider">LUSIO</p>
                        <p className="text-cyan-400 text-xs tracking-widest">CASINO</p>
                    </div>
                </NavbarBrand>
            </NavbarContent>

            {/* Right Side - Wallet Info */}
            <NavbarContent justify="end" className="gap-4">
                <NavbarItem>
                    {currentAccount ? (
                        <div className="flex items-center gap-3">
                            {/* Balance Display */}
                            <div className="hidden md:flex bg-gradient-to-r from-cyan-500/10 to-blue-500/10 backdrop-blur-sm px-5 py-2.5 rounded-xl border border-cyan-500/30 hover:border-cyan-500/50 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="bg-cyan-500/20 p-2 rounded-lg">
                                        <OctSvg className="w-5 h-5 text-cyan-400" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-400 uppercase tracking-wider font-medium">Balance</span>
                                        <span className="text-cyan-400 font-bold text-lg">
                                            {loading ? '...' : balance} OCT
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Wallet Address */}
                            <div className="hidden sm:flex bg-black/60 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-cyan-500/30 hover:border-cyan-500/50 transition-all">
                                <p className="text-cyan-400 text-sm font-mono font-medium">
                                    {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
                                </p>
                            </div>
                            
                            {/* Connect Button */}
                            <div className="scale-95 hover:scale-100 transition-transform">
                                <ConnectButton />
                            </div>
                        </div>
                    ) : (
                        <div className="scale-100 hover:scale-105 transition-transform">
                            <ConnectButton />
                        </div>
                    )}
                </NavbarItem>
            </NavbarContent>

            <NavbarMenu className="bg-dark-900/20 px-12 flex flex-col items-center justify-center gap-4">
                {MenuList.map((item, index) => (
                    <NavbarMenuItem key={`${item}-${index}`} className="w-1/2 bg-dark-500 py-2 px-4 rounded-lg">
                        <Link
                            className="text-white w-full hover:text-success-500"
                            color="foreground"
                            href={item.path}
                            size="lg"
                        >
                            {item.title}
                        </Link>
                    </NavbarMenuItem>
                ))}
            </NavbarMenu>
        </Navbar>
    );
}

export default CustomNavbar;
