<template>
  <div class="tree-table-container">
    <div class="controls">
      <div class="control-group">
        <h3 @click="toggleSection('add')" class="control-header">
          <span class="arrow" :class="{ open: isOpen.add }">▶</span>
          Добавить элемент
        </h3>
        <div v-show="isOpen.add" class="form-row">
          <input
            v-model="newItem.id"
            type="text"
            placeholder="ID (строка или число)"
            class="input"
          />
          <input
            v-model="newItem.parent"
            type="text"
            placeholder="Parent ID (или null)"
            class="input"
          />
          <input
            v-model="newItem.label"
            type="text"
            placeholder="Наименование"
            class="input"
          />
          <button @click="handleAdd" class="btn btn-primary">Добавить</button>
        </div>
      </div>

      <div class="control-group">
        <h3 @click="toggleSection('update')" class="control-header">
          <span class="arrow" :class="{ open: isOpen.update }">▶</span>
          Обновить элемент
        </h3>
        <div v-show="isOpen.update" class="form-row">
          <input
            v-model="updateItem.id"
            type="text"
            placeholder="ID элемента"
            class="input"
          />
          <input
            v-model="updateItem.label"
            type="text"
            placeholder="Новое наименование"
            class="input"
          />
          <button @click="handleUpdate" class="btn btn-secondary">Обновить</button>
        </div>
      </div>

      <div class="control-group">
        <h3 @click="toggleSection('delete')" class="control-header">
          <span class="arrow" :class="{ open: isOpen.delete }">▶</span>
          Удалить элемент
        </h3>
        <div v-show="isOpen.delete" class="form-row">
          <input
            v-model="deleteId"
            type="text"
            placeholder="ID элемента"
            class="input"
          />
          <button @click="handleDelete" class="btn btn-danger">Удалить</button>
        </div>
      </div>
    </div>

    <div class="ag-theme-alpine" style="height: 600px; width: 100%; border: 1px solid #e0e0e0;">
      <ag-grid-vue
        :columnDefs="columnDefs"
        :rowData="rowData"
        :defaultColDef="defaultColDef"
        :treeData="true"
        :getDataPath="getDataPath"
        :groupDefaultExpanded="groupDefaultExpanded"
        :autoGroupColumnDef="autoGroupColumnDef"
        :animateRows="true"
        :rowSelection="'single'"
        @grid-ready="onGridReady"
        class="ag-theme-alpine"
        style="width: 100%; height: 100%;"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { AgGridVue } from '@ag-grid-community/vue3';
import { AllEnterpriseModules } from '@ag-grid-enterprise/all-modules';
import { AllCommunityModules } from '@ag-grid-community/all-modules';
import { ModuleRegistry } from '@ag-grid-community/core';
import { TreeStore } from '../stores/TreeStore';
import type { TreeNode } from '../stores/TreeStore';

ModuleRegistry.registerModules(AllCommunityModules as any);
ModuleRegistry.registerModules(AllEnterpriseModules as any);

interface TreeRowData extends TreeNode {
  children?: TreeRowData[];
  rowNumber?: number;
}

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

const treeStore = ref(new TreeStore(initialItems));
const rowData = ref<TreeRowData[]>([]);

const newItem = ref<Partial<TreeNode>>({
  id: '',
  parent: null,
  label: '',
});

const updateItem = ref<Partial<TreeNode>>({
  id: '',
  label: '',
});

const deleteId = ref<string | number>('');

const isOpen = ref({
  add: true,
  update: false,
  delete: false,
});

const toggleSection = (section: 'add' | 'update' | 'delete') => {
  isOpen.value[section] = !isOpen.value[section];
};

const columnDefs = computed(() => [
  {
    field: 'rowNumber',
    headerName: '№ п/п',
    width: 100,
    valueGetter: (params: any) => {
      if (params.node && params.node.displayIndex !== null && params.node.displayIndex !== undefined) {
        return params.node.displayIndex + 1;
      }
      return params.node && params.node.rowIndex !== undefined ? params.node.rowIndex + 1 : '';
    },
  },
  {
    field: 'label',
    headerName: 'Наименование',
    flex: 1,
  },
]);

const defaultColDef = {
  sortable: true,
  filter: true,
  resizable: true,
};

