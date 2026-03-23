// S3 파일 정보 (multer-s3 사용 시 location 필드가 추가됨)
export interface S3File extends Express.Multer.File {
    location: string;
}

// 상품 등록/수정 요청 바디
export interface ProductRequest {
    name: string;
    price: number;
    description: string;
    category: string;
    status?: 'ON_SALE' | 'SOLD_OUT';
    // 옵션들은 1개일 때 string, 여러 개일 때 string[]으로 들어옴
    option_name?: string | string[];
    extra_price?: string | string[];
    stock_quantity?: string | string[];
}