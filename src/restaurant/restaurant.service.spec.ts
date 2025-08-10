import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { Restaurant, RestaurantDocument } from './schema/restaurant.schema';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

describe('RestaurantService', () => {
  let service: RestaurantService;
  let model: Model<RestaurantDocument>;

  const mockRestaurantId = new Types.ObjectId().toString();
  const mockReviewerId = new Types.ObjectId().toString();
  const mockPersonalDiningId = new Types.ObjectId().toString();

  const mockRestaurant = {
    _id: mockRestaurantId,
    name: 'Test Restaurant',
    description: 'A great test restaurant',
    location: {
      latitude: 6.5244,
      longitude: 3.3792,
      address: '123 Test Street, Lagos'
    },
    cuisine_types: ['Italian', 'Mediterranean'],
    price_range: 3,
    phone_number: '+2348012345678',
    opening_hours: {
      monday: { open: '09:00', close: '22:00', closed: false },
      tuesday: { open: '09:00', close: '22:00', closed: false },
      wednesday: { open: '09:00', close: '22:00', closed: false },
      thursday: { open: '09:00', close: '22:00', closed: false },
      friday: { open: '09:00', close: '22:00', closed: false },
      saturday: { open: '09:00', close: '22:00', closed: false },
      sunday: { open: '09:00', close: '22:00', closed: false }
    },
    average_rating: 4.5,
    total_reviews: 10,
    is_active: true,
    accepts_reservations: true,
    platform_discount_percentage: 10,
    platform_commission_percentage: 5,
    diner_discount_percentage: 5,
    reviews: [],
    amenities: ['WiFi', 'Parking'],
    is_partner: false,
    active_personal_dining: [],
    active_public_events: [],
    toObject: jest.fn().mockReturnThis(),
    save: jest.fn().mockResolvedValue(this)
  };

  const mockCreateRestaurantDto: CreateRestaurantDto = {
    name: 'New Restaurant',
    description: 'A new restaurant',
    location: {
      latitude: 6.5244,
      longitude: 3.3792,
      address: '456 New Street, Lagos'
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
      sunday: { open: '10:00', close: '21:00' }
    }
  };

  const mockModel = {
    new: jest.fn().mockResolvedValue(mockRestaurant),
    constructor: jest.fn().mockResolvedValue(mockRestaurant),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    exec: jest.fn(),
    populate: jest.fn(),
    sort: jest.fn(),
    skip: jest.fn(),
    limit: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestaurantService,
        {
          provide: getModelToken(Restaurant.name),
          useValue: mockModel
        }
      ]
    }).compile();

    service = module.get<RestaurantService>(RestaurantService);
    model = module.get<Model<RestaurantDocument>>(getModelToken(Restaurant.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createRestaurant', () => {
    it('should create a new restaurant successfully', async () => {
      const mockSave = jest.fn().mockResolvedValue(mockRestaurant);
      const mockConstructor = jest.fn().mockImplementation(() => ({
        ...mockRestaurant,
        save: mockSave
      }));

      // Mock the model constructor
      jest.spyOn(model, 'constructor' as any).mockImplementation(mockConstructor);
      // Create a spy for the model function itself
      const modelSpy = jest.fn().mockImplementation(mockConstructor);
      (service as any).restaurantModel = modelSpy;

      const result = await service.createRestaurant(mockCreateRestaurantDto);

      expect(modelSpy).toHaveBeenCalledWith({
        ...mockCreateRestaurantDto,
        average_rating: 0,
        total_reviews: 0
      });
      expect(mockSave).toHaveBeenCalled();
      expect(result.message).toBe('Restaurant created successfully');
      expect(result.data).toEqual(mockRestaurant);
    });

    it('should handle creation error', async () => {
      const mockSave = jest.fn().mockRejectedValue(new Error('Database error'));
      const mockConstructor = jest.fn().mockImplementation(() => ({
        save: mockSave
      }));

      (service as any).restaurantModel = mockConstructor;

      await expect(service.createRestaurant(mockCreateRestaurantDto))
        .rejects
        .toThrow('Failed to create restaurant');
    });
  });

  describe('findAllRestaurants', () => {
    it('should return all restaurants with filters', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockRestaurant])
      };

      mockModel.find.mockReturnValue(mockQuery);
      mockModel.countDocuments.mockResolvedValue(1);

      const filters = { cuisine_types: 'Italian,Chinese', price_range: '3' };
      const result = await service.findAllRestaurants(filters, 1, 10);

      expect(mockModel.find).toHaveBeenCalledWith({
        is_active: true,
        cuisine_types: { $in: ['Italian', 'Chinese'] },
        price_range: { $lte: 3 }
      });
      expect(result.message).toBe('Restaurants retrieved successfully');
      expect(result.data).toEqual([mockRestaurant]);
      expect(result.totalCount).toBe(1);
    });

    it('should handle search filter', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockRestaurant])
      };

      mockModel.find.mockReturnValue(mockQuery);
      mockModel.countDocuments.mockResolvedValue(1);

      const filters = { search: 'pasta' };
      const result = await service.findAllRestaurants(filters);

      expect(mockModel.find).toHaveBeenCalledWith({
        is_active: true,
        $or: [
          { name: { $regex: 'pasta', $options: 'i' } },
          { description: { $regex: 'pasta', $options: 'i' } },
          { cuisine_types: { $regex: 'pasta', $options: 'i' } }
        ]
      });
    });

    it('should handle errors', async () => {
      mockModel.find.mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(service.findAllRestaurants({}))
        .rejects
        .toThrow('Failed to fetch restaurants');
    });
  });

  describe('findRestaurantById', () => {
    it('should return restaurant by id', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockRestaurant)
      };

      mockModel.findById.mockReturnValue(mockQuery);

      const result = await service.findRestaurantById(mockRestaurantId);

      expect(mockModel.findById).toHaveBeenCalledWith(mockRestaurantId);
      expect(mockQuery.populate).toHaveBeenCalledWith('active_public_events');
      expect(result.message).toBe('Restaurant retrieved successfully');
      expect(result.data).toEqual(mockRestaurant);
    });

    it('should throw NotFoundException when restaurant not found', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null)
      };

      mockModel.findById.mockReturnValue(mockQuery);

      await expect(service.findRestaurantById(mockRestaurantId))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('updateRestaurant', () => {
    it('should update restaurant successfully', async () => {
      const updateDto: UpdateRestaurantDto = { name: 'Updated Restaurant' };
      const updatedRestaurant = { ...mockRestaurant, name: 'Updated Restaurant' };

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(updatedRestaurant)
      };

      mockModel.findByIdAndUpdate.mockReturnValue(mockQuery);

      const result = await service.updateRestaurant(mockRestaurantId, updateDto);

      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockRestaurantId,
        updateDto,
        { new: true }
      );
      expect(result.message).toBe('Restaurant updated successfully');
      expect(result.data).toEqual(updatedRestaurant);
    });

    it('should throw NotFoundException when restaurant not found', async () => {
      const mockQuery = {
        exec: jest.fn().mockResolvedValue(null)
      };

      mockModel.findByIdAndUpdate.mockReturnValue(mockQuery);

      await expect(service.updateRestaurant(mockRestaurantId, {}))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('deleteRestaurant', () => {
    it('should deactivate restaurant successfully', async () => {
      const deactivatedRestaurant = { ...mockRestaurant, is_active: false };

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(deactivatedRestaurant)
      };

      mockModel.findByIdAndUpdate.mockReturnValue(mockQuery);

      const result = await service.deleteRestaurant(mockRestaurantId);

      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockRestaurantId,
        { is_active: false },
        { new: true }
      );
      expect(result.message).toBe('Restaurant deactivated successfully');
    });
  });

  describe('findNearbyRestaurants', () => {
    it('should return nearby restaurants', async () => {
      const restaurantWithDistance = {
        ...mockRestaurant,
        distance_km: 2.5
      };

      const mockQuery = {
        exec: jest.fn().mockResolvedValue([mockRestaurant])
      };

      mockModel.find.mockReturnValue(mockQuery);

      // Mock geolib
      const geolib = require('geolib');
      jest.doMock('geolib', () => ({
        getDistance: jest.fn().mockReturnValue(2500) // 2.5km in meters
      }));

      const result = await service.findNearbyRestaurants(6.5244, 3.3792, 10);

      expect(mockModel.find).toHaveBeenCalledWith({
        is_active: true,
        accepts_reservations: true
      });
      expect(result.message).toBe('Nearby restaurants retrieved successfully');
    });
  });

  describe('addReview', () => {
    it('should add review successfully', async () => {
      const mockRestaurantWithReviews = {
        ...mockRestaurant,
        reviews: [],
        save: jest.fn().mockResolvedValue(true)
      };

      mockModel.findById.mockResolvedValue(mockRestaurantWithReviews);

      const result = await service.addReview(
        mockRestaurantId,
        mockReviewerId,
        5,
        'Great restaurant!',
        mockPersonalDiningId
      );

      expect(mockModel.findById).toHaveBeenCalledWith(mockRestaurantId);
      expect(mockRestaurantWithReviews.reviews).toHaveLength(1);
      expect(mockRestaurantWithReviews.save).toHaveBeenCalled();
      expect(result.message).toBe('Review added successfully');
    });

    it('should throw NotFoundException when restaurant not found', async () => {
      mockModel.findById.mockResolvedValue(null);

      await expect(service.addReview(mockRestaurantId, mockReviewerId, 5))
        .rejects
        .toThrow(NotFoundException);
    });

    it('should throw BadRequestException when user already reviewed', async () => {
      const mockRestaurantWithExistingReview = {
        ...mockRestaurant,
        reviews: [
          {
            reviewer: new Types.ObjectId(mockReviewerId),
            rating: 4,
            review: 'Previous review'
          }
        ]
      };

      mockModel.findById.mockResolvedValue(mockRestaurantWithExistingReview);

      await expect(service.addReview(mockRestaurantId, mockReviewerId, 5))
        .rejects
        .toThrow(BadRequestException);
    });
  });

  // Personal dining methods removed - personal dining is ALWAYS private

  describe('getRestaurantsForMap', () => {
    it('should return restaurants with active experiences for map', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockRestaurant])
      };

      mockModel.find.mockReturnValue(mockQuery);

      const result = await service.getRestaurantsForMap(6.5244, 3.3792, 50);

      expect(mockModel.find).toHaveBeenCalledWith({
        is_active: true,
        'active_public_events.0': { $exists: true }
      });
      expect(result.message).toBe('Map restaurants retrieved successfully');
    });
  });
});