const autoGroupColumnDef = {
  headerName: 'Категория',
  minWidth: 200,
  cellRendererParams: {
    suppressCount: true,
    innerRenderer: (params: any) => {
      if (!params.data || !params.data.id) return '';
      const children = treeStore.value.getChildren(params.data.id);
      const isGroup = children.length > 0;
      const label = isGroup ? 'Группа' : 'Элемент';
      return `${isGroup ? '✓ ' : ''}${label}`;
    },
  },
};

const getDataPath = (data: TreeRowData): string[] => {
  if (!data || data.id === undefined || data.id === null) {
    return [];
  }
  const parents = treeStore.value.getAllParents(data.id);
  const path: string[] = [];
  for (let i = parents.length - 1; i >= 0; i--) {
    const parent = parents[i];
    if (parent && parent.id !== undefined && parent.id !== null) {
      path.push(String(parent.id));
    }
  }
  
  return path;
};

const groupDefaultExpanded = -1;

function buildTreeData(): TreeRowData[] {
  const items = treeStore.value.getAll() as TreeRowData[];
  const map = new Map<string | number, TreeRowData>();

  for (const item of items) {
    map.set(item.id, { ...item, children: [] });
  }

  for (const item of items) {
    const current = map.get(item.id)!;
    if (item.parent !== null) {
      const parent = map.get(item.parent);
      if (parent) {
        parent.children!.push(current);
      }
    }
  }

  return Array.from(map.values());
}

function refreshGrid(): void {
  rowData.value = buildTreeData();
}

function handleAdd(): void {
  try {
    if (!newItem.value.id || !newItem.value.label) {
      alert('Заполните ID и наименование');
      return;
    }

    const parentId = newItem.value.parent === '' || newItem.value.parent === 'null' 
      ? null 
      : (isNaN(Number(newItem.value.parent)) ? newItem.value.parent : Number(newItem.value.parent));

    const id = isNaN(Number(newItem.value.id)) 
      ? newItem.value.id 
      : Number(newItem.value.id);

    treeStore.value.addItem({
      id,
      parent: parentId,
      label: newItem.value.label,
    } as TreeNode);

    refreshGrid();

    newItem.value = { id: '', parent: null, label: '' };
  } catch (error: any) {
    alert(`Ошибка: ${error.message}`);
  }
}

function handleUpdate(): void {
  try {
    if (!updateItem.value.id || !updateItem.value.label) {
      alert('Заполните ID и новое наименование');
      return;
    }

    const id = isNaN(Number(updateItem.value.id)) 
      ? updateItem.value.id 
      : Number(updateItem.value.id);

    const success = treeStore.value.updateItem({
      id,
      label: updateItem.value.label,
    } as Partial<TreeNode> & { id: string | number });

    if (success) {
      refreshGrid();
      updateItem.value = { id: '', label: '' };
    } else {
      alert('Элемент с таким ID не найден');
    }
  } catch (error: any) {
    alert(`Ошибка: ${error.message}`);
  }
}

function handleDelete(): void {
  if (!deleteId.value) {
    alert('Введите ID элемента для удаления');
    return;
  }

  const id = isNaN(Number(deleteId.value)) 
    ? deleteId.value 
    : Number(deleteId.value);

  const success = treeStore.value.removeItem(id);

  if (success) {
    refreshGrid();
    deleteId.value = '';
  } else {
    alert('Элемент с таким ID не найден');
  }
}

const onGridReady = (params: any) => {
  params.api.expandAll();
  params.api.sizeColumnsToFit();
};

onMounted(() => {
  refreshGrid();
});
</script>

<style scoped>
.tree-table-container {
  padding: 20px;
  width: 100%;
}

.controls {
  margin-bottom: 20px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
}

.control-group {
  margin-bottom: 20px;
}

.control-group:last-child {
  margin-bottom: 0;
}

.control-header {
  margin: 0 0 10px 0;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.control-header:hover {
  background-color: #e9ecef;
}

.arrow {
  display: inline-block;
  transition: transform 0.2s;
  font-size: 12px;
  color: #666;
}

.arrow.open {
  transform: rotate(90deg);
}

.form-row {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  padding-left: 20px;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 200px;
  }
}

.form-row {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  min-width: 150px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #545b62;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover {
  background-color: #c82333;
}
</style>

