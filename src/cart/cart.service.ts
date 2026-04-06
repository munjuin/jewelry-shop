// src/cart/dto/cart.service.ts
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { ProductOption } from 'src/entities/product-option.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    private readonly dataSource: DataSource,
  ) {}

  // 💡 [내부 헬퍼] 장바구니 총액 계산 (기존 로직 이식)
  private async getCartTotals(userId: number) {
    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product', 'items.productOption'],
    });

    if (!cart || !cart.items.length) {
      return {
        totalProductPrice: 0,
        deliveryFee: 0,
        finalPrice: 0,
        itemCount: 0,
      };
    }

    let totalProductPrice = 0;
    cart.items.forEach((item) => {
      totalProductPrice +=
        (item.product.price + item.productOption.extra_price) * item.quantity;
    });

    const deliveryFee = totalProductPrice < 100000 ? 3000 : 0;
    return {
      totalProductPrice,
      deliveryFee,
      finalPrice: totalProductPrice + deliveryFee,
      itemCount: cart.items.length,
    };
  }

  // 1. 장바구니 아이템 추가 (안전성 강화 및 타입 에러 해결)
  async addToCart(userId: number, dto: AddToCartDto) {
    const qty = dto.quantity || 1;

    return await this.dataSource.transaction(async (manager) => {
      const productOption = await manager.findOne(ProductOption, {
        where: { id: dto.product_option_id, product: { id: dto.product_id } },
      });

      if (!productOption) {
        throw new NotFoundException(
          '요청하신 상품 또는 옵션을 찾을 수 없습니다.',
        );
      }

      if (productOption.stock_quantity < qty) {
        throw new BadRequestException('해당 옵션의 재고가 부족합니다.');
      }

      // 1) 유저의 장바구니 찾기 (타입: Cart | null)
      let cart = await manager.findOne(Cart, {
        where: { user: { id: userId } },
      });

      if (!cart) {
        try {
          cart = manager.create(Cart, { user: { id: userId } });
          await manager.save(cart);
        } catch (error: unknown) {
          // 💡 [수정 1] any 대신 unknown을 쓰고, 타입 단언으로 안전하게 접근합니다.
          const dbError = error as { code?: string };

          if (dbError.code === '23505') {
            cart = await manager.findOne(Cart, {
              where: { user: { id: userId } },
            });
          } else {
            throw error;
          }
        }
      }

      // 💡 [수정 2] TypeScript의 걱정을 덜어주는 '타입 가드(Type Guard)'
      // 이 시점에도 cart가 없다면 서버 에러로 간주하여 실행을 멈춥니다.
      // 이 코드를 통과하면 TypeScript는 "아, 이제 cart는 절대 null이 아니구나!" 라고 안심합니다.
      if (!cart) {
        throw new InternalServerErrorException(
          '장바구니를 생성하거나 확인할 수 없습니다.',
        );
      }

      // 2) 장바구니에 동일한 상품+옵션이 있는지 확인 (이제 cart.id 사용 가능)
      let cartItem = await manager.findOne(CartItem, {
        where: {
          cart: { id: cart.id },
          productOption: { id: dto.product_option_id },
        },
      });

      // 3) 있으면 수량 증가, 없으면 새로 생성
      if (cartItem) {
        cartItem.quantity += qty;
        await manager.save(cartItem);
      } else {
        cartItem = manager.create(CartItem, {
          cart: { id: cart.id },
          product: { id: dto.product_id },
          productOption: { id: dto.product_option_id },
          quantity: qty,
        });
        await manager.save(cartItem);
      }

      return { message: '장바구니에 성공적으로 담겼습니다.' };
    });
  }

  // 2. 장바구니 목록 조회
  async getCart(userId: number) {
    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: [
        'items',
        'items.product',
        'items.product.images',
        'items.productOption',
      ],
      order: { items: { created_at: 'DESC' } },
    });

    if (!cart || !cart.items.length) {
      return { cartItems: [], totals: await this.getCartTotals(userId) };
    }

    const formattedCartItems = cart.items.map((item) => {
      const unitPrice = item.product.price + item.productOption.extra_price;
      const totalPrice = unitPrice * item.quantity;

      const thumbnail = item.product.images?.find((img) => img.is_thumbnail);

      return {
        item_id: item.id,
        quantity: item.quantity,
        product_id: item.product.id,
        product_name: item.product.name,
        base_price: item.product.price,
        option_name: item.productOption.option_name,
        extra_price: item.productOption.extra_price,
        image_url: thumbnail ? thumbnail.image_url : null,
        total_price: totalPrice,
      };
    });

    return {
      cartItems: formattedCartItems,
      totals: await this.getCartTotals(userId),
    };
  }

  // 3. 수량 변경 (재고 검증 로직 추가)
  async updateCartItem(userId: number, itemId: number, dto: UpdateCartItemDto) {
    const cartItem = await this.cartItemRepository.findOne({
      where: { id: itemId, cart: { user: { id: userId } } },
      // 💡 [핵심] 현재 잔여 재고를 확인하기 위해 productOption을 반드시 조인(JOIN)하여 가져와야 합니다.
      relations: ['product', 'productOption'],
    });

    if (!cartItem)
      throw new NotFoundException('장바구니 항목을 찾을 수 없습니다.');

    // 💡 [이슈 1 해결] 변경하려는 수량이 옵션의 실제 재고보다 많은지 검사하는 방어 로직 추가
    if (cartItem.productOption.stock_quantity < dto.quantity) {
      throw new BadRequestException(
        `재고가 부족합니다. (잔여 재고: ${cartItem.productOption.stock_quantity}개)`,
      );
    }

    cartItem.quantity = dto.quantity;
    await this.cartItemRepository.save(cartItem);

    const itemTotalPrice =
      (cartItem.product.price + cartItem.productOption.extra_price) *
      dto.quantity;
    const totals = await this.getCartTotals(userId);

    return { message: '수량이 변경되었습니다.', itemTotalPrice, totals };
  }

  // 4. 아이템 삭제
  async deleteCartItem(userId: number, itemId: number) {
    const cartItem = await this.cartItemRepository.findOne({
      where: { id: itemId, cart: { user: { id: userId } } },
    });

    if (!cartItem) throw new NotFoundException('삭제할 항목이 없습니다.');

    await this.cartItemRepository.remove(cartItem);
    const totals = await this.getCartTotals(userId);

    return { message: '삭제되었습니다.', totals };
  }
}
