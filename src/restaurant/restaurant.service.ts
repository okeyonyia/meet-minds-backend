import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Restaurant, RestaurantDocument } from './schema/restaurant.schema';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import * as geolib from 'geolib';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectModel(Restaurant.name)
    private restaurantModel: Model<RestaurantDocument>,
  ) {}

  async createRestaurant(
    createRestaurantDto: CreateRestaurantDto,
  ): Promise<{ message: string; data: Restaurant }> {
    try {
      const newRestaurant = new this.restaurantModel({
        ...createRestaurantDto,
        average_rating: 0,
        total_reviews: 0,
      });

      await newRestaurant.save();

      return {
        message: 'Restaurant created successfully',
        data: newRestaurant,
      };
    } catch (error) {
      console.error('Error creating restaurant:', error);
      throw new InternalServerErrorException('Failed to create restaurant');
    }
  }

  async bulkCreateRestaurants(restaurants: CreateRestaurantDto[]): Promise<{
    message: string;
    data: {
      successful: Restaurant[];
      failed: Array<{
        index: number;
        data: CreateRestaurantDto;
        error: string;
      }>;
      summary: {
        total: number;
        successful: number;
        failed: number;
      };
    };
  }> {
    const successful: Restaurant[] = [];
    const failed: Array<{
      index: number;
      data: CreateRestaurantDto;
      error: string;
    }> = [];

    try {
      // Process restaurants in batches to avoid overwhelming the database
      const batchSize = 10;
      const batches = [];

      for (let i = 0; i < restaurants.length; i += batchSize) {
        batches.push(restaurants.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        // Process each batch concurrently
        const batchPromises = batch.map(async (restaurant, batchIndex) => {
          const globalIndex = batches.indexOf(batch) * batchSize + batchIndex;
          try {
            const newRestaurant = new this.restaurantModel({
              ...restaurant,
              average_rating: 0,
              total_reviews: 0,
              is_active:
                restaurant.is_active !== undefined
                  ? restaurant.is_active
                  : true,
              accepts_reservations:
                restaurant.accepts_reservations !== undefined
                  ? restaurant.accepts_reservations
                  : true,
              platform_discount_percentage:
                restaurant.platform_discount_percentage || 10,
              platform_commission_percentage:
                restaurant.platform_commission_percentage || 5,
              diner_discount_percentage:
                restaurant.diner_discount_percentage || 5,
              is_partner:
                restaurant.is_partner !== undefined
                  ? restaurant.is_partner
                  : false,
            });

            const savedRestaurant = await newRestaurant.save();
            successful.push(savedRestaurant);
          } catch (error) {
            console.error(
              `Error creating restaurant at index ${globalIndex}:`,
              error,
            );
            failed.push({
              index: globalIndex,
              data: restaurant,
              error: error.message || 'Unknown error occurred',
            });
          }
        });

        // Wait for the current batch to complete before moving to the next
        await Promise.all(batchPromises);
      }

      return {
        message: `Bulk restaurant creation completed. ${successful.length} successful, ${failed.length} failed.`,
        data: {
          successful,
          failed,
          summary: {
            total: restaurants.length,
            successful: successful.length,
            failed: failed.length,
          },
        },
      };
    } catch (error) {
      console.error('Error in bulk restaurant creation:', error);
      throw new InternalServerErrorException(
        'Failed to process bulk restaurant creation',
      );
    }
  }

  async findAllRestaurants(
    filters: { [key: string]: any } = {},
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    message: string;
    data: Restaurant[];
    totalCount: number;
  }> {
    try {
      const query: any = { is_active: true };

      // Apply filters
      if (filters.cuisine_types) {
        query.cuisine_types = { $in: filters.cuisine_types.split(',') };
      }

      if (filters.price_range) {
        query.price_range = { $lte: parseInt(filters.price_range) };
      }

      if (filters.min_rating) {
        query.average_rating = { $gte: parseFloat(filters.min_rating) };
      }

      if (filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } },
          { cuisine_types: { $regex: filters.search, $options: 'i' } },
        ];
      }

      // Location-based filtering
      let restaurants = await this.restaurantModel
        .find(query)
        .sort({ average_rating: -1, total_reviews: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();

      // Apply distance filter if coordinates provided
      if (filters.latitude && filters.longitude && filters.radius) {
        const userLocation = {
          latitude: parseFloat(filters.latitude),
          longitude: parseFloat(filters.longitude),
        };
        const radiusInMeters = parseInt(filters.radius) * 1000; // Convert km to meters

        restaurants = restaurants.filter((restaurant) => {
          const distance = geolib.getDistance(userLocation, {
            latitude: restaurant.location.latitude,
            longitude: restaurant.location.longitude,
          });
          return distance <= radiusInMeters;
        });
      }

      const totalCount = await this.restaurantModel.countDocuments(query);

      return {
        message: 'Restaurants retrieved successfully',
        data: restaurants,
        totalCount,
      };
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      throw new InternalServerErrorException('Failed to fetch restaurants');
    }
  }

  async findRestaurantById(
    id: string,
  ): Promise<{ message: string; data: Restaurant }> {
    try {
      const restaurant = await this.restaurantModel
        .findById(id)
        .populate('active_public_events')
        .exec();

      if (!restaurant) {
        throw new NotFoundException('Restaurant not found');
      }

      return {
        message: 'Restaurant retrieved successfully',
        data: restaurant,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error fetching restaurant:', error);
      throw new InternalServerErrorException('Failed to fetch restaurant');
    }
  }

  async updateRestaurant(
    id: string,
    updateRestaurantDto: UpdateRestaurantDto,
  ): Promise<{ message: string; data: Restaurant }> {
    try {
      const updatedRestaurant = await this.restaurantModel
        .findByIdAndUpdate(id, updateRestaurantDto, { new: true })
        .exec();

      if (!updatedRestaurant) {
        throw new NotFoundException('Restaurant not found');
      }

      return {
        message: 'Restaurant updated successfully',
        data: updatedRestaurant,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error updating restaurant:', error);
      throw new InternalServerErrorException('Failed to update restaurant');
    }
  }

  async deleteRestaurant(id: string): Promise<{ message: string }> {
    try {
      const deletedRestaurant = await this.restaurantModel
        .findByIdAndUpdate(id, { is_active: false }, { new: true })
        .exec();

      if (!deletedRestaurant) {
        throw new NotFoundException('Restaurant not found');
      }

      return {
        message: 'Restaurant deactivated successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error deleting restaurant:', error);
      throw new InternalServerErrorException('Failed to delete restaurant');
    }
  }

  async findNearbyRestaurants(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
  ): Promise<{ message: string; data: Restaurant[] }> {
    try {
      const userLocation = { latitude, longitude };

      const allRestaurants = await this.restaurantModel
        .find({ is_active: true, accepts_reservations: true })
        .exec();

      const nearbyRestaurants = allRestaurants
        .map((restaurant) => {
          const distance = geolib.getDistance(userLocation, {
            latitude: restaurant.location.latitude,
            longitude: restaurant.location.longitude,
          });

          return {
            ...restaurant.toObject(),
            distance_km: Math.round((distance / 1000) * 10) / 10, // Round to 1 decimal
          };
        })
        .filter((restaurant) => restaurant.distance_km <= radiusKm)
        .sort((a, b) => a.distance_km - b.distance_km);

      return {
        message: 'Nearby restaurants retrieved successfully',
        data: nearbyRestaurants,
      };
    } catch (error) {
      console.error('Error finding nearby restaurants:', error);
      throw new InternalServerErrorException(
        'Failed to find nearby restaurants',
      );
    }
  }

  async addReview(
    restaurantId: string,
    reviewerId: string,
    rating: number,
    review?: string,
    personalDiningId?: string,
  ): Promise<{ message: string }> {
    try {
      const restaurant = await this.restaurantModel.findById(restaurantId);

      if (!restaurant) {
        throw new NotFoundException('Restaurant not found');
      }

      // Check if user already reviewed this restaurant for this personal dining
      const existingReview = restaurant.reviews.find(
        (r) =>
          r.reviewer.toString() === reviewerId &&
          (!personalDiningId ||
            r.personal_dining?.toString() === personalDiningId),
      );

      if (existingReview) {
        throw new BadRequestException(
          'You have already reviewed this restaurant',
        );
      }

      // Add review
      restaurant.reviews.push({
        reviewer: new Types.ObjectId(reviewerId),
        rating,
        review,
        personal_dining: personalDiningId
          ? new Types.ObjectId(personalDiningId)
          : undefined,
      });

      // Update average rating and total reviews
      restaurant.total_reviews = restaurant.reviews.length;
      restaurant.average_rating =
        restaurant.reviews.reduce((sum, r) => sum + r.rating, 0) /
        restaurant.total_reviews;

      await restaurant.save();

      return {
        message: 'Review added successfully',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Error adding review:', error);
      throw new InternalServerErrorException('Failed to add review');
    }
  }

  // Personal dining methods removed - personal dining is ALWAYS private
  // Only Events (group dining) can be public and appear on maps

  async addActivePublicEvent(
    restaurantId: string,
    eventId: string,
  ): Promise<void> {
    try {
      await this.restaurantModel.findByIdAndUpdate(
        restaurantId,
        { $addToSet: { active_public_events: eventId } },
        { new: true },
      );
    } catch (error) {
      console.error('Error adding active public event:', error);
    }
  }

  async removeActivePublicEvent(
    restaurantId: string,
    eventId: string,
  ): Promise<void> {
    try {
      await this.restaurantModel.findByIdAndUpdate(
        restaurantId,
        { $pull: { active_public_events: eventId } },
        { new: true },
      );
    } catch (error) {
      console.error('Error removing active public event:', error);
    }
  }

  async getRestaurantsForMap(
    latitude: number,
    longitude: number,
    radiusKm: number = 50,
  ): Promise<{
    message: string;
    data: Array<
      Restaurant & {
        distance_km: number;
        active_events_count: number;
        total_active_count: number;
      }
    >;
  }> {
    try {
      const userLocation = { latitude, longitude };

      // Get restaurants with public events only
      // Personal dining is ALWAYS private and never appears on maps
      const restaurants = await this.restaurantModel
        .find({
          is_active: true,
          'active_public_events.0': { $exists: true }, // Has public group events only
        })
        .populate('active_public_events')
        .exec();

      const restaurantsWithDistance = restaurants
        .map((restaurant) => {
          const distance = geolib.getDistance(userLocation, {
            latitude: restaurant.location.latitude,
            longitude: restaurant.location.longitude,
          });

          return {
            ...restaurant.toObject(),
            distance_km: Math.round((distance / 1000) * 10) / 10,
            active_events_count: restaurant.active_public_events.length,
            total_active_count: restaurant.active_public_events.length,
          };
        })
        .filter((restaurant) => restaurant.distance_km <= radiusKm)
        .sort((a, b) => a.distance_km - b.distance_km);

      return {
        message: 'Map restaurants retrieved successfully',
        data: restaurantsWithDistance,
      };
    } catch (error) {
      console.error('Error getting restaurants for map:', error);
      throw new InternalServerErrorException(
        'Failed to get restaurants for map',
      );
    }
  }
}
