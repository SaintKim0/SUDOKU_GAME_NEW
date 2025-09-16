/**
 * 스도쿠 자동 풀이 시스템
 * 백트래킹 알고리즘을 사용한 스도쿠 해결
 */

class AutoSolver {
    constructor() {
        this.solving = false;
        this.solveSpeed = 100; // 밀리초
        this.solveSteps = [];
        this.currentStep = 0;
        this.animationId = null;
        this.boardSize = 9; // 기본값
        this.maxNumber = 9; // 기본값
    }

    /**
     * 스도쿠 자동 풀이 시작
     */
    async solveSudoku(board, userInputs, onProgress, onComplete) {
        if (this.solving) {
            this.showToast('이미 풀이 중입니다.');
            return;
        }

        // 보드 크기 설정
        this.boardSize = board.length;
        this.maxNumber = this.boardSize;

        this.solving = true;
        this.solveSteps = [];
        this.currentStep = 0;

        try {
            // 현재 보드 상태 복사
            const currentBoard = this.copyBoard(board);
            const currentUserInputs = this.copyBoard(userInputs);

            // 해결 가능한지 확인
            if (!this.isValidBoard(currentBoard)) {
                this.showToast('현재 보드가 유효하지 않습니다.');
                this.solving = false;
                return;
            }

            // 백트래킹으로 해결
            const solution = await this.backtrackSolve(currentBoard, onProgress);
            
            if (solution) {
                // 해결 단계들을 애니메이션으로 표시
                await this.animateSolution(solution, onProgress, onComplete);
            } else {
                this.showToast('이 스도쿠는 해결할 수 없습니다.');
                this.solving = false;
            }

        } catch (error) {
            console.error('자동 풀이 중 오류:', error);
            this.showToast('자동 풀이 중 오류가 발생했습니다.');
            this.solving = false;
        }
    }

    /**
     * 백트래킹 알고리즘으로 스도쿠 해결
     */
    async backtrackSolve(board, onProgress) {
        return new Promise((resolve) => {
            const solve = (board, row = 0, col = 0) => {
                // 진행률 업데이트
                if (onProgress) {
                    const progress = ((row * 9 + col) / 81) * 100;
                    onProgress(Math.round(progress));
                }

                // 모든 셀을 채웠으면 성공
                if (row === 9) {
                    resolve(this.copyBoard(board));
                    return true;
                }

                // 다음 셀로 이동
                let nextRow = row;
                let nextCol = col + 1;
                if (nextCol === 9) {
                    nextRow++;
                    nextCol = 0;
                }

                // 이미 채워진 셀이면 다음으로
                if (board[row][col] !== 0) {
                    return solve(board, nextRow, nextCol);
                }

                // 1부터 maxNumber까지 시도
                for (let num = 1; num <= this.maxNumber; num++) {
                    if (this.isValidPlacement(board, row, col, num)) {
                        board[row][col] = num;
                        
                        // 해결 단계 기록
                        this.solveSteps.push({
                            row: row,
                            col: col,
                            value: num,
                            action: 'place'
                        });

                        if (solve(board, nextRow, nextCol)) {
                            return true;
                        }

                        // 백트래킹
                        board[row][col] = 0;
                        this.solveSteps.push({
                            row: row,
                            col: col,
                            value: 0,
                            action: 'remove'
                        });
                    }
                }

                return false;
            };

            solve(board);
        });
    }

    /**
     * 해결 과정을 애니메이션으로 표시
     */
    async animateSolution(solution, onProgress, onComplete) {
        return new Promise((resolve) => {
            let stepIndex = 0;
            const totalSteps = this.solveSteps.length;

            const animateStep = () => {
                if (stepIndex >= totalSteps || !this.solving) {
                    this.solving = false;
                    if (onComplete) {
                        onComplete(solution);
                    }
                    resolve();
                    return;
                }

                const step = this.solveSteps[stepIndex];
                const progress = ((stepIndex + 1) / totalSteps) * 100;
                
                if (onProgress) {
                    onProgress(Math.round(progress));
                }

                // 셀에 애니메이션 적용
                this.animateCell(step.row, step.col, step.value, step.action);

                stepIndex++;
                setTimeout(animateStep, this.solveSpeed);
            };

            animateStep();
        });
    }

    /**
     * 셀 애니메이션
     */
    animateCell(row, col, value, action) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (!cell) return;

