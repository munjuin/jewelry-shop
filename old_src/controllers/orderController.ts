// src/controllers/orderController.ts
import { Request, Response } from 'express';
import { AppDataSource } from '../config/db';
import { Order } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { Cart } from '../entities/Cart';
import { CartItem } from '../entities/CartItem';
import { ProductOption } from '../entities/ProductOption';

// 레포지토리 초기화
const orderRepository = AppDataSource.getRepository(Order);

// 1. 주문서 작성 페이지
export const getCheckoutPage = async (req: Request, res: Response) => {
    const userId = req.user!.id as number;

    try {
        const cart = await AppDataSource.getRepository(Cart).findOne({
            where: { user: { id: userId } },
            relations: ['items', 'items.product', 'items.productOption']
        });

        if (!cart || cart.items.length === 0) {
            return res.send('<script>alert("장바구니가 비어있습니다."); location.href="/products";</script>');
        }

        let totalProductPrice = 0;
        
        // 기존 EJS 템플릿 호환성을 위한 데이터 매핑
        const cartItems = cart.items.map(item => {
            totalProductPrice += (item.product.price + item.productOption.extra_price) * item.quantity;
            return {
                quantity: item.quantity,
                product_name: item.product.name,
                base_price: item.product.price,
                option_name: item.productOption.option_name,
                extra_price: item.productOption.extra_price
            };
        });

        const deliveryFee = (totalProductPrice < 100000) ? 3000 : 0;
        const finalPrice = totalProductPrice + deliveryFee;

        res.render('orders/checkout', {
            title: '주문서 작성',
            cartItems,
            totalProductPrice,
            deliveryFee,
            finalPrice
        });
    } catch (error) {
        console.error('주문 페이지 오류:', error);
        res.status(500).send('오류가 발생했습니다.');
    }
};

// 2. 주문 생성 (🔥 완벽하게 캡슐화된 TypeORM 트랜잭션)
export const createOrder = async (req: Request, res: Response) => {
    const userId = req.user!.id as number;
    const { receiver_name, receiver_phone, zipcode, address, detail_address } = req.body;

    try {
        let createdOrderId: number;

        // 트랜잭션 블록 시작: 이 안에서 에러가 발생하면 모든 것이 자동 ROLLBACK 됩니다.
        await AppDataSource.transaction(async (manager) => {
            const cart = await manager.findOne(Cart, {
                where: { user: { id: userId } },
                relations: ['items', 'items.product', 'items.productOption']
            });

            if (!cart || cart.items.length === 0) {
                throw new Error('EMPTY_CART');
            }

            // 재고 검증 및 총액 계산
            let totalAmount = 0;
            for (const item of cart.items) {
                if (item.productOption.stock_quantity < item.quantity) {
                    // 재고가 부족하면 즉시 커스텀 에러를 던져 트랜잭션을 파기합니다.
                    throw new Error(`STOCK_SHORTAGE|${item.productOption.option_name}`);
                }
                totalAmount += (item.product.price + item.productOption.extra_price) * item.quantity;
            }

            const deliveryFee = (totalAmount < 100000) ? 3000 : 0;
            const finalAmount = totalAmount + deliveryFee;

            // 1) 주문 생성
            const order = manager.create(Order, {
                user: { id: userId },
                total_amount: totalAmount,
                delivery_fee: deliveryFee,
                final_amount: finalAmount,
                receiver_name,
                receiver_phone,
                zipcode,
                address,
                detail_address,
                status: 'PAID'
            });
            await manager.save(order);
            createdOrderId = order.id;

            // 2) 주문 상세 내역 저장 및 재고 차감 처리
            for (const item of cart.items) {
                const priceSnapshot = item.product.price + item.productOption.extra_price;

                // 스냅샷 저장
                const orderItem = manager.create(OrderItem, {
                    order: { id: order.id },
                    product: { id: item.product.id },
                    option_snapshot: item.productOption.option_name,
                    quantity: item.quantity,
                    price_snapshot: priceSnapshot
                });
                await manager.save(orderItem);

                // 재고 차감
                item.productOption.stock_quantity -= item.quantity;
                await manager.save(item.productOption);
            }

            // 3) 장바구니 비우기
            await manager.remove(CartItem, cart.items);
        });

        // 트랜잭션이 성공적으로 끝나면 COMMIT 완료 상태
        res.redirect(`/orders/complete?id=${createdOrderId!}`);

    } catch (error: any) {
        console.error('주문 생성 트랜잭션 오류:', error);
        
        // 에러 메세지에 따른 맞춤형 사용자 응답 분기 처리
        if (error.message === 'EMPTY_CART') {
            return res.send('<script>alert("장바구니가 비어있습니다."); location.href="/products";</script>');
        }
        if (error.message.startsWith('STOCK_SHORTAGE')) {
            const optionName = error.message.split('|')[1];
            return res.send(`<script>alert("재고가 부족합니다: ${optionName}"); history.back();</script>`);
        }
        
        res.status(500).send('<script>alert("주문 처리 중 오류가 발생했습니다."); history.back();</script>');
    }
};

// 3. 주문 내역 조회
export const getOrderList = async (req: Request, res: Response) => {
    const userId = req.user!.id as number;
    try {
        const orders = await orderRepository.find({
            where: { user: { id: userId } },
            order: { created_at: 'DESC' }
        });
        res.render('users/mypage-orders', { title: '주문 내역', orders });
    } catch (error) {
        res.status(500).send('오류가 발생했습니다.');
    }
};

// 4. 주문 취소 로직 (🔥 TypeORM 트랜잭션)
export const cancelOrder = async (req: Request, res: Response) => {
    const userId = req.user!.id as number;
    const orderId = parseInt(req.params.id);

    try {
        await AppDataSource.transaction(async (manager) => {
            const order = await manager.findOne(Order, {
                where: { id: orderId, user: { id: userId } },
                relations: ['items', 'items.product']
            });

            if (!order) throw new Error('NOT_FOUND');
            if (order.status === 'CANCELLED') throw new Error('ALREADY_CANCELLED');

            // 1) 상태 변경
            order.status = 'CANCELLED';
            await manager.save(order);

            // 2) 재고 복구 (결제 시점의 option_snapshot을 바탕으로 실제 옵션을 찾아 복구)
            for (const item of order.items) {
                // 상품과 옵션명을 기준으로 원본 ProductOption 엔티티를 찾습니다.
                const option = await manager.findOne(ProductOption, {
                    where: { 
                        product: { id: item.product.id }, 
                        option_name: item.option_snapshot 
                    }
                });

                if (option) {
                    option.stock_quantity += item.quantity;
                    await manager.save(option);
                }
            }
        });

        res.redirect('/mypage/orders');
    } catch (error) {
        console.error('주문 취소 트랜잭션 오류:', error);
        res.status(500).send('주문 취소에 실패했습니다.');
    }
};

// 5. 주문 완료 페이지
export const getOrderComplete = (req: Request, res: Response) => {
    res.render('orders/complete', { orderId: req.query.id });
};