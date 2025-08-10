import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RestaurantService } from './restaurant.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { BulkCreateRestaurantDto } from './dto/bulk-create-restaurant.dto';
import { AdminGuard } from '../auth/admin.guard';

@ApiTags('restaurants')
@Controller('restaurant')
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  @ApiOperation({
    summary: 'Create a new restaurant (Admin Only)',
    description:
      'Creates a new restaurant with location, cuisine types, opening hours, and commission settings. Requires admin privileges.',
  })
  @ApiResponse({
    status: 201,
    description: 'Restaurant created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin privileges required',
  })
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @Post()
  async createRestaurant(@Body() createRestaurantDto: CreateRestaurantDto) {
    const response =
      await this.restaurantService.createRestaurant(createRestaurantDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: response.message,
      data: response.data,
    };
  }

  @ApiOperation({
    summary: 'Bulk create restaurants (Admin Only)',
    description:
      'Creates multiple restaurants at once. Maximum 100 restaurants per request. Processes restaurants in batches to avoid database overload. Requires admin privileges.',
  })
  @ApiResponse({
    status: 201,
    description:
      'Bulk restaurant creation completed with summary of successful and failed creations',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 201 },
        message: {
          type: 'string',
          example:
            'Bulk restaurant creation completed. 8 successful, 2 failed.',
        },
        data: {
          type: 'object',
          properties: {
            successful: {
              type: 'array',
              items: { type: 'object' },
              description: 'Successfully created restaurants',
            },
            failed: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  index: {
                    type: 'number',
                    description: 'Index of failed restaurant in original array',
                  },
                  data: {
                    type: 'object',
                    description: 'Restaurant data that failed',
                  },
                  error: { type: 'string', description: 'Error message' },
                },
              },
              description: 'Failed restaurant creations with error details',
            },
            summary: {
              type: 'object',
              properties: {
                total: {
                  type: 'number',
                  description: 'Total restaurants attempted',
                },
                successful: {
                  type: 'number',
                  description: 'Number of successful creations',
                },
                failed: {
                  type: 'number',
                  description: 'Number of failed creations',
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or validation errors',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin privileges required',
  })
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @Post('bulk')
  async bulkCreateRestaurants(@Body() bulkCreateDto: BulkCreateRestaurantDto) {
    const response = await this.restaurantService.bulkCreateRestaurants(
      bulkCreateDto.restaurants,
    );
    return {
      statusCode: HttpStatus.CREATED,
      message: response.message,
      data: response.data,
    };
  }

  @ApiOperation({
    summary: 'Get all restaurants with filtering',
    description:
      'Retrieves restaurants with optional filtering by cuisine, price range, location, etc.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of results per page',
    example: 10,
  })
  @ApiQuery({
    name: 'cuisine_types',
    required: false,
    description: 'Comma-separated cuisine types',
    example: 'Italian,Chinese',
  })
  @ApiQuery({
    name: 'price_range',
    required: false,
    description: 'Maximum price range (1-5)',
    example: 3,
  })
  @ApiQuery({
    name: 'min_rating',
    required: false,
    description: 'Minimum rating (0-5)',
    example: 4.0,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in name, description, cuisine',
    example: 'pasta',
  })
  @ApiQuery({
    name: 'latitude',
    required: false,
    description: 'User latitude for distance filtering',
    example: 6.5244,
  })
  @ApiQuery({
    name: 'longitude',
    required: false,
    description: 'User longitude for distance filtering',
    example: 3.3792,
  })
  @ApiQuery({
    name: 'radius',
    required: false,
    description: 'Search radius in kilometers',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Restaurants retrieved successfully',
  })
  @Get()
  async findAllRestaurants(
    @Query() filters: { [key: string]: any },
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Res() res: Response,
  ) {
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;

    const response = await this.restaurantService.findAllRestaurants(
      filters,
      pageNumber,
      limitNumber,
    );

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: response.message,
      data: response.data,
      totalCount: response.totalCount,
    });
  }

  @ApiOperation({
    summary: 'Find nearby restaurants',
    description:
      'Get restaurants within a specified radius of given coordinates',
  })
  @ApiQuery({
    name: 'latitude',
    required: true,
    description: 'User latitude',
    example: 6.5244,
  })
  @ApiQuery({
    name: 'longitude',
    required: true,
    description: 'User longitude',
    example: 3.3792,
  })
  @ApiQuery({
    name: 'radius',
    required: false,
    description: 'Search radius in kilometers',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Nearby restaurants retrieved successfully',
  })
  @Get('nearby')
  async findNearbyRestaurants(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('radius') radius: string = '10',
  ) {
    const response = await this.restaurantService.findNearbyRestaurants(
      parseFloat(latitude),
      parseFloat(longitude),
      parseInt(radius),
    );

    return {
      statusCode: HttpStatus.OK,
      message: response.message,
      data: response.data,
    };
  }

  @ApiOperation({
    summary: 'Get restaurants for map display',
    description:
      'Retrieves only restaurants with active dining experiences for Google Maps display',
  })
  @ApiQuery({
    name: 'latitude',
    required: true,
    description: 'User latitude',
    example: 6.5244,
  })
  @ApiQuery({
    name: 'longitude',
    required: true,
    description: 'User longitude',
    example: 3.3792,
  })
  @ApiQuery({
    name: 'radius',
    required: false,
    description: 'Search radius in kilometers',
    example: 50,
  })
  @ApiResponse({
    status: 200,
    description: 'Map restaurants retrieved successfully',
  })
  @Get('map')
  async getRestaurantsForMap(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('radius') radius: string = '50',
  ) {
    const response = await this.restaurantService.getRestaurantsForMap(
      parseFloat(latitude),
      parseFloat(longitude),
      parseInt(radius),
    );

    return {
      statusCode: HttpStatus.OK,
      message: response.message,
      data: response.data,
    };
  }

  @ApiOperation({
    summary: 'Get restaurant by ID',
    description:
      'Retrieves a single restaurant with all its details including active dining experiences',
  })
  @ApiParam({
    name: 'id',
    description: 'Restaurant ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Restaurant retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @Get(':id')
  async findRestaurantById(@Param('id') id: string) {
    const response = await this.restaurantService.findRestaurantById(id);
    return {
      statusCode: HttpStatus.OK,
      message: response.message,
      data: response.data,
    };
  }

  @ApiOperation({
    summary: 'Update restaurant (Admin Only)',
    description:
      'Updates restaurant information including hours, menu, and commission settings. Requires admin privileges.',
  })
  @ApiParam({
    name: 'id',
    description: 'Restaurant ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Restaurant updated successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin privileges required',
  })
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @Patch(':id')
  async updateRestaurant(
    @Param('id') id: string,
    @Body() updateRestaurantDto: UpdateRestaurantDto,
  ) {
    const response = await this.restaurantService.updateRestaurant(
      id,
      updateRestaurantDto,
    );
    return {
      statusCode: HttpStatus.OK,
      message: response.message,
      data: response.data,
    };
  }

  @ApiOperation({
    summary: 'Delete restaurant (Admin Only)',
    description:
      'Deactivates a restaurant (soft delete). Requires admin privileges.',
  })
  @ApiParam({
    name: 'id',
    description: 'Restaurant ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Restaurant deactivated successfully',
  })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin privileges required',
  })
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @Delete(':id')
  async deleteRestaurant(@Param('id') id: string) {
    const response = await this.restaurantService.deleteRestaurant(id);
    return {
      statusCode: HttpStatus.OK,
      message: response.message,
    };
  }

  @ApiOperation({
    summary: 'Add restaurant review',
    description:
      'Adds a review and rating for a restaurant, optionally linked to a dining experience',
  })
  @ApiParam({
    name: 'id',
    description: 'Restaurant ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reviewer_id: { type: 'string', example: '507f1f77bcf86cd799439012' },
        rating: { type: 'number', minimum: 1, maximum: 5, example: 5 },
        review: {
          type: 'string',
          example: 'Amazing food and great atmosphere!',
        },
        dining_experience_id: {
          type: 'string',
          example: '507f1f77bcf86cd799439013',
        },
      },
      required: ['reviewer_id', 'rating'],
    },
  })
  @ApiResponse({ status: 201, description: 'Review added successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid review data or user already reviewed',
  })
  @ApiBearerAuth()
  @Post(':id/review')
  async addReview(
    @Param('id') restaurantId: string,
    @Body()
    reviewData: {
      reviewer_id: string;
      rating: number;
      review?: string;
      dining_experience_id?: string;
    },
  ) {
    const response = await this.restaurantService.addReview(
      restaurantId,
      reviewData.reviewer_id,
      reviewData.rating,
      reviewData.review,
      reviewData.dining_experience_id,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: response.message,
    };
  }
}
