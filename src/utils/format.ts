// 가격 포맷팅 함수 (숫자를 받아 콤마가 포함된 문자열 반환)
export const formatPrice = (price: number): string => {
  return price.toLocaleString('ko-KR') + '원';
};

// 날짜 포맷팅 함수
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('ko-KR').format(date);
};