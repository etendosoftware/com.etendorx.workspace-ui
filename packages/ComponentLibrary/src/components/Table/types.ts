export interface Organization {
  identificator: string;
  name: string;
  description: string;
  active: boolean;
  groupLevel: boolean;
  socialName: string;
  organizationType: string;
  currency: string;
  allowPeriodControl: boolean;
  calendar: 'Spain' | 'USA' | 'LATAM';
  files: number;
  tags: string[];
  reactions: number;
  id: string;
  parentId: string | null;
}

export interface TableProps {
  data: Organization[];
  isTreeStructure?: boolean;
}
