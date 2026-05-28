/**
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 * Mô tả: Unit test cho App component — kiểm tra app khởi tạo và render router-outlet.
 */
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

/**
 * Người tạo: DungBT
 * Ngày tạo: 28/05/2026
 * Test cases cho App component.
 */
describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Kiểm tra app được tạo thành công.
   */
  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  /**
   * Người tạo: DungBT
   * Ngày tạo: 28/05/2026
   * Kiểm tra app render router-outlet.
   */
  it('should render a router-outlet', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });
});
