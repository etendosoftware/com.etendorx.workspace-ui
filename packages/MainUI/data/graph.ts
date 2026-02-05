/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

// biome-ignore lint/style/useNodejsImportProtocol: <explanation>
import EventEmitter from "events";
import { logger } from "@/utils/logger";
import type { EntityData, Tab } from "@workspaceui/api-client/src/api/types";

type GraphNode<T> = {
  value: T;
  neighbors: Set<GraphNode<T>>;
  selected?: EntityData;
  selectedMultiple: EntityData[];
  records?: EntityData[];
};

export type GraphEvents = {
  selected: [tab: Tab, record: EntityData];
  unselected: [tab: Tab];
  selectedMultiple: [tab: Tab, records: EntityData[]];
  unselectedMultiple: [tab: Tab];
};

export type GraphEventListener<K extends keyof GraphEvents> = (...args: GraphEvents[K]) => void;

export type GraphEventNames = keyof GraphEvents;

export class Graph<T extends Tab> extends EventEmitter<GraphEvents> {
  public nodes: Map<string, GraphNode<T>>;
  private activeLevels: number[];

  public constructor(tabs: T[]) {
    super();
    this.setMaxListeners(50);
    this.nodes = new Map();
    this.activeLevels = [];

    tabs.forEach(this.addNode);
    for (const tab of tabs) {
      if (tab.parentTabId) {
        this.addEdge(tab.parentTabId, tab.id);
      }
    }
  }

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
      logger.warn("Both nodes must exist before adding an edge", { sourceNode, destNode });

      return this;
    }

    sourceNode.neighbors.add(destNode);

    return this;
  };

  public toJSON = (rootId: string) => {
    const rootNode = this.nodes.get(rootId);
    if (!rootNode) throw new Error("Root node not found");

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
    if (!rootNode) throw new Error("Root node not found");

    const printNode = (node: GraphNode<T>, level: number) => {
      for (const child of node.neighbors) {
        printNode(child, level + 1);
      }
    };

    printNode(rootNode, 0);
  };

  public setActiveLevels = (level: number) => {
    const trimmed = this.activeLevels.filter((lvl) => lvl < level);

    if (trimmed[trimmed.length - 1] !== level) {
      this.activeLevels = [...trimmed, level].slice(-2);
    } else {
      this.activeLevels = trimmed;
    }
  };

  public getChildren = (tab?: Tab) => {
    if (tab) {
      const node = this.nodes.get(tab.id);

      if (node) {
        return Array.from(node.neighbors).map((child) => child.value);
      }
    }
  };

  public getParent = (tab?: Tab) => {
    if (tab) {
      for (const node of this.nodes.values()) {
        for (const neighbor of node.neighbors) {
          if (neighbor.value.id === tab.id) {
            return node.value;
          }
        }
      }
    }
  };

  public setSelected = (tab?: Tab, record: EntityData = {}) => {
    if (tab) {
      const node = this.nodes.get(tab.id);

      if (node) {
        node.selected = record;
        node.neighbors.forEach(this.clearSelectedNode);

        this.emit("selected", tab, record);
      }
    }
  };

  public clearSelected = (tab?: Tab) => {
    if (tab) {
      const node = this.nodes.get(tab.id);

      if (node) {
        this.clearSelectedNode(node);

        this.emit("unselected", tab);
      }
    }
  };

  public clear = (tab?: Tab) => {
    this.clearSelected(tab);
    this.clearSelectedMultiple(tab);
  };

  private clearSelectedNode = (node: GraphNode<T>) => {
    node.selected = undefined;
    node.neighbors.forEach(this.clearSelectedNode);
  };

  public setSelectedMultiple = (tab?: Tab, records: EntityData[] = []) => {
    if (tab) {
      const node = this.nodes.get(tab.id);

      if (node) {
        node.selectedMultiple = records;
        node.neighbors.forEach(this.clearSelectedMultipleNode);

        this.emit("selectedMultiple", tab, records);
      }
    }
  };

  public clearSelectedMultiple = (tab?: Tab) => {
    if (tab) {
      const node = this.nodes.get(tab.id);

      if (node) {
        this.clearSelectedMultipleNode(node);

        this.emit("unselectedMultiple", tab);
      }
    }
  };

  private clearSelectedMultipleNode = (node: GraphNode<T>) => {
    node.selectedMultiple = [];
    node.neighbors.forEach(this.clearSelectedMultipleNode);
  };

  public getSelected = (tab?: Tab) => {
    return tab ? this.nodes.get(tab.id)?.selected : undefined;
  };

  public getSelectedMultiple = (tab?: Tab) => {
    return tab ? this.nodes.get(tab.id)?.selectedMultiple : undefined;
  };

  public setRecords = (tab?: Tab, records: EntityData[] = []) => {
    if (tab) {
      const node = this.nodes.get(tab.id);

      if (node) {
        node.records = records;
      }
    }
  };

  public getRecord = (tab: Tab, recordId: string) => {
    const node = this.nodes.get(tab.id);
    return node?.records?.find((r) => String(r.id) === recordId);
  };
}

export default Graph;
