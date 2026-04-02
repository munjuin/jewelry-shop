// src/orders/orders.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { id: number; email: string; role: string };
}

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // 1. 주문서 작성 정보 조회 (기존 /checkout 역할)
  @Get('checkout')
  async getCheckoutInfo(@Req() req: RequestWithUser) {
    return await this.ordersService.getCheckoutInfo(req.user.id);
  }

  // 2. 주문 생성 (트랜잭션 실행)
  @Post()
  async createOrder(@Req() req: RequestWithUser, @Body() dto: CreateOrderDto) {
    return await this.ordersService.createOrder(req.user.id, dto);
  }

  // 3. 내 주문 내역 조회
  @Get()
  async getOrderList(@Req() req: RequestWithUser) {
    return await this.ordersService.getOrderList(req.user.id);
  }

  // 4. 주문 취소
  @Patch(':id/cancel')
  async cancelOrder(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) orderId: number,
  ) {
    return await this.ordersService.cancelOrder(req.user.id, orderId);
  }
}
