/**
 * 스마트 힌트 시스템
 * 논리적 분석을 통해 지능적인 힌트를 제공
 */

class SmartHintSystem {
    constructor() {
        this.boardSize = 9; // 기본값
        this.maxNumber = 9; // 기본값
        
        this.hintTypes = {
            SINGLE_CANDIDATE: 'single_candidate',
            ROW_ANALYSIS: 'row_analysis',
            COLUMN_ANALYSIS: 'column_analysis',
            BOX_ANALYSIS: 'box_analysis',
            PAIR_ANALYSIS: 'pair_analysis',
            NAKED_SINGLES: 'naked_singles',
            HIDDEN_SINGLES: 'hidden_singles'
        };
        
        this.hintLevels = {
            EASY: 1,    // 단순한 힌트
            MEDIUM: 2,  // 중간 수준 힌트
            HARD: 3     // 고급 힌트
        };
    }

    /**
     * 스마트 힌트 제공
     */
    provideSmartHint(gameBoard, solution, userInputs, prefilled) {
        // 보드 크기 설정
        this.boardSize = gameBoard.length;
        this.maxNumber = this.boardSize;
        
        const currentBoard = this.getCurrentBoard(gameBoard, userInputs, prefilled);
        const analysis = this.analyzeBoard(currentBoard);
        
        // 힌트 우선순위에 따라 분석
        const hints = [
            this.findNakedSingles(currentBoard),
            this.findHiddenSingles(currentBoard),
            this.findRowAnalysis(currentBoard),
            this.findColumnAnalysis(currentBoard),
            this.findBoxAnalysis(currentBoard),
            this.findPairAnalysis(currentBoard),
            this.findSingleCandidate(currentBoard)
        ].filter(hint => hint !== null);

        if (hints.length === 0) {
            return this.getGeneralHint(currentBoard);
        }

        // 가장 유용한 힌트 선택
        const bestHint = this.selectBestHint(hints);
        return this.formatHint(bestHint);
    }