        if (action === 'place') {
            cell.classList.add('auto-solving');
            setTimeout(() => {
                cell.textContent = value;
                cell.classList.add('user-input');
                cell.classList.remove('auto-solving');
            }, this.solveSpeed / 2);
        } else if (action === 'remove') {
            cell.classList.add('auto-removing');
            setTimeout(() => {
                cell.textContent = '';
                cell.classList.remove('user-input', 'auto-removing');
            }, this.solveSpeed / 2);
        }
    }

    /**
     * 숫자 배치가 유효한지 확인
     */
    isValidPlacement(board, row, col, num) {
        // 같은 행에 이미 있는지 확인
        for (let x = 0; x < this.boardSize; x++) {
            if (board[row][x] === num) return false;
        }

        // 같은 열에 이미 있는지 확인
        for (let x = 0; x < this.boardSize; x++) {
            if (board[x][col] === num) return false;
        }

        // 박스 확인 (보드 크기에 따라)
        let startRow, startCol, boxHeight, boxWidth;
        
        if (this.boardSize === 6) {
            // 6x6 보드: 3x2 박스
            startRow = Math.floor(row / 3) * 3;
            startCol = Math.floor(col / 2) * 2;
            boxHeight = 3;
            boxWidth = 2;
        } else if (this.boardSize === 9) {
            // 9x9 보드: 3x3 박스
            startRow = Math.floor(row / 3) * 3;
            startCol = Math.floor(col / 3) * 3;
            boxHeight = 3;
            boxWidth = 3;
        } else if (this.boardSize === 12) {
            // 12x12 보드: 4x3 박스
            startRow = Math.floor(row / 4) * 4;
            startCol = Math.floor(col / 3) * 3;
            boxHeight = 4;
            boxWidth = 3;
        }
        
        for (let i = startRow; i < startRow + boxHeight; i++) {
            for (let j = startCol; j < startCol + boxWidth; j++) {
                if (board[i][j] === num) return false;
            }
        }

        return true;
    }

    /**
     * 보드가 유효한지 확인
     */
    isValidBoard(board) {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const value = board[row][col];
                if (value !== 0) {
                    // 임시로 0으로 설정하고 유효성 검사
                    board[row][col] = 0;
                    const isValid = this.isValidPlacement(board, row, col, value);
                    board[row][col] = value;
                    
                    if (!isValid) return false;
                }
            }
        }
        return true;
    }

    /**
     * 보드 복사
     */
    copyBoard(board) {
        return board.map(row => [...row]);
    }

    /**
     * 자동 풀이 중지
     */
    stopSolving() {
        this.solving = false;
        if (this.animationId) {
            clearTimeout(this.animationId);
            this.animationId = null;
        }
        this.showToast('자동 풀이가 중지되었습니다.');
    }

    /**
     * 풀이 속도 설정
     */
    setSolveSpeed(speed) {
        this.solveSpeed = Math.max(10, Math.min(1000, speed));
    }

    /**
     * 현재 풀이 상태
     */
    isSolving() {
        return this.solving;
    }

    /**
     * 힌트 기반 풀이 (한 단계씩)
     */
    async solveStep(board, onStep) {
        if (this.solving) {
            this.showToast('이미 풀이 중입니다.');
            return false;
        }

        // 가장 쉬운 셀 찾기 (하나의 숫자만 가능한 셀)
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (board[row][col] === 0) {
                    const possibleNumbers = [];
                    for (let num = 1; num <= this.maxNumber; num++) {
                        if (this.isValidPlacement(board, row, col, num)) {
                            possibleNumbers.push(num);
                        }
                    }
                    
                    if (possibleNumbers.length === 1) {
                        const num = possibleNumbers[0];
                        board[row][col] = num;
                        
                        if (onStep) {
                            onStep(row, col, num, '단일 후보 숫자 발견');
                        }
                        
                        return true;
                    }
                }
            }
        }

        // 숨겨진 단일 후보 찾기
        for (let num = 1; num <= this.maxNumber; num++) {
            // 각 행에서 확인
            for (let row = 0; row < this.boardSize; row++) {
                const possibleCols = [];
                for (let col = 0; col < this.boardSize; col++) {
                    if (board[row][col] === 0 && this.isValidPlacement(board, row, col, num)) {
                        possibleCols.push(col);
                    }
                }
                if (possibleCols.length === 1) {
                    const col = possibleCols[0];
                    board[row][col] = num;
                    
                    if (onStep) {
                        onStep(row, col, num, '행에서 숨겨진 단일 후보 발견');
                    }
                    
                    return true;
                }
            }

            // 각 열에서 확인
            for (let col = 0; col < this.boardSize; col++) {
                const possibleRows = [];
                for (let row = 0; row < this.boardSize; row++) {
                    if (board[row][col] === 0 && this.isValidPlacement(board, row, col, num)) {
                        possibleRows.push(row);
                    }
                }
                if (possibleRows.length === 1) {
                    const row = possibleRows[0];
                    board[row][col] = num;
                    
                    if (onStep) {
                        onStep(row, col, num, '열에서 숨겨진 단일 후보 발견');
                    }
                    
                    return true;
                }
            }

            // 각 박스에서 확인 (9x9 보드만 지원)
            if (this.boardSize === 9) {
                for (let boxRow = 0; boxRow < 3; boxRow++) {
                    for (let boxCol = 0; boxCol < 3; boxCol++) {
                        const possibleCells = [];
                        for (let i = 0; i < 3; i++) {
                            for (let j = 0; j < 3; j++) {
                                const row = boxRow * 3 + i;
                                const col = boxCol * 3 + j;
                            if (board[row][col] === 0 && this.isValidPlacement(board, row, col, num)) {
                                possibleCells.push({ row, col });
                            }
                        }
                    }
                    if (possibleCells.length === 1) {
                        const { row, col } = possibleCells[0];
                        board[row][col] = num;
                        
                        if (onStep) {
                            onStep(row, col, num, '박스에서 숨겨진 단일 후보 발견');
                        }
                        
                        return true;
                    }
                }
            }
            }
        }

        return false;
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

// 전역 자동 풀이 시스템 인스턴스
window.autoSolver = new AutoSolver();
