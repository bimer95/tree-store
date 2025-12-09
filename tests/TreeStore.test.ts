import { describe, it, expect, beforeEach } from 'vitest';
import { TreeStore, TreeNode } from '../src/stores/TreeStore';

describe('TreeStore', () => {
  const initialItems: TreeNode[] = [
    { id: 1, parent: null, label: 'Айтем 1' },
    { id: '91064cee', parent: 1, label: 'Айтем 2' },
    { id: 3, parent: 1, label: 'Айтем 3' },
    { id: 4, parent: '91064cee', label: 'Айтем 4' },
    { id: 5, parent: '91064cee', label: 'Айтем 5' },
    { id: 6, parent: '91064cee', label: 'Айтем 6' },
    { id: 7, parent: 4, label: 'Айтем 7' },
    { id: 8, parent: 4, label: 'Айтем 8' },
  ];

  let store: TreeStore;

  beforeEach(() => {
    store = new TreeStore([...initialItems]);
  });

  describe('getAll', () => {
    it('should return all elements', () => {
      const all = store.getAll();
      expect(all).toHaveLength(8);
      expect(all).toEqual(expect.arrayContaining(initialItems));
    });

    it('should return a copy of the array, not a reference', () => {
      const all1 = store.getAll();
      const all2 = store.getAll();
      expect(all1).not.toBe(all2);
      expect(all1).toEqual(all2);
    });
  });

  describe('getItem', () => {
    it('should return element by numeric id', () => {
      const item = store.getItem(1);
      expect(item).toBeDefined();
      expect(item?.id).toBe(1);
      expect(item?.label).toBe('Айтем 1');
    });

    it('should return element by string id', () => {
      const item = store.getItem('91064cee');
      expect(item).toBeDefined();
      expect(item?.id).toBe('91064cee');
      expect(item?.label).toBe('Айтем 2');
    });

    it('should return undefined for non-existent id', () => {
      const item = store.getItem(999);
      expect(item).toBeUndefined();
    });
  });

  describe('getChildren', () => {
    it('should return direct children for numeric id', () => {
      const children = store.getChildren(1);
      expect(children).toHaveLength(2);
      expect(children.map(c => c.id)).toEqual(expect.arrayContaining(['91064cee', 3]));
    });

    it('should return direct children for string id', () => {
      const children = store.getChildren('91064cee');
      expect(children).toHaveLength(3);
      expect(children.map(c => c.id)).toEqual(expect.arrayContaining([4, 5, 6]));
    });

    it('should return empty array for element without children', () => {
      const children = store.getChildren(7);
      expect(children).toHaveLength(0);
    });

    it('should return empty array for non-existent id', () => {
      const children = store.getChildren(999);
      expect(children).toHaveLength(0);
    });
  });

  describe('getAllChildren', () => {
    it('should return all descendants recursively', () => {
      const allChildren = store.getAllChildren(1);
      expect(allChildren).toHaveLength(7);
      expect(allChildren.map(c => c.id)).toEqual(
        expect.arrayContaining(['91064cee', 3, 4, 5, 6, 7, 8])
      );
    });

    it('should return all descendants for string id', () => {
      const allChildren = store.getAllChildren('91064cee');
      expect(allChildren).toHaveLength(5);
      expect(allChildren.map(c => c.id)).toEqual(
        expect.arrayContaining([4, 5, 6, 7, 8])
      );
    });

    it('should return empty array for element without descendants', () => {
      const allChildren = store.getAllChildren(7);
      expect(allChildren).toHaveLength(0);
    });
  });

  describe('getAllParents', () => {
    it('should return parent chain from element to root', () => {
      const parents = store.getAllParents(7);
      expect(parents).toHaveLength(4);
      expect(parents[0].id).toBe(7);
      expect(parents[1].id).toBe(4);
      expect(parents[2].id).toBe('91064cee');
      expect(parents[3].id).toBe(1);
    });

    it('should return parent chain including root element', () => {
      const parents = store.getAllParents(4);
      expect(parents).toHaveLength(3);
      expect(parents[0].id).toBe(4);
      expect(parents[1].id).toBe('91064cee');
      expect(parents[2].id).toBe(1);
    });

    it('should return only the element itself for root element', () => {
      const parents = store.getAllParents(1);
      expect(parents).toHaveLength(1);
      expect(parents[0].id).toBe(1);
    });

    it('should return empty array for non-existent id', () => {
      const parents = store.getAllParents(999);
      expect(parents).toHaveLength(0);
    });
  });

  describe('addItem', () => {
    it('should add new element to store', () => {
      const newItem: TreeNode = { id: 9, parent: 1, label: 'Айтем 9' };
      store.addItem(newItem);

      const item = store.getItem(9);
      expect(item).toBeDefined();
      expect(item?.label).toBe('Айтем 9');

      const children = store.getChildren(1);
      expect(children.map(c => c.id)).toContain(9);
    });

    it('should add element with null parent', () => {
      const newItem: TreeNode = { id: 10, parent: null, label: 'Корневой элемент' };
      store.addItem(newItem);

      const item = store.getItem(10);
      expect(item).toBeDefined();
      expect(item?.parent).toBeNull();
    });

    it('should throw error when adding element with existing id', () => {
      const newItem: TreeNode = { id: 1, parent: null, label: 'Дубликат' };
      expect(() => store.addItem(newItem)).toThrow('Item with id 1 already exists');
    });

    it('should throw error when adding element with non-existent parent', () => {
      const newItem: TreeNode = { id: 11, parent: 999, label: 'Элемент' };
      expect(() => store.addItem(newItem)).toThrow('Parent with id 999 does not exist');
    });
  });

  describe('removeItem', () => {
    it('should remove element and all its descendants', () => {
      const removed = store.removeItem(4);
      expect(removed).toBe(true);

      expect(store.getItem(4)).toBeUndefined();
      expect(store.getItem(7)).toBeUndefined();
      expect(store.getItem(8)).toBeUndefined();

      const all = store.getAll();
      expect(all).toHaveLength(5);
    });

    it('should remove element with string id and all its descendants', () => {
      const removed = store.removeItem('91064cee');
      expect(removed).toBe(true);

      expect(store.getItem('91064cee')).toBeUndefined();
      expect(store.getItem(4)).toBeUndefined();
      expect(store.getItem(5)).toBeUndefined();
      expect(store.getItem(6)).toBeUndefined();
      expect(store.getItem(7)).toBeUndefined();
      expect(store.getItem(8)).toBeUndefined();
    });

    it('should return false for non-existent element', () => {
      const removed = store.removeItem(999);
      expect(removed).toBe(false);
    });

    it('should correctly update indexes after removal', () => {
      store.removeItem(4);
      
      const children = store.getChildren('91064cee');
      expect(children.map(c => c.id)).not.toContain(4);
      expect(children.map(c => c.id)).toEqual(expect.arrayContaining([5, 6]));
    });
  });

  describe('updateItem', () => {
    it('should update element properties', () => {
      const updated = store.updateItem({ id: 1, label: 'Обновленный Айтем 1' });
      expect(updated).toBe(true);

      const item = store.getItem(1);
      expect(item?.label).toBe('Обновленный Айтем 1');
    });

    it('should update element with string id', () => {
      const updated = store.updateItem({ id: '91064cee', label: 'Обновленный Айтем 2' });
      expect(updated).toBe(true);

      const item = store.getItem('91064cee');
      expect(item?.label).toBe('Обновленный Айтем 2');
    });

    it('should update parent and move element', () => {
      const updated = store.updateItem({ id: 3, parent: '91064cee' });
      expect(updated).toBe(true);

      const item = store.getItem(3);
      expect(item?.parent).toBe('91064cee');

      const children = store.getChildren('91064cee');
      expect(children.map(c => c.id)).toContain(3);
    });

    it('should return false for non-existent element', () => {
      const updated = store.updateItem({ id: 999, label: 'Не существует' });
      expect(updated).toBe(false);
    });

    it('should throw error when updating parent to non-existent', () => {
      expect(() => {
        store.updateItem({ id: 1, parent: 999 });
      }).toThrow('Parent with id 999 does not exist');
    });

    it('should preserve existing properties on partial update', () => {
      const itemBefore = store.getItem(1);
      store.updateItem({ id: 1, label: 'Новое название' });
      
      const itemAfter = store.getItem(1);
      expect(itemAfter?.id).toBe(itemBefore?.id);
      expect(itemAfter?.parent).toBe(itemBefore?.parent);
      expect(itemAfter?.label).toBe('Новое название');
    });
  });

  describe('Performance and indexes', () => {
    it('should correctly work with mixed id types', () => {
      const mixedStore = new TreeStore([
        { id: 1, parent: null, label: 'Число' },
        { id: 'str', parent: 1, label: 'Строка' },
        { id: 2, parent: 'str', label: 'Число под строкой' },
      ]);

      expect(mixedStore.getItem(1)).toBeDefined();
      expect(mixedStore.getItem('str')).toBeDefined();
      expect(mixedStore.getChildren(1).map(c => c.id)).toContain('str');
      expect(mixedStore.getChildren('str').map(c => c.id)).toContain(2);
    });

    it('should correctly rebuild indexes after removal', () => {
      store.removeItem(4);
      
      expect(store.getChildren('91064cee').map(c => c.id)).not.toContain(4);
      expect(store.getChildren(4)).toHaveLength(0);
    });
  });
});

