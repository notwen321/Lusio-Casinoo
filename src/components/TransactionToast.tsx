"use client"

import React from 'react';
import toast from 'react-hot-toast';

export const showTransactionToast = (digest: string, message: string = 'Transaction successful!') => {
  const explorerUrl = `https://testnet.onechain.network/txblock/${digest}`;
  
  toast.custom((t) => (
    <div
      className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5">
            <span className="text-3xl">✅</span>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-bold text-white">
              {message}
            </p>
            <p className="mt-1 text-xs text-white/80 font-mono break-all">
              {digest.slice(0, 20)}...{digest.slice(-20)}
            </p>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs font-semibold text-white underline hover:text-yellow-200"
            >
              View on Explorer →
            </a>
          </div>
        </div>
      </div>
      <div className="flex border-l border-white/20">
        <button
          onClick={() => toast.dismiss(t.id)}
          className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-white hover:bg-white/10 focus:outline-none"
        >
          ✕
        </button>
      </div>
    </div>
  ), {
    duration: 8000,
    position: 'top-right',
  });
};
