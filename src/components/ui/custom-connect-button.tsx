"use client";

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from '@/components/ui/button';
import { Wallet, Zap, User, LogOut, Copy, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function CustomConnectButton() {
  const [copied, setCopied] = useState(false);

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success("Address copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === 'authenticated');

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              'style': {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button
                    onClick={openConnectModal}
                    className="hud-panel border-neon-green text-neon-green hover:bg-neon-green/10 command-text relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neon-green/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <Wallet className="w-4 h-4 mr-2" />
                    CONNECT.NEURAL.LINK
                  </Button>
                );
              }

              if (chain.unsupported) {
                return (
                  <Button
                    onClick={openChainModal}
                    className="hud-panel border-red-500 text-red-500 hover:bg-red-500/10 command-text"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    NETWORK.ERROR
                  </Button>
                );
              }

              return (
                <div className="flex items-center gap-2">
                  {/* Chain Selector */}
                  <Button
                    onClick={openChainModal}
                    variant="outline"
                    size="sm"
                    className="hud-panel border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 command-text"
                  >
                    {chain.hasIcon && (
                      <div
                        style={{
                          background: chain.iconBackground,
                          width: 16,
                          height: 16,
                          borderRadius: 999,
                          overflow: 'hidden',
                          marginRight: 8,
                        }}
                      >
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            style={{ width: 16, height: 16 }}
                          />
                        )}
                      </div>
                    )}
                    {chain.name}
                  </Button>

                  {/* Account Button */}
                  <div className="relative group">
                    <Button
                      onClick={openAccountModal}
                      className="hud-panel border-neon-green text-neon-green hover:bg-neon-green/10 command-text relative overflow-hidden"
                    >
                      <div className="absolute inset-0 scan-lines opacity-30"></div>
                      <User className="w-4 h-4 mr-2" />
                      <div className="flex flex-col items-start">
                        <span className="text-xs opacity-70">OPERATOR</span>
                        <span className="font-mono text-sm">
                          {account.displayName}
                        </span>
                      </div>
                      {account.displayBalance && (
                        <div className="ml-3 text-neon-cyan text-xs">
                          {account.displayBalance}
                        </div>
                      )}
                    </Button>

                    {/* Hover Panel */}
                    <div className="absolute top-full right-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto z-50">
                      <div className="hud-panel p-4 min-w-[280px] border-neon-green">
                        <div className="space-y-3">
                          {/* Address */}
                          <div>
                            <div className="command-text text-xs text-neon-cyan mb-1">
                              NEURAL.ADDRESS
                            </div>
                            <div className="flex items-center gap-2">
                              <code className="text-neon-green font-mono text-sm bg-black/30 px-2 py-1 rounded border border-neon-green/30">
                                {account.address}
                              </code>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyAddress(account.address)}
                                className="text-neon-cyan hover:text-neon-green"
                              >
                                {copied ? (
                                  <span className="text-xs">COPIED</span>
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* Balance */}
                          {account.displayBalance && (
                            <div>
                              <div className="command-text text-xs text-neon-cyan mb-1">
                                BALANCE
                              </div>
                              <div className="text-neon-green font-mono">
                                {account.displayBalance}
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2 pt-2 border-t border-neon-green/20">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 command-text text-xs"
                              onClick={() => {
                                window.open(`https://calibration.filscan.io/address/${account.address}`, '_blank');
                              }}
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              EXPLORER
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}