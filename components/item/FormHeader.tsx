"use client";

import React from "react";

interface FormHeaderProps {
  effectiveVaultType: 'personal' | 'org';
}

export const FormHeader: React.FC<FormHeaderProps> = ({ effectiveVaultType }) => {
  return (
    <div className="shrink-0 pb-6 mb-6 border-b border-gray-100">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1.5 tracking-tight">
        Create Vault Item
      </h2>
      <p className="text-gray-500 text-sm leading-relaxed">
        Store your passwords, notes, and 2FA keys securely in your <span className="font-medium text-gray-900 capitalize">{effectiveVaultType === 'org' ? 'Organization' : 'Personal'}</span> vault.
      </p>
    </div>
  );
};