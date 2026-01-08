import { SEVERITY_MAP, SEVERITY_COLORS } from './constants';

export const getSeverityLevel = (action: string): 'low' | 'medium' | 'high' | 'critical' => {
  return SEVERITY_MAP[action] || 'low';
};

export const getSeverityColor = (severity: string): string => {
  return SEVERITY_COLORS[severity] || 'bg-gray-900 text-gray-300';
};
