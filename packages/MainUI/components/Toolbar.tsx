import { useToolbar } from '@workspaceui/etendohookbinder/src/hooks/useToolbar';

interface ToolbarProps {
  windowId: string;
  tabId?: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({ windowId, tabId }) => {
  const { toolbar, loading } = useToolbar(windowId, tabId);

  if (loading) return <div>Loading toolbar...</div>;

  return (
    <div className="toolbar">
      {toolbar?.buttons?.map(button => (
        <button key={button.id} disabled={!button.enabled}>
          {button.name}
        </button>
      )) || null}
    </div>
  );
};
