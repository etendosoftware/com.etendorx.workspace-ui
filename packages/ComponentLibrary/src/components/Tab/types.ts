export interface TabContent {
  id: string;
  title: string;
  icon?: React.ReactNode;
  fill: string;
  hoverFill?: string;
  children: React.ReactNode;
}
export interface TabsMUIProps {
  tabArray: TabContent[];
  homeTooltip: string;
  homeIcon: React.ReactNode;
  moreIcon: React.ReactNode;
  closeIcon: React.ReactNode;
}
