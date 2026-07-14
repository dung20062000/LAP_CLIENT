/**
 * Người tạo: DungBT
 * Ngày tạo: 10/06/2026
 * Mô tả: Unit test cho MediaService — kiểm tra gọi API lấy nhóm xe, xe theo nhóm và tìm kiếm ảnh.
 */
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MediaService } from './media.service';
import {
  VehicleGroupTreeNode,
  VehicleItem,
  MediaSearchParams,
  MediaSearchResult,
} from '../../models/media';
import { environment } from '../../../environments/environment';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';

describe('MediaService', () => {
  let service: MediaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MediaService],
    });

    service = TestBed.inject(MediaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getVehicleGroups()', () => {
    it('should fetch vehicle groups and return data', () => {
      const mockGroups: VehicleGroupTreeNode[] = [
        { key: 'g1', label: 'Group 1', data: 'data1', children: [] },
      ];

      service.getVehicleGroups().subscribe((groups) => {
        expect(groups).toEqual(mockGroups);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/Vehicles/groups`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockGroups });
    });

    it('should return empty array if data is null/undefined', () => {
      service.getVehicleGroups().subscribe((groups) => {
        expect(groups).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/Vehicles/groups`);
      req.flush({ success: true, data: null });
    });
  });

  describe('getVehiclesByGroups()', () => {
    it('should append valid numeric groupIds as HTTP params', () => {
      const mockVehicles: VehicleItem[] = [
        { id: 10, vehiclePlate: '29C-12345', privateCode: '10', XNCode: 1, displayName: '10 (29C-12345)' },
      ];

      service.getVehiclesByGroups(['12', 'abc', '34']).subscribe((vehicles) => {
        expect(vehicles).toEqual(mockVehicles);
      });

      const req = httpMock.expectOne((request) => {
        const groupIds = request.params.getAll('groupIds') || [];
        return (
          request.url === `${environment.apiUrl}/Vehicles` &&
          groupIds.includes('12') &&
          groupIds.includes('34') &&
          !groupIds.includes('NaN')
        );
      });
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockVehicles });
    });

    it('should return empty array if response data is missing', () => {
      service.getVehiclesByGroups(['12']).subscribe((vehicles) => {
        expect(vehicles).toEqual([]);
      });

      const req = httpMock.expectOne((request) => request.url === `${environment.apiUrl}/Vehicles`);
      req.flush({ success: true });
    });
  });

  describe('searchImages()', () => {
    it('should send POST request with correct payload', () => {
      const mockParams: MediaSearchParams = {
        vehiclePlate: '29C-12345',
        customerId: 1,
        channels: [1, 2],
        startTime: '2026-06-10T00:00:00',
        endTime: '2026-06-10T23:59:59',
        sortOrder: 'desc',
        pageNumber: 1,
        pageSize: 50,
      };

      const mockResult: MediaSearchResult = {
        totalCount: 1,
        items: [
          { channel: 1, imageTime: '2026-06-10T10:00:00', url: 'http://img.jpg', speed: 45 },
        ],
      };

      service.searchImages(mockParams).subscribe((result) => {
        expect(result).toEqual(mockResult);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/Vehicles/images/search`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockParams);
      req.flush({ success: true, data: mockResult });
    });

    it('should return default empty result if data is missing', () => {
      const mockParams: MediaSearchParams = {
        vehiclePlate: '29C-12345',
        customerId: 1,
        channels: [1],
        startTime: '2026-06-10T00:00:00',
        endTime: '2026-06-10T23:59:59',
        sortOrder: 'desc',
        pageNumber: 1,
        pageSize: 50,
      };

      service.searchImages(mockParams).subscribe((result) => {
        expect(result).toEqual({ totalCount: 0, items: [] });
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/Vehicles/images/search`);
      req.flush({ success: true, data: null });
    });
  });
});
