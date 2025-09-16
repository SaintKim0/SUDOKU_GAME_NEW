/**
 * 사용자 행동 분석 시스템
 * 상세한 사용자 행동 패턴 분석 및 인사이트 제공
 */

class UserAnalytics {
    constructor() {
        this.sessionData = {
            startTime: Date.now(),
            actions: [],
            gameSessions: [],
            currentSession: null
        };
        
        this.behaviorPatterns = {
            playStyle: 'balanced', // aggressive, balanced, cautious
            timePattern: 'evening', // morning, afternoon, evening, night
            difficultyPreference: 'adaptive',
            hintUsagePattern: 'moderate',
            errorRecoveryPattern: 'quick'
        };
        
        this.insights = {
            strengths: [],
            weaknesses: [],
            recommendations: [],
            trends: []
        };
        
        this.initializeAnalytics();
    }

    /**
     * 분석 시스템 초기화
     */
    initializeAnalytics() {
        try {
            const savedData = localStorage.getItem('sudoku_user_analytics');
            if (savedData) {
                const data = JSON.parse(savedData);
                this.sessionData = { ...this.sessionData, ...data.sessionData };
                this.behaviorPatterns = { ...this.behaviorPatterns, ...data.behaviorPatterns };
                this.insights = { ...this.insights, ...data.insights };
                console.log('사용자 분석 데이터 로드됨:', data);
            }
        } catch (error) {
            console.error('분석 데이터 로드 실패:', error);
        }
    }

    /**
     * 게임 세션 시작
     */
    startGameSession(difficulty) {
        this.sessionData.currentSession = {
            id: Date.now(),
            startTime: Date.now(),
            difficulty: difficulty,
            actions: [],
            errors: [],
            hints: [],
            undoActions: [],
            timeSpent: 0,
            completionStatus: 'ongoing'
        };
        
        this.recordAction('game_start', { difficulty });
    }

    /**
     * 게임 세션 종료
     */
    endGameSession(completionData) {
        if (!this.sessionData.currentSession) return;
        
        const session = this.sessionData.currentSession;
        session.endTime = Date.now();
        session.timeSpent = session.endTime - session.startTime;
        session.completionStatus = completionData.completed ? 'completed' : 'abandoned';
        session.completionTime = completionData.completionTime;
        session.errors = completionData.errors || 0;
        session.hintsUsed = completionData.hintsUsed || 0;
        
        this.sessionData.gameSessions.push(session);
        this.recordAction('game_end', completionData);
        
        // 세션 분석
        this.analyzeSession(session);
        
        // 데이터 저장
        this.saveAnalyticsData();
        
        this.sessionData.currentSession = null;
    }

    /**
     * 사용자 행동 기록
     */
    recordAction(actionType, data = {}) {
        const action = {
            timestamp: Date.now(),
            type: actionType,
            data: data,
            sessionId: this.sessionData.currentSession?.id
        };
        
        this.sessionData.actions.push(action);
        
        if (this.sessionData.currentSession) {
            this.sessionData.currentSession.actions.push(action);
        }
        
        // 실시간 패턴 분석
        this.updateBehaviorPatterns(action);
    }

    /**
     * 셀 입력 기록
     */
    recordCellInput(row, col, value, isValid) {
        this.recordAction('cell_input', {
            position: { row, col },
            value: value,
            isValid: isValid,
            timestamp: Date.now()
        });
    }

    /**
     * 힌트 사용 기록
     */
    recordHintUsage(hintType, position, effectiveness) {
        this.recordAction('hint_used', {
            hintType: hintType,
            position: position,
            effectiveness: effectiveness,
            timestamp: Date.now()
        });
        
        if (this.sessionData.currentSession) {
            this.sessionData.currentSession.hints.push({
                type: hintType,
                position: position,
                effectiveness: effectiveness,
                timestamp: Date.now()
            });
        }
    }

