// src/cart/cart.service.spec.ts

// 💡 1. TS가 인식하지 못하던 전역 함수들을 명시적으로 불러옵니다.
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { DataSource, Repository } from 'typeorm'; // 💡 Repository 타입 추가

describe('CartService - 최종 금액 산정 로직 (#129)', () => {
  let service: CartService;

  // 💡 2. 'any' 대신 정확한 Repository<Cart> 타입을 지정합니다.
  let cartRepository: Repository<Cart>;

  const mockCartRepository = {
    findOne: jest.fn(),
  };
  const mockCartItemRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };
  const mockDataSource = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: getRepositoryToken(Cart), useValue: mockCartRepository },
        {
          provide: getRepositoryToken(CartItem),
          useValue: mockCartItemRepository,
        },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    // 제네릭을 사용하여 완벽한 타입 캐스팅
    cartRepository = module.get<Repository<Cart>>(getRepositoryToken(Cart));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCartTotals', () => {
    const userId = 1;

    it('시나리오 1: 장바구니가 없거나 비어있으면 모든 금액은 0원이어야 한다', async () => {
      // 💡 3. Unsafe 에러 해결: 직접 .mockResolvedValue에 접근하지 않고 spyOn을 사용
      jest.spyOn(cartRepository, 'findOne').mockResolvedValue(null);

      const result = await service['getCartTotals'](userId);

      expect(result).toEqual({
        totalProductPrice: 0,
        deliveryFee: 0,
        finalPrice: 0,
        itemCount: 0,
      });
    });

    it('시나리오 2: 총 상품 금액이 100,000원 미만이면 배송비 3,000원이 부과되어야 한다', async () => {
      const mockCart = {
        items: [
          {
            quantity: 2,
            product: { price: 30000 },
            productOption: { extra_price: 0 },
          },
        ],
      };

      // 💡 4. as unknown as Cart: 부분 객체를 반환할 때 발생하는 엄격한 타입 에러 우회
      jest
        .spyOn(cartRepository, 'findOne')
        .mockResolvedValue(mockCart as unknown as Cart);

      const result = await service['getCartTotals'](userId);

      expect(result.totalProductPrice).toBe(60000);
      expect(result.deliveryFee).toBe(3000);
      expect(result.finalPrice).toBe(63000);
      expect(result.itemCount).toBe(1);
    });

    it('시나리오 3: 총 상품 금액이 100,000원 이상이면 배송비는 무료(0원)이어야 한다', async () => {
      const mockCart = {
        items: [
          {
            quantity: 1,
            product: { price: 80000 },
            productOption: { extra_price: 20000 },
          },
          {
            quantity: 1,
            product: { price: 50000 },
            productOption: { extra_price: 0 },
          },
        ],
      };
      jest
        .spyOn(cartRepository, 'findOne')
        .mockResolvedValue(mockCart as unknown as Cart);

      const result = await service['getCartTotals'](userId);

      expect(result.totalProductPrice).toBe(150000);
      expect(result.deliveryFee).toBe(0);
      expect(result.finalPrice).toBe(150000);
      expect(result.itemCount).toBe(2);
    });
  });
});
