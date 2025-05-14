import { EntityData, Tab } from '@workspaceui/etendohookbinder/src/api/types';
import EventEmitter from 'events';

type GraphNode<T> = {
  value: T;
  neighbors: Set<GraphNode<T>>;
  selected?: EntityData;
  selectedMultiple: EntityData[];
};

class Graph<T extends Tab> extends EventEmitter {
  private nodes: Map<string, GraphNode<T>>;
  private level: number;

  public constructor() {
    super();
    this.nodes = new Map();
    this.level = 0;
  }

  public buildTreeFromTabs = (tabs: T[]) => {
    tabs.forEach(tab => this.addNode(tab));
    tabs.forEach(tab => {
      if (tab.parentTabId) {
        this.addEdge(tab.parentTabId, tab.id);
      }
    });

    return this;
  };

  private addNode = (value: T) => {
    if (!this.nodes.has(value.id)) {
      this.nodes.set(value.id, { value, neighbors: new Set(), selectedMultiple: [] });
    }

    return this;
  };

  private addEdge = (sourceId: string, destinationId: string) => {
    const sourceNode = this.nodes.get(sourceId);
    const destNode = this.nodes.get(destinationId);

    if (!sourceNode || !destNode) {
      throw new Error('Both nodes must exist before adding an edge');
    }

    sourceNode.neighbors.add(destNode);

    return this;
  };

  public toJSON = (rootId: string) => {
    const rootNode = this.nodes.get(rootId);
    if (!rootNode) throw new Error('Root node not found');

    return this.buildJSON(rootNode);
  };

  private buildJSON = (node: GraphNode<T>): unknown => {
    return {
      id: node.value.id,
      name: node.value.name,
      children: Array.from(node.neighbors).map(this.buildJSON),
    };
  };

  public printTree = (rootId: string) => {
    const rootNode = this.nodes.get(rootId);
    if (!rootNode) throw new Error('Root node not found');

    const printNode = (node: GraphNode<T>, level: number) => {
      console.log(' '.repeat(level * 2) + node.value.name);
      node.neighbors.forEach(child => printNode(child, level + 1));
    };

    printNode(rootNode, 0);
  };

  public getLevel = () => {
    return this.level;
  };

  public getChildren = (tab: Tab) => {
    const node = this.nodes.get(tab.id);

    if (!node) throw new Error('Tab not found');

    return Array.from(node.neighbors).map(child => child.value);
  };

  public getParent = (tab: Tab) => {
    for (const node of this.nodes.values()) {
      for (const neighbor of node.neighbors) {
        if (neighbor.value.id === tab.id) return node.value;
      }
    }

    return undefined;
  };

  public setSelected = (tab: Tab, record: EntityData) => {
    const node = this.nodes.get(tab.id);

    if (!node) throw new Error('Tab not found');

    node.selected = record;
    node.neighbors.forEach(this.clearSelectedNode);

    this.level = tab.level;
    this.emit('update', tab.id);
  };

  public clearSelected = (tab: Tab) => {
    const node = this.nodes.get(tab.id);

    if (!node) throw new Error('Tab not found');

    this.clearSelectedNode(node);
    const parent = this.getParent(tab);
    this.level = parent ? parent.level : 0;
    this.emit('update', tab.id);
  };

  private clearSelectedNode = (node: GraphNode<T>) => {
    node.selected = undefined;
    node.neighbors.forEach(this.clearSelectedNode);
  };

  public setSelectedMultiple = (tab: Tab, records: EntityData[]) => {
    const node = this.nodes.get(tab.id);

    if (!node) throw new Error('Tab not found');

    node.selectedMultiple = records;
    node.neighbors.forEach(this.clearSelectedMultipleNode);
    this.emit('update', tab.id);
  };

  public clearSelectedMultiple = (tab: Tab) => {
    const node = this.nodes.get(tab.id);

    if (!node) throw new Error('Tab not found');

    this.clearSelectedMultipleNode(node);
    this.emit('update', tab.id);
  };

  private clearSelectedMultipleNode = (node: GraphNode<T>) => {
    node.selectedMultiple = [];
    node.neighbors.forEach(this.clearSelectedMultipleNode);
  };

  public getSelected = (tab: Tab) => {
    return this.nodes.get(tab.id)?.selected;
  };

  public getSelectedMultiple = (tab: Tab) => {
    return this.nodes.get(tab.id)?.selectedMultiple;
  };
}

export default Graph;
