import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('profiles')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) { }

    // Create a new profile
    @Post()
    async createProfile(@Body() createProfileDto: CreateProfileDto) {
        return this.profileService.createProfile(createProfileDto);
    }

    // Get all profiles
    @Get()
    async findAllProfiles() {
        return this.profileService.findAllProfiles();
    }

    // Get a profile by ID
    @Get(':id')
    async findOneProfile(@Param('id') id: string) {
        return this.profileService.findOneProfile(id);
    }

    // Update a profile by ID
    @Put(':id')
    async updateProfile(@Param('id') id: string, @Body() updateProfileDto: UpdateProfileDto) {
        return this.profileService.updateProfile(id, updateProfileDto);
    }

    // Delete a profile by ID
    @Delete(':id')
    async deleteProfileById(@Param('id') id: string) {
        return this.profileService.deleteProfileById(id);
    }
}
