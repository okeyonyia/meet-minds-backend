import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { RestaurantController } from './restaurant.controller';
import { RestaurantService } from './restaurant.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { AdminGuard } from '../auth/admin.guard';

describe('RestaurantController', () => {
  let controller: RestaurantController;

  const mockRestaurant = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Test Restaurant',
    description: 'A great test restaurant',
    location: {
      latitude: 6.5244,
      longitude: 3.3792,
      address: '123 Test Street, Lagos',
    },
    cuisine_types: ['Italian', 'Mediterranean'],
    price_range: 3,
    phone_number: '+2348012345678',
    average_rating: 4.5,
    total_reviews: 10,
    is_active: true,
    accepts_reservations: true,
  };

  const mockCreateRestaurantDto: CreateRestaurantDto = {
    name: 'New Restaurant',
    description: 'A new restaurant',
    location: {
      latitude: 6.5244,
      longitude: 3.3792,
      address: '456 New Street, Lagos',
    },
    cuisine_types: ['Chinese', 'Asian'],
    price_range: 2,
    phone_number: '+2348087654321',
    opening_hours: {
      monday: { open: '10:00', close: '21:00' },
      tuesday: { open: '10:00', close: '21:00' },
      wednesday: { open: '10:00', close: '21:00' },
      thursday: { open: '10:00', close: '21:00' },
      friday: { open: '10:00', close: '21:00' },
      saturday: { open: '10:00', close: '21:00' },
      sunday: { open: '10:00', close: '21:00' },
    },
  };

  const mockRestaurantService = {
    createRestaurant: jest.fn(),
    findAllRestaurants: jest.fn(),
    findRestaurantById: jest.fn(),
    updateRestaurant: jest.fn(),
    deleteRestaurant: jest.fn(),
    findNearbyRestaurants: jest.fn(),
    addReview: jest.fn(),
    getRestaurantsForMap: jest.fn(),
  };

  const mockAdminGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RestaurantController],
      providers: [
        {
          provide: RestaurantService,
          useValue: mockRestaurantService,
        },
      ],
    })
      .overrideGuard(AdminGuard)
      .useValue(mockAdminGuard)
      .compile();

    controller = module.get<RestaurantController>(RestaurantController);
    controller = module.get<RestaurantController>(RestaurantController);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createRestaurant', () => {
    it('should create a new restaurant', async () => {
      const mockServiceResponse = {
        message: 'Restaurant created successfully',
        data: mockRestaurant,
      };

      mockRestaurantService.createRestaurant.mockResolvedValue(
        mockServiceResponse,
      );

      const result = await controller.createRestaurant(mockCreateRestaurantDto);

      expect(mockRestaurantService.createRestaurant).toHaveBeenCalledWith(
        mockCreateRestaurantDto,
      );
      expect(result).toEqual({
        statusCode: HttpStatus.CREATED,
        message: mockServiceResponse.message,
        data: mockServiceResponse.data,
      });
    });
  });

  describe('findAllRestaurants', () => {
    it('should return all restaurants with pagination', async () => {
      const mockServiceResponse = {
        message: 'Restaurants retrieved successfully',
        data: [mockRestaurant],
        totalCount: 1,
      };

      mockRestaurantService.findAllRestaurants.mockResolvedValue(
        mockServiceResponse,
      );

      const filters = { cuisine_types: 'Italian' };
      await controller.findAllRestaurants(filters, '1', '10', mockResponse);

      expect(mockRestaurantService.findAllRestaurants).toHaveBeenCalledWith(
        filters,
        1,
        10,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.OK,
        message: mockServiceResponse.message,
        data: mockServiceResponse.data,
        totalCount: mockServiceResponse.totalCount,
      });
    });

    it('should handle default pagination values', async () => {
      const mockServiceResponse = {
        message: 'Restaurants retrieved successfully',
        data: [mockRestaurant],
        totalCount: 1,
      };

      mockRestaurantService.findAllRestaurants.mockResolvedValue(
        mockServiceResponse,
      );

      await controller.findAllRestaurants(
        {},
        undefined,
        undefined,
        mockResponse,
      );

      expect(mockRestaurantService.findAllRestaurants).toHaveBeenCalledWith(
        {},
        1,
        10,
      );
    });
  });

  describe('findNearbyRestaurants', () => {
    it('should return nearby restaurants', async () => {
      const mockServiceResponse = {
        message: 'Nearby restaurants retrieved successfully',
        data: [mockRestaurant],
      };

      mockRestaurantService.findNearbyRestaurants.mockResolvedValue(
        mockServiceResponse,
      );

      const result = await controller.findNearbyRestaurants(
        '6.5244',
        '3.3792',
        '10',
      );

      expect(mockRestaurantService.findNearbyRestaurants).toHaveBeenCalledWith(
        6.5244,
        3.3792,
        10,
      );
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: mockServiceResponse.message,
        data: mockServiceResponse.data,
      });
    });

    it('should use default radius when not provided', async () => {
      const mockServiceResponse = {
        message: 'Nearby restaurants retrieved successfully',
        data: [mockRestaurant],
      };

      mockRestaurantService.findNearbyRestaurants.mockResolvedValue(
        mockServiceResponse,
      );

      await controller.findNearbyRestaurants('6.5244', '3.3792');

      expect(mockRestaurantService.findNearbyRestaurants).toHaveBeenCalledWith(
        6.5244,
        3.3792,
        10,
      );
    });
  });

  describe('getRestaurantsForMap', () => {
    it('should return restaurants for map display', async () => {
      const mockServiceResponse = {
        message: 'Map restaurants retrieved successfully',
        data: [mockRestaurant],
      };

      mockRestaurantService.getRestaurantsForMap.mockResolvedValue(
        mockServiceResponse,
      );

      const result = await controller.getRestaurantsForMap(
        '6.5244',
        '3.3792',
        '25',
      );

      expect(mockRestaurantService.getRestaurantsForMap).toHaveBeenCalledWith(
        6.5244,
        3.3792,
        25,
      );
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: mockServiceResponse.message,
        data: mockServiceResponse.data,
      });
    });

    it('should use default radius for map when not provided', async () => {
      const mockServiceResponse = {
        message: 'Map restaurants retrieved successfully',
        data: [mockRestaurant],
      };

      mockRestaurantService.getRestaurantsForMap.mockResolvedValue(
        mockServiceResponse,
      );

      await controller.getRestaurantsForMap('6.5244', '3.3792');

      expect(mockRestaurantService.getRestaurantsForMap).toHaveBeenCalledWith(
        6.5244,
        3.3792,
        50,
      );
    });
  });

  describe('findRestaurantById', () => {
    it('should return restaurant by id', async () => {
      const mockServiceResponse = {
        message: 'Restaurant retrieved successfully',
        data: mockRestaurant,
      };

      mockRestaurantService.findRestaurantById.mockResolvedValue(
        mockServiceResponse,
      );

      const result = await controller.findRestaurantById(
        '507f1f77bcf86cd799439011',
      );

      expect(mockRestaurantService.findRestaurantById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: mockServiceResponse.message,
        data: mockServiceResponse.data,
      });
    });
  });

  describe('updateRestaurant', () => {
    it('should update restaurant', async () => {
      const updateDto: UpdateRestaurantDto = { name: 'Updated Restaurant' };
      const mockServiceResponse = {
        message: 'Restaurant updated successfully',
        data: { ...mockRestaurant, name: 'Updated Restaurant' },
      };

      mockRestaurantService.updateRestaurant.mockResolvedValue(
        mockServiceResponse,
      );

      const result = await controller.updateRestaurant(
        '507f1f77bcf86cd799439011',
        updateDto,
      );

      expect(mockRestaurantService.updateRestaurant).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        updateDto,
      );
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: mockServiceResponse.message,
        data: mockServiceResponse.data,
      });
    });
  });

  describe('deleteRestaurant', () => {
    it('should delete restaurant', async () => {
      const mockServiceResponse = {
        message: 'Restaurant deactivated successfully',
      };

      mockRestaurantService.deleteRestaurant.mockResolvedValue(
        mockServiceResponse,
      );

      const result = await controller.deleteRestaurant(
        '507f1f77bcf86cd799439011',
      );

      expect(mockRestaurantService.deleteRestaurant).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: mockServiceResponse.message,
      });
    });
  });

  describe('addReview', () => {
    it('should add review to restaurant', async () => {
      const reviewData = {
        reviewer_id: '507f1f77bcf86cd799439012',
        rating: 5,
        review: 'Great restaurant!',
        dining_experience_id: '507f1f77bcf86cd799439013',
      };

      const mockServiceResponse = {
        message: 'Review added successfully',
      };

      mockRestaurantService.addReview.mockResolvedValue(mockServiceResponse);

      const result = await controller.addReview(
        '507f1f77bcf86cd799439011',
        reviewData,
      );

      expect(mockRestaurantService.addReview).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        reviewData.reviewer_id,
        reviewData.rating,
        reviewData.review,
        reviewData.dining_experience_id,
      );
      expect(result).toEqual({
        statusCode: HttpStatus.CREATED,
        message: mockServiceResponse.message,
      });
    });

    it('should add review without optional fields', async () => {
      const reviewData = {
        reviewer_id: '507f1f77bcf86cd799439012',
        rating: 4,
      };

      const mockServiceResponse = {
        message: 'Review added successfully',
      };

      mockRestaurantService.addReview.mockResolvedValue(mockServiceResponse);

      const result = await controller.addReview(
        '507f1f77bcf86cd799439011',
        reviewData,
      );

      expect(mockRestaurantService.addReview).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        reviewData.reviewer_id,
        reviewData.rating,
        undefined,
        undefined,
      );
      expect(result).toEqual({
        statusCode: HttpStatus.CREATED,
        message: mockServiceResponse.message,
      });
    });
  });
});