    /**
     * 오류 기록
     */
    recordError(row, col, attemptedValue, correctValue) {
        this.recordAction('error', {
            position: { row, col },
            attemptedValue: attemptedValue,
            correctValue: correctValue,
            timestamp: Date.now()
        });
        
        if (this.sessionData.currentSession) {
            this.sessionData.currentSession.errors.push({
                position: { row, col },
                attemptedValue: attemptedValue,
                correctValue: correctValue,
                timestamp: Date.now()
            });
        }
    }

    /**
     * 되돌리기 기록
     */
    recordUndo(actionType, position) {
        this.recordAction('undo', {
            actionType: actionType,
            position: position,
            timestamp: Date.now()
        });
        
        if (this.sessionData.currentSession) {
            this.sessionData.currentSession.undoActions.push({
                actionType: actionType,
                position: position,
                timestamp: Date.now()
            });
        }
    }

    /**
     * 행동 패턴 업데이트
     */
    updateBehaviorPatterns(action) {
        switch (action.type) {
            case 'cell_input':
                this.analyzePlayStyle(action);
                break;
            case 'hint_used':
                this.analyzeHintUsagePattern(action);
                break;
            case 'error':
                this.analyzeErrorPattern(action);
                break;
            case 'undo':
                this.analyzeUndoPattern(action);
                break;
        }
    }

    /**
     * 플레이 스타일 분석
     */
    analyzePlayStyle(action) {
        // 입력 속도 분석
        const recentActions = this.getRecentActions(10, 'cell_input');
        if (recentActions.length >= 5) {
            const avgTimeBetweenInputs = this.calculateAverageTimeBetweenActions(recentActions);
            
            if (avgTimeBetweenInputs < 2000) { // 2초 미만
                this.behaviorPatterns.playStyle = 'aggressive';
            } else if (avgTimeBetweenInputs > 10000) { // 10초 초과
                this.behaviorPatterns.playStyle = 'cautious';
            } else {
                this.behaviorPatterns.playStyle = 'balanced';
            }
        }
    }

    /**
     * 힌트 사용 패턴 분석
     */
    analyzeHintUsagePattern(action) {
        const hintCount = this.sessionData.currentSession?.hints.length || 0;
        const gameProgress = this.calculateGameProgress();
        
        if (hintCount === 0) {
            this.behaviorPatterns.hintUsagePattern = 'none';
        } else if (hintCount <= 2) {
            this.behaviorPatterns.hintUsagePattern = 'minimal';
        } else if (hintCount <= 5) {
            this.behaviorPatterns.hintUsagePattern = 'moderate';
        } else {
            this.behaviorPatterns.hintUsagePattern = 'frequent';
        }
    }

    /**
     * 오류 패턴 분석
     */
    analyzeErrorPattern(action) {
        const errorCount = this.sessionData.currentSession?.errors.length || 0;
        const recentErrors = this.getRecentErrors(5);
        
        if (errorCount === 0) {
            this.behaviorPatterns.errorRecoveryPattern = 'perfect';
        } else if (recentErrors.length <= 2) {
            this.behaviorPatterns.errorRecoveryPattern = 'quick';
        } else {
            this.behaviorPatterns.errorRecoveryPattern = 'slow';
        }
    }

    /**
     * 되돌리기 패턴 분석
     */
    analyzeUndoPattern(action) {
        const undoCount = this.sessionData.currentSession?.undoActions.length || 0;
        
        if (undoCount === 0) {
            this.behaviorPatterns.undoPattern = 'none';
        } else if (undoCount <= 3) {
            this.behaviorPatterns.undoPattern = 'minimal';
        } else {
            this.behaviorPatterns.undoPattern = 'frequent';
        }
    }

    /**
     * 세션 분석
     */
    analyzeSession(session) {
        const analysis = {
            efficiency: this.calculateEfficiency(session),
            consistency: this.calculateConsistency(session),
            learningCurve: this.calculateLearningCurve(session),
            stressLevel: this.calculateStressLevel(session)
        };
        
        this.generateInsights(analysis, session);
        this.updateTrends(session);
    }

