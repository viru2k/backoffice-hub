import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
  ValidationPipe,
  Request
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomFiltersDto } from './dto/room-filters.dto';
import { RoomResponseDto } from './dto/room-response.dto';
import { RoomListResponseDto } from './dto/room-list-response.dto';

@ApiTags('Rooms')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('rooms')
export class RoomController {
  // Room CRUD operations
  constructor(private readonly roomService: RoomService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new room' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Room created successfully', type: RoomResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  async create(
    @Body(ValidationPipe) createRoomDto: CreateRoomDto,
    @Request() req,
  ): Promise<RoomResponseDto> {
    return this.roomService.create(createRoomDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all rooms with optional filters' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rooms retrieved successfully', type: RoomListResponseDto })
  async findAll(
    @Query(ValidationPipe) filters: RoomFiltersDto,
    @Request() req,
  ): Promise<RoomListResponseDto> {
    return this.roomService.findAll(filters, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get room by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Room retrieved successfully', type: RoomResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Room not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<RoomResponseDto> {
    return this.roomService.findOne(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update room by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Room updated successfully', type: RoomResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Room not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateRoomDto: UpdateRoomDto,
    @Request() req,
  ): Promise<RoomResponseDto> {
    return this.roomService.update(id, updateRoomDto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete room by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Room deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Room not found' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<{ message: string }> {
    await this.roomService.remove(id, req.user);
    return { message: 'Room deleted successfully' };
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Toggle room status (active/inactive)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Room status toggled successfully', type: RoomResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Room not found' })
  async toggleStatus(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<RoomResponseDto> {
    return this.roomService.toggleStatus(id, req.user);
  }
}