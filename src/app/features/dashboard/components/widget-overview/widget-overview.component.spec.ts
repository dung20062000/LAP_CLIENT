/**
 * Người tạo: DungBT
 * Ngày tạo: 03/06/2026
 * Mô tả: Unit test cho WidgetOverviewComponent — kiểm tra khởi tạo, tính phần trăm và ngOnChanges.
 */
import { afterEach, describe, expect, it, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WidgetOverviewComponent } from './widget-overview.component';
import { DashboardStats } from '../../../../models/dashboard';

describe('WidgetOverviewComponent', () => {
  let fixture: ComponentFixture<WidgetOverviewComponent>;
  let component: WidgetOverviewComponent;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [WidgetOverviewComponent],
    });

    fixture = TestBed.createComponent(WidgetOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  // Khởi tạo

  describe('Khởi tạo', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have stats as null by default', () => {
      expect(component.stats).toBeNull();
    });

    it('should have loadedPercent as 0 by default', () => {
      expect(component.loadedPercent).toBe(0);
    });

    it('should have emptyPercent as 0 by default', () => {
      expect(component.emptyPercent).toBe(0);
    });
  });

  // ngOnChanges – tính phần trăm

  describe('ngOnChanges() – tính phần trăm', () => {
    it('should calculate loadedPercent correctly', () => {
      const stats: DashboardStats = {
        totalVehicles: 100,
        loadedVehicles: 55,
        emptyVehicles: 45,
        atBorder: 10,
        onRoad: 20,
        atPort: 30,
        atFactory: 40,
      };
      component.stats = stats;
      component.ngOnChanges();
      expect(component.loadedPercent).toBe(55);
    });

    it('should calculate emptyPercent correctly', () => {
      const stats: DashboardStats = {
        totalVehicles: 100,
        loadedVehicles: 55,
        emptyVehicles: 45,
        atBorder: 10,
        onRoad: 20,
        atPort: 30,
        atFactory: 40,
      };
      component.stats = stats;
      component.ngOnChanges();
      expect(component.emptyPercent).toBe(45);
    });

    it('should round loadedPercent using Math.round', () => {
      const stats: DashboardStats = {
        totalVehicles: 3,
        loadedVehicles: 1,
        emptyVehicles: 2,
        atBorder: 1,
        onRoad: 0,
        atPort: 1,
        atFactory: 1,
      };
      component.stats = stats;
      component.ngOnChanges();
      expect(component.loadedPercent).toBe(Math.round((1 / 3) * 100));
    });

    it('should not divide by zero when totalVehicles is 0', () => {
      const stats: DashboardStats = {
        totalVehicles: 0,
        loadedVehicles: 0,
        emptyVehicles: 0,
        atBorder: 0,
        onRoad: 0,
        atPort: 0,
        atFactory: 0,
      };
      component.stats = stats;
      component.ngOnChanges();
      expect(component.loadedPercent).toBe(0);
      expect(component.emptyPercent).toBe(0);
    });

    it('should set loadedPercent to 100 when all vehicles have load', () => {
      const stats: DashboardStats = {
        totalVehicles: 20,
        loadedVehicles: 20,
        emptyVehicles: 0,
        atBorder: 5,
        onRoad: 5,
        atPort: 5,
        atFactory: 5,
      };
      component.stats = stats;
      component.ngOnChanges();
      expect(component.loadedPercent).toBe(100);
      expect(component.emptyPercent).toBe(0);
    });

    it('should set emptyPercent to 100 when no vehicle has load', () => {
      const stats: DashboardStats = {
        totalVehicles: 20,
        loadedVehicles: 0,
        emptyVehicles: 20,
        atBorder: 5,
        onRoad: 5,
        atPort: 5,
        atFactory: 5,
      };
      component.stats = stats;
      component.ngOnChanges();
      expect(component.loadedPercent).toBe(0);
      expect(component.emptyPercent).toBe(100);
    });

    it('should not update percent when stats is null', () => {
      component.stats = null;
      component.loadedPercent = 50;
      component.emptyPercent = 50;
      component.ngOnChanges();
      expect(component.loadedPercent).toBe(50);
      expect(component.emptyPercent).toBe(50);
    });
  });
});