    /**
     * 현재 보드 상태 가져오기
     */
    getCurrentBoard(gameBoard, userInputs, prefilled) {
        const currentBoard = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
        
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (prefilled[i][j]) {
                    currentBoard[i][j] = gameBoard[i][j];
                } else {
                    currentBoard[i][j] = userInputs[i][j];
                }
            }
        }
        
        return currentBoard;
    }

    /**
     * 보드 분석
     */
    analyzeBoard(board) {
        const analysis = {
            emptyCells: [],
            candidates: {},
            rowStats: {},
            colStats: {},
            boxStats: {}
        };

        // 빈 셀 찾기 및 후보 숫자 분석
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (board[i][j] === 0) {
                    analysis.emptyCells.push({ row: i, col: j });
                    analysis.candidates[`${i}-${j}`] = this.getPossibleNumbers(board, i, j);
                }
            }
        }

        return analysis;
    }

    /**
     * 특정 셀에 들어갈 수 있는 숫자 찾기
     */
    getPossibleNumbers(board, row, col) {
        const possible = [];
        
        for (let num = 1; num <= this.maxNumber; num++) {
            if (this.isValidPlacement(board, row, col, num)) {
                possible.push(num);
            }
        }
        
        return possible;
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
                if (board[i][j] === num && (i !== row || j !== col)) {
                    return false;
                }
            }
        }
        
        return true;
    }

    /**
     * Naked Singles 찾기 (후보가 하나만 남은 셀)
     */
    findNakedSingles(board) {
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (board[i][j] === 0) {
                    const candidates = this.getPossibleNumbers(board, i, j);
                    if (candidates.length === 1) {
                        return {
                            type: this.hintTypes.NAKED_SINGLES,
                            level: this.hintLevels.EASY,
                            row: i,
                            col: j,
                            number: candidates[0],
                            message: `(${i+1}행, ${j+1}열)에는 ${candidates[0]}만 들어갈 수 있습니다!`,
                            description: '이 위치에는 다른 숫자가 들어갈 수 없습니다.'
                        };
                    }
                }
            }
        }
        return null;
    }

    /**
     * Hidden Singles 찾기 (특정 숫자가 한 곳에만 들어갈 수 있는 경우)
     */
    findHiddenSingles(board) {
        // 행에서 Hidden Singles 찾기
        for (let row = 0; row < this.boardSize; row++) {
            for (let num = 1; num <= this.maxNumber; num++) {
                const possiblePositions = [];
                for (let col = 0; col < this.boardSize; col++) {
                    if (board[row][col] === 0 && this.isValidPlacement(board, row, col, num)) {
                        possiblePositions.push(col);
                    }
                }
                if (possiblePositions.length === 1) {
                    return {
                        type: this.hintTypes.HIDDEN_SINGLES,
                        level: this.hintLevels.MEDIUM,
                        row: row,
                        col: possiblePositions[0],
                        number: num,
                        message: `${row+1}행에서 ${num}은 (${row+1}행, ${possiblePositions[0]+1}열)에만 들어갈 수 있습니다!`,
                        description: '이 행의 다른 빈 칸에는 이 숫자가 들어갈 수 없습니다.'
                    };
                }
            }
        }

        // 열에서 Hidden Singles 찾기
        for (let col = 0; col < this.boardSize; col++) {
            for (let num = 1; num <= this.maxNumber; num++) {
                const possiblePositions = [];
                for (let row = 0; row < this.boardSize; row++) {
                    if (board[row][col] === 0 && this.isValidPlacement(board, row, col, num)) {
                        possiblePositions.push(row);
                    }
                }
                if (possiblePositions.length === 1) {
                    return {
                        type: this.hintTypes.HIDDEN_SINGLES,
                        level: this.hintLevels.MEDIUM,
                        row: possiblePositions[0],
                        col: col,
                        number: num,
                        message: `${col+1}열에서 ${num}은 (${possiblePositions[0]+1}행, ${col+1}열)에만 들어갈 수 있습니다!`,
                        description: '이 열의 다른 빈 칸에는 이 숫자가 들어갈 수 없습니다.'
                    };
                }
            }
        }

        return null;
    }

    /**
     * 행 분석 힌트
     */
    findRowAnalysis(board) {
        for (let row = 0; row < this.boardSize; row++) {
            const missingNumbers = this.getMissingNumbersInRow(board, row);
            const emptyCells = [];
            
            for (let col = 0; col < this.boardSize; col++) {
                if (board[row][col] === 0) {
                    emptyCells.push(col);
                }
            }

            if (missingNumbers.length <= 3 && emptyCells.length > 0) {
                return {
                    type: this.hintTypes.ROW_ANALYSIS,
                    level: this.hintLevels.EASY,
                    row: row,
                    message: `${row+1}행에는 ${missingNumbers.join(', ')}이(가) 빠져있습니다.`,
                    description: `이 숫자들 중 하나를 빈 칸에 넣어보세요.`,
                    missingNumbers: missingNumbers,
                    emptyCells: emptyCells
                };
            }
        }
        return null;
    }

    /**
     * 열 분석 힌트
     */
    findColumnAnalysis(board) {
        for (let col = 0; col < this.boardSize; col++) {
            const missingNumbers = this.getMissingNumbersInColumn(board, col);
            const emptyCells = [];
            
            for (let row = 0; row < this.boardSize; row++) {
                if (board[row][col] === 0) {
                    emptyCells.push(row);
                }
            }

            if (missingNumbers.length <= 3 && emptyCells.length > 0) {
                return {
                    type: this.hintTypes.COLUMN_ANALYSIS,
                    level: this.hintLevels.EASY,
                    col: col,
                    message: `${col+1}열에는 ${missingNumbers.join(', ')}이(가) 빠져있습니다.`,
                    description: `이 숫자들 중 하나를 빈 칸에 넣어보세요.`,
                    missingNumbers: missingNumbers,
                    emptyCells: emptyCells
                };
            }
        }
        return null;
    }

    /**
     * 박스 분석 힌트
     */
    findBoxAnalysis(board) {
        // 9x9 보드만 지원 (다른 크기는 복잡하므로 일단 제외)
        if (this.boardSize !== 9) {
            return null;
        }
        
        for (let boxRow = 0; boxRow < 3; boxRow++) {
            for (let boxCol = 0; boxCol < 3; boxCol++) {
                const missingNumbers = this.getMissingNumbersInBox(board, boxRow, boxCol);
                const emptyCells = [];
                
                for (let i = boxRow * 3; i < boxRow * 3 + 3; i++) {
                    for (let j = boxCol * 3; j < boxCol * 3 + 3; j++) {
                        if (board[i][j] === 0) {
                            emptyCells.push({ row: i, col: j });
                        }
                    }
                }

                if (missingNumbers.length <= 3 && emptyCells.length > 0) {
                    return {
                        type: this.hintTypes.BOX_ANALYSIS,
                        level: this.hintLevels.EASY,
                        boxRow: boxRow,
                        boxCol: boxCol,
                        message: `${boxRow + 1}번째 3x3 박스에는 ${missingNumbers.join(', ')}이(가) 빠져있습니다.`,
                        description: `이 숫자들 중 하나를 빈 칸에 넣어보세요.`,
                        missingNumbers: missingNumbers,
                        emptyCells: emptyCells
                    };
                }
            }
        }
        return null;
    }

    /**
     * 페어 분석 힌트
     */
    findPairAnalysis(board) {
        // 간단한 페어 힌트 (후보가 2개인 셀들)
        const pairCells = [];
        
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (board[i][j] === 0) {
                    const candidates = this.getPossibleNumbers(board, i, j);
                    if (candidates.length === 2) {
                        pairCells.push({ row: i, col: j, candidates });
                    }
                }
            }
        }

        if (pairCells.length > 0) {
            const cell = pairCells[0];
            return {
                type: this.hintTypes.PAIR_ANALYSIS,
                level: this.hintLevels.MEDIUM,
                row: cell.row,
                col: cell.col,
                message: `(${cell.row+1}행, ${cell.col+1}열)에는 ${cell.candidates.join(' 또는 ')}만 들어갈 수 있습니다.`,
                description: '이 두 숫자 중 하나를 선택해보세요.',
                candidates: cell.candidates
            };
        }
        return null;
    }

    /**
     * 단일 후보 힌트
     */
    findSingleCandidate(board) {
        // 후보가 가장 적은 셀 찾기
        let bestCell = null;
        let minCandidates = this.maxNumber + 1;

        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (board[i][j] === 0) {
                    const candidates = this.getPossibleNumbers(board, i, j);
                    if (candidates.length < minCandidates && candidates.length > 0) {
                        minCandidates = candidates.length;
                        bestCell = { row: i, col: j, candidates };
                    }
                }
            }
        }

        if (bestCell && minCandidates <= 3) {
            return {
                type: this.hintTypes.SINGLE_CANDIDATE,
                level: this.hintLevels.MEDIUM,
                row: bestCell.row,
                col: bestCell.col,
                message: `(${bestCell.row+1}행, ${bestCell.col+1}열)에는 ${bestCell.candidates.join(', ')} 중 하나가 들어갈 수 있습니다.`,
                description: '이 위치부터 시작해보세요.',
                candidates: bestCell.candidates
            };
        }
        return null;
    }

    /**
     * 일반적인 힌트
     */
    getGeneralHint(board) {
        const emptyCount = this.countEmptyCells(board);
        
        if (emptyCount > 50) {
            return {
                type: 'general',
                level: this.hintLevels.EASY,
                message: '아직 많은 칸이 비어있습니다. 한 행이나 열부터 채워보세요!',
                description: '1-9 숫자 중 빠진 숫자를 찾아 빈 칸에 넣어보세요.'
            };
        } else if (emptyCount > 20) {
            return {
                type: 'general',
                level: this.hintLevels.MEDIUM,
                message: '좋은 진전입니다! 이제 3x3 박스에 집중해보세요.',
                description: '각 3x3 박스에 1-9 숫자가 하나씩 들어가야 합니다.'
            };
        } else {
            return {
                type: 'general',
                level: this.hintLevels.HARD,
                message: '거의 다 왔습니다! 마지막 숫자들을 신중하게 넣어보세요.',
                description: '각 숫자가 중복되지 않는지 확인하면서 진행하세요.'
            };
        }
    }

    /**
     * 가장 좋은 힌트 선택
     */
    selectBestHint(hints) {
        // 레벨별 우선순위 (낮은 레벨이 우선)
        hints.sort((a, b) => a.level - b.level);
        
        // 같은 레벨에서는 타입별 우선순위
        const typePriority = {
            [this.hintTypes.NAKED_SINGLES]: 1,
            [this.hintTypes.HIDDEN_SINGLES]: 2,
            [this.hintTypes.SINGLE_CANDIDATE]: 3,
            [this.hintTypes.PAIR_ANALYSIS]: 4,
            [this.hintTypes.ROW_ANALYSIS]: 5,
            [this.hintTypes.COLUMN_ANALYSIS]: 6,
            [this.hintTypes.BOX_ANALYSIS]: 7
        };

        hints.sort((a, b) => {
            if (a.level !== b.level) {
                return a.level - b.level;
            }
            return (typePriority[a.type] || 999) - (typePriority[b.type] || 999);
        });

        return hints[0];
    }

    /**
     * 힌트 포맷팅
     */
    formatHint(hint) {
        return {
            ...hint,
            formattedMessage: hint.message,
            formattedDescription: hint.description,
            timestamp: Date.now()
        };
    }

    /**
     * 행에서 빠진 숫자 찾기
     */
    getMissingNumbersInRow(board, row) {
        const numbers = new Set();
        for (let col = 0; col < this.boardSize; col++) {
            if (board[row][col] !== 0) {
                numbers.add(board[row][col]);
            }
        }
        
        const missing = [];
        for (let i = 1; i <= this.maxNumber; i++) {
            if (!numbers.has(i)) {
                missing.push(i);
            }
        }
        return missing;
    }

    /**
     * 열에서 빠진 숫자 찾기
     */
    getMissingNumbersInColumn(board, col) {
        const numbers = new Set();
        for (let row = 0; row < this.boardSize; row++) {
            if (board[row][col] !== 0) {
                numbers.add(board[row][col]);
            }
        }
        
        const missing = [];
        for (let i = 1; i <= this.maxNumber; i++) {
            if (!numbers.has(i)) {
                missing.push(i);
            }
        }
        return missing;
    }

    /**
     * 박스에서 빠진 숫자 찾기
     */
    getMissingNumbersInBox(board, boxRow, boxCol) {
        const numbers = new Set();
        
        for (let i = boxRow * 3; i < boxRow * 3 + 3; i++) {
            for (let j = boxCol * 3; j < boxCol * 3 + 3; j++) {
                if (board[i][j] !== 0) {
                    numbers.add(board[i][j]);
                }
            }
        }
        
        const missing = [];
        for (let i = 1; i <= this.maxNumber; i++) {
            if (!numbers.has(i)) {
                missing.push(i);
            }
        }
        return missing;
    }

    /**
     * 빈 셀 개수 세기
     */
    countEmptyCells(board) {
        let count = 0;
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (board[i][j] === 0) {
                    count++;
                }
            }
        }
        return count;
    }
}

// 전역 스마트 힌트 시스템 인스턴스
window.smartHintSystem = new SmartHintSystem();
