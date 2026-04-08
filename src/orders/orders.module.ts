// src/orders/orders.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { CartModule } from 'src/cart/cart.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem]), CartModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
