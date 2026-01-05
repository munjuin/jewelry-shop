// const db = require('../config/db');
import db from '../config/db.js';

// 홈 페이지를 렌더링하는 함수를 async로 변경
exports.getHomePage = async (req, res) => { // 2. async 키워드 추가
    const pageTitle = "Jewelry Mall - Best Items";

    let dbTimeResult;
    try {
        // 3. Model 함수를 사용하여 DB 쿼리 실행 (await 사용)
        // 'SELECT NOW()' 쿼리를 실행하여 현재 DB 시간을 가져옵니다.
        const result = await db.query('SELECT NOW()');

        // 4. DB 쿼리 결과를 콘솔에 출력! (사용자 요청 사항)
        dbTimeResult = result.rows[0].now;
        console.log('📢 DB에서 가져온 현재 시간 (Controller 로그):', dbTimeResult);

    } catch (error) {
        console.error('⚠️ DB 쿼리 실행 중 오류 발생:', error);
        // 에러가 나더라도 서버가 멈추지 않도록 기본값 설정
        dbTimeResult = 'DB connection error';
    }

    // 뷰 렌더링 시 DB 결과를 함께 전달하여 뷰에서도 확인 가능하도록 처리
    res.render('index', { 
        title: pageTitle,
        dbTime: dbTimeResult, // DB 쿼리 결과를 뷰에 전달
        user: req.user // 뷰에서 사용자 정보 접근 가능하도록 전달
        
    });
};