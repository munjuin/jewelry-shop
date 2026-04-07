// src/orders/orders.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { ProductOption } from '../entities/product-option.entity';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly dataSource: DataSource) {}

  // 1. 주문서 작성 데이터 조회 (결제 전 프리뷰)
  async getCheckoutInfo(userId: number) {
    const cart = await this.dataSource.getRepository(Cart).findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product', 'items.productOption'],
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('장바구니가 비어있습니다.');
    }

    let totalProductPrice = 0;
    const cartItems = cart.items.map((item) => {
      totalProductPrice +=
        (item.product.price + item.productOption.extra_price) * item.quantity;
      return {
        quantity: item.quantity,
        product_name: item.product.name,
        base_price: item.product.price,
        option_name: item.productOption.option_name,
        extra_price: item.productOption.extra_price,
      };
    });

    const deliveryFee = totalProductPrice < 100000 ? 3000 : 0;
    const finalPrice = totalProductPrice + deliveryFee;

    return { cartItems, totalProductPrice, deliveryFee, finalPrice };
  }

  // 2. 주문 생성 (🔥 핵심 트랜잭션 - 비관적 락 적용)
  async createOrder(userId: number, dto: CreateOrderDto) {
    return await this.dataSource.transaction(async (manager) => {
      const cart = await manager.findOne(Cart, {
        where: { user: { id: userId } },
        relations: ['items', 'items.product', 'items.productOption'],
      });

      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('장바구니가 비어있습니다.');
      }

      // 💡 [데드락 방지] 트랜잭션 교착 상태를 막기 위해 옵션 ID 기준으로 오름차순 정렬
      const sortedItems = cart.items.sort(
        (a, b) => a.productOption.id - b.productOption.id,
      );

      let totalAmount = 0;

      // 💡 [이슈 1 해결] 재고 검증 및 차감 (비관적 락 적용)
      for (const item of sortedItems) {
        // SELECT ... FOR UPDATE 구문으로 해당 옵션 행(Row)을 트랜잭션 종료 시까지 잠금
        const productOption = await manager.findOne(ProductOption, {
          where: { id: item.productOption.id },
          lock: { mode: 'pessimistic_write' },
        });

        if (!productOption) {
          throw new NotFoundException(
            `상품 옵션을 찾을 수 없습니다. (ID: ${item.productOption.id})`,
          );
        }

        // 락이 걸린 안전한 상태에서 실제 재고 비교
        if (productOption.stock_quantity < item.quantity) {
          throw new BadRequestException(
            `재고 부족: [${productOption.option_name}] 상품의 재고가 부족합니다. (잔여: ${productOption.stock_quantity}개)`,
          );
        }

        // 재고가 충분하다면 총액 누적
        totalAmount +=
          (item.product.price + productOption.extra_price) * item.quantity;

        // 재고 즉시 차감 및 DB 반영 (트랜잭션 내부이므로 안전함)
        productOption.stock_quantity -= item.quantity;
        await manager.save(productOption);
      }

      const deliveryFee = totalAmount < 100000 ? 3000 : 0;
      const finalAmount = totalAmount + deliveryFee;

      // 1) 주문 마스터 생성
      const order = manager.create(Order, {
        user: { id: userId },
        total_amount: totalAmount,
        delivery_fee: deliveryFee,
        final_amount: finalAmount,
        ...dto, // DTO의 배송지 정보 병합
        status: 'PAID', // 결제 완료 상태로 가정
      });
      await manager.save(order);

      // 2) 주문 상세 내역(스냅샷) 저장
      for (const item of sortedItems) {
        const priceSnapshot =
          item.product.price + item.productOption.extra_price;

        const orderItem = manager.create(OrderItem, {
          order: { id: order.id },
          product: { id: item.product.id },
          option_snapshot: item.productOption.option_name,
          quantity: item.quantity,
          price_snapshot: priceSnapshot,
        });
        await manager.save(orderItem);
      }

      // 3) 장바구니 비우기
      await manager.remove(CartItem, cart.items);

      return {
        message: '주문이 성공적으로 완료되었습니다.',
        orderId: order.id,
      };
    });
  }

  // 3. 내 주문 내역 조회
  async getOrderList(userId: number) {
    return await this.dataSource.getRepository(Order).find({
      where: { user: { id: userId } },
      relations: ['items', 'items.product'],
      order: { created_at: 'DESC' },
    });
  }

  // 4. 주문 취소 (기존 스냅샷 기반 로직 유지 - 이슈 2에서 수정 예정)
  async cancelOrder(userId: number, orderId: number) {
    return await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: orderId, user: { id: userId } },
        relations: ['items', 'items.product'],
      });

      if (!order) throw new NotFoundException('주문 내역을 찾을 수 없습니다.');
      if (order.status === 'CANCELLED')
        throw new BadRequestException('이미 취소된 주문입니다.');

      // 1) 상태 변경
      order.status = 'CANCELLED';
      await manager.save(order);

      // 2) 재고 복구 (스냅샷을 이용한 역추적)
      for (const item of order.items) {
        if (item.product) {
          const option = await manager.findOne(ProductOption, {
            where: {
              product: { id: item.product.id },
              option_name: item.option_snapshot,
            },
          });

          if (option) {
            option.stock_quantity += item.quantity;
            await manager.save(option);
          }
        }
      }

      return {
        message: '주문이 성공적으로 취소되었습니다.',
        orderId: order.id,
      };
    });
  }
}
