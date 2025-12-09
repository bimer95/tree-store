import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TreeTable from '../src/components/TreeTable.vue';

describe('TreeTable.vue', () => {
  const factory = () =>
    mount(TreeTable, {
      global: {
        stubs: {
          'ag-grid-vue': { template: '<div class="ag-grid-stub"></div>' },
        },
      },
    });

  it('renders CRUD controls', () => {
    const wrapper = factory();
    expect(wrapper.text()).toContain('Добавить элемент');
    expect(wrapper.text()).toContain('Обновить элемент');
    expect(wrapper.text()).toContain('Удалить элемент');
  });

  it('renders grid stub', () => {
    const wrapper = factory();
    const gridContainer = wrapper.find('.ag-theme-alpine');
    expect(gridContainer.exists()).toBe(true);
    expect(gridContainer.find('.ag-root-wrapper').exists()).toBe(true);
  });
});

