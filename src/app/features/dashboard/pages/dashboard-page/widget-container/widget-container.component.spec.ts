/**
 * Người tạo: DungBT
 * Ngày tạo: 03/06/2026
 * Mô tả: Unit test cho WidgetContainerComponent — kiểm tra inputs, outputs, toggle collapse, reload, options dropdown và resize positioning.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WidgetContainerComponent } from './widget-container.component';
import { WidgetSize } from '../../../../models/dashboard';
import { vi } from 'vitest';

describe('WidgetContainerComponent', () => {
  let fixture: ComponentFixture<WidgetContainerComponent>;
  let component: WidgetContainerComponent;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      declarations: [WidgetContainerComponent],
    });

    fixture = TestBed.createComponent(WidgetContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Khởi tạo

  describe('Khởi tạo', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have default title as empty string', () => {
      expect(component.title).toBe('');
    });

    it('should have default widgetId as empty string', () => {
      expect(component.widgetId).toBe('');
    });

    it('should have default size as auto', () => {
      expect(component.size).toBe(WidgetSize.Auto);
    });

    it('should have default collapsed as false', () => {
      expect(component.collapsed).toBe(false);
    });

    it('should have default loading as false', () => {
      expect(component.loading).toBe(false);
    });

    it('should have default layoutClass as empty string', () => {
      expect(component.layoutClass).toBe('');
    });

    it('should have showOptions as false initially', () => {
      expect(component.showOptions).toBe(false);
    });

    it('should have openLeft as false initially', () => {
      expect(component.openLeft).toBe(false);
    });

    it('should expose 4 size options', () => {
      expect(component.sizeOptions.length).toBe(4);
      expect(component.sizeOptions.map(o => o.value)).toEqual([WidgetSize.Auto, WidgetSize.Small, WidgetSize.Medium, WidgetSize.Large]);
    });
  });

  // isReloading getter

  describe('isReloading getter', () => {
    it('should return false when loading and _internalReloading are both false', () => {
      component.loading = false;
      (component as unknown as { _internalReloading: boolean })._internalReloading = false;
      expect(component.isReloading).toBe(false);
    });

    it('should return true when loading is true', () => {
      component.loading = true;
      (component as unknown as { _internalReloading: boolean })._internalReloading = false;
      expect(component.isReloading).toBe(true);
    });

    it('should return true when _internalReloading is true', () => {
      component.loading = false;
      (component as unknown as { _internalReloading: boolean })._internalReloading = true;
      expect(component.isReloading).toBe(true);
    });

    it('should return true when both loading and _internalReloading are true', () => {
      component.loading = true;
      (component as unknown as { _internalReloading: boolean })._internalReloading = true;
      expect(component.isReloading).toBe(true);
    });
  });

  // toggleCollapse

  describe('toggleCollapse()', () => {
    it('should toggle collapsed from false to true', () => {
      component.collapsed = false;
      let emitted: boolean | null = null;
      component.collapsedChange.subscribe(v => { emitted = v; });

      component.toggleCollapse();
      expect(component.collapsed).toBe(true);
      expect(emitted).toBe(true);
    });

    it('should toggle collapsed from true to false', () => {
      component.collapsed = true;
      let emitted: boolean | null = null;
      component.collapsedChange.subscribe(v => { emitted = v; });

      component.toggleCollapse();
      expect(component.collapsed).toBe(false);
      expect(emitted).toBe(false);
    });

    it('should emit collapsedChange with new collapsed state', () => {
      component.collapsed = false;
      const emitSpy = { called: false, value: false as boolean };
      component.collapsedChange.subscribe(v => {
        emitSpy.called = true;
        emitSpy.value = v;
      });

      component.toggleCollapse();
      expect(emitSpy.called).toBe(true);
      expect(emitSpy.value).toBe(true);
    });
  });

  // onReload

  describe('onReload()', () => {
    it('should emit reload event', () => {
      let emitted = false;
      component.reload.subscribe(() => { emitted = true; });

      component.onReload();
      expect(emitted).toBe(true);
    });

    it('should set _internalReloading to true immediately', () => {
      component.onReload();
      expect((component as unknown as { _internalReloading: boolean })._internalReloading).toBe(true);
    });
  });

  // onSelectSize

  describe('onSelectSize()', () => {
    it('should update size property', () => {
      component.onSelectSize(WidgetSize.Large);
      expect(component.size).toBe(WidgetSize.Large);
    });

    it('should emit sizeChange with the new size', () => {
      let emitted: WidgetSize | null = null;
      component.sizeChange.subscribe(v => { emitted = v; });

      component.onSelectSize(WidgetSize.Medium);
      expect(emitted).toBe(WidgetSize.Medium);
    });

    it('should close options dropdown after selecting size', () => {
      component.showOptions = true;
      component.onSelectSize(WidgetSize.Small);
      expect(component.showOptions).toBe(false);
    });

    it('should accept auto size', () => {
      let emitted: WidgetSize | null = null;
      component.sizeChange.subscribe(v => { emitted = v; });
      component.onSelectSize(WidgetSize.Auto);
      expect(emitted).toBe(WidgetSize.Auto);
    });
  });

  // toggleOptions

  describe('toggleOptions()', () => {
    it('should set showOptions to true when closed', () => {
      component.showOptions = false;
      component.toggleOptions(new MouseEvent('click'));
      expect(component.showOptions).toBe(true);
    });

    it('should set showOptions to false when open', () => {
      component.showOptions = true;
      component.toggleOptions(new MouseEvent('click'));
      expect(component.showOptions).toBe(false);
    });

    it('should reset openLeft to false when closing', () => {
      component.showOptions = true;
      component.openLeft = true;
      component.toggleOptions(new MouseEvent('click'));
      expect(component.openLeft).toBe(false);
    });
  });

  // onDocumentClick

  describe('onDocumentClick()', () => {
    it('should close options when clicking outside widget', () => {
      component.showOptions = true;
      const outsideEvent = new Event('click');
      const containsMock = vi.fn().mockReturnValue(false);
      Object.defineProperty(component['el'].nativeElement, 'contains', {
        get: () => containsMock,
        configurable: true,
      });

      component.onDocumentClick(outsideEvent);
      expect(containsMock).toHaveBeenCalled();
      expect(component.showOptions).toBe(false);
    });

    it('should NOT close options when clicking inside widget', () => {
      component.showOptions = true;
      const insideEvent = new Event('click');
      const containsMock = vi.fn().mockReturnValue(true);
      Object.defineProperty(component['el'].nativeElement, 'contains', {
        get: () => containsMock,
        configurable: true,
      });

      component.onDocumentClick(insideEvent);
      expect(component.showOptions).toBe(true);
    });
  });

  // onWidgetOptionsOpen

  describe('onWidgetOptionsOpen()', () => {
    it('should close options when another widget opens its dropdown', () => {
      component.widgetId = 'widget-A';
      component.showOptions = true;
      const event = new CustomEvent('widget-options-open', { detail: 'widget-B' });

      component.onWidgetOptionsOpen(event);
      expect(component.showOptions).toBe(false);
    });

    it('should NOT close options when same widget opens dropdown', () => {
      component.widgetId = 'widget-A';
      component.showOptions = true;
      const event = new CustomEvent('widget-options-open', { detail: 'widget-A' });

      component.onWidgetOptionsOpen(event);
      expect(component.showOptions).toBe(true);
    });
  });

  // onResize

  describe('onResize()', () => {
    it('should not crash when called with showOptions=false', () => {
      component.showOptions = false;
      expect(() => component.onResize()).not.toThrow();
    });

    it('should call updateSubmenuPosition when showOptions is true', () => {
      component.showOptions = true;
      const spy = vi.spyOn(component, 'updateSubmenuPosition');

      component.onResize();
      expect(spy).toHaveBeenCalled();
    });
  });

  // updateSubmenuPosition

  describe('updateSubmenuPosition()', () => {
    it('should not crash when menu element does not exist', () => {
      const origQuerySelector = component['el'].nativeElement.querySelector.bind(
        component['el'].nativeElement,
      );
      component['el'].nativeElement.querySelector = vi.fn().mockReturnValue(null) as any;

      expect(() => component.updateSubmenuPosition()).not.toThrow();

      component['el'].nativeElement.querySelector = origQuerySelector as any;
    });

    it('should not crash when called outside browser', () => {
      const origInnerWidth = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', {
        get: () => 1920,
        configurable: true,
      });

      expect(() => component.updateSubmenuPosition()).not.toThrow();

      Object.defineProperty(window, 'innerWidth', {
        get: () => origInnerWidth,
        configurable: true,
      });
    });
  });

  // Inputs binding

  describe('Inputs', () => {
    it('should bind title from parent', () => {
      component.title = 'Phương tiện tại Cửa khẩu';
      fixture.detectChanges();
      const titleEl = fixture.nativeElement.querySelector('.widget-title-text');
      expect(titleEl.textContent.trim()).toContain('Phương tiện tại Cửa khẩu');
    });

    it('should hide widget body when collapsed is true', () => {
      component.collapsed = true;
      fixture.detectChanges();
      const bodyEl = fixture.nativeElement.querySelector('.widget-body');
      expect(bodyEl).toBeNull();
    });

    it('should show widget body when collapsed is false', () => {
      component.collapsed = false;
      fixture.detectChanges();
      const bodyEl = fixture.nativeElement.querySelector('.widget-body');
      expect(bodyEl).toBeTruthy();
    });

    it('should apply layoutClass to widget wrapper via ngClass', () => {
      component.layoutClass = 'col-12 col-md-6';
      fixture.detectChanges();
      const wrapper = fixture.nativeElement.querySelector('.widget-wrapper');
      expect(wrapper.classList).toContain('col-12');
    });

    it('should apply options-open class when showOptions is true', () => {
      component.showOptions = true;
      fixture.detectChanges();
      const wrapper = fixture.nativeElement.querySelector('.widget-wrapper');
      expect(wrapper.classList).toContain('options-open');
    });

    it('should apply widget-collapsed class when collapsed is true', () => {
      component.collapsed = true;
      fixture.detectChanges();
      const card = fixture.nativeElement.querySelector('.widget-card');
      expect(card.classList).toContain('widget-collapsed');
    });
  });
});