    /**
     * 효율성 계산
     */
    calculateEfficiency(session) {
        // 방어적 코드: 속성이 유효한 배열인지 확인
        const actions = Array.isArray(session.actions) ? session.actions : [];
        const errors = Array.isArray(session.errors) ? session.errors : [];
        const hints = Array.isArray(session.hints) ? session.hints : [];
        const undoActions = Array.isArray(session.undoActions) ? session.undoActions : [];
        
        const totalActions = actions.length;
        if (totalActions === 0) return 50; // 기본값
        
        const errorRate = errors.length / totalActions;
        const hintRate = hints.length / totalActions;
        const undoRate = undoActions.length / totalActions;
        
        // 효율성 점수 (0-100)
        const efficiency = Math.max(0, 100 - (errorRate * 40) - (hintRate * 20) - (undoRate * 10));
        
        // NaN 체크
        if (isNaN(efficiency)) return 50;
        
        return Math.round(efficiency);
    }

    /**
     * 일관성 계산
     */
    calculateConsistency(session) {
        if (session.actions.length < 10) return 50;
        
        const timeIntervals = [];
        for (let i = 1; i < session.actions.length; i++) {
            const interval = session.actions[i].timestamp - session.actions[i-1].timestamp;
            timeIntervals.push(interval);
        }
        
        // 표준편차 계산 (간단화)
        const avgInterval = timeIntervals.reduce((a, b) => a + b, 0) / timeIntervals.length;
        const variance = timeIntervals.reduce((acc, interval) => acc + Math.pow(interval - avgInterval, 2), 0) / timeIntervals.length;
        const stdDev = Math.sqrt(variance);
        
        // 일관성 점수 (표준편차가 낮을수록 높은 점수)
        const consistency = Math.max(0, 100 - (stdDev / avgInterval * 100));
        return Math.round(consistency);
    }

    /**
     * 학습 곡선 계산
     */
    calculateLearningCurve(session) {
        if (session.actions.length < 20) return 50;
        
        const firstHalf = session.actions.slice(0, Math.floor(session.actions.length / 2));
        const secondHalf = session.actions.slice(Math.floor(session.actions.length / 2));
        
        const firstHalfErrors = firstHalf.filter(a => a.type === 'error').length;
        const secondHalfErrors = secondHalf.filter(a => a.type === 'error').length;
        
        const errorReduction = (firstHalfErrors - secondHalfErrors) / firstHalfErrors * 100;
        return Math.round(Math.max(0, Math.min(100, errorReduction + 50)));
    }

    /**
     * 스트레스 레벨 계산
     */
    calculateStressLevel(session) {
        // 방어적 코드: 속성이 유효한 배열인지 확인
        const errors = Array.isArray(session.errors) ? session.errors : [];
        const undoActions = Array.isArray(session.undoActions) ? session.undoActions : [];
        const hints = Array.isArray(session.hints) ? session.hints : [];
        const actions = Array.isArray(session.actions) ? session.actions : [];
        
        const errorCount = errors.length;
        const undoCount = undoActions.length;
        const hintCount = hints.length;
        const totalActions = actions.length;
        
        if (totalActions === 0) return 30; // 기본값
        
        // 스트레스 지표들
        const stressIndicators = {
            errorFrequency: errorCount / totalActions * 100,
            undoFrequency: undoCount / totalActions * 100,
            hintDependency: hintCount / totalActions * 100,
            timePressure: session.timeSpent > this.getAverageGameTime() * 1.5 ? 20 : 0
        };
        
        const totalStress = Object.values(stressIndicators).reduce((a, b) => a + b, 0);
        
        // NaN 체크
        if (isNaN(totalStress)) return 30;
        
        return Math.round(Math.min(100, totalStress));
    }

