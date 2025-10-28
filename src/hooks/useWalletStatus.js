'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { usePushWalletContext, usePushChainClient, PushUI } from '@pushchain/ui-kit';

const WalletStatusContext = createContext(null);

export function WalletStatusProvider({ children }) {
  // Always use real wallet - no dev wallet
  const isDev = false;

  const { connectionStatus } = usePushWalletContext();
  const { pushChainClient } = usePushChainClient();

  const [devWallet, setDevWallet] = useState({
    isConnected: false,
    address: null,
    chain: null,
  });

  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isDev) return;

    const savedState = localStorage.getItem('dev-wallet-state');
    if (savedState === 'connected') {
      setDevWallet({
        isConnected: true,
        address: '0x1234...dev',
        chain: { id: 'arbitrum_testnet', name: 'Arbitrum Sepolia' },
      });
    }

    const handleToggle = () => {
      setDevWallet((prev) => {
        const newState = !prev.isConnected;
        localStorage.setItem(
          'dev-wallet-state',
          newState ? 'connected' : 'disconnected'
        );

        return newState
          ? {
            isConnected: true,
            address: '0x1234...dev',
            chain: { id: 'arbitrum_testnet', name: 'Arbitrum Sepolia' },
          }
          : {
            isConnected: false,
            address: null,
            chain: null,
          };
      });
    };

    window.addEventListener('dev-wallet-toggle', handleToggle);
    return () => {
      window.removeEventListener('dev-wallet-toggle', handleToggle);
    };
  }, [isDev]);

  const connectWallet = useCallback(async () => {
    if (isDev) {
      localStorage.setItem('dev-wallet-state', 'connected');
      setDevWallet({
        isConnected: true,
        address: '0x1234...dev',
        chain: { id: 'push_chain_testnet', name: 'Push Chain Testnet' },
      });
      return;
    }

    try {
      // Push Universal Wallet handles connection automatically
      console.log('🔗 Push Universal Wallet connection initiated');
    } catch (err) {
      setError('Failed to connect to Push Universal Wallet: ' + err.message);
    }
  }, [isDev]);

  const disconnectWallet = useCallback(async () => {
    if (isDev) {
      localStorage.setItem('dev-wallet-state', 'disconnected');
      setDevWallet({
        isConnected: false,
        address: null,
        chain: null,
      });
      return;
    }

    try {
      // Push Universal Wallet handles disconnection automatically
      console.log('🔌 Push Universal Wallet disconnection initiated');
    } catch (err) {
      setError('Failed to disconnect wallet: ' + err.message);
    }
  }, [isDev]);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const isConnected = connectionStatus === PushUI.CONSTANTS.CONNECTION.STATUS.CONNECTED;
  const address = pushChainClient?.universal?.account || null;
  const chain = isConnected ? { id: 'push_chain_testnet', name: 'Push Chain Testnet' } : null;

  const currentStatus = {
    isConnected,
    address,
    chain,
  };

  // Debug currentStatus calculation
  console.log('🔍 Push Universal Wallet status:', {
    connectionStatus,
    isConnected,
    address,
    chain,
    pushChainClient: !!pushChainClient
  });

  useEffect(() => {
    console.log('🔌 Push Universal Wallet connection changed:');
    console.log('=== CURRENT STATUS ===');
    console.log('Connected:', currentStatus.isConnected);
    console.log('Address:', currentStatus.address);
    console.log('Chain:', currentStatus.chain);
    console.log('=== PUSH CHAIN VALUES ===');
    console.log('Connection Status:', connectionStatus);
    console.log('Push Chain Client:', !!pushChainClient);
    console.log('Universal Account:', pushChainClient?.universal?.account);
    console.log('=== ENVIRONMENT ===');
    console.log('Is Dev:', isDev);
    console.log('Dev Wallet:', devWallet);
  }, [currentStatus, connectionStatus, pushChainClient, isDev, devWallet]);

  return (
    <WalletStatusContext.Provider
      value={{
        ...currentStatus,
        isDev,
        connectWallet,
        disconnectWallet,
        resetError,
        error,
      }}
    >
      {children}
    </WalletStatusContext.Provider>
  );
}

export default function useWalletStatus() {
  const context = useContext(WalletStatusContext);
  if (!context) {
    throw new Error('useWalletStatus must be used within a WalletStatusProvider');
  }
  return context;
}
