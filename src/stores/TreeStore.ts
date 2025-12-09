export interface TreeNode {
  id: string | number;
  parent: string | number | null;
  [key: string]: any;
}

export class TreeStore<T extends TreeNode = TreeNode> {
  private items: T[];
  private itemsMap: Map<string, T>;
  private childrenMap: Map<string, T[]>;
  private parentMap: Map<string, string | null>;

  constructor(items: T[]) {
    this.items = [...items];
    this.itemsMap = new Map();
    this.childrenMap = new Map();
    this.parentMap = new Map();

    this.buildIndexes();
  }

  private toKey(id: string | number): string {
    return String(id);
  }

  private toParentKey(id: string | number | null): string {
    return id === null ? '__root__' : String(id);
  }

  private buildIndexes(): void {
    this.itemsMap.clear();
    this.childrenMap.clear();
    this.parentMap.clear();

    for (const item of this.items) {
      const key = this.toKey(item.id);
      this.itemsMap.set(key, item);
      this.parentMap.set(key, item.parent === null ? null : this.toKey(item.parent));
    }

    for (const item of this.items) {
      const parentKey = this.toParentKey(item.parent);
      if (!this.childrenMap.has(parentKey)) {
        this.childrenMap.set(parentKey, []);
      }
      this.childrenMap.get(parentKey)!.push(item);
    }
  }

  getAll(): T[] {
    return [...this.items];
  }

  getItem(id: string | number): T | undefined {
    return this.itemsMap.get(this.toKey(id));
  }

  getChildren(id: string | number): T[] {
    const children = this.childrenMap.get(this.toParentKey(id));
    return children ? [...children] : [];
  }

  getAllChildren(id: string | number): T[] {
    const result: T[] = [];
    const stack: (string | number)[] = [id];

    while (stack.length > 0) {
      const currentId = stack.pop()!;
      const children = this.childrenMap.get(this.toParentKey(currentId)) || [];

      for (const child of children) {
        result.push(child);
        stack.push(child.id);
      }
    }

    return result;
  }

  getAllParents(id: string | number): T[] {
    const result: T[] = [];
    let currentId: string | number | null = id;

    while (currentId !== null) {
      const item = this.itemsMap.get(this.toKey(currentId));
      if (!item) break;

      result.push(item);
      const parentKey = this.parentMap.get(this.toKey(currentId));
      currentId = parentKey === undefined ? null : parentKey;
    }

    return result;
  }

  addItem(item: T): void {
    if (this.itemsMap.has(this.toKey(item.id))) {
      throw new Error(`Item with id ${item.id} already exists`);
    }

    if (item.parent !== null && !this.itemsMap.has(this.toKey(item.parent))) {
      throw new Error(`Parent with id ${item.parent} does not exist`);
    }

    this.items.push(item);
    const key = this.toKey(item.id);
    this.itemsMap.set(key, item);
    this.parentMap.set(key, item.parent === null ? null : this.toKey(item.parent));

    const parentKey = this.toParentKey(item.parent);
    if (!this.childrenMap.has(parentKey)) {
      this.childrenMap.set(parentKey, []);
    }
    this.childrenMap.get(parentKey)!.push(item);
  }

  removeItem(id: string | number): boolean {
    const item = this.itemsMap.get(this.toKey(id));
    if (!item) {
      return false;
    }

    const allChildren = this.getAllChildren(id);
    const idsToRemove = new Set([id, ...allChildren.map(child => child.id)]);

    for (const itemToRemove of [item, ...allChildren]) {
      const key = this.toKey(itemToRemove.id);
      const parentKey = this.toParentKey(itemToRemove.parent);
      
      this.itemsMap.delete(key);
      this.parentMap.delete(key);
      
      const parentChildren = this.childrenMap.get(parentKey);
      if (parentChildren) {
        const index = parentChildren.findIndex(child => child.id === itemToRemove.id);
        if (index !== -1) {
          parentChildren.splice(index, 1);
        }
      }
    }

    this.items = this.items.filter(item => !idsToRemove.has(item.id));

    return true;
  }

  updateItem(updates: Partial<T> & { id: string | number }): boolean {
    const key = this.toKey(updates.id);
    const existingItem = this.itemsMap.get(key);
    if (!existingItem) {
      return false;
    }

    const oldParent = existingItem.parent;
    const newParent = updates.parent !== undefined ? updates.parent : oldParent;

    if (oldParent !== newParent) {
      if (newParent !== null && !this.itemsMap.has(this.toKey(newParent))) {
        throw new Error(`Parent with id ${newParent} does not exist`);
      }

      const oldChildren = this.childrenMap.get(this.toParentKey(oldParent)) || [];
      const oldChildrenIndex = oldChildren.findIndex(child => child.id === updates.id);
      if (oldChildrenIndex !== -1) {
        oldChildren.splice(oldChildrenIndex, 1);
      }

      const newParentKey = this.toParentKey(newParent);
      if (!this.childrenMap.has(newParentKey)) {
        this.childrenMap.set(newParentKey, []);
      }
      this.childrenMap.get(newParentKey)!.push(existingItem);
    }

    Object.assign(existingItem, updates);
    this.itemsMap.set(key, existingItem);
    this.parentMap.set(key, newParent === null ? null : this.toKey(newParent));

    return true;
  }
}