    /**
     * 인사이트 생성
     */
    generateInsights(analysis, session) {
        this.insights = {
            strengths: [],
            weaknesses: [],
            recommendations: [],
            trends: []
        };
        
        // 강점 분석
        if (analysis.efficiency > 80) {
            this.insights.strengths.push('높은 해결 효율성을 보입니다.');
        }
        if (analysis.consistency > 75) {
            this.insights.strengths.push('일관된 플레이 패턴을 유지합니다.');
        }
        if (analysis.learningCurve > 70) {
            this.insights.strengths.push('빠른 학습 능력을 보입니다.');
        }
        if (this.behaviorPatterns.errorRecoveryPattern === 'quick') {
            this.insights.strengths.push('오류에서 빠르게 회복합니다.');
        }
        
        // 약점 분석
        if (analysis.efficiency < 50) {
            this.insights.weaknesses.push('해결 효율성을 개선할 필요가 있습니다.');
        }
        if (analysis.consistency < 50) {
            this.insights.weaknesses.push('더 일관된 플레이를 연습해보세요.');
        }
        if (analysis.stressLevel > 70) {
            this.insights.weaknesses.push('게임 중 스트레스가 높습니다.');
        }
        if (this.behaviorPatterns.hintUsagePattern === 'frequent') {
            this.insights.weaknesses.push('힌트 의존도가 높습니다.');
        }
        
        // 추천사항 생성
        this.generateRecommendations(analysis);
    }

    /**
     * 추천사항 생성
     */
    generateRecommendations(analysis) {
        if (this.behaviorPatterns.playStyle === 'aggressive') {
            this.insights.recommendations.push('좀 더 신중하게 생각해보세요.');
        } else if (this.behaviorPatterns.playStyle === 'cautious') {
            this.insights.recommendations.push('더 적극적으로 도전해보세요.');
        }
        
        if (this.behaviorPatterns.hintUsagePattern === 'frequent') {
            this.insights.recommendations.push('힌트 사용을 줄이고 스스로 풀어보세요.');
        }
        
        if (analysis.consistency < 50) {
            this.insights.recommendations.push('일정한 시간 간격으로 플레이해보세요.');
        }
        
        if (analysis.stressLevel > 70) {
            this.insights.recommendations.push('편안한 환경에서 플레이해보세요.');
        }
    }

    /**
     * 트렌드 업데이트
     */
    updateTrends(session) {
        const recentSessions = this.sessionData.gameSessions.slice(-10);
        if (recentSessions.length >= 3) {
            const efficiencyTrend = this.calculateTrend(recentSessions, 'efficiency');
            const consistencyTrend = this.calculateTrend(recentSessions, 'consistency');
            
            this.insights.trends = [
                `최근 효율성 ${efficiencyTrend > 0 ? '상승' : '하락'} 추세`,
                `최근 일관성 ${consistencyTrend > 0 ? '상승' : '하락'} 추세`
            ];
        }
    }

    /**
     * 트렌드 계산
     */
    calculateTrend(sessions, metric) {
        if (sessions.length < 3) return 0;
        
        const values = sessions.map(session => {
            switch (metric) {
                case 'efficiency': return this.calculateEfficiency(session);
                case 'consistency': return this.calculateConsistency(session);
                default: return 0;
            }
        });
        
        // 간단한 선형 회귀
        const n = values.length;
        const x = Array.from({length: n}, (_, i) => i);
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = values.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((acc, xi, i) => acc + xi * values[i], 0);
        const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        return slope;
    }

    /**
     * 분석 리포트 생성
     */
    generateReport() {
        const recentSessions = this.sessionData.gameSessions.slice(-10);
        const totalSessions = this.sessionData.gameSessions.length;
        
        return {
            overview: {
                totalSessions: totalSessions,
                averageEfficiency: this.calculateAverageMetric(recentSessions, 'efficiency'),
                averageConsistency: this.calculateAverageMetric(recentSessions, 'consistency'),
                averageLearningCurve: this.calculateAverageMetric(recentSessions, 'learningCurve'),
                averageStressLevel: this.calculateAverageMetric(recentSessions, 'stressLevel')
            },
            behaviorPatterns: this.behaviorPatterns,
            insights: this.insights,
            recommendations: this.getRecommendations(),
            trends: this.insights.trends
        };
    }

    /**
     * 평균 메트릭 계산
     */
    calculateAverageMetric(sessions, metric) {
        if (sessions.length === 0) return 0;
        
        const values = sessions.map(session => {
            switch (metric) {
                case 'efficiency': return this.calculateEfficiency(session);
                case 'consistency': return this.calculateConsistency(session);
                case 'learningCurve': return this.calculateLearningCurve(session);
                case 'stressLevel': return this.calculateStressLevel(session);
                default: return 0;
            }
        });
        
        return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    }

