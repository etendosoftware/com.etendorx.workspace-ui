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

  public constructor() {
    super();
    this.nodes = new Map();
  }

  public buildTreeFromTabs(tabs: T[]) {
    tabs.forEach(tab => this.addNode(tab));
    tabs.forEach(tab => {
      if (tab.parentTabId) {
        this.addEdge(tab.parentTabId, tab.id);
      }
    });

    return this;
  }

  private addNode(value: T) {
    if (!this.nodes.has(value.id)) {
      this.nodes.set(value.id, { value, neighbors: new Set(), selectedMultiple: [] });
    }

    return this;
  }

  private addEdge(sourceId: string, destinationId: string) {
    const sourceNode = this.nodes.get(sourceId);
    const destNode = this.nodes.get(destinationId);
    if (!sourceNode || !destNode) {
      throw new Error('Both nodes must exist before adding an edge');
    }
    sourceNode.neighbors.add(destNode);

    return this;
  }

  public toJSON(rootId: string) {
    const rootNode = this.nodes.get(rootId);
    if (!rootNode) throw new Error('Root node not found');

    return this.buildJSON(rootNode);
  }

  private buildJSON(node: GraphNode<T>): unknown {
    return {
      id: node.value.id,
      name: node.value.name,
      children: Array.from(node.neighbors).map(this.buildJSON),
    };
  }

  public printTree(rootId: string, indent = 0) {
    const rootNode = this.nodes.get(rootId);
    if (!rootNode) throw new Error('Root node not found');

    const printNode = (node: GraphNode<T>, level: number) => {
      console.log(' '.repeat(level * 2) + node.value.name);
      node.neighbors.forEach(child => printNode(child, level + 1));
    };

    printNode(rootNode, indent);
  }

  public getChildren(tabId: string) {
    const node = this.nodes.get(tabId);
    if (!node) throw new Error('Tab not found');
    return Array.from(node.neighbors).map(child => child.value);
  }

  public getParent(tabId: string) {
    for (const node of this.nodes.values()) {
      for (const neighbor of node.neighbors) {
        if (neighbor.value.id === tabId) return node.value;
      }
    }

    return undefined;
  }

  public setSelected(tabId: string, record: EntityData) {
    if (!record.id) throw new Error('Missing record id');
    const node = this.nodes.get(tabId);
    if (!node) throw new Error('Tab not found');
    node.selected = record;

    this.emit('update', tabId);
  }

  public clearSelected(tabId?: string | null) {
    if (tabId) {
      const node = this.nodes.get(tabId);
      if (!node) throw new Error('Tab not found');
      this.clearSelectedNode(node);
    }

    this.emit('update', tabId);
  }

  private clearSelectedNode(node: GraphNode<T>) {
    node.selected = undefined;
    node.neighbors.forEach(n => this.clearSelectedNode(n));
  }

  public setSelectedMultiple(tabId: string, records: EntityData[]) {
    const node = this.nodes.get(tabId);
    if (!node) throw new Error('Tab not found');
    node.selectedMultiple = records;

    this.emit('update', tabId);
  }

  public clearSelectedMultiple(tabId?: string | null) {
    if (tabId) {
      const node = this.nodes.get(tabId);
      if (!node) throw new Error('Tab not found');
      this.clearSelectedMultipleNode(node);
    }

    this.emit('update', tabId);
  }

  private clearSelectedMultipleNode(node: GraphNode<T>) {
    node.selectedMultiple = [];
    node.neighbors.forEach(n => this.clearSelectedMultipleNode(n));
  }

  public getSelected(tabId?: string | null) {
    if (!tabId) return;
    return this.nodes.get(tabId)?.selected;
  }

  public getSelectedMultiple(tabId?: string | null) {
    if (!tabId) return;
    return this.nodes.get(tabId)?.selectedMultiple;
  }
}

export default Graph;
