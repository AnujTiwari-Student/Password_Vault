export interface ItemTypeConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
  examples: string[];
}

export interface ItemCreationFormProps {
  vaultId?: string;
  vaultType?: 'personal' | 'org';
  orgId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}