    /**
     * 추천사항 가져오기 (재귀 호출 방지)
     */
    getRecommendations() {
        return this.insights && this.insights.recommendations ? this.insights.recommendations : [];
    }

    /**
     * 개인화된 추천사항 생성
     */
    generatePersonalizedRecommendations() {
        const recommendations = [];
        const recentSessions = this.sessionData.gameSessions.slice(-10);
        
        // 직접 메트릭 계산 (generateReport 호출 없이)
        const averageEfficiency = this.calculateAverageMetric(recentSessions, 'efficiency');
        const averageStressLevel = this.calculateAverageMetric(recentSessions, 'stressLevel');
        
        if (averageEfficiency < 60) {
            recommendations.push('스마트 힌트를 활용하여 해결 전략을 배워보세요.');
        }
        
        if (averageStressLevel > 60) {
            recommendations.push('일일 도전으로 규칙적인 연습을 해보세요.');
        }
        
        if (this.behaviorPatterns.playStyle === 'aggressive') {
            recommendations.push('한 단계 풀이 기능으로 차근차근 해결해보세요.');
        }
        
        return recommendations;
    }

    /**
     * 유틸리티 메서드들
     */
    getRecentActions(count, type = null) {
        const actions = this.sessionData.actions.slice(-count);
        return type ? actions.filter(a => a.type === type) : actions;
    }

    getRecentErrors(count) {
        return this.sessionData.actions
            .filter(a => a.type === 'error')
            .slice(-count);
    }

    calculateAverageTimeBetweenActions(actions) {
        if (actions.length < 2) return 0;
        
        let totalTime = 0;
        for (let i = 1; i < actions.length; i++) {
            totalTime += actions[i].timestamp - actions[i-1].timestamp;
        }
        
        return totalTime / (actions.length - 1);
    }

    calculateGameProgress() {
        // 게임 진행률 계산 (간단화)
        const currentSession = this.sessionData.currentSession;
        if (!currentSession) return 0;
        
        return Math.min(100, (currentSession.actions.length / 50) * 100);
    }

    getAverageGameTime() {
        const completedSessions = this.sessionData.gameSessions.filter(s => s.completionStatus === 'completed');
        if (completedSessions.length === 0) return 600000; // 10분 기본값
        
        const totalTime = completedSessions.reduce((acc, session) => acc + session.timeSpent, 0);
        return totalTime / completedSessions.length;
    }

    /**
     * 데이터 저장
     */
    saveAnalyticsData() {
        try {
            const data = {
                sessionData: this.sessionData,
                behaviorPatterns: this.behaviorPatterns,
                insights: this.insights
            };
            
            // localStorage에 직접 저장
            localStorage.setItem('sudoku_user_analytics', JSON.stringify(data));
            console.log('사용자 분석 데이터 저장됨:', data);
        } catch (error) {
            console.error('분석 데이터 저장 실패:', error);
        }
    }

    /**
     * 데이터 초기화
     */
    resetAnalyticsData() {
        this.sessionData = {
            startTime: Date.now(),
            actions: [],
            gameSessions: [],
            currentSession: null
        };
        
        this.behaviorPatterns = {
            playStyle: 'balanced',
            timePattern: 'evening',
            difficultyPreference: 'adaptive',
            hintUsagePattern: 'moderate',
            errorRecoveryPattern: 'quick'
        };
        
        this.insights = {
            strengths: [],
            weaknesses: [],
            recommendations: [],
            trends: []
        };
        
        this.saveAnalyticsData();
        this.showToast('분석 데이터가 초기화되었습니다.');
    }

    /**
     * 토스트 메시지 표시
     */
    showToast(message) {
        if (window.uiManager && window.uiManager.showToast) {
            window.uiManager.showToast(message);
        } else {
            console.log('Toast:', message);
        }
    }
}

// 전역 사용자 분석 인스턴스
window.userAnalytics = new UserAnalytics();
