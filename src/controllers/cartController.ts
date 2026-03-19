// src/controllers/cartController.ts
import { Request, Response } from 'express';
import { AppDataSource } from '../config/db';
import { Cart } from '../entities/Cart';
import { CartItem } from '../entities/CartItem';
import { Product } from '../entities/Product';
import { ProductOption } from '../entities/ProductOption';

// 레포지토리 초기화
const cartRepository = AppDataSource.getRepository(Cart);
const cartItemRepository = AppDataSource.getRepository(CartItem);

// [공통 헬퍼 함수] 장바구니 총액 계산 로직 (Raw SQL -> TypeORM 변환)
const getCartTotals = async (userId: number) => {
    const cart = await cartRepository.findOne({
        where: { user: { id: userId } },
        relations: ['items', 'items.product', 'items.productOption']
    });

    if (!cart || !cart.items.length) {
        return { totalProductPrice: 0, deliveryFee: 0, finalPrice: 0, itemCount: 0 };
    }

    let totalProductPrice = 0;
    cart.items.forEach(item => {
        totalProductPrice += (item.product.price + item.productOption.extra_price) * item.quantity;
    });

    const deliveryFee = totalProductPrice < 100000 ? 3000 : 0;
    return { 
        totalProductPrice, 
        deliveryFee, 
        finalPrice: totalProductPrice + deliveryFee, 
        itemCount: cart.items.length 
    };
};

// 1. 장바구니에 아이템 추가 (TypeORM 트랜잭션 적용)
export const addToCart = async (req: Request, res: Response) => {
    const userId = req.user!.id as number;
    const { product_id, product_option_id, quantity } = req.body;
    const qty = parseInt(quantity as string) || 1;

    try {
        // 콜백 함수 내부에서 에러 발생 시 자동 ROLLBACK, 성공 시 자동 COMMIT 됩니다.
        await AppDataSource.transaction(async (transactionalEntityManager) => {
            // 1) 유저의 장바구니 찾기 (없으면 생성)
            let cart = await transactionalEntityManager.findOne(Cart, { 
                where: { user: { id: userId } } 
            });

            if (!cart) {
                cart = transactionalEntityManager.create(Cart, { user: { id: userId } });
                await transactionalEntityManager.save(cart);
            }

            // 2) 장바구니에 동일한 상품+옵션이 있는지 확인
            let cartItem = await transactionalEntityManager.findOne(CartItem, {
                where: { 
                    cart: { id: cart.id }, 
                    productOption: { id: product_option_id } 
                }
            });

            // 3) 있으면 수량 증가, 없으면 새로 생성
            if (cartItem) {
                cartItem.quantity += qty;
                await transactionalEntityManager.save(cartItem);
            } else {
                cartItem = transactionalEntityManager.create(CartItem, {
                    cart: { id: cart.id },
                    product: { id: product_id },
                    productOption: { id: product_option_id },
                    quantity: qty
                });
                await transactionalEntityManager.save(cartItem);
            }
        });

        res.redirect('/cart'); 
    } catch (error) {
        console.error('장바구니 담기 실패:', error);
        res.status(500).send('장바구니 담기 실패');
    }
};

// 2. 장바구니 페이지 조회
export const getCartPage = async (req: Request, res: Response) => {
    const userId = req.user!.id as number;

    try {
        const cart = await cartRepository.findOne({
            where: { user: { id: userId } },
            relations: [
                'items', 
                'items.product', 
                'items.product.images', 
                'items.productOption'
            ],
            order: { items: { created_at: 'DESC' } }
        });

        // 장바구니가 비어있을 경우 예외 처리
        if (!cart || !cart.items.length) {
            return res.render('cart/list', { 
                title: 'My Cart', cartItems: [], totalProductPrice: 0, deliveryFee: 0, finalPrice: 0 
            });
        }

        let totalProductPrice = 0;

        // 기존 EJS 템플릿(CartItemView) 구조와 동일하게 데이터 포맷팅
        const formattedCartItems = cart.items.map(item => {
            const unitPrice = item.product.price + item.productOption.extra_price;
            const totalPrice = unitPrice * item.quantity;
            totalProductPrice += totalPrice;

            const thumbnail = item.product.images?.find(img => img.is_thumbnail);

            return {
                item_id: item.id,
                quantity: item.quantity,
                product_id: item.product.id,
                product_name: item.product.name,
                base_price: item.product.price,
                option_name: item.productOption.option_name,
                extra_price: item.productOption.extra_price,
                image_url: thumbnail ? thumbnail.image_url : null,
                total_price: totalPrice
            };
        });

        const deliveryFee = totalProductPrice < 100000 ? 3000 : 0;
        const finalPrice = totalProductPrice + deliveryFee;

        res.render('cart/list', { 
            title: 'My Cart', 
            cartItems: formattedCartItems, 
            totalProductPrice, 
            deliveryFee, 
            finalPrice 
        });
    } catch (error) {
        console.error('장바구니 조회 오류:', error);
        res.status(500).send('장바구니를 불러오지 못했습니다.');
    }
};

// 3. 수량 변경 (PATCH API)
export const updateCartItem = async (req: Request, res: Response) => {
    const userId = req.user!.id as number;
    const itemId = parseInt(req.params.itemId);
    const { quantity } = req.body;

    if (quantity < 1) return res.status(400).json({ message: '수량 오류' });

    try {
        // 아이템 찾기 (내 장바구니의 아이템이 맞는지 검증)
        const cartItem = await cartItemRepository.findOne({
            where: { id: itemId, cart: { user: { id: userId } } },
            relations: ['product', 'productOption']
        });

        if (!cartItem) throw new Error('NOT_FOUND');

        // 수량 업데이트
        cartItem.quantity = quantity;
        await cartItemRepository.save(cartItem);

        // 변경된 가격 계산 및 총액 다시 불러오기
        const itemTotalPrice = (cartItem.product.price + cartItem.productOption.extra_price) * quantity;
        const totals = await getCartTotals(userId);

        res.json({ message: '수정됨', itemTotalPrice, ...totals });
    } catch (error) {
        console.error('수량 변경 오류:', error);
        res.status(500).json({ message: '서버 오류' });
    }
};

// 4. 장바구니 삭제 (DELETE API)
export const deleteCartItem = async (req: Request, res: Response) => {
    const userId = req.user!.id as number;
    const itemId = parseInt(req.params.itemId);

    try {
        // 삭제 (내 장바구니에 속한 아이템일 때만 삭제됨)
        const cartItem = await cartItemRepository.findOne({
            where: { id: itemId, cart: { user: { id: userId } } }
        });

        if (!cartItem) return res.status(404).json({ message: '항목 없음' });

        await cartItemRepository.remove(cartItem);

        const totals = await getCartTotals(userId);
        res.json({ message: '삭제됨', ...totals });
    } catch (error) {
        console.error('삭제 오류:', error);
        res.status(500).json({ message: '서버 오류' });
    }
};