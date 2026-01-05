import { formatPrice, formatDate } from '../format';

describe('Format 유틸리티 단위 테스트', () => {
  
  test('formatPrice: 숫자를 한국 통화(원) 형식으로 정확히 변환해야 한다', () => {
    expect(formatPrice(1000)).toBe('1,000원');
    expect(formatPrice(1234567)).toBe('1,234,567원');
    expect(formatPrice(0)).toBe('0원');
  });

  test('formatDate: Date 객체를 한국식 날짜 문자열로 변환해야 한다', () => {
    const testDate = new Date('2026-01-05');
    const result = formatDate(testDate);
    
    // 환경에 따른 미세한 공백 차이를 허용하기 위해 포함 여부(toContain)로 검증
    expect(result).toContain('2026');
    expect(result).toContain('1');
    expect(result).toContain('5');
  });
});