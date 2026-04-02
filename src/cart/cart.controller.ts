// src/cart/dto/cart.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

// 커스텀 Request 인터페이스 (Auth 파트에서 만들었던 것 재사용 권장)
interface RequestWithUser extends Request {
  user: { id: number; email: string; role: string };
}

@Controller('cart')
@UseGuards(JwtAuthGuard) // 💡 이 컨트롤러의 모든 라우터는 로그인 필수
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  async addToCart(@Req() req: RequestWithUser, @Body() dto: AddToCartDto) {
    return await this.cartService.addToCart(req.user.id, dto);
  }

  @Get()
  async getCart(@Req() req: RequestWithUser) {
    return await this.cartService.getCart(req.user.id);
  }

  @Patch(':itemId')
  async updateCartItem(
    @Req() req: RequestWithUser,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdateCartItemDto,
  ) {
    return await this.cartService.updateCartItem(req.user.id, itemId, dto);
  }

  @Delete(':itemId')
  async deleteCartItem(
    @Req() req: RequestWithUser,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return await this.cartService.deleteCartItem(req.user.id, itemId);
  }
}
