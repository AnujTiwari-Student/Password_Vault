"use client";

interface FormHeaderProps {
  effectiveVaultType: 'personal' | 'org';
}

export const FormHeader: React.FC<FormHeaderProps> = ({ effectiveVaultType }) => {
  return (
    <div className="flex-shrink-0 px-1 pb-4">
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
        Create Vault Item
      </h2>
      <p className="text-gray-400 text-sm">
        Store your passwords, notes, and 2FA keys securely in your {effectiveVaultType} vault
      </p>
    </div>
  );
};
