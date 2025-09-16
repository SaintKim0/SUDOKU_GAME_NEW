/**
 * 스도쿠 게임 핵심 로직
 * 게임 보드 생성, 검증, 퍼즐 생성 등의 핵심 기능을 담당
 */

class SudokuGame {
    constructor() {
        // 보드 크기 설정 (기본값: 6x6 - 단계별 잠금 시스템)
        this.boardSize = 6;
        this.boxSize = 2; // 6x6은 3x2 박스
        this.maxNumber = 6;
        
        // 보드 크기에 따른 배열 초기화
        this.initializeBoard();
        
        this.difficulty = 'easy';
        this.selectedCell = null;
        this.gameStartTime = null;
        this.gameEndTime = null;
        this.isGameComplete = false;
        this.hintsUsed = 0;
        this.maxHints = 3;
        this.history = [];
        
        // 보드 크기 잠금 시스템
        this.unlockedBoardSizes = this.loadUnlockedBoardSizes();
        
        // 난이도별 잠금 해제 시스템
        this.unlockedDifficulties = this.loadUnlockedDifficulties();
        
        // 게임 보드 DOM 요소
        this.gameBoardElement = null;
        this.numberPadElement = null;
        
        // 이벤트 리스너 바인딩
        this.bindEvents();
    }
    
