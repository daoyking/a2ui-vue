// @vitest-environment jsdom
import {describe, it, expect} from 'vitest';
import {defineComponent, h} from 'vue';
import {mount} from '@vue/test-utils';
import {useA2ui, A2uiSurface} from '../src';
import restaurantCard from '../demo/src/examples/restaurant-card.json';
import contactCard from '../demo/src/examples/contact-card.json';

/** Mounts the renderer, feeds it `messages`, and renders every surface. */
function render(messages: unknown) {
  const Harness = defineComponent({
    setup() {
      const {surfaces, processMessages} = useA2ui();
      processMessages(messages as Parameters<typeof processMessages>[0]);
      return () =>
        h(
          'div',
          surfaces.map((s) => h(A2uiSurface, {surface: s, key: s.id})),
        );
    },
  });
  return mount(Harness);
}

describe('@a2ui/vue renderer', () => {
  it('renders the official restaurant-card sample into real DOM', () => {
    const wrapper = render(restaurantCard);
    const html = wrapper.html();

    // Data-bound text from the data model must resolve through the binder.
    expect(html).toContain('The Italian Kitchen');
    expect(html).toContain('$$$');
    expect(html).toContain('Italian • Pasta • Wine Bar');
    expect(html).toContain('4.8');
    expect(html).toContain('(2,847 reviews)');
    expect(html).toContain('0.8 mi');

    // The structural component types must be present.
    expect(wrapper.find('.a2ui-card').exists()).toBe(true);
    expect(wrapper.find('.a2ui-column').exists()).toBe(true);
    expect(wrapper.find('.a2ui-row').exists()).toBe(true);
    expect(wrapper.find('.a2ui-text').exists()).toBe(true);
    expect(wrapper.find('.a2ui-image').exists()).toBe(true);
    expect(wrapper.find('.a2ui-icon').exists()).toBe(true);
  });

  it('renders the contact-card sample without throwing', () => {
    const wrapper = render(contactCard);
    // At minimum a surface + root card node should be produced.
    expect(wrapper.find('.a2ui-card').exists()).toBe(true);
  });

  it('renders exactly one root card per createSurface', () => {
    const wrapper = render(restaurantCard);
    // One surface → one root Card node in the rendered tree.
    expect(wrapper.findAll('.a2ui-card').length).toBe(1);
  });
});