    /**
     * 보드 크기에 따른 배열 초기화
     */
    initializeBoard() {
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
        this.solution = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
        this.prefilled = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(false));
        this.userInputs = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
    }
    
    /**
     * 잠금 해제된 보드 크기 로드
     */
    loadUnlockedBoardSizes() {
        try {
            const saved = localStorage.getItem('sudoku_unlocked_board_sizes');
            if (saved) {
                const unlocked = JSON.parse(saved);
                // 6x6은 항상 잠금 해제
                if (!unlocked.includes(6)) {
                    unlocked.push(6);
                }
                return unlocked;
            }
        } catch (error) {
            console.error('잠금 해제 상태 로드 실패:', error);
        }
        // 기본값: 6x6만 잠금 해제
        return [6];
    }
    
    /**
     * 잠금 해제된 난이도 로드
     */
    loadUnlockedDifficulties() {
        try {
            const saved = localStorage.getItem('sudoku_unlocked_difficulties');
            if (saved) {
                const unlocked = JSON.parse(saved);
                // 6x6 쉬움은 항상 잠금 해제
                if (!unlocked['6-easy']) {
                    unlocked['6-easy'] = true;
                }
                return unlocked;
            }
        } catch (error) {
            console.error('난이도 잠금 해제 상태 로드 실패:', error);
        }
        // 기본값: 6x6 쉬움만 잠금 해제
        return { '6-easy': true };
    }
    
    /**
     * 잠금 해제된 보드 크기 저장
     */
    saveUnlockedBoardSizes() {
        try {
            localStorage.setItem('sudoku_unlocked_board_sizes', JSON.stringify(this.unlockedBoardSizes));
        } catch (error) {
            console.error('잠금 해제 상태 저장 실패:', error);
        }
    }
    
    /**
     * 잠금 해제된 난이도 저장
     */
    saveUnlockedDifficulties() {
        try {
            localStorage.setItem('sudoku_unlocked_difficulties', JSON.stringify(this.unlockedDifficulties));
        } catch (error) {
            console.error('난이도 잠금 해제 상태 저장 실패:', error);
        }
    }
    
    /**
     * 난이도가 잠금 해제되었는지 확인
     */
    isDifficultyUnlocked(boardSize, difficulty) {
        const key = `${boardSize}-${difficulty}`;
        return this.unlockedDifficulties[key] === true;
    }
    
    /**
     * 난이도 잠금 해제
     */
    unlockDifficulty(boardSize, difficulty) {
        const key = `${boardSize}-${difficulty}`;
        if (!this.unlockedDifficulties[key]) {
            this.unlockedDifficulties[key] = true;
            this.saveUnlockedDifficulties();
            console.log(`난이도 ${boardSize}x${boardSize} ${difficulty} 잠금 해제됨!`);
            return true;
        }
        return false;
    }
    
    /**
     * 보드 크기가 잠금 해제되었는지 확인
     */
    isBoardSizeUnlocked(size) {
        return this.unlockedBoardSizes.includes(size);
    }
    
    /**
     * 보드 크기 잠금 해제
     */
    unlockBoardSize(size) {
        if (!this.unlockedBoardSizes.includes(size)) {
            this.unlockedBoardSizes.push(size);
            this.saveUnlockedBoardSizes();
            console.log(`보드 크기 ${size}x${size} 잠금 해제됨!`);
            return true;
        }
        return false;
    }
    
    /**
     * 다음 단계 난이도/보드 크기 잠금 해제
     */
    unlockNextStage() {
        const currentKey = `${this.boardSize}-${this.difficulty}`;
        let unlocked = false;
        let message = '';
        
        // 현재 난이도에 따라 다음 단계 결정
        if (this.difficulty === 'easy') {
            // 쉬움 → 보통
            if (this.unlockDifficulty(this.boardSize, 'medium')) {
                message = `축하합니다! ${this.boardSize}x${this.boardSize} 보통 난이도가 잠금 해제되었습니다!`;
                unlocked = true;
            }
        } else if (this.difficulty === 'medium') {
            // 보통 → 어려움
            if (this.unlockDifficulty(this.boardSize, 'hard')) {
                message = `축하합니다! ${this.boardSize}x${this.boardSize} 어려움 난이도가 잠금 해제되었습니다!`;
                unlocked = true;
            }
        } else if (this.difficulty === 'hard') {
            // 어려움 완료 → 다음 보드 크기 쉬움
            let nextSize = null;
            if (this.boardSize === 6) {
                nextSize = 9;
            } else if (this.boardSize === 9) {
                nextSize = 12;
            }
            
            if (nextSize && this.unlockBoardSize(nextSize) && this.unlockDifficulty(nextSize, 'easy')) {
                message = `🎉 축하합니다! ${nextSize}x${nextSize} 모드가 잠금 해제되었습니다!`;
                unlocked = true;
                
                // 모드 완료 보상
                this.giveModeCompletionReward(this.boardSize);
            }
        }
        
        if (unlocked) {
            // 잠금 해제 알림 표시
            this.showUnlockNotification(message);
            // UI 업데이트
            this.updateBoardSizeButtons();
            this.updateDifficultyButtons();
            
            // 전체 완료 체크
            this.checkFullCompletion();
        }
    }
    
    /**
     * 잠금 해제 알림 표시
     */
    showUnlockNotification(message) {
        if (window.uiManager) {
            window.uiManager.showToast(message, 'success');
        } else {
            alert(message);
        }
    }
    
    /**
     * 모드 완료 보상 지급
     */
    giveModeCompletionReward(boardSize) {
        const rewards = {
            6: { points: 100, message: '6x6 모드 완료! 100 포인트 획득!' },
            9: { points: 200, message: '9x9 모드 완료! 200 포인트 획득!' },
            12: { points: 300, message: '12x12 모드 완료! 300 포인트 획득!' }
        };
        
        const reward = rewards[boardSize];
        if (reward && window.shopSystem) {
            window.shopSystem.points += reward.points;
            this.showUnlockNotification(reward.message);
        }
    }
    
    /**
     * 전체 완료 체크
     */
    checkFullCompletion() {
        const allModes = ['6-easy', '6-medium', '6-hard', '9-easy', '9-medium', '9-hard', '12-easy', '12-medium', '12-hard'];
        const completedModes = allModes.filter(mode => this.unlockedDifficulties[mode]);
        
        if (completedModes.length === allModes.length) {
            // 전체 완료 보상
            this.giveFullCompletionReward();
        }
    }
    
    /**
     * 전체 완료 보상 지급
     */
    giveFullCompletionReward() {
        if (window.shopSystem) {
            window.shopSystem.points += 1000;
            this.showUnlockNotification('🎊 축하합니다! 모든 모드를 완료했습니다! 1000 포인트 보너스 획득!');
        }
    }
    
    /**
     * 난이도 버튼 UI 업데이트
     */
    updateDifficultyButtons() {
        const buttons = document.querySelectorAll('.difficulty-btn');
        buttons.forEach(button => {
            const difficulty = button.dataset.difficulty;
            const isUnlocked = this.isDifficultyUnlocked(this.boardSize, difficulty);
            
            if (isUnlocked) {
                button.classList.remove('locked');
                button.disabled = false;
                button.style.cursor = 'pointer';
                // 잠금 아이콘 제거
                const lockIcon = button.querySelector('.lock-icon');
                if (lockIcon) {
                    lockIcon.remove();
                }
            } else {
                button.classList.add('locked');
                button.disabled = true;
                button.style.cursor = 'not-allowed';
                // 잠금 아이콘 추가
                if (!button.querySelector('.lock-icon')) {
                    const lockIcon = document.createElement('span');
                    lockIcon.className = 'lock-icon';
                    lockIcon.textContent = '🔒';
                    button.appendChild(lockIcon);
                }
            }
        });
    }
    
    /**
     * 보드 크기 버튼 UI 업데이트
     */
    updateBoardSizeButtons() {
        const buttons = document.querySelectorAll('.board-size-btn');
        buttons.forEach(button => {
            const size = parseInt(button.dataset.size);
            const isUnlocked = this.isBoardSizeUnlocked(size);
            
            if (isUnlocked) {
                button.classList.remove('locked');
                button.disabled = false;
                button.style.cursor = 'pointer';
                // 잠금 아이콘 제거
                const lockIcon = button.querySelector('.lock-icon');
                if (lockIcon) {
                    lockIcon.remove();
                }
            } else {
                button.classList.add('locked');
                button.disabled = true;
                button.style.cursor = 'not-allowed';
                // 잠금 아이콘 추가
                if (!button.querySelector('.lock-icon')) {
                    const lockIcon = document.createElement('span');
                    lockIcon.className = 'lock-icon';
                    lockIcon.textContent = '🔒';
                    button.appendChild(lockIcon);
                }
            }
        });
    }
    
    /**
     * 보드 크기 설정
     */
    setBoardSize(size) {
        console.log('setBoardSize 호출됨:', size);
        
        if (![6, 9, 12].includes(size)) {
            throw new Error('지원되지 않는 보드 크기입니다. 6, 9, 12만 지원됩니다.');
        }
        
        // 잠금 해제된 보드 크기인지 확인
        if (!this.isBoardSizeUnlocked(size)) {
            console.log(`보드 크기 ${size}x${size}는 아직 잠금 해제되지 않았습니다.`);
            return false;
        }
        
        this.boardSize = size;
        console.log('setBoardSize - boardSize 설정 후:', this.boardSize);
        
        // 각 보드 크기별 올바른 boxSize 설정
        if (size === 6) {
            this.boxSize = 2; // 3x2 박스 (박스 크기는 2)
        } else if (size === 9) {
            this.boxSize = 3; // 3x3 박스
        } else if (size === 12) {
            this.boxSize = 3; // 3x4 박스
        }
        console.log('setBoardSize - boxSize 설정 후:', this.boxSize);
        
        this.maxNumber = size;
        console.log('setBoardSize - maxNumber 설정 후:', this.maxNumber);
        
        console.log('setBoardSize - 모든 값 설정 후:', {
            boardSize: this.boardSize,
            boxSize: this.boxSize,
            maxNumber: this.maxNumber
        });
        
        // 보드 재초기화
        console.log('setBoardSize - initializeBoard 호출 전');
        this.initializeBoard();
        console.log('setBoardSize - initializeBoard 호출 후:', {
            boardSize: this.boardSize,
            boxSize: this.boxSize,
            maxNumber: this.maxNumber
        });
        
        // 숫자 패드 업데이트
        console.log('setBoardSize - updateNumberPad 호출 전');
        this.updateNumberPad();
        console.log('setBoardSize - updateNumberPad 호출 후:', {
            boardSize: this.boardSize,
            boxSize: this.boxSize,
            maxNumber: this.maxNumber
        });
        
        // 게임 보드 다시 렌더링
        this.renderBoard();
        
        console.log('보드 크기 변경 완료');
    }
    
    /**
     * 숫자 패드 업데이트
     */
    updateNumberPad() {
        const numberPad = document.getElementById('number-pad');
        if (!numberPad) return;
        
        // 기존 숫자 버튼들 제거 (삭제, 힌트 버튼은 유지)
        const existingButtons = numberPad.querySelectorAll('.number-btn');
        existingButtons.forEach(btn => btn.remove());
        
        // 새로운 숫자 버튼들 생성
        for (let i = 1; i <= this.maxNumber; i++) {
            const button = document.createElement('button');
            button.className = 'number-btn';
            button.dataset.number = i;
            button.textContent = i;
            
            // 삭제 버튼 앞에 삽입
            const deleteBtn = numberPad.querySelector('.delete-btn');
            numberPad.insertBefore(button, deleteBtn);
        }
    }

    /**
     * 게임 초기화
     */
    init() {
        this.generateNewPuzzle();
        this.renderBoard();
        this.updateGameInfo();
        this.gameStartTime = Date.now();
        this.isGameComplete = false;
        this.hintsUsed = 0;
        this.history = [];
        
        // 보드 크기 버튼 UI 업데이트
        this.updateBoardSizeButtons();
        // 난이도 버튼 UI 업데이트
        this.updateDifficultyButtons();
        
        // 사용자 분석: 게임 세션 시작
        if (window.userAnalytics) {
            window.userAnalytics.startGameSession(this.difficulty);
        }
    }

    /**
     * 이벤트 리스너 바인딩
     */
    bindEvents() {
        // 숫자 패드 이벤트
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('number-btn')) {
                const number = parseInt(e.target.dataset.number);
                this.inputNumber(number);
            } else if (e.target.id === 'delete-btn') {
                this.deleteNumber();
            } else if (e.target.id === 'hint-btn') {
                this.requestHint();
            } else if (e.target.classList.contains('cell')) {
                this.selectCell(e.target);
            }
        });

        // 키보드 이벤트
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardInput(e);
        });

        // 새 게임 버튼
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.showDifficultyModal();
        });
        
        // 보드 크기 선택 버튼들
        document.addEventListener('click', (e) => {
            // 보드 크기 버튼 클릭 처리 (자식 요소 클릭도 고려)
            const boardSizeBtn = e.target.closest('.board-size-btn');
            if (boardSizeBtn) {
                // 잠금된 버튼은 클릭 무시
                if (boardSizeBtn.disabled || boardSizeBtn.classList.contains('locked')) {
                    console.log('잠금된 보드 크기 버튼 클릭 무시됨');
                    return;
                }
                console.log('보드 크기 버튼 클릭됨:', boardSizeBtn);
                this.selectBoardSize(boardSizeBtn);
            } else if (e.target.classList.contains('difficulty-btn')) {
                // 잠금된 버튼은 클릭 무시
                if (e.target.disabled || e.target.classList.contains('locked')) {
                    console.log('잠금된 난이도 버튼 클릭 무시됨');
                    return;
                }
                this.selectDifficulty(e.target);
            } else if (e.target.id === 'start-game-btn') {
                this.startGameWithSettings();
            }
        });

        // 액션 버튼들
        document.getElementById('undo-btn').addEventListener('click', () => {
            this.undo();
        });

        document.getElementById('show-answer-btn').addEventListener('click', () => {
            this.showAnswer();
        });

        document.getElementById('smart-hint-btn').addEventListener('click', () => {
            this.requestSmartHint();
        });

        // 자동 풀이 버튼 이벤트
        document.getElementById('auto-solve-btn').addEventListener('click', () => {
            this.startAutoSolve();
        });

        // 한 단계 풀이 버튼 이벤트
        document.getElementById('solve-step-btn').addEventListener('click', () => {
            this.solveOneStep();
        });

        // AI 난이도 버튼 이벤트
        document.getElementById('ai-difficulty-btn').addEventListener('click', () => {
            this.showAIDifficultyModal();
        });

        // 행동 분석 버튼 이벤트
        document.getElementById('analytics-btn').addEventListener('click', () => {
            this.showAnalyticsModal();
        });

        // 트로피 버튼 이벤트
        document.getElementById('trophies-btn').addEventListener('click', () => {
            this.showTrophyModal();
        });

        // 게임 완료 모달 버튼 이벤트
        document.getElementById('play-again-btn').addEventListener('click', () => {
            document.getElementById('game-complete-modal').classList.remove('show');
            this.showDifficultyModal();
        });

        document.getElementById('view-stats-btn').addEventListener('click', () => {
            document.getElementById('game-complete-modal').classList.remove('show');
            this.showAnalyticsModal();
        });
    }

    /**
     * 새 퍼즐 생성
     */
    generateNewPuzzle() {
        console.log('generateNewPuzzle 시작 - boardSize:', this.boardSize, 'boxSize:', this.boxSize, 'maxNumber:', this.maxNumber);
        
        // 기존 데이터 완전 초기화
        this.initializeBoard();
        
        // 완전한 스도쿠 솔루션 생성
        console.log('generateCompleteSolution 호출 시작');
        this.generateCompleteSolution();
        console.log('generateCompleteSolution 호출 완료');
        
        // 솔루션을 복사하여 게임 보드 생성
        console.log('솔루션 복사 시작 - boardSize:', this.boardSize);
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                this.board[i][j] = this.solution[i][j];
                this.prefilled[i][j] = false;
            }
        }
        console.log('솔루션 복사 완료');
        
        // 난이도에 따라 숫자 제거 (솔루션은 보존)
        console.log('removeNumbersForDifficulty 호출 시작');
        this.removeNumbersForDifficulty();
        console.log('removeNumbersForDifficulty 호출 완료');
        
        // 솔루션 검증 및 로그
        console.log('최종 솔루션 상태:', this.solution);
        console.log('최종 게임 보드 상태:', this.board);
        
        // 사용자 입력 초기화
        console.log('사용자 입력 초기화 시작 - boardSize:', this.boardSize);
        this.userInputs = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
        console.log('사용자 입력 초기화 완료');
        
        // 미리 채워진 셀 표시
        console.log('미리 채워진 셀 표시 시작 - boardSize:', this.boardSize);
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j] !== 0) {
                    this.prefilled[i][j] = true;
                }
            }
        }
        console.log('미리 채워진 셀 표시 완료');
        console.log('generateNewPuzzle 완료');
    }

    /**
     * 완전한 스도쿠 솔루션 생성
     */
    generateCompleteSolution() {
        console.log('솔루션 생성 시작 - 보드 크기:', this.boardSize);
        
        // 보드 크기에 따라 미리 정의된 유효한 솔루션 사용
        if (this.boardSize === 6) {
            console.log('6x6 보드용 솔루션 사용');
            this.solution = [
                [1, 2, 3, 4, 5, 6],
                [4, 5, 6, 1, 2, 3],
                [2, 3, 1, 5, 6, 4],
                [5, 6, 4, 2, 3, 1],
                [3, 1, 2, 6, 4, 5],
                [6, 4, 5, 3, 1, 2]
            ];
        } else if (this.boardSize === 9) {
            console.log('9x9 보드용 솔루션 사용');
            this.solution = [
                [1, 2, 3, 4, 5, 6, 7, 8, 9],
                [4, 5, 6, 7, 8, 9, 1, 2, 3],
                [7, 8, 9, 1, 2, 3, 4, 5, 6],
                [2, 3, 1, 5, 6, 4, 8, 9, 7],
                [5, 6, 4, 8, 9, 7, 2, 3, 1],
                [8, 9, 7, 2, 3, 1, 5, 6, 4],
                [3, 1, 2, 6, 4, 5, 9, 7, 8],
                [6, 4, 5, 9, 7, 8, 3, 1, 2],
                [9, 7, 8, 3, 1, 2, 6, 4, 5]
            ];
        } else if (this.boardSize === 12) {
            console.log('12x12 보드용 솔루션 사용');
            this.solution = [
                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3],
                [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6],
                [10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9],
                [2, 3, 1, 5, 6, 4, 8, 9, 7, 11, 12, 10],
                [5, 6, 4, 8, 9, 7, 11, 12, 10, 2, 3, 1],
                [8, 9, 7, 11, 12, 10, 2, 3, 1, 5, 6, 4],
                [11, 12, 10, 2, 3, 1, 5, 6, 4, 8, 9, 7],
                [3, 1, 2, 6, 4, 5, 9, 7, 8, 12, 10, 11],
                [6, 4, 5, 9, 7, 8, 12, 10, 11, 3, 1, 2],
                [9, 7, 8, 12, 10, 11, 3, 1, 2, 6, 4, 5],
                [12, 10, 11, 3, 1, 2, 6, 4, 5, 9, 7, 8]
            ];
        } else {
            console.log('알 수 없는 보드 크기, 기본 솔루션 생성');
            this.generateFallbackSolution();
            return;
        }
        
        console.log('솔루션 생성 완료:', this.solution);
        
        // 솔루션 검증
        if (this.isCompleteSolution()) {
            console.log('솔루션 검증 성공');
        } else {
            console.error('솔루션 검증 실패');
        }
    }

    /**
     * 솔루션이 완전한지 검증
     */
    isCompleteSolution() {
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.solution[i][j] === 0) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * 백업 솔루션 생성 (간단한 패턴)
     */
    generateFallbackSolution() {
        console.log('백업 솔루션 생성 중...');
        
        // 6x6 보드용 간단한 유효한 솔루션
        if (this.boardSize === 6) {
            const fallbackSolution = [
                [1, 2, 3, 4, 5, 6],
                [4, 5, 6, 1, 2, 3],
                [2, 3, 1, 5, 6, 4],
                [5, 6, 4, 2, 3, 1],
                [3, 1, 2, 6, 4, 5],
                [6, 4, 5, 3, 1, 2]
            ];
            this.solution = fallbackSolution;
        } else if (this.boardSize === 9) {
            // 9x9 보드용 간단한 유효한 솔루션
            const fallbackSolution = [
                [1, 2, 3, 4, 5, 6, 7, 8, 9],
                [4, 5, 6, 7, 8, 9, 1, 2, 3],
                [7, 8, 9, 1, 2, 3, 4, 5, 6],
                [2, 3, 1, 5, 6, 4, 8, 9, 7],
                [5, 6, 4, 8, 9, 7, 2, 3, 1],
                [8, 9, 7, 2, 3, 1, 5, 6, 4],
                [3, 1, 2, 6, 4, 5, 9, 7, 8],
                [6, 4, 5, 9, 7, 8, 3, 1, 2],
                [9, 7, 8, 3, 1, 2, 6, 4, 5]
            ];
            this.solution = fallbackSolution;
        } else {
            // 기본 패턴
            for (let i = 0; i < this.boardSize; i++) {
                for (let j = 0; j < this.boardSize; j++) {
                    this.solution[i][j] = ((i + j) % this.maxNumber) + 1;
                }
            }
        }
        
        console.log('백업 솔루션 생성 완료:', this.solution);
    }

    /**
     * 대각선 박스들 채우기
     */
    fillDiagonalBoxes() {
        if (this.boardSize === 6) {
            // 6x6 보드: 3x2 박스들 (대각선 박스들만 채우기)
            this.fillBox(0, 0); // 첫 번째 박스 (0,0) ~ (2,1)
            this.fillBox(3, 2); // 두 번째 박스 (3,2) ~ (5,3)
        } else if (this.boardSize === 9) {
            // 9x9 보드: 3x3 박스들
            for (let i = 0; i < this.boardSize; i += this.boxSize) {
            this.fillBox(i, i);
            }
        } else if (this.boardSize === 12) {
            // 12x12 보드: 4x3 박스들 (4행 3열)
            this.fillBox(0, 0); // 첫 번째 박스 (0,0) ~ (3,2)
            this.fillBox(0, 3); // 두 번째 박스 (0,3) ~ (3,5)
            this.fillBox(0, 6); // 세 번째 박스 (0,6) ~ (3,8)
            this.fillBox(0, 9); // 네 번째 박스 (0,9) ~ (3,11)
            this.fillBox(4, 0); // 다섯 번째 박스 (4,0) ~ (7,2)
            this.fillBox(4, 3); // 여섯 번째 박스 (4,3) ~ (7,5)
            this.fillBox(4, 6); // 일곱 번째 박스 (4,6) ~ (7,8)
            this.fillBox(4, 9); // 여덟 번째 박스 (4,9) ~ (7,11)
            this.fillBox(8, 0); // 아홉 번째 박스 (8,0) ~ (11,2)
            this.fillBox(8, 3); // 열 번째 박스 (8,3) ~ (11,5)
            this.fillBox(8, 6); // 열한 번째 박스 (8,6) ~ (11,8)
            this.fillBox(8, 9); // 열두 번째 박스 (8,9) ~ (11,11)
        }
    }

    /**
     * 박스 채우기
     */
    fillBox(row, col) {
        const numbers = Array.from({length: this.maxNumber}, (_, i) => i + 1);
        this.shuffleArray(numbers);
        
        let index = 0;
        
        if (this.boardSize === 6) {
            // 6x6 보드: 3x2 박스
        for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 2; j++) {
                    this.solution[row + i][col + j] = numbers[index++];
                }
            }
        } else if (this.boardSize === 9) {
            // 9x9 보드: 3x3 박스
            for (let i = 0; i < this.boxSize; i++) {
                for (let j = 0; j < this.boxSize; j++) {
                    this.solution[row + i][col + j] = numbers[index++];
                }
            }
        } else if (this.boardSize === 12) {
            // 12x12 보드: 4x3 박스
            for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 3; j++) {
                this.solution[row + i][col + j] = numbers[index++];
                }
            }
        }
    }

    /**
     * 나머지 셀들 백트래킹으로 채우기
     */
    solveRemaining(row, col) {
        if (col === this.boardSize) {
            col = 0;
            row++;
        }
        
        if (row === this.boardSize) {
            return true; // 모든 셀이 채워짐
        }
        
        // 이미 채워진 셀은 건너뛰기
        if (this.solution[row][col] !== 0) {
            return this.solveRemaining(row, col + 1);
        }
        
        // 1부터 maxNumber까지 시도
        for (let num = 1; num <= this.maxNumber; num++) {
            if (this.isValidPlacement(this.solution, row, col, num)) {
                this.solution[row][col] = num;
                
                if (this.solveRemaining(row, col + 1)) {
                    return true;
                }
                
                this.solution[row][col] = 0; // 백트래킹
            }
        }
        
        return false;
    }

    /**
     * 난이도에 따라 숫자 제거
     */
    removeNumbersForDifficulty() {
        const totalCells = this.boardSize * this.boardSize;
        let cellsToRemove;
        
        switch (this.difficulty) {
            case 'easy':
                cellsToRemove = Math.floor(totalCells * 0.4); // 40%
                break;
            case 'medium':
                cellsToRemove = Math.floor(totalCells * 0.5); // 50%
                break;
            case 'hard':
                cellsToRemove = Math.floor(totalCells * 0.6); // 60%
                break;
            default:
                cellsToRemove = Math.floor(totalCells * 0.5); // 50%
        }
        
        let removed = 0;
        while (removed < cellsToRemove) {
            const row = Math.floor(Math.random() * this.boardSize);
            const col = Math.floor(Math.random() * this.boardSize);
            
            if (this.board[row][col] !== 0) {
                this.board[row][col] = 0;
                removed++;
            }
        }
    }

    /**
     * 게임 보드 렌더링
     */
    renderBoard() {
        this.gameBoardElement = document.getElementById('game-board');
        this.gameBoardElement.innerHTML = '';
        
        // 보드 크기에 따른 CSS 클래스 설정
        this.gameBoardElement.className = `game-board size-${this.boardSize}`;
        
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                
                if (this.prefilled[i][j]) {
                    cell.textContent = this.board[i][j];
                    cell.classList.add('prefilled');
                } else if (this.userInputs[i][j] !== 0) {
                    cell.textContent = this.userInputs[i][j];
                    cell.classList.add('user-input');
                }
                
                // 오류 검증
                if (!this.prefilled[i][j] && this.userInputs[i][j] !== 0) {
                    if (!this.isValidPlacement(this.getCurrentBoard(), i, j, this.userInputs[i][j])) {
                        cell.classList.add('error');
                    }
                }
                
                this.gameBoardElement.appendChild(cell);
            }
        }
    }

    /**
     * 현재 게임 상태의 보드 반환 (미리 채워진 숫자 + 사용자 입력)
     */
    getCurrentBoard() {
        // 안전성 검사
        if (!this.boardSize || !this.board || !this.userInputs || !this.prefilled) {
            console.warn('getCurrentBoard: 게임이 완전히 초기화되지 않았습니다.');
            return Array(9).fill().map(() => Array(9).fill(0)); // 기본 9x9 보드 반환
        }
        
        const currentBoard = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
        
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.prefilled[i] && this.prefilled[i][j]) {
                    // 미리 채워진 셀은 board에서 가져오기 (솔루션이 아닌)
                    currentBoard[i][j] = this.board[i][j];
                } else {
                    // 사용자 입력 셀은 userInputs에서 가져오기
                    currentBoard[i][j] = this.userInputs[i][j];
                }
            }
        }
        
        return currentBoard;
    }

    /**
     * 셀 선택
     */
    selectCell(cellElement) {
        // 이전 선택 해제
        if (this.selectedCell) {
            this.selectedCell.classList.remove('selected');
        }
        
        // 새 셀 선택
        this.selectedCell = cellElement;
        cellElement.classList.add('selected');
        
        // 미리 채워진 셀은 선택 불가
        if (cellElement.classList.contains('prefilled')) {
            return;
        }
        
        // 관련 셀들 하이라이트
        this.highlightRelatedCells(cellElement);
    }

    /**
     * 관련 셀들 하이라이트
     */
    highlightRelatedCells(selectedCell) {
        const row = parseInt(selectedCell.dataset.row);
        const col = parseInt(selectedCell.dataset.col);
        
        // 모든 셀의 하이라이트 제거
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.classList.remove('related');
        });
        
        // 같은 행, 열, 박스의 셀들 하이라이트
        cells.forEach(cell => {
            const cellRow = parseInt(cell.dataset.row);
            const cellCol = parseInt(cell.dataset.col);
            
            if (cellRow === row || cellCol === col || 
                (Math.floor(cellRow / this.boxSize) === Math.floor(row / this.boxSize) && 
                 Math.floor(cellCol / this.boxSize) === Math.floor(col / this.boxSize))) {
                if (!cell.classList.contains('selected')) {
                    cell.classList.add('related');
                }
            }
        });
    }

    /**
     * 숫자 입력
     */
    inputNumber(number) {
        if (!this.selectedCell || this.selectedCell.classList.contains('prefilled')) {
            return;
        }
        
        const row = parseInt(this.selectedCell.dataset.row);
        const col = parseInt(this.selectedCell.dataset.col);
        
        // 히스토리에 저장 (되돌리기용)
        this.saveToHistory(row, col, this.userInputs[row][col]);
        
        // 숫자 입력
        this.userInputs[row][col] = number;
        this.selectedCell.textContent = number;
        this.selectedCell.classList.add('user-input');
        this.selectedCell.classList.remove('error');
        
        // 오류 검증
        if (!this.isValidPlacement(this.getCurrentBoard(), row, col, number)) {
            this.selectedCell.classList.add('error');
            // 오류 사운드 재생
            if (window.audioManager) {
                window.audioManager.playBeep();
            }
            // 사용자 분석: 오류 기록
            if (window.userAnalytics) {
                window.userAnalytics.recordError(row, col, number, null);
            }
        } else {
            // 사용자 분석: 유효한 입력 기록
            if (window.userAnalytics) {
                window.userAnalytics.recordCellInput(row, col, number, true);
            }
        }
        
        // 게임 완료 체크 (자동 완료 모달 표시 안함)
        this.checkGameComplete();
        this.updateGameInfo();
    }

    /**
     * 숫자 삭제
     */
    deleteNumber() {
        if (!this.selectedCell || this.selectedCell.classList.contains('prefilled')) {
            return;
        }
        
        const row = parseInt(this.selectedCell.dataset.row);
        const col = parseInt(this.selectedCell.dataset.col);
        
        // 히스토리에 저장
        this.saveToHistory(row, col, this.userInputs[row][col]);
        
        // 숫자 삭제
        this.userInputs[row][col] = 0;
        this.selectedCell.textContent = '';
        this.selectedCell.classList.remove('user-input', 'error');
        
        this.updateGameInfo();
    }

    /**
     * 힌트 요청
     */
    requestHint() {
        if (this.hintsUsed >= this.maxHints) {
            alert('힌트를 모두 사용했습니다.');
            return;
        }
        
        // 빈 셀 찾기
        const emptyCells = [];
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (!this.prefilled[i][j] && this.userInputs[i][j] === 0) {
                    emptyCells.push({ row: i, col: j });
                }
            }
        }
        
        if (emptyCells.length === 0) {
            alert('힌트를 줄 빈 셀이 없습니다.');
            return;
        }
        
        // 랜덤하게 빈 셀 선택
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const correctNumber = this.solution[randomCell.row][randomCell.col];
        
        // 솔루션이 0인 경우 처리
        if (correctNumber === 0) {
            console.error(`솔루션에 0이 발견됨: (${randomCell.row}, ${randomCell.col})`);
            this.showToast('솔루션에 문제가 있습니다. 새 게임을 시작해주세요.');
            return;
        }
        
        // 힌트 제공
        this.userInputs[randomCell.row][randomCell.col] = correctNumber;
        this.hintsUsed++;
        
        // 사용자 분석: 힌트 사용 기록
        if (window.userAnalytics) {
            window.userAnalytics.recordHintUsage('basic', { row: randomCell.row, col: randomCell.col }, 1);
        }
        
        // DOM 업데이트
        const cellElement = document.querySelector(`[data-row="${randomCell.row}"][data-col="${randomCell.col}"]`);
        cellElement.textContent = correctNumber;
        cellElement.classList.add('user-input', 'hint');
        
        this.updateGameInfo();
        // 자동 완료 체크 비활성화 - 수동 정답 확인만 허용
        // this.checkGameComplete();
    }

    /**
     * 스마트 힌트 요청
     */
    requestSmartHint() {
        if (!window.smartHintSystem) {
            alert('스마트 힌트 시스템을 불러오는 중입니다...');
            return;
        }

        // 빈 셀이 있는지 확인
        let hasEmptyCells = false;
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (!this.prefilled[i][j] && this.userInputs[i][j] === 0) {
                    hasEmptyCells = true;
                    break;
                }
            }
            if (hasEmptyCells) break;
        }

        if (!hasEmptyCells) {
            alert('힌트를 줄 빈 셀이 없습니다.');
            return;
        }

        try {
            // SmartHintSystem에 보드 크기 설정
            window.smartHintSystem.boardSize = this.boardSize;
            window.smartHintSystem.maxNumber = this.maxNumber;
            
            // 스마트 힌트 시스템으로 분석
            const hint = window.smartHintSystem.provideSmartHint(
                this.board,
                this.solution,
                this.userInputs,
                this.prefilled
            );

            // 스마트 힌트 모달 표시
            this.showSmartHintModal(hint);
        } catch (error) {
            console.error('스마트 힌트 생성 중 오류:', error);
            alert('스마트 힌트 생성에 실패했습니다.');
        }
    }

    /**
     * 스마트 힌트 모달 표시
     */
    showSmartHintModal(hint) {
        const modal = document.getElementById('smart-hint-modal');
        const iconElement = document.getElementById('hint-icon');
        const messageElement = document.getElementById('hint-message');
        const descriptionElement = document.getElementById('hint-description');
        const detailsElement = document.getElementById('hint-details');

        // 힌트 타입에 따른 아이콘 설정
        const iconMap = {
            'naked_singles': '🎯',
            'hidden_singles': '🔍',
            'single_candidate': '💡',
            'pair_analysis': '🔗',
            'row_analysis': '📊',
            'column_analysis': '📈',
            'box_analysis': '📦',
            'general': '🧠'
        };

        iconElement.textContent = iconMap[hint.type] || '💡';
        messageElement.textContent = hint.formattedMessage || hint.message;
        descriptionElement.textContent = hint.formattedDescription || hint.description;

        // 힌트 세부사항 표시
        let detailsHTML = '';
        if (hint.candidates && hint.candidates.length > 0) {
            detailsHTML += `<div class="detail-item">
                <span class="detail-label">가능한 숫자:</span>
                <span class="detail-value">${hint.candidates.join(', ')}</span>
            </div>`;
        }
        if (hint.missingNumbers && hint.missingNumbers.length > 0) {
            detailsHTML += `<div class="detail-item">
                <span class="detail-label">빠진 숫자:</span>
                <span class="detail-value">${hint.missingNumbers.join(', ')}</span>
            </div>`;
        }
        if (hint.level) {
            const levelText = hint.level === 1 ? '쉬움' : hint.level === 2 ? '보통' : '어려움';
            detailsHTML += `<div class="detail-item">
                <span class="detail-label">힌트 난이도:</span>
                <span class="detail-value">${levelText}</span>
            </div>`;
        }

        detailsElement.innerHTML = detailsHTML;

        // 모달 표시
        modal.classList.add('show');

        // 현재 힌트 저장 (적용 버튼용)
        this.currentSmartHint = hint;

        // 모달 이벤트 바인딩
        this.bindSmartHintModalEvents();
    }

    /**
     * 스마트 힌트 모달 이벤트 바인딩
     */
    bindSmartHintModalEvents() {
        const modal = document.getElementById('smart-hint-modal');
        const applyBtn = document.getElementById('apply-smart-hint');
        const closeBtn = document.getElementById('close-smart-hint-modal');

        // 적용하기 버튼
        applyBtn.onclick = () => {
            this.applySmartHint();
            modal.classList.remove('show');
        };

        // 닫기 버튼
        closeBtn.onclick = () => {
            modal.classList.remove('show');
        };

        // 모달 외부 클릭시 닫기
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        };
    }

    /**
     * 스마트 힌트 적용
     */
    applySmartHint() {
        if (!this.currentSmartHint) {
            return;
        }

        const hint = this.currentSmartHint;

        // 숫자를 직접 제시하는 힌트인 경우
        if (hint.number && hint.row !== undefined && hint.col !== undefined) {
            // 히스토리에 저장
            this.saveToHistory(hint.row, hint.col, this.userInputs[hint.row][hint.col]);
            
            // 숫자 입력
            this.userInputs[hint.row][hint.col] = hint.number;
            
            // DOM 업데이트
            const cellElement = document.querySelector(`[data-row="${hint.row}"][data-col="${hint.col}"]`);
            if (cellElement) {
                cellElement.textContent = hint.number;
                cellElement.classList.add('user-input', 'smart-hint');
                
                // 셀 선택
                this.selectCell(cellElement);
            }
            
            this.updateGameInfo();
            // 자동 완료 체크 비활성화 - 수동 정답 확인만 허용
            // this.checkGameComplete();
            
            // 스마트 힌트 사용 통계 기록
            this.recordSmartHintUsage(hint);
        } else {
            // 일반적인 조언 힌트인 경우
            alert('힌트를 참고하여 게임을 계속 진행해보세요!');
        }

        this.currentSmartHint = null;
    }

    /**
     * 스마트 힌트 사용 통계 기록
     */
    recordSmartHintUsage(hint) {
        if (window.gameStorage) {
            window.gameStorage.saveSmartHintStats({
                type: hint.type,
                level: hint.level,
                difficulty: this.difficulty,
                date: new Date().toISOString()
            });
        }
    }

    /**
     * 게임 완료 체크 (자동 완료 모달 표시 안함)
     */
    checkGameComplete() {
        // 한 줄 완성 체크
        this.checkLineCompletions();
        
        // 모든 셀이 채워졌는지 확인
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.getCurrentBoard()[i][j] === 0) {
                    console.log(`게임 미완료: 빈 셀 발견 (${i}, ${j})`);
                    return false;
                }
            }
        }
        
        // 솔루션과 일치하는지 확인
        const currentBoard = this.getCurrentBoard();
        console.log('현재 보드 상태:', currentBoard);
        console.log('솔루션 상태:', this.solution);
        
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (currentBoard[i][j] !== this.solution[i][j]) {
                    console.log(`게임 미완료: 솔루션 불일치 (${i}, ${j}) - 현재: ${currentBoard[i][j]}, 솔루션: ${this.solution[i][j]}`);
                    console.log('prefilled 상태:', this.prefilled[i][j]);
                    console.log('userInputs 상태:', this.userInputs[i][j]);
                    console.log('board 상태:', this.board[i][j]);
                    return false;
                }
            }
        }
        
        // 게임 완료! (하지만 자동으로 모달을 표시하지 않음)
        console.log('🎉 게임 완료 감지됨! (수동 확인 대기 중)');
        return true;
    }

    /**
     * 수동 정답 확인
     */
    checkAnswerManually() {
        console.log('수동 정답 확인 시작');
        console.log('보드 크기:', this.boardSize);
        console.log('board 상태:', this.board);
        console.log('userInputs 상태:', this.userInputs);
        console.log('prefilled 상태:', this.prefilled);
        console.log('solution 상태:', this.solution);
        
        // 모든 셀이 채워졌는지 확인
        const currentBoard = this.getCurrentBoard();
        console.log('getCurrentBoard() 결과:', currentBoard);
        
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                const cellValue = currentBoard[i][j];
                console.log(`셀 (${i}, ${j}): 값=${cellValue}, prefilled=${this.prefilled[i][j]}, userInput=${this.userInputs[i][j]}, board=${this.board[i][j]}, solution=${this.solution[i][j]}`);
                
                if (cellValue === 0) {
                    console.log(`빈 칸 발견: (${i}, ${j})`);
                    this.showToast('아직 빈 칸이 있습니다. 모든 칸을 채워주세요.');
                    return false;
                }
            }
        }
        
        console.log('모든 칸이 채워짐, 스도쿠 규칙 검증 시작');
        
        // 스도쿠 규칙 직접 검증 (솔루션 배열에 의존하지 않음)
        if (this.isValidSudoku(currentBoard)) {
            console.log('🎉 스도쿠 규칙 검증 성공! 정답입니다!');
            this.completeGame();
            return true;
        } else {
            console.log('❌ 스도쿠 규칙 검증 실패');
            this.showToast('정답이 아닙니다. 다시 확인해주세요.');
            return false;
        }
    }

    /**
     * 스도쿠 규칙 직접 검증
     */
    isValidSudoku(board) {
        console.log('스도쿠 규칙 검증 시작');
        
        // 행 검증
        for (let i = 0; i < this.boardSize; i++) {
            const row = board[i];
            if (!this.isValidSet(row)) {
                console.log(`행 ${i} 검증 실패:`, row);
                return false;
            }
        }
        console.log('모든 행 검증 성공');
        
        // 열 검증
        for (let j = 0; j < this.boardSize; j++) {
            const col = [];
            for (let i = 0; i < this.boardSize; i++) {
                col.push(board[i][j]);
            }
            if (!this.isValidSet(col)) {
                console.log(`열 ${j} 검증 실패:`, col);
                return false;
            }
        }
        console.log('모든 열 검증 성공');
        
        // 박스 검증
        if (this.boardSize === 6) {
            // 6x6: 2x3 박스 (2행 3열)
            for (let boxRow = 0; boxRow < 3; boxRow++) {
                for (let boxCol = 0; boxCol < 2; boxCol++) {
                    const box = [];
                    for (let i = 0; i < 2; i++) {
                        for (let j = 0; j < 3; j++) {
                            box.push(board[boxRow * 2 + i][boxCol * 3 + j]);
                        }
                    }
                    if (!this.isValidSet(box)) {
                        console.log(`박스 (${boxRow}, ${boxCol}) 검증 실패:`, box);
                        return false;
                    }
                }
            }
        } else if (this.boardSize === 9) {
            // 9x9: 3x3 박스
            for (let boxRow = 0; boxRow < 3; boxRow++) {
                for (let boxCol = 0; boxCol < 3; boxCol++) {
                    const box = [];
                    for (let i = 0; i < 3; i++) {
                        for (let j = 0; j < 3; j++) {
                            box.push(board[boxRow * 3 + i][boxCol * 3 + j]);
                        }
                    }
                    if (!this.isValidSet(box)) {
                        console.log(`박스 (${boxRow}, ${boxCol}) 검증 실패:`, box);
                        return false;
                    }
                }
            }
        } else if (this.boardSize === 12) {
            // 12x12: 3x4 박스 (3행 4열)
            for (let boxRow = 0; boxRow < 4; boxRow++) {
                for (let boxCol = 0; boxCol < 3; boxCol++) {
                    const box = [];
                    for (let i = 0; i < 3; i++) {
                        for (let j = 0; j < 4; j++) {
                            box.push(board[boxRow * 3 + i][boxCol * 4 + j]);
                        }
                    }
                    if (!this.isValidSet(box)) {
                        console.log(`박스 (${boxRow}, ${boxCol}) 검증 실패:`, box);
                        return false;
                    }
                }
            }
        }
        console.log('모든 박스 검증 성공');
        
        return true;
    }

    /**
     * 숫자 집합이 유효한지 검증 (1부터 maxNumber까지 중복 없이)
     */
    isValidSet(numbers) {
        const seen = new Set();
        for (const num of numbers) {
            if (num < 1 || num > this.maxNumber || seen.has(num)) {
                return false;
            }
            seen.add(num);
        }
        return seen.size === this.maxNumber;
    }

    /**
     * 솔루션에 0이 있으면 강제로 수정
     */
    fixSolutionIfNeeded() {
        let needsFix = false;
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.solution[i][j] === 0) {
                    needsFix = true;
                    break;
                }
            }
            if (needsFix) break;
        }
        
        if (needsFix) {
            console.log('솔루션에 0이 발견됨, 강제로 수정합니다');
            this.generateCompleteSolution();
        }
    }

    /**
     * 게임 완료 처리
     */
    completeGame() {
        this.isGameComplete = true;
        this.gameEndTime = Date.now();
        
        // 성공 사운드 재생
        if (window.audioManager) {
            window.audioManager.playSuccess();
        }
        
        // 게임 통계 생성
        const gameStats = {
            completionTime: this.gameEndTime - this.gameStartTime,
            hintsUsed: this.hintsUsed,
            difficulty: this.difficulty,
            moves: this.getMoveCount(),
            errors: this.getErrorCount(),
            date: new Date().toISOString()
        };
        
        // 업적 시스템에 게임 완료 알림
        if (window.achievementSystem) {
            window.achievementSystem.checkGameCompletion(gameStats);
        }
        
        // 레벨 시스템 경험치 추가
        if (window.levelSystem) {
            window.levelSystem.addGameCompleteExp(this.difficulty, gameStats);
        }
        
        // 다음 단계 난이도/보드 크기 잠금 해제
        this.unlockNextStage();
        
        // AI 난이도 분석
        this.analyzeGameWithAI();
        
        // 사용자 분석: 게임 세션 종료
        if (window.userAnalytics) {
            const completionData = {
                completed: true,
                completionTime: this.gameEndTime - this.gameStartTime,
                errors: this.getErrorCount(),
                hintsUsed: this.hintsUsed
            };
            window.userAnalytics.endGameSession(completionData);
        }
        
        // 게임 완료 모달 표시
        setTimeout(() => {
        this.showGameCompleteModal();
        }, 500);
    }

    /**
     * 한 줄/열/박스 완성 체크
     */
    checkLineCompletions() {
        const currentBoard = this.getCurrentBoard();
        
        // 행 완성 체크
        for (let row = 0; row < this.boardSize; row++) {
            if (this.isRowComplete(currentBoard, row)) {
                this.highlightCompletedRow(row);
            }
        }
        
        // 열 완성 체크
        for (let col = 0; col < this.boardSize; col++) {
            if (this.isColumnComplete(currentBoard, col)) {
                this.highlightCompletedColumn(col);
            }
        }
        
        // 박스 완성 체크
        const totalBoxes = this.boardSize;
        for (let box = 0; box < totalBoxes; box++) {
            if (this.isBoxComplete(currentBoard, box)) {
                this.highlightCompletedBox(box);
            }
        }
    }

    /**
     * 행이 완성되었는지 확인
     */
    isRowComplete(board, row) {
        const numbers = new Set();
        for (let col = 0; col < this.boardSize; col++) {
            const value = board[row][col];
            if (value === 0 || numbers.has(value)) {
                return false;
            }
            numbers.add(value);
        }
        return numbers.size === this.maxNumber;
    }

    /**
     * 열이 완성되었는지 확인
     */
    isColumnComplete(board, col) {
        const numbers = new Set();
        for (let row = 0; row < this.boardSize; row++) {
            const value = board[row][col];
            if (value === 0 || numbers.has(value)) {
                return false;
            }
            numbers.add(value);
        }
        return numbers.size === this.maxNumber;
    }

    /**
     * 박스가 완성되었는지 확인
     */
    isBoxComplete(board, boxIndex) {
        const boxesPerRow = Math.sqrt(this.boardSize);
        const startRow = Math.floor(boxIndex / boxesPerRow) * this.boxSize;
        const startCol = (boxIndex % boxesPerRow) * this.boxSize;
        const numbers = new Set();
        
        for (let i = startRow; i < startRow + this.boxSize; i++) {
            for (let j = startCol; j < startCol + this.boxSize; j++) {
                const value = board[i][j];
                if (value === 0 || numbers.has(value)) {
                    return false;
                }
                numbers.add(value);
            }
        }
        return numbers.size === this.maxNumber;
    }

    /**
     * 완성된 행 하이라이트
     */
    highlightCompletedRow(row) {
        if (!this.gameBoardElement) return;
        
        const cells = this.gameBoardElement.querySelectorAll('.cell');
        for (let col = 0; col < this.boardSize; col++) {
            const cellIndex = row * this.boardSize + col;
            const cell = cells[cellIndex];
            if (cell && !cell.classList.contains('line-completed')) {
                cell.classList.add('line-completed');
                // 3초 후 클래스 제거 (애니메이션 효과)
                setTimeout(() => {
                    cell.classList.remove('line-completed');
                }, 3000);
            }
        }
        
        // 완성 사운드 재생
        if (window.audioManager) {
            window.audioManager.playSuccess();
        }
    }

    /**
     * 완성된 열 하이라이트
     */
    highlightCompletedColumn(col) {
        if (!this.gameBoardElement) return;
        
        const cells = this.gameBoardElement.querySelectorAll('.cell');
        for (let row = 0; row < this.boardSize; row++) {
            const cellIndex = row * this.boardSize + col;
            const cell = cells[cellIndex];
            if (cell && !cell.classList.contains('line-completed')) {
                cell.classList.add('line-completed');
                // 3초 후 클래스 제거 (애니메이션 효과)
                setTimeout(() => {
                    cell.classList.remove('line-completed');
                }, 3000);
            }
        }
        
        // 완성 사운드 재생
        if (window.audioManager) {
            window.audioManager.playSuccess();
        }
    }

    /**
     * 완성된 박스 하이라이트
     */
    highlightCompletedBox(boxIndex) {
        if (!this.gameBoardElement) return;
        
        const boxesPerRow = Math.sqrt(this.boardSize);
        const startRow = Math.floor(boxIndex / boxesPerRow) * this.boxSize;
        const startCol = (boxIndex % boxesPerRow) * this.boxSize;
        const cells = this.gameBoardElement.querySelectorAll('.cell');
        
        for (let i = startRow; i < startRow + this.boxSize; i++) {
            for (let j = startCol; j < startCol + this.boxSize; j++) {
                const cellIndex = i * this.boardSize + j;
                const cell = cells[cellIndex];
                if (cell && !cell.classList.contains('line-completed')) {
                    cell.classList.add('line-completed');
                    // 3초 후 클래스 제거 (애니메이션 효과)
                    setTimeout(() => {
                        cell.classList.remove('line-completed');
                    }, 3000);
                }
            }
        }
        
        // 완성 사운드 재생
        if (window.audioManager) {
            window.audioManager.playSuccess();
        }
    }

    /**
     * 게임 완료 축하 모달 표시
     */
    showGameCompleteModal() {
        const completionTime = this.getFormattedTime(this.gameEndTime - this.gameStartTime);
        const moveCount = this.getMoveCount();
        const errorCount = this.getErrorCount();
        const avgMoveTime = this.getFormattedTime(this.getAverageMoveTime());
        
        // 트로피 획득 체크
        const trophies = this.checkTrophyEligibility(completionTime, errorCount, this.hintsUsed);
        
        // 축하 모달 생성
        this.createCelebrationModal({
            completionTime,
            moveCount,
            errorCount,
            avgMoveTime,
            hintsUsed: this.hintsUsed,
            difficulty: this.difficulty,
            trophies
        });
        
        // 통계 저장
        this.saveGameStats();
    }

    /**
     * 트로피 획득 자격 체크
     */
    checkTrophyEligibility(completionTime, errorCount, hintsUsed) {
        const trophies = [];
        
        // 속도 트로피 (5분 이내)
        if (completionTime < 300000) { // 5분 = 300,000ms
            trophies.push({
                id: 'speed_demon',
                name: '속도의 마법사',
                icon: '🏃‍♂️',
                description: '5분 이내 완료'
            });
        }
        
        // 완벽주의 트로피 (오류 없음)
        if (errorCount === 0) {
            trophies.push({
                id: 'perfectionist',
                name: '완벽주의자',
                icon: '💎',
                description: '실수 없이 완료'
            });
        }
        
        // 독립성 트로피 (힌트 없음)
        if (hintsUsed === 0) {
            trophies.push({
                id: 'independent',
                name: '독립적인 사고',
                icon: '🧠',
                description: '힌트 없이 완료'
            });
        }
        
        // 난이도별 트로피
        if (this.difficulty === 'hard') {
            trophies.push({
                id: 'expert',
                name: '전문가',
                icon: '👑',
                description: '어려움 난이도 완료'
            });
        }
        
        // 트로피 저장
        this.saveTrophies(trophies);
        
        return trophies;
    }

    /**
     * 트로피 저장
     */
    saveTrophies(trophies) {
        if (trophies.length === 0) return;
        
        try {
            const existingTrophies = JSON.parse(localStorage.getItem('sudoku_trophies') || '[]');
            const newTrophies = trophies.filter(trophy => 
                !existingTrophies.some(existing => existing.id === trophy.id)
            );
            
            if (newTrophies.length > 0) {
                const updatedTrophies = [...existingTrophies, ...newTrophies];
                localStorage.setItem('sudoku_trophies', JSON.stringify(updatedTrophies));
            }
        } catch (error) {
            console.warn('트로피 저장 중 오류:', error);
        }
    }

    /**
     * 축하 모달 생성
     */
    createCelebrationModal(stats) {
        // 기존 모달 제거
        const existingModal = document.querySelector('.completion-celebration');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.className = 'completion-celebration';
        modal.innerHTML = `
            <div class="completion-celebration-content">
                <div class="completion-trophy">🏆</div>
                <div class="completion-title">축하합니다!</div>
                <div class="completion-message">
                    스도쿠 퍼즐을 완벽하게 해결하셨습니다!<br>
                    ${this.getDifficultyText(stats.difficulty)} 난이도를 ${stats.completionTime}만에 완료하셨네요!
                </div>
                
                <div class="completion-stats">
                    <div class="completion-stat-item">
                        <span class="completion-stat-label">완료 시간</span>
                        <span class="completion-stat-value">${stats.completionTime}</span>
                    </div>
                    <div class="completion-stat-item">
                        <span class="completion-stat-label">이동 횟수</span>
                        <span class="completion-stat-value">${stats.moveCount}</span>
                    </div>
                    <div class="completion-stat-item">
                        <span class="completion-stat-label">힌트 사용</span>
                        <span class="completion-stat-value">${stats.hintsUsed}회</span>
                    </div>
                    <div class="completion-stat-item">
                        <span class="completion-stat-label">실수 횟수</span>
                        <span class="completion-stat-value">${stats.errorCount}회</span>
                    </div>
                </div>
                
                ${stats.trophies.length > 0 ? `
                <div class="trophy-collection">
                    <h4>🏆 새로 획득한 트로피</h4>
                    <div class="trophy-list">
                        ${stats.trophies.map(trophy => `
                            <div class="trophy-item">
                                <div class="trophy-icon">${trophy.icon}</div>
                                <div class="trophy-name">${trophy.name}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <div class="completion-buttons">
                    <button class="completion-btn" onclick="this.closest('.completion-celebration').remove(); window.sudokuGame.newGame();">
                        새 게임
                    </button>
                    <button class="completion-btn secondary" onclick="this.closest('.completion-celebration').remove(); window.uiManager.showStats();">
                        통계 보기
                    </button>
                    <button class="completion-btn secondary" onclick="this.closest('.completion-celebration').remove();">
                        닫기
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // ESC 키로 닫기
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
        
        // 배경 클릭으로 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                document.removeEventListener('keydown', handleEsc);
            }
        });
    }

    /**
     * 난이도 텍스트 변환
     */
    getDifficultyText(difficulty) {
        const difficultyMap = {
            'easy': '쉬움',
            'medium': '보통',
            'hard': '어려움'
        };
        return difficultyMap[difficulty] || difficulty;
    }

    /**
     * 게임 통계 저장
     */
    saveGameStats() {
        const stats = {
            completionTime: this.gameEndTime - this.gameStartTime,
            hintsUsed: this.hintsUsed,
            difficulty: this.difficulty,
            date: new Date().toISOString(),
            moves: this.getMoveCount(),
            errors: this.getErrorCount(),
            averageMoveTime: this.getAverageMoveTime()
        };
        
        // LocalStorage에 저장
        if (window.gameStorage) {
            window.gameStorage.saveGameStats(stats);
        }
        
        console.log('Game completed:', stats);
    }

    /**
     * 이동 횟수 계산
     */
    getMoveCount() {
        let moves = 0;
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.userInputs[i][j] !== 0) {
                    moves++;
                }
            }
        }
        return moves;
    }

    /**
     * 오류 횟수 계산
     */
    getErrorCount() {
        let errors = 0;
        const currentBoard = this.getCurrentBoard();
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (!this.prefilled[i][j] && currentBoard[i][j] !== 0) {
                    if (!this.isValidPlacement(currentBoard, i, j, currentBoard[i][j])) {
                        errors++;
                    }
                }
            }
        }
        return errors;
    }

    /**
     * 평균 이동 시간 계산
     */
    getAverageMoveTime() {
        const totalTime = this.gameEndTime - this.gameStartTime;
        const moveCount = this.getMoveCount();
        return moveCount > 0 ? Math.round(totalTime / moveCount) : 0;
    }

    /**
     * 되돌리기
     */
    undo() {
        if (this.history.length === 0) {
            alert('되돌릴 동작이 없습니다.');
            return;
        }
        
        const lastAction = this.history.pop();
        const { row, col, previousValue } = lastAction;
        
        // 사용자 분석: 되돌리기 기록
        if (window.userAnalytics) {
            window.userAnalytics.recordUndo('cell_input', { row, col });
        }
        
        this.userInputs[row][col] = previousValue;
        
        // DOM 업데이트
        const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (previousValue === 0) {
            cellElement.textContent = '';
            cellElement.classList.remove('user-input', 'error', 'hint');
        } else {
            cellElement.textContent = previousValue;
            cellElement.classList.add('user-input');
            cellElement.classList.remove('error', 'hint');
        }
        
        this.updateGameInfo();
    }

    /**
     * 히스토리에 액션 저장
     */
    saveToHistory(row, col, previousValue) {
        this.history.push({ row, col, previousValue });
        
        // 히스토리 크기 제한 (최대 50개)
        if (this.history.length > 50) {
            this.history.shift();
        }
    }

    /**
     * 난이도 설정
     */
    setDifficulty(difficulty) {
        // 잠금 해제된 난이도인지 확인
        if (!this.isDifficultyUnlocked(this.boardSize, difficulty)) {
            console.log(`난이도 ${this.boardSize}x${this.boardSize} ${difficulty}는 아직 잠금 해제되지 않았습니다.`);
            return false;
        }
        
        this.difficulty = difficulty;
        // 난이도 표시 제거됨 (HTML에서 제거됨)
        return true;
    }

    /**
     * 난이도 선택 모달 표시
     */
    showDifficultyModal() {
        const modal = document.getElementById('difficulty-modal');
        modal.classList.add('show');
        
        // 잠금 해제 상태 UI 업데이트
        this.updateBoardSizeButtons();
        this.updateDifficultyButtons();
        
        // 현재 보드 크기 표시
        const boardSizeBtns = document.querySelectorAll('.board-size-btn');
        boardSizeBtns.forEach(btn => {
            btn.classList.remove('selected');
            if (parseInt(btn.dataset.size) === this.boardSize) {
                btn.classList.add('selected');
            }
        });
        
        // 현재 난이도 표시
        const difficultyBtns = document.querySelectorAll('.difficulty-btn');
        difficultyBtns.forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.difficulty === this.difficulty) {
                btn.classList.add('selected');
            }
        });
    }
    
    /**
     * 보드 크기 선택
     */
    selectBoardSize(button) {
        console.log('selectBoardSize 호출됨, 버튼:', button);
        console.log('버튼의 data-size:', button.dataset.size);
        
        const size = parseInt(button.dataset.size);
        
        // 잠금 해제 상태 체크
        if (!this.isBoardSizeUnlocked(size)) {
            console.log(`보드 크기 ${size}x${size}는 아직 잠금 해제되지 않았습니다.`);
            this.showToast(`${size}x${size} 모드는 아직 잠금 해제되지 않았습니다.`);
            return;
        }
        
        // 모든 보드 크기 버튼에서 선택 상태 제거
        document.querySelectorAll('.board-size-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // 선택된 버튼에 선택 상태 추가
        button.classList.add('selected');
        
        console.log('보드 크기 선택됨:', button.dataset.size);
        console.log('선택된 버튼에 selected 클래스 추가됨');
    }
    
    /**
     * 난이도 선택
     */
    selectDifficulty(button) {
        const difficulty = button.dataset.difficulty;
        
        // 잠금 해제 상태 체크
        if (!this.isDifficultyUnlocked(this.boardSize, difficulty)) {
            console.log(`난이도 ${this.boardSize}x${this.boardSize} ${difficulty}는 아직 잠금 해제되지 않았습니다.`);
            this.showToast(`${this.boardSize}x${this.boardSize} ${difficulty} 난이도는 아직 잠금 해제되지 않았습니다.`);
            return;
        }
        
        // 모든 난이도 버튼에서 선택 상태 제거
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // 선택된 버튼에 선택 상태 추가
        button.classList.add('selected');
    }
    
    /**
     * 설정된 값으로 게임 시작
     */
    startGameWithSettings() {
        // 선택된 보드 크기 가져오기
        const selectedBoardSizeBtn = document.querySelector('.board-size-btn.selected');
        console.log('선택된 보드 크기 버튼:', selectedBoardSizeBtn);
        console.log('버튼의 data-size:', selectedBoardSizeBtn ? selectedBoardSizeBtn.dataset.size : 'null');
        
        const selectedSize = selectedBoardSizeBtn ? parseInt(selectedBoardSizeBtn.dataset.size) : 9;
        
        // 선택된 난이도 가져오기
        const selectedDifficultyBtn = document.querySelector('.difficulty-btn.selected');
        console.log('선택된 난이도 버튼:', selectedDifficultyBtn);
        console.log('난이도 버튼의 data-difficulty:', selectedDifficultyBtn ? selectedDifficultyBtn.dataset.difficulty : 'null');
        const selectedDifficulty = selectedDifficultyBtn ? selectedDifficultyBtn.dataset.difficulty : 'medium';
        
        console.log('선택된 보드 크기:', selectedSize, '현재 보드 크기:', this.boardSize);
        console.log('선택된 난이도:', selectedDifficulty);
        
        // 보드 크기 설정
        if (selectedSize !== this.boardSize) {
            console.log('보드 크기 변경:', this.boardSize, '->', selectedSize);
            this.setBoardSize(selectedSize);
        } else {
            console.log('보드 크기 동일, 변경하지 않음');
        }
        
        // 난이도 설정
        console.log('난이도 설정 시작:', selectedDifficulty);
        this.setDifficulty(selectedDifficulty);
        console.log('난이도 설정 완료');
        
        // 헤더 업데이트
        console.log('헤더 업데이트 시작');
        this.updateHeaderInfo();
        console.log('헤더 업데이트 완료');
        
        // 모달 닫기
        console.log('모달 닫기 시작');
        document.getElementById('difficulty-modal').classList.remove('show');
        console.log('모달 닫기 완료');
        
        // 새 게임 시작
        console.log('새 게임 시작');
        this.newGame();
        console.log('새 게임 시작 완료');
    }
    
    /**
     * 헤더 정보 업데이트
     */
    updateHeaderInfo() {
        // 보드 크기와 난이도 표시 제거됨 (HTML에서 제거됨)
    }

    /**
     * 키보드 입력 처리
     */
    handleKeyboardInput(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        if (e.key >= '1' && e.key <= '9') {
            this.inputNumber(parseInt(e.key));
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
            this.deleteNumber();
        } else if (e.key === ' ') {
            e.preventDefault();
            this.requestHint();
        } else if (e.key === 'z' && e.ctrlKey) {
            e.preventDefault();
            this.undo();
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
                   e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            this.navigateWithArrows(e.key);
        } else if (e.key === 'Tab') {
            e.preventDefault();
            this.navigateWithTab();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            this.selectRandomEmptyCell();
        } else if (e.key === 'a' || e.key === 'A') {
            e.preventDefault();
            this.showAnswer();
        } else if (e.key === 's' || e.key === 'S') {
            e.preventDefault();
            this.requestSmartHint();
        }
    }

    /**
     * 화살표 키로 셀 이동
     */
    navigateWithArrows(direction) {
        if (!this.selectedCell) {
            this.selectFirstEmptyCell();
            return;
        }
        
        const currentRow = parseInt(this.selectedCell.dataset.row);
        const currentCol = parseInt(this.selectedCell.dataset.col);
        let newRow = currentRow;
        let newCol = currentCol;
        
        switch (direction) {
            case 'ArrowUp':
                newRow = Math.max(0, currentRow - 1);
                break;
            case 'ArrowDown':
                newRow = Math.min(this.boardSize - 1, currentRow + 1);
                break;
            case 'ArrowLeft':
                newCol = Math.max(0, currentCol - 1);
                break;
            case 'ArrowRight':
                newCol = Math.min(this.boardSize - 1, currentCol + 1);
                break;
        }
        
        const newCell = document.querySelector(`[data-row="${newRow}"][data-col="${newCol}"]`);
        if (newCell) {
            this.selectCell(newCell);
        }
    }

    /**
     * Tab 키로 다음 빈 셀 이동
     */
    navigateWithTab() {
        if (!this.selectedCell) {
            this.selectFirstEmptyCell();
            return;
        }
        
        const currentRow = parseInt(this.selectedCell.dataset.row);
        const currentCol = parseInt(this.selectedCell.dataset.col);
        
        // 현재 위치에서 다음 빈 셀 찾기
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                let row = i;
                let col = j;
                
                // 현재 위치보다 뒤에 있는 셀만 확인
                if (row < currentRow || (row === currentRow && col <= currentCol)) {
                    continue;
                }
                
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (cell && !cell.classList.contains('prefilled')) {
                    this.selectCell(cell);
                    return;
                }
            }
        }
        
        // 다음 빈 셀이 없으면 첫 번째 빈 셀로
        this.selectFirstEmptyCell();
    }

    /**
     * 첫 번째 빈 셀 선택
     */
    selectFirstEmptyCell() {
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                const cell = document.querySelector(`[data-row="${i}"][data-col="${j}"]`);
                if (cell && !cell.classList.contains('prefilled')) {
                    this.selectCell(cell);
                    return;
                }
            }
        }
    }

    /**
     * 랜덤 빈 셀 선택
     */
    selectRandomEmptyCell() {
        const emptyCells = [];
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                const cell = document.querySelector(`[data-row="${i}"][data-col="${j}"]`);
                if (cell && !cell.classList.contains('prefilled')) {
                    emptyCells.push(cell);
                }
            }
        }
        
        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.selectCell(randomCell);
        }
    }

    /**
     * 게임 정보 업데이트
     */
    updateGameInfo() {
        // 타이머 업데이트
        if (this.gameStartTime && !this.isGameComplete) {
            const elapsed = Date.now() - this.gameStartTime;
            document.getElementById('timer').textContent = this.getFormattedTime(elapsed);
        }
        
        // 힌트 수 업데이트
        document.getElementById('hints').textContent = this.maxHints - this.hintsUsed;
        
        // 진행률 업데이트
        let filledCells = 0;
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.prefilled[i][j] || this.userInputs[i][j] !== 0) {
                    filledCells++;
                }
            }
        }
        const totalCells = this.boardSize * this.boardSize;
        document.getElementById('progress').textContent = `${filledCells}/${totalCells}`;
    }

    /**
     * 시간 포맷팅
     */
    getFormattedTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * 배열 섞기 (Fisher-Yates 알고리즘)
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    /**
     * 숫자 배치가 유효한지 확인
     */
    isValidPlacement(board, row, col, num) {
        // 행 확인
        for (let x = 0; x < this.boardSize; x++) {
            if (board[row][x] === num && x !== col) {
                return false;
            }
        }
        
        // 열 확인
        for (let x = 0; x < this.boardSize; x++) {
            if (board[x][col] === num && x !== row) {
                return false;
            }
        }
        
        // 박스 확인
        let startRow, startCol, boxHeight, boxWidth;
        
        if (this.boardSize === 6) {
            // 6x6 보드: 3x2 박스 (3행 2열)
            startRow = Math.floor(row / 3) * 3;
            startCol = Math.floor(col / 2) * 2;
            boxHeight = 3;
            boxWidth = 2;
        } else if (this.boardSize === 9) {
            // 9x9 보드: 3x3 박스
            startRow = Math.floor(row / this.boxSize) * this.boxSize;
            startCol = Math.floor(col / this.boxSize) * this.boxSize;
            boxHeight = this.boxSize;
            boxWidth = this.boxSize;
        } else if (this.boardSize === 12) {
            // 12x12 보드: 4x3 박스
            startRow = Math.floor(row / 4) * 4;
            startCol = Math.floor(col / 3) * 3;
            boxHeight = 4;
            boxWidth = 3;
        }
        
        for (let i = startRow; i < startRow + boxHeight; i++) {
            for (let j = startCol; j < startCol + boxWidth; j++) {
                if (board[i][j] === num && (i !== row || j !== col)) {
                    return false;
                }
            }
        }
        
        return true;
    }

    /**
     * 정답 보여주기
     */
    showAnswer() {
        // 사용자 확인
        if (!confirm('정답을 보시겠습니까?\n정답을 보면 게임이 종료됩니다.')) {
            return;
        }

        // 모든 빈 셀에 정답 입력
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (!this.prefilled[i][j] && this.userInputs[i][j] === 0) {
                    this.userInputs[i][j] = this.solution[i][j];
                }
            }
        }

        // 게임 보드 다시 렌더링
        this.renderBoard();
        
        // 정답 표시된 셀들에 특별한 스타일 적용
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            if (!this.prefilled[row][col]) {
                cell.classList.add('answer-revealed');
            }
        });

        // 게임 완료 처리
        this.isGameComplete = true;
        this.gameEndTime = Date.now();
        
        // 통계 업데이트
        this.updateGameInfo();
        
        // 게임 완료 모달 표시
        setTimeout(() => {
            this.showGameCompleteModal();
        }, 500);

        // 정답 보기 사용 통계 기록
        if (window.gameStorage) {
            window.gameStorage.saveAnswerUsedStats({
                difficulty: this.difficulty,
                date: new Date().toISOString(),
                completionTime: this.gameEndTime - this.gameStartTime
            });
        }
    }

    /**
     * 게임 상태 저장 (JSON 형태)
     */
    getGameState() {
        return {
            board: this.board,
            userInputs: this.userInputs,
            prefilled: this.prefilled,
            difficulty: this.difficulty,
            gameStartTime: this.gameStartTime,
            hintsUsed: this.hintsUsed,
            history: this.history
        };
    }

    /**
     * 저장된 게임 상태 로드
     */
    loadGameState(gameState) {
        // 게임 상태 검증
        if (!gameState || !gameState.board || !gameState.userInputs || !gameState.prefilled) {
            console.error('loadGameState: 유효하지 않은 게임 상태입니다.');
            return;
        }
        
        this.board = gameState.board;
        this.userInputs = gameState.userInputs;
        this.prefilled = gameState.prefilled;
        this.difficulty = gameState.difficulty;
        this.gameStartTime = gameState.gameStartTime;
        this.hintsUsed = gameState.hintsUsed;
        this.history = gameState.history;
        
        // 보드 크기 설정
        this.boardSize = this.board.length;
        this.maxNumber = this.boardSize;
        
        // boxSize 설정
        if (this.boardSize === 6) {
            this.boxSize = 2; // 3x2 박스
        } else if (this.boardSize === 9) {
            this.boxSize = 3; // 3x3 박스
        } else if (this.boardSize === 12) {
            this.boxSize = 3; // 4x3 박스
        }
        
        this.setDifficulty(this.difficulty);
        this.renderBoard();
        this.updateGameInfo();
    }

    /**
     * 자동 풀이 시작
     */
    async startAutoSolve() {
        if (this.isGameComplete) {
            this.showToast('이미 완료된 게임입니다.');
            return;
        }

        if (window.autoSolver && window.autoSolver.isSolving()) {
            this.showToast('이미 자동 풀이 중입니다.');
            return;
        }

        // 자동 풀이 모달 표시
        this.showAutoSolveModal();

        try {
            const currentBoard = this.getCurrentBoard();
            const currentUserInputs = this.userInputs.map(row => [...row]);

            await window.autoSolver.solveSudoku(
                currentBoard,
                currentUserInputs,
                (progress) => {
                    this.updateSolveProgress(progress);
                },
                (solution) => {
                    this.onAutoSolveComplete(solution);
                }
            );
        } catch (error) {
            console.error('자동 풀이 실패:', error);
            this.showToast('자동 풀이 중 오류가 발생했습니다.');
            this.hideAutoSolveModal();
        }
    }

    /**
     * 한 단계 풀이
     */
    async solveOneStep() {
        if (this.isGameComplete) {
            this.showToast('이미 완료된 게임입니다.');
            return;
        }

        if (!window.autoSolver) {
            this.showToast('자동 풀이 시스템을 사용할 수 없습니다.');
            return;
        }

        try {
            const currentBoard = this.getCurrentBoard();
            
            // AutoSolver에 보드 크기 설정
            window.autoSolver.boardSize = this.boardSize;
            window.autoSolver.maxNumber = this.maxNumber;
            
            const solved = await window.autoSolver.solveStep(currentBoard, (row, col, value, reason) => {
                // 한 단계 해결
                this.userInputs[row][col] = value;
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (cell) {
                    cell.textContent = value;
                    cell.classList.add('user-input');
                    cell.classList.remove('error');
                }
                
                this.showToast(`한 단계 해결: ${reason}`);
                // 자동 완료 체크 비활성화 - 수동 정답 확인만 허용
                // this.checkGameComplete();
            });

            if (!solved) {
                this.showToast('더 이상 해결할 수 있는 단계가 없습니다.');
            }
        } catch (error) {
            console.error('한 단계 풀이 실패:', error);
            this.showToast('한 단계 풀이 중 오류가 발생했습니다.');
        }
    }

    /**
     * 자동 풀이 모달 표시
     */
    showAutoSolveModal() {
        const modal = document.getElementById('auto-solve-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.updateSolveProgress(0);
            this.updateSolveStatus('풀이 준비 중...');
        }
    }

    /**
     * 자동 풀이 모달 숨기기
     */
    hideAutoSolveModal() {
        const modal = document.getElementById('auto-solve-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * 풀이 진행률 업데이트
     */
    updateSolveProgress(progress) {
        const progressFill = document.getElementById('solve-progress-fill');
        const progressText = document.getElementById('solve-progress-text');
        
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${progress}%`;
        }
    }

    /**
     * 풀이 상태 업데이트
     */
    updateSolveStatus(status) {
        const statusElement = document.getElementById('solve-status');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }

    /**
     * 자동 풀이 완료 처리
     */
    onAutoSolveComplete(solution) {
        this.hideAutoSolveModal();
        this.showToast('자동 풀이가 완료되었습니다! 🎉');
        
        // 게임 완료 처리
        this.isGameComplete = true;
        this.gameEndTime = Date.now();
        
        // 업적 시스템에 게임 완료 알림
        if (window.achievementSystem) {
            const gameStats = {
                completionTime: this.gameEndTime - this.gameStartTime,
                hintsUsed: this.hintsUsed,
                difficulty: this.difficulty,
                moves: this.getMoveCount(),
                errors: this.getErrorCount(),
                date: new Date().toISOString()
            };
            window.achievementSystem.checkGameCompletion(gameStats);
        }
        
        this.showGameCompleteModal();
    }

    /**
     * 자동 풀이 중지
     */
    stopAutoSolve() {
        if (window.autoSolver) {
            window.autoSolver.stopSolving();
        }
        this.hideAutoSolveModal();
        this.showToast('자동 풀이가 중지되었습니다.');
    }

    /**
     * AI 난이도 분석
     */
    analyzeGameWithAI() {
        if (window.aiDifficultyManager) {
            const gameData = {
                completionTime: this.gameEndTime - this.gameStartTime,
                totalMoves: this.getMoveCount(),
                errors: this.getErrorCount(),
                hintsUsed: this.hintsUsed,
                difficulty: this.difficulty
            };
            
            window.aiDifficultyManager.analyzeGameCompletion(gameData);
        }
    }

    /**
     * AI 난이도 모달 표시
     */
    showAIDifficultyModal() {
        if (!window.aiDifficultyManager) {
            this.showToast('AI 난이도 시스템을 사용할 수 없습니다.');
            return;
        }

        const modal = document.getElementById('ai-difficulty-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.updateAIDifficultyModal();
        }
    }

    /**
     * AI 난이도 모달 업데이트
     */
    updateAIDifficultyModal() {
        try {
            const stats = window.aiDifficultyManager.getPlayerStats();
            const recommendation = window.aiDifficultyManager.getRecommendedDifficulty();

        // 플레이어 통계 업데이트
        document.getElementById('ai-skill-level').textContent = this.getSkillLevelText(stats.skillLevel);
        document.getElementById('ai-skill-score').textContent = `${stats.skillScore}/100`;
        document.getElementById('ai-games-played').textContent = `${stats.gamesPlayed}게임`;
        document.getElementById('ai-avg-time').textContent = this.formatTime(stats.averageSolveTime);
        document.getElementById('ai-error-rate').textContent = `${stats.averageErrorRate}%`;
        document.getElementById('ai-hint-usage').textContent = `${stats.hintUsageRate}회`;

        // AI 추천 업데이트
        document.getElementById('ai-recommended-difficulty').textContent = this.getDifficultyText(recommendation.difficulty);
        document.getElementById('ai-recommendation-reason').textContent = recommendation.reason;
        document.getElementById('ai-confidence').textContent = `신뢰도: ${recommendation.confidence}`;
        } catch (error) {
            console.error('AI 난이도 모달 업데이트 중 오류:', error);
            this.showToast('AI 난이도 분석 중 오류가 발생했습니다.');
        }
    }

    /**
     * 스킬 레벨 텍스트 변환
     */
    getSkillLevelText(skillLevel) {
        const mapping = {
            'beginner': '초보자',
            'intermediate': '중급자',
            'advanced': '고급자',
            'expert': '전문가'
        };
        return mapping[skillLevel] || '초보자';
    }

    /**
     * 난이도 텍스트 변환
     */
    getDifficultyText(difficulty) {
        const mapping = {
            'easy': '쉬움',
            'medium': '보통',
            'hard': '어려움'
        };
        return mapping[difficulty] || '쉬움';
    }

    /**
     * AI 추천 난이도로 새 게임 시작
     */
    startGameWithAIDifficulty() {
        try {
            if (!window.aiDifficultyManager) {
                this.showToast('AI 난이도 시스템을 사용할 수 없습니다.');
                return;
            }

            const recommendation = window.aiDifficultyManager.getRecommendedDifficulty();
            this.setDifficulty(recommendation.difficulty);
            this.newGame();
            
            this.hideAIDifficultyModal();
            this.showToast(`AI 추천 난이도 "${this.getDifficultyText(recommendation.difficulty)}"로 새 게임을 시작했습니다!`);
        } catch (error) {
            console.error('AI 난이도로 새 게임 시작 중 오류:', error);
            this.showToast('새 게임 시작 중 오류가 발생했습니다.');
        }
    }

    /**
     * AI 난이도 모달 숨기기
     */
    hideAIDifficultyModal() {
        const modal = document.getElementById('ai-difficulty-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * AI 프로필 초기화
     */
    resetAIProfile() {
        if (window.aiDifficultyManager) {
            window.aiDifficultyManager.resetPlayerProfile();
            this.updateAIDifficultyModal();
            this.showToast('AI 프로필이 초기화되었습니다.');
        }
    }

    /**
     * 트로피 모달 표시
     */
    showTrophyModal() {
        try {
            const trophies = JSON.parse(localStorage.getItem('sudoku_trophies') || '[]');
            
            const modal = document.createElement('div');
            modal.className = 'modal show';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>🏆 트로피</h2>
                        <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        ${trophies.length === 0 ? `
                            <div style="text-align: center; padding: 40px; color: #666;">
                                <div style="font-size: 48px; margin-bottom: 20px;">🏆</div>
                                <h3>아직 획득한 트로피가 없습니다</h3>
                                <p>게임을 완료하여 다양한 트로피를 획득해보세요!</p>
                            </div>
                        ` : `
                            <div class="trophy-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin-top: 20px;">
                                ${trophies.map(trophy => `
                                    <div class="trophy-card" style="background: linear-gradient(135deg, #ffd700, #ffed4e); border-radius: 15px; padding: 20px; text-align: center; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);">
                                        <div style="font-size: 48px; margin-bottom: 10px;">${trophy.icon}</div>
                                        <h4 style="color: #2c3e50; margin-bottom: 5px;">${trophy.name}</h4>
                                        <p style="color: #666; font-size: 14px;">${trophy.description}</p>
                                    </div>
                                `).join('')}
                            </div>
                            <div style="text-align: center; margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 10px;">
                                <h4 style="color: #2c3e50; margin-bottom: 10px;">총 ${trophies.length}개의 트로피를 획득하셨습니다!</h4>
                                <p style="color: #666; font-size: 14px;">더 많은 트로피를 획득하기 위해 다양한 조건으로 게임을 완료해보세요.</p>
                            </div>
                        `}
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // 모달 배경 클릭 시 닫기
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });
            
            // ESC 키로 닫기
            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    modal.remove();
                    document.removeEventListener('keydown', handleEsc);
                }
            };
            document.addEventListener('keydown', handleEsc);
            
        } catch (error) {
            console.error('트로피 모달 표시 중 오류:', error);
            this.showToast('트로피 모달을 표시할 수 없습니다.');
        }
    }

    /**
     * 사용자 분석 모달 표시
     */
    showAnalyticsModal() {
        if (!window.userAnalytics) {
            this.showToast('사용자 분석 시스템을 사용할 수 없습니다.');
            return;
        }

        const modal = document.getElementById('analytics-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.updateAnalyticsModal();
        }
    }

    /**
     * 사용자 분석 모달 업데이트
     */
    updateAnalyticsModal() {
        try {
            const report = window.userAnalytics.generateReport();

        // 개요 업데이트
        document.getElementById('total-games').textContent = report.overview.totalSessions;
        document.getElementById('avg-efficiency').textContent = `${report.overview.averageEfficiency}%`;
        document.getElementById('avg-consistency').textContent = `${report.overview.averageConsistency}%`;
        document.getElementById('learning-curve').textContent = `${report.overview.averageLearningCurve}%`;
        document.getElementById('stress-level').textContent = `${report.overview.averageStressLevel}%`;

        // 행동 패턴 업데이트
        document.getElementById('play-style').textContent = this.getPlayStyleText(report.behaviorPatterns.playStyle);
        document.getElementById('hint-pattern').textContent = this.getHintPatternText(report.behaviorPatterns.hintUsagePattern);
        document.getElementById('error-recovery').textContent = this.getErrorRecoveryText(report.behaviorPatterns.errorRecoveryPattern);
        document.getElementById('undo-pattern').textContent = report.behaviorPatterns.undoPattern || '없음';

        // 인사이트 업데이트
        this.updateInsightsList('strengths-list', report.insights.strengths);
        this.updateInsightsList('weaknesses-list', report.insights.weaknesses);
        this.updateInsightsList('recommendations-list', report.recommendations);

        // 트렌드 업데이트
        this.updateTrendsList(report.trends);
        } catch (error) {
            console.error('사용자 분석 모달 업데이트 중 오류:', error);
            this.showToast('분석 데이터를 불러오는 중 오류가 발생했습니다.');
        }
    }

    /**
     * 플레이 스타일 텍스트 변환
     */
    getPlayStyleText(style) {
        const mapping = {
            'aggressive': '적극적',
            'balanced': '균형적',
            'cautious': '신중함'
        };
        return mapping[style] || '균형적';
    }

    /**
     * 힌트 패턴 텍스트 변환
     */
    getHintPatternText(pattern) {
        const mapping = {
            'none': '사용 안함',
            'minimal': '최소한',
            'moderate': '적당히',
            'frequent': '자주'
        };
        return mapping[pattern] || '적당히';
    }

    /**
     * 오류 회복 텍스트 변환
     */
    getErrorRecoveryText(recovery) {
        const mapping = {
            'perfect': '완벽함',
            'quick': '빠름',
            'slow': '느림'
        };
        return mapping[recovery] || '빠름';
    }

    /**
     * 인사이트 리스트 업데이트
     */
    updateInsightsList(listId, items) {
        const list = document.getElementById(listId);
        if (list) {
            list.innerHTML = '';
            items.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                list.appendChild(li);
            });
        }
    }

    /**
     * 트렌드 리스트 업데이트
     */
    updateTrendsList(trends) {
        const container = document.getElementById('trends-container');
        if (container) {
            container.innerHTML = '';
            trends.forEach(trend => {
                const div = document.createElement('div');
                div.className = 'trend-item';
                div.textContent = trend;
                container.appendChild(div);
            });
        }
    }

    /**
     * 사용자 분석 모달 숨기기
     */
    hideAnalyticsModal() {
        const modal = document.getElementById('analytics-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * 분석 데이터 새로고침
     */
    refreshAnalytics() {
        if (window.userAnalytics) {
            this.updateAnalyticsModal();
            this.showToast('분석 데이터가 새로고침되었습니다.');
        }
    }

    /**
     * 분석 데이터 초기화
     */
    resetAnalyticsData() {
        if (window.userAnalytics) {
            window.userAnalytics.resetAnalyticsData();
            this.updateAnalyticsModal();
            this.showToast('분석 데이터가 초기화되었습니다.');
        }
    }

    /**
     * 일일 도전 시작
     */
    startDailyChallenge(challengeData) {
        try {
            // 일일 도전 데이터로 게임 보드 설정
            if (challengeData && challengeData.puzzle) {
                this.board = challengeData.puzzle.map(row => [...row]);
                this.solution = challengeData.solution ? challengeData.solution.map(row => [...row]) : null;
                this.difficulty = challengeData.difficulty || 'hard';
                
                // 미리 채워진 셀 표시
                this.prefilled = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(false));
                for (let row = 0; row < this.boardSize; row++) {
                    for (let col = 0; col < this.boardSize; col++) {
                        if (this.board[row][col] !== 0) {
                            this.prefilled[row][col] = true;
                        }
                    }
                }
                
                // 사용자 입력 초기화
                this.userInputs = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
                this.selectedCell = null;
                this.gameStartTime = Date.now();
                this.isGameComplete = false;
                this.hintsUsed = 0;
                this.history = [];
                
                // UI 업데이트
                this.renderBoard();
                this.updateGameInfo();
                
                // 난이도 표시 제거됨 (HTML에서 제거됨)
                
                // 사용자 분석: 일일 도전 세션 시작
                if (window.userAnalytics) {
                    window.userAnalytics.startGameSession('daily-challenge');
                }
                
                this.showToast('일일 도전을 시작합니다! 🏆');
            } else {
                this.showToast('일일 도전 데이터를 불러올 수 없습니다.');
            }
        } catch (error) {
            console.error('일일 도전 시작 중 오류:', error);
            this.showToast('일일 도전 시작 중 오류가 발생했습니다.');
        }
    }

    /**
     * 시간 포맷팅
     */
    formatTime(milliseconds) {
        if (!milliseconds || milliseconds === 0) return '-';
        
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        if (minutes > 0) {
            return `${minutes}분 ${remainingSeconds}초`;
        } else {
            return `${remainingSeconds}초`;
        }
    }

    /**
     * 새 게임 시작
     */
    newGame() {
        console.log('newGame 함수 시작');
        
        // 게임 상태 완전 초기화
        this.isGameComplete = false;
        this.gameStartTime = Date.now();
        this.gameEndTime = null;
        this.hintsUsed = 0;
        this.history = [];
        
        console.log('퍼즐 생성 시작');
        this.generateNewPuzzle();
        console.log('퍼즐 생성 완료');
        
        console.log('보드 렌더링 시작');
        this.renderBoard();
        console.log('보드 렌더링 완료');
        
        console.log('게임 정보 업데이트 시작');
        this.updateGameInfo();
        console.log('게임 정보 업데이트 완료');
        
        console.log('newGame 함수 완료');
        
        // 사용자 분석: 게임 세션 시작
        if (window.userAnalytics) {
            window.userAnalytics.startGameSession(this.difficulty);
        }
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

// 전역 게임 인스턴스
window.sudokuGame = new SudokuGame();
